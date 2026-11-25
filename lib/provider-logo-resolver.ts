const HUGGING_FACE_ORIGIN = "https://huggingface.co";
const AVATAR_HOSTS = new Set([
  "cdn-avatars.huggingface.co",
  "huggingface.co",
]);
const ORG_AVATAR_REVALIDATE_SECONDS = 86_400;
const PROFILE_REVALIDATE_SECONDS = 86_400;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getHuggingFaceHandle(author: string): string | null {
  const handle = author.trim();
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,95}$/.test(handle) ? handle : null;
}

function getAvatarUrl(value: unknown): string | null {
  if (!isRecord(value) || typeof value.avatarUrl !== "string") return null;

  try {
    const url = new URL(value.avatarUrl);
    if (
      url.protocol !== "https:" ||
      !AVATAR_HOSTS.has(url.hostname) ||
      (url.hostname === "huggingface.co" &&
        !url.pathname.startsWith("/avatars/"))
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

async function fetchHuggingFaceJson(path: string): Promise<unknown | null> {
  try {
    const response = await fetch(`${HUGGING_FACE_ORIGIN}${path}`, {
      next: { revalidate: ORG_AVATAR_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn("Hugging Face author avatar lookup failed.", {
      path,
      cause: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

async function getAuthorAvatar(handle: string): Promise<string | null> {
  const encodedHandle = encodeURIComponent(handle);
  const organizationAvatar = await fetchHuggingFaceJson(
    `/api/organizations/${encodedHandle}/avatar`,
  );
  const organizationUrl = getAvatarUrl(organizationAvatar);
  if (organizationUrl) return organizationUrl;

  const userOverview = await fetchHuggingFaceJson(
    `/api/users/${encodedHandle}/overview`,
  );
  return getAvatarUrl(userOverview);
}

function getWebsiteFromProfileHtml(html: string): URL | null {
  const links =
    /<a\b[^>]*href=["'](https:\/\/[^"']+)["'][^>]*>([^<]+)<\/a>/gi;

  for (const match of html.matchAll(links)) {
    const href = match[1];
    const label = match[2].trim();
    if (!href || !/^https?:\/\//i.test(label)) continue;

    try {
      const website = new URL(href);
      if (
        website.protocol === "https:" &&
        website.hostname !== "huggingface.co" &&
        label.replace(/\/+$/, "").startsWith(website.origin)
      ) {
        return website;
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function getAuthorWebsite(handle: string): Promise<URL | null> {
  try {
    const response = await fetch(
      `${HUGGING_FACE_ORIGIN}/${encodeURIComponent(handle)}`,
      {
        next: { revalidate: PROFILE_REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) return null;
    return getWebsiteFromProfileHtml(await response.text());
  } catch (error) {
    console.warn("Hugging Face profile website lookup failed.", {
      handle,
      cause: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

function getSimpleIconsSlug(hostname: string): string {
  const labels = hostname.toLowerCase().replace(/^www\./, "").split(".");
  const suffix = labels.at(-1) ?? "";
  const precedingLabel = labels.at(-2) ?? hostname;
  const usesCompoundSuffix =
    suffix.length === 2 &&
    precedingLabel.length <= 3 &&
    labels.length > 2;
  const brand = usesCompoundSuffix ? labels.at(-3) : precedingLabel;
  return (brand ?? hostname).replace(/[^a-z0-9]/g, "");
}

export async function resolveProviderLogoSources(
  author: string,
): Promise<string[]> {
  const handle = getHuggingFaceHandle(author);
  if (!handle) return [];

  const [avatar, website] = await Promise.all([
    getAuthorAvatar(handle),
    getAuthorWebsite(handle),
  ]);

  const sources = avatar ? [avatar] : [];
  if (website) {
    const simpleIconSlug = getSimpleIconsSlug(website.hostname);
    if (simpleIconSlug) {
      sources.push(`https://cdn.simpleicons.org/${simpleIconSlug}`);
    }

    const favicon = new URL("https://www.google.com/s2/favicons/");
    favicon.searchParams.set("domain_url", website.origin);
    favicon.searchParams.set("sz", "128");
    sources.push(favicon.toString());
  }
  return [...new Set(sources)];
}
