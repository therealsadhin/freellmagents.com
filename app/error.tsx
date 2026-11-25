"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-[1720px] flex-1 px-5 pt-[41px] sm:px-7 lg:px-12">
      <h1 className="font-heading text-5xl font-bold tracking-[-0.05em]">
        Explore AI models
      </h1>
      <Alert variant="destructive" className="mt-8 max-w-2xl border-border bg-surface">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>We couldn’t load the models</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
