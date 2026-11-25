import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Model Pricing",
  description:
    "Understand provider-specific model pricing shown in the FreeLLMAgents directory.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <ContentPage
      title="Model pricing"
      description="Prices are displayed only when reported in the upstream inference catalog."
    >
      <ContentSection title="Provider-specific rates">
        <p>
          Inference rates belong to the provider and model combination, not
          necessarily to a model universally. Where upstream data supplies
          input and output token rates, the directory shows the provider and
          rates normalized to 1,000 tokens. Missing rates are labeled as
          unavailable.
        </p>
        <p>
          Prices can change, may exclude other fees, and should be confirmed
          with the provider before use. Displayed metadata is informational
          and is not a quote or offer.
        </p>
      </ContentSection>
      <ContentSection title="Estimate token costs">
        <p>
          Use the{" "}
          <Link className="text-primary underline" href="/cost-calculator">
            cost calculator
          </Link>{" "}
          with rates from the provider you intend to use. Check that
          provider’s current pricing and billing terms before relying on an
          estimate.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
