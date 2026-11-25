import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      aria-label="Loading AI models"
      className="mx-auto w-full max-w-[1720px] flex-1 px-5 pt-[41px] sm:px-7 lg:px-12"
    >
      <Skeleton className="h-[88px] w-[min(650px,90%)]" />
      <Skeleton className="mt-4 h-8 w-[min(800px,90%)]" />
      <div className="mt-6 flex gap-4">
        <Skeleton className="h-[51px] flex-1" />
        <Skeleton className="h-[51px] w-[157px]" />
      </div>
      <Skeleton className="mt-6 h-[51px] w-full" />
      <div className="mt-[91px] grid grid-cols-1 gap-[14px] md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[208px] rounded-[10px]" />
        ))}
      </div>
    </main>
  );
}
