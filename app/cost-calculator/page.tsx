import { CostCalculator } from "@/components/cost-calculator";
import { JsonLd } from "@/components/json-ld";
import { getModels, type Model } from "@/lib/models";
import { createPageMetadata } from "@/lib/seo-metadata";
import { createWebPageStructuredData } from "@/lib/structured-data";

const pageTitle = "AI Model Cost Calculator: Usage Costs | FreeLLMAgents";
const pageDescription =
  "Estimate AI model token costs using your input, output, request, and usage assumptions. Compare published provider rates and review what each estimate excludes.";

export const metadata = createPageMetadata({
  title: pageTitle,
  description: pageDescription,
  canonical: "/cost-calculator",
});

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
    <>
      <JsonLd
        data={createWebPageStructuredData({
          canonical: "/cost-calculator",
          title: pageTitle,
          description: pageDescription,
        })}
      />
      <CostCalculator
        initialModels={initialModels}
        initialError={initialError}
        initialWarnings={initialWarnings}
      />
    </>
  );
}
