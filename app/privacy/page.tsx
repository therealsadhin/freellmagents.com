import type { Metadata } from "next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy information for FreeLLMAgents, including model lookups and contact messages.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      description="How FreeLLMAgents currently handles information when you browse the directory or contact us."
    >
      <p>
        This page describes the website as currently implemented. It is not
        legal advice. The site operator should review the highlighted
        operational details before publication and update this notice if
        services or data practices change.
      </p>

      <ContentSection title="Information processed">
        <p>
          Model searches, sorting, categories, and pagination are sent to the
          website server as URL parameters. The server requests model metadata
          from Hugging Face APIs. The site does not require an account to browse
          the model directory and does not send Hugging Face tokens to a
          visitor’s browser.
        </p>
        <p>
          If you submit the contact form, the name, email address, subject, and
          message are sent to the configured email delivery service and the
          support mailbox. The email address is used as the reply-to address.
          The website does not keep a contact-message database.
        </p>
        <p>
          The contact endpoint uses the incoming network address transiently
          for an in-process rate limit. The current implementation does not
          intentionally persist that address. The hosting platform may
          independently process request data in its operational logs; the
          hosting provider and its retention settings must be confirmed by the
          site operator.
        </p>
      </ContentSection>

      <ContentSection title="Third-party services">
        <p>
          Model data is requested from Hugging Face Hub and Hugging Face
          Inference Providers. Contact messages are sent using Resend when
          delivery credentials are configured. These services operate under
          their own terms and privacy notices and may process request or
          message data to provide their services.
        </p>
        <p>
          Provider avatars and logo fallbacks are loaded by the browser from
          the Hugging Face avatar CDN, SimpleIcons, and Google&apos;s favicon
          service when available. Those image hosts may receive your IP address
          and browser request metadata; referrer information is suppressed for
          logo images. The website does not load their analytics scripts.
        </p>
        <p>
          FreeLLMAgents is independent of Hugging Face and the publishers and
          providers whose models are listed. A model listing does not indicate
          that its publisher provides information directly to this website.
        </p>
      </ContentSection>

      <ContentSection title="Cookies and analytics">
        <p>
          The current application does not intentionally set analytics,
          advertising, or preference cookies and does not include analytics
          scripts. Infrastructure or hosting services may use necessary
          technical storage; confirm the hosting configuration before
          publication. No non-essential tracking is introduced by this
          application.
        </p>
      </ContentSection>

      <ContentSection title="Retention and your choices">
        <p>
          Contact messages are delivered to the configured support mailbox;
          mailbox and email-service retention are controlled by the site
          operator and service providers. The website has no message-retention
          schedule configured. To ask about a contact message, email{" "}
          <a className="text-primary underline" href="mailto:support@freellmagents.com">
            support@freellmagents.com
          </a>
          .
        </p>
      </ContentSection>

      <Alert className="mt-9 border-border bg-muted">
        <AlertTitle>Site operator confirmation needed</AlertTitle>
        <AlertDescription>
          Confirm the hosting provider and access-log retention, Resend’s
          applicable processing/retention settings, the support mailbox
          retention practice, and the appropriate privacy contact before
          publishing this policy.
        </AlertDescription>
      </Alert>
    </ContentPage>
  );
}
