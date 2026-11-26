import type { Metadata } from "next";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://freellmagents.com";

const shareImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "FreeLLMAgents AI model directory and comparison tools",
};

export function createPageMetadata({
  title,
  description,
  canonical,
}: {
  title: string;
  description: string;
  canonical: string;
}): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: "FreeLLMAgents",
      title,
      description,
      url: canonical,
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage.url],
    },
  };
}
