import { siteUrl } from "@/lib/seo-metadata";

export const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "FreeLLMAgents",
      url: siteUrl,
      email: "support@freellmagents.com",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@freellmagents.com",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "FreeLLMAgents",
      url: siteUrl,
      inLanguage: "en",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export function createWebPageStructuredData({
  canonical,
  title,
  description,
}: {
  canonical: string;
  title: string;
  description: string;
}) {
  const url = new URL(canonical, siteUrl).toString();

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: "en",
    isPartOf: { "@id": `${siteUrl}/#website` },
  };
}
