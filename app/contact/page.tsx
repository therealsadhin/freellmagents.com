import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the FreeLLMAgents team about the model directory or website.",
  alternates: { canonical: "/contact" },
};

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
