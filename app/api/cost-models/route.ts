import { getModels } from "@/lib/models";

const MAX_SEARCH_LENGTH = 120;

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams
    .get("q")
    ?.trim()
    .slice(0, MAX_SEARCH_LENGTH);

  try {
    const page = await getModels({
      search: search || undefined,
      sort: "popular",
    });

    return Response.json({
      models: page.models,
      warnings: page.warnings,
    });
  } catch (cause) {
    console.error("Cost calculator model lookup failed.", { cause });
    return Response.json(
      { error: "Model search is temporarily unavailable." },
      { status: 502 },
    );
  }
}
