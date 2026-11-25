import type { Metadata } from "next";
import { ModelComparison } from "@/components/model-comparison";
import { getModels, type Model } from "@/lib/models";

export const metadata: Metadata = {
  title: "Model Comparison",
  description:
    "Compare AI model specifications, capabilities, and published provider pricing side by side.",
  alternates: { canonical: "/model-comparison" },
  openGraph: {
    title: "Model Comparison | FreeLLMAgents",
    description:
      "Compare model specifications, supported capabilities, and published token rates.",
    url: "/model-comparison",
  },
  twitter: {
    card: "summary",
    title: "Model Comparison | FreeLLMAgents",
    description: "Compare model specifications, capabilities, and published pricing.",
  },
};

export default async function ModelComparisonPage() {
  let initialModels: Model[] = [];
  let initialError: string | null = null;
  let initialWarnings: string[] = [];

  try {
    const page = await getModels({ sort: "popular" });
    initialModels = page.models;
    initialWarnings = page.warnings;
  } catch (cause) {
    console.error("Model comparison could not load initial model data.", {
      cause,
    });
    initialError =
      "Live model data could not be loaded. You can retry by searching for models.";
  }

  return (
    <ModelComparison
      initialModels={initialModels}
      initialError={initialError}
      initialWarnings={initialWarnings}
    />
  );
}
