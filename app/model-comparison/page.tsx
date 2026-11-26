import { ModelComparison } from "@/components/model-comparison";
import { JsonLd } from "@/components/json-ld";
import { getModels, type Model } from "@/lib/models";
import { createPageMetadata } from "@/lib/seo-metadata";
import { createWebPageStructuredData } from "@/lib/structured-data";

const pageTitle = "AI Model Comparison: Specs and Pricing | FreeLLMAgents";
const pageDescription =
  "Compare AI models by specifications, capabilities, context windows, reported licenses, inference providers, and published pricing in upstream catalogs.";

export const metadata = createPageMetadata({
  title: pageTitle,
  description: pageDescription,
  canonical: "/model-comparison",
});

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
    <>
      <JsonLd
        data={createWebPageStructuredData({
          canonical: "/model-comparison",
          title: pageTitle,
          description: pageDescription,
        })}
      />
      <ModelComparison
        initialModels={initialModels}
        initialError={initialError}
        initialWarnings={initialWarnings}
      />
    </>
  );
}
