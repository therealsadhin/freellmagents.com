import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how FreeLLMAgents helps people discover and compare AI models.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentPage
      title="About FreeLLMAgents"
      description="A clear directory for exploring AI models, their capabilities, and where they can be used."
    >
      <ContentSection title="What we do">
        <p>
          FreeLLMAgents brings model information together so visitors can
          compare names, publishers, declared licenses, supported tasks, and
          inference availability. The directory is intended to make research
          easier, not to provide a guarantee about a model or its suitability.
        </p>
      </ContentSection>

      <ContentSection title="Where model information comes from">
        <p>
          Model listings and repository metadata are retrieved from the
          Hugging Face Hub API. Where available, inference availability,
          context lengths, and provider pricing are supplemented from the
          Hugging Face Inference Providers catalog. Missing information is
          shown as unavailable rather than estimated.
        </p>
        <p>
          Hugging Face, model publishers, and inference providers are
          independent third parties. FreeLLMAgents is not affiliated with or
          endorsed by them. Listing a model does not imply a partnership or
          endorsement.
        </p>
      </ContentSection>

      <ContentSection title="FAQ">
        <div id="faq" className="scroll-mt-8">
          <h3 className="font-semibold text-foreground">
            Does “open source” mean the model is approved for every use?
          </h3>
          <p>
            No. The directory reflects license metadata declared in a model
            repository and does not provide legal advice or independently
            validate the license. Review the publisher’s terms before use.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            Why is some model information missing?
          </h3>
          <p>
            The upstream APIs do not publish every field for every model or
            provider. We do not fill gaps with guesses.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            How can I contact the site?
          </h3>
          <p>
            Use the{" "}
            <Link className="text-primary underline" href="/contact">
              contact form
            </Link>{" "}
            or email support@freellmagents.com.
          </p>
        </div>
      </ContentSection>
    </ContentPage>
  );
}
