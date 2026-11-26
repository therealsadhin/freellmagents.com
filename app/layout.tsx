import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/seo-metadata";
import { siteStructuredData } from "@/lib/structured-data";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Free AI Model Directory and Comparison | FreeLLMAgents",
    template: "%s",
  },
  description:
    "Explore AI models by task, license, context window, provider access, and reported pricing. Compare Hugging Face model data in the FreeLLMAgents directory.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "FreeLLMAgents",
    title: "Free AI Model Directory and Comparison | FreeLLMAgents",
    description:
      "Explore AI models by task, license, context window, provider access, and reported pricing. Compare Hugging Face model data in the FreeLLMAgents directory.",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "FreeLLMAgents AI model directory and comparison tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Model Directory and Comparison | FreeLLMAgents",
    description:
      "Explore AI models by task, license, context window, provider access, and reported pricing. Compare Hugging Face model data in the FreeLLMAgents directory.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background">
        <JsonLd data={siteStructuredData} />
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
