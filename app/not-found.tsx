import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = {
  title: { absolute: "Page Not Found | FreeLLMAgents" },
  description:
    "The page you requested could not be found. Browse the FreeLLMAgents AI model directory or return to the homepage.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[1050px] flex-1 items-center px-5 py-16 sm:px-7 lg:px-12">
      <Empty className="min-h-64 border border-dashed border-border bg-surface">
        <EmptyHeader>
          <EmptyTitle className="font-heading text-2xl">
            404 — Page not found
          </EmptyTitle>
          <EmptyDescription>
            The page you requested may have moved or no longer exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button
          nativeButton={false}
          render={<Link href="/" />}
          className="mt-2"
        >
          Return to the model directory
        </Button>
      </Empty>
    </main>
  );
}
