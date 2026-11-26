import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ContentPage, ContentSection } from "@/components/content-page";
import { createPageMetadata } from "@/lib/seo-metadata";

export const metadata = createPageMetadata({
  title: "FreeLLMAgents Cookie Policy: Browser Storage Details",
  description:
    "Learn whether FreeLLMAgents uses cookies or browser storage, what third-party services may process, and how to manage storage in your browser.",
  canonical: "/cookies",
});

export default function CookiesPage() {
  return (
    <ContentPage
      title="Cookie Policy"
      description="The current FreeLLMAgents application is designed not to use non-essential cookies."
    >
      <ContentSection title="Cookies used by this application">
        <p>
          The current application does not intentionally set analytics,
          advertising, or personalization cookies, and it does not load
          analytics or advertising scripts. Browsing models and using search,
          sorting, filters, and pagination do not require a cookie preference
          cookie.
        </p>
        <p>
          The hosting platform or third-party services may use strictly
          necessary technical storage for security or delivery. The host is not
          configured in this project, so the operator should verify any
          platform cookies and describe them here if applicable.
        </p>
      </ContentSection>

      <ContentSection title="Managing cookies">
        <p>
          You can manage or delete cookies using your browser settings. Because
          the application does not currently set non-essential cookies, it
          does not display a separate consent banner or preference control.
          If analytics or other non-essential storage is added, this policy
          and consent controls must be reviewed before deployment.
        </p>
      </ContentSection>

      <Alert className="mt-9 border-border bg-muted">
        <AlertTitle>Site operator confirmation needed</AlertTitle>
        <AlertDescription>
          Review the production host, CDN, email integration, and any future
          third-party scripts for cookies or local storage before publishing.
          Update this policy if the implementation changes.
        </AlertDescription>
      </Alert>
    </ContentPage>
  );
}
