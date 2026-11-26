import { ModelExplorer } from "@/components/model-explorer";
import { JsonLd } from "@/components/json-ld";
import { getModels } from "@/lib/models";
import { createPageMetadata } from "@/lib/seo-metadata";
import { createWebPageStructuredData } from "@/lib/structured-data";

const pageTitle = "Free AI Model Directory and Comparison | FreeLLMAgents";
const pageDescription =
  "Explore AI models by task, license, context window, provider access, and reported pricing. Compare Hugging Face model data in the FreeLLMAgents directory.";

export const metadata = createPageMetadata({
  title: pageTitle,
  description: pageDescription,
  canonical: "/",
});

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
      <JsonLd
        data={createWebPageStructuredData({
          canonical: "/",
          title: pageTitle,
          description: pageDescription,
        })}
      />
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
