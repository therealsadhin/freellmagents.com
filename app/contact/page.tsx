import { ContactForm } from "@/components/contact-form";
import { ContentPage } from "@/components/content-page";
import { createPageMetadata } from "@/lib/seo-metadata";

export const metadata = createPageMetadata({
  title: "Contact FreeLLMAgents About the AI Model Directory",
  description:
    "Contact FreeLLMAgents with questions, corrections, or feedback about AI model listings, provider availability, pricing details, or the website.",
  canonical: "/contact",
});

export default function ContactPage() {
  return (
    <ContentPage
      title="Contact us"
      description="Questions, corrections, or feedback about the directory are welcome."
    >
      <p>
        Send a message using the form below. Messages are delivered to{" "}
        <a
          className="text-primary underline"
          href="mailto:support@freellmagents.com"
        >
          support@freellmagents.com
        </a>
        .
      </p>
      <div className="mt-8 rounded-xl border border-border bg-surface p-5 sm:p-8">
        <ContactForm />
      </div>
    </ContentPage>
  );
}
