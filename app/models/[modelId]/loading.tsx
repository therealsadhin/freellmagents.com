import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingModelPage() {
  return (
    <main
      aria-label="Loading model details"
      className="mx-auto w-full max-w-[1320px] flex-1 px-5 py-8 sm:px-7 sm:py-10 lg:px-12"
    >
      <Skeleton className="mb-7 h-5 w-56" />
      <div className="grid gap-7 border-b border-border pb-8 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex items-start gap-5">
          <Skeleton className="size-16 shrink-0 rounded-full sm:size-[76px]" />
          <div className="flex w-full flex-col gap-3">
            <Skeleton className="h-14 w-[min(650px,90%)]" />
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-20 w-[min(780px,95%)]" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <Skeleton className="mt-8 h-11 w-full max-w-3xl" />
      <Skeleton className="mt-6 h-64 w-full" />
    </main>
  );
}
