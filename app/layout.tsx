import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://freellmagents.com",
  ),
  title: {
    default: "FreeLLMAgents — Explore AI models",
    template: "%s | FreeLLMAgents",
  },
  description:
    "Discover, explore, and compare AI models with current information from Hugging Face and supported inference providers.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "FreeLLMAgents",
    title: "FreeLLMAgents — Explore AI models",
    description:
      "Discover, explore, and compare AI models, capabilities, and provider availability.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "FreeLLMAgents — Explore AI models",
    description:
      "Discover, explore, and compare AI models, capabilities, and provider availability.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
