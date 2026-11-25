import type { MetadataRoute } from "next";

const publicPaths = [
  "",
  "/about",
  "/contact",
  "/providers",
  "/pricing",
  "/cost-calculator",
  "/privacy",
  "/terms",
  "/cookies",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://freellmagents.com";

  return publicPaths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: path === "" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.5,
  }));
}
