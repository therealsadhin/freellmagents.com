import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/content-page";
import { createPageMetadata } from "@/lib/seo-metadata";

export const metadata = createPageMetadata({
  title: "AI Model Providers and Availability | FreeLLMAgents",
  description:
    "See how FreeLLMAgents reports model availability, context limits, tool support, and provider-specific prices using the Hugging Face Inference Providers catalog.",
  canonical: "/providers",
});

export default function ProvidersPage() {
  return (
    <ContentPage
      title="Inference providers"
      description="Provider availability is shown per model using the current Hugging Face Inference Providers catalog."
    >
      <ContentSection title="Availability varies by model">
        <p>
          A provider is shown only when the upstream catalog reports that
          model as live for that provider. Availability, context limits, tool
          support, and prices can differ between providers and may change
          without notice.
        </p>
        <p>
          The catalog may not include every provider or deployment option.
          FreeLLMAgents is independent of Hugging Face and the providers listed
          in model metadata.
        </p>
      </ContentSection>
      <ContentSection title="Compare model availability">
        <p>
          Browse the{" "}
          <Link className="text-primary underline" href="/#models">
            model directory
          </Link>{" "}
          to see providers reported for each model.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
