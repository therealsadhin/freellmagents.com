import { Skeleton } from "@/components/ui/skeleton";

export default function CostCalculatorLoading() {
  return (
    <main className="mx-auto w-full max-w-[1720px] flex-1 px-5 py-10 sm:px-7 lg:px-12">
      <Skeleton className="h-16 w-3/4 max-w-2xl" />
      <Skeleton className="mt-4 h-6 w-full max-w-3xl" />
      <Skeleton className="mt-8 h-11 w-full max-w-3xl" />
      <div className="mt-7 grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-[720px] rounded-2xl" />
        <Skeleton className="h-[720px] rounded-2xl" />
      </div>
    </main>
  );
}
