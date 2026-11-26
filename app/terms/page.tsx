import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ContentPage, ContentSection } from "@/components/content-page";
import { createPageMetadata } from "@/lib/seo-metadata";

export const metadata = createPageMetadata({
  title: "FreeLLMAgents Terms of Service: Site Use and Limits",
  description:
    "Review terms and limits for using the FreeLLMAgents model directory, including model metadata, licenses, availability, and pricing. Confirm details before use.",
  canonical: "/terms",
});

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms of Service"
      description="Important information about using the FreeLLMAgents directory."
    >
      <p>
        These draft terms explain the current purpose and limitations of the
        website. They are not a guarantee of legal compliance and require
        review by the site operator before publication.
      </p>

      <ContentSection title="Directory information">
        <p>
          FreeLLMAgents displays information received from Hugging Face Hub and
          Hugging Face Inference Providers. Third-party metadata can be
          incomplete, outdated, or changed by its publisher. We do not
          independently verify every model, license, capability, context
          length, provider, or price.
        </p>
        <p>
          Model classifications are informational interpretations of
          repository metadata, not legal determinations. Review the model
          publisher’s license and the inference provider’s current terms
          before downloading, deploying, or using a model.
        </p>
      </ContentSection>

      <ContentSection title="Third-party services and links">
        <p>
          The website links to Hugging Face model repositories and may show
          inference provider availability. Those services are operated by
          independent third parties. FreeLLMAgents is not affiliated with,
          sponsored by, or endorsed by Hugging Face or the listed model
          publishers and providers.
        </p>
      </ContentSection>

      <ContentSection title="Availability and use">
        <p>
          The directory is provided for discovery and comparison. Availability
          may change, and the website may be unavailable or contain errors. No
          model listing or price display is an offer, recommendation, or
          guarantee of performance. Do not rely on the directory as the sole
          source for a licensing, safety, or purchasing decision.
        </p>
      </ContentSection>

      <ContentSection title="Contact">
        <p>
          Questions about these draft terms can be sent to{" "}
          <a className="text-primary underline" href="mailto:support@freellmagents.com">
            support@freellmagents.com
          </a>
          .
        </p>
      </ContentSection>

      <Alert className="mt-9 border-border bg-muted">
        <AlertTitle>Site operator confirmation needed</AlertTitle>
        <AlertDescription>
          Confirm the operating entity, governing law and venue, effective
          date, age requirements, limitation-of-liability wording, acceptable
          use rules, and any jurisdiction-specific terms with qualified
          counsel. Those facts are intentionally not invented here.
        </AlertDescription>
      </Alert>
    </ContentPage>
  );
}
