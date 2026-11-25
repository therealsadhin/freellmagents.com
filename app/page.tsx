import { ModelExplorer } from "@/components/model-explorer";
import { getModels } from "@/lib/models";

export const metadata = {
  title: "Explore AI models",
  description:
    "Compare AI models by capability, licensing, context, provider availability, and pricing.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Explore AI models | FreeLLMAgents",
    description:
      "Compare AI models by capability, licensing, context, provider availability, and pricing.",
    url: "/",
  },
};

type SearchParams = {
  q?: string;
  category?: string;
  provider?: string;
  sort?: string;
  cursor?: string;
  page?: string;
  f_type?: string;
  f_context?: string;
  f_input?: string;
  f_output?: string;
  f_weights?: string;
  f_tools?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sort =
    params.sort === "downloads" ||
    params.sort === "trending" ||
    params.sort === "updated" ||
    params.sort === "newest"
      ? params.sort
      : "popular";
  const requestedPageNumber = Math.max(1, Number(params.page) || 1);
  const pageNumber = params.cursor ? requestedPageNumber : 1;
  const modelPage = await getModels({
    search: params.q,
    category: params.category,
    provider: params.provider,
    sort,
    cursor: params.cursor,
  });

  return (
    <main className="mx-auto w-full max-w-[1720px] flex-1 px-5 pt-[41px] sm:px-7 lg:px-12">
      <h1 className="font-heading text-[clamp(3.35rem,6vw,5.55rem)] leading-[0.98] font-bold tracking-[-0.06em] text-foreground">
        Explore AI models
      </h1>
      <p className="mt-[12px] text-[clamp(1.05rem,2vw,1.65rem)] leading-[1.35] tracking-[-0.025em] text-foreground">
        Compare capabilities, context windows, and pricing across leading models.
      </p>
      <ModelExplorer
        models={modelPage.models}
        warnings={modelPage.warnings}
        query={params.q ?? ""}
        category={params.category ?? "all"}
        provider={params.provider ?? ""}
        filters={{
          modelType: params.f_type ?? "",
          contextWindow: params.f_context ?? "",
          inputPrice: params.f_input ?? "",
          outputPrice: params.f_output ?? "",
          openWeights: params.f_weights ?? "",
          toolsSupport: params.f_tools ?? "",
        }}
        sort={sort}
        pageNumber={pageNumber}
        currentCursor={params.cursor ?? null}
        nextCursor={modelPage.nextCursor}
        totalResults={modelPage.totalResults}
      />
    </main>
  );
}
