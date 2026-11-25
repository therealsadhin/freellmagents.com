import type { Metadata } from "next";
import { CostCalculator } from "@/components/cost-calculator";
import { getModels, type Model } from "@/lib/models";

export const metadata: Metadata = {
  title: "AI Cost Analytics",
  description:
    "Understand, estimate, and optimize AI model spending with workload-based cost projections.",
  alternates: { canonical: "/cost-calculator" },
  openGraph: {
    title: "AI Cost Analytics | FreeLLMAgents",
    description:
      "Estimate AI model spending using published provider token pricing.",
    url: "/cost-calculator",
  },
  twitter: {
    card: "summary",
    title: "AI Cost Analytics | FreeLLMAgents",
    description: "Estimate AI model spending with published provider rates.",
  },
};

export default async function CostCalculatorPage() {
  let initialModels: Model[] = [];
  let initialError: string | null = null;
  let initialWarnings: string[] = [];

  try {
    const page = await getModels({ sort: "popular" });
    initialModels = page.models;
    initialWarnings = page.warnings;
  } catch (cause) {
    console.error("Cost calculator could not load initial model data.", {
      cause,
    });
    initialError =
      "Live model data could not be loaded. You can retry by searching for models.";
  }

  return (
    <CostCalculator
      initialModels={initialModels}
      initialError={initialError}
      initialWarnings={initialWarnings}
    />
  );
}
