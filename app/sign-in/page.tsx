import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "FreeLLMAgents model browsing is currently available without an account.",
  alternates: { canonical: "/sign-in" },
};

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
