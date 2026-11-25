"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export default function ModelPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Could not render the model detail page.", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-[1050px] flex-1 items-center px-5 py-16 sm:px-7 lg:px-12">
      <Empty className="min-h-64 border border-dashed border-border bg-surface">
        <EmptyHeader>
          <EmptyTitle className="font-heading text-2xl">
            Model details are temporarily unavailable
          </EmptyTitle>
          <EmptyDescription>
            The model source could not be reached. Please retry in a moment.
          </EmptyDescription>
        </EmptyHeader>
        <Button className="mt-2" onClick={reset}>
          Try again
        </Button>
      </Empty>
    </main>
  );
}
