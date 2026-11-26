import Link from "next/link";
import { ContentPage } from "@/components/content-page";
import { createPageMetadata } from "@/lib/seo-metadata";

export const metadata = createPageMetadata({
  title: "Browse AI Models Without an Account | FreeLLMAgents",
  description:
    "Browse the FreeLLMAgents AI model directory without an account. Compare model capabilities, provider availability, reported licenses, and published pricing.",
  canonical: "/sign-in",
});

export default function SignInPage() {
  return (
    <ContentPage
      title="No account needed"
      description="The FreeLLMAgents model directory is available to browse without signing in."
    >
      <p>
        Account sign-in is not currently enabled. You can continue to the{" "}
        <Link className="text-primary underline" href="/#models">
          model directory
        </Link>{" "}
        or <Link className="text-primary underline" href="/contact">contact us</Link>.
      </p>
    </ContentPage>
  );
}
