import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export default function ModelNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[1050px] flex-1 items-center px-5 py-16 sm:px-7 lg:px-12">
      <Empty className="min-h-64 border border-dashed border-border bg-surface">
        <EmptyHeader>
          <EmptyTitle className="font-heading text-2xl">
            Model not found
          </EmptyTitle>
          <EmptyDescription>
            This model may have been removed or its repository ID may be incorrect.
          </EmptyDescription>
        </EmptyHeader>
        <Button
          nativeButton={false}
          render={<Link href="/" />}
          className="mt-2"
        >
          Return to models
        </Button>
      </Empty>
    </main>
  );
}
