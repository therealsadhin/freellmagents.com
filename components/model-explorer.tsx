"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { ModelCard } from "@/components/model-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  getCompareSelectionSnapshot,
  getEmptyCompareSelection,
  subscribeToCompareSelection,
  writeCompareSelection,
} from "@/lib/compare-selection";
import {
  getEmptyModelPageCursors,
  getModelPageCursors,
  saveModelPageCursor,
  subscribeToModelPageCursors,
} from "@/lib/model-page-cursors";
import type { Model } from "@/lib/models";

const categories = [
  { value: "all", label: "All models" },
  { value: "chat", label: "Chat" },
  { value: "coding", label: "Coding" },
  { value: "reasoning", label: "Reasoning" },
  { value: "image", label: "Image" },
  { value: "audio", label: "Audio" },
  { value: "open-source", label: "Open source" },
] as const;

type CategoryFilter = (typeof categories)[number]["value"];

type ModelFilters = {
  provider: string;
  modelType: string;
  contextWindow: string;
  inputPrice: string;
  outputPrice: string;
  openWeights: string;
  toolsSupport: string;
};

type FilterOption = {
  value: string | null;
  label: string;
};

const emptyFilters: ModelFilters = {
  provider: "",
  modelType: "",
  contextWindow: "",
  inputPrice: "",
  outputPrice: "",
  openWeights: "",
  toolsSupport: "",
};

const modelTypeOptions: FilterOption[] = [
  { value: null, label: "Any type" },
  { value: "chat", label: "Chat" },
  { value: "coding", label: "Coding" },
  { value: "reasoning", label: "Reasoning" },
  { value: "image", label: "Image" },
  { value: "audio", label: "Audio" },
  { value: "open-source", label: "Open source" },
];

const contextOptions: FilterOption[] = [
  { value: null, label: "Any size" },
  { value: "128000", label: "128K+ tokens" },
  { value: "1000000", label: "1M+ tokens" },
];

const priceOptions: FilterOption[] = [
  { value: null, label: "Any price" },
  { value: "0.001", label: "Up to $0.001" },
  { value: "0.005", label: "Up to $0.005" },
  { value: "0.01", label: "Up to $0.01" },
];

const booleanOptions = (anyLabel: string): FilterOption[] => [
  { value: null, label: anyLabel },
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

function FilterField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[6px]">
      <label htmlFor={id} className="text-[14px] leading-5 font-semibold">
        {label}
      </label>
      <Select
        value={value || null}
        onValueChange={(nextValue) => onChange(nextValue ?? "")}
        items={options}
      >
        <SelectTrigger
          id={id}
          className="h-[36px] w-full min-w-0 rounded-[6px] border-border bg-surface px-3 text-[14px] shadow-none"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start" side="bottom" alignItemWithTrigger={false}>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.label} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function ModelSearch({
  search,
  onSearch,
}: {
  search: string;
  onSearch: (value: string) => void;
}) {
  const [query, setQuery] = useState(search);

  useEffect(() => {
    if (query.trim() === search.trim()) return;

    const timeout = window.setTimeout(() => {
      onSearch(query.trim());
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [onSearch, query, search]);

  return (
    <label className="relative min-w-0 flex-1">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-[17px] size-[22px] -translate-y-1/2 text-[#898c8d]"
      />
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search models, providers, or capabilities..."
        aria-label="Search models, providers, or capabilities"
        className="h-[51px] rounded-[9px] border-border bg-surface pl-[54px] text-[16px] shadow-none placeholder:text-[#858585] focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/25 md:text-[18px]"
      />
    </label>
  );
}

function matchesFilters(model: Model, filters: ModelFilters) {
  if (filters.provider && model.authorId !== filters.provider) return false;

  if (filters.modelType) {
    if (
      filters.modelType === "open-source" &&
      model.classification !== "open-source"
    ) {
      return false;
    }
    if (filters.modelType !== "open-source") {
      const selectedType = (
        ["chat", "coding", "reasoning", "image", "audio"] as const
      ).find((type) => type === filters.modelType);
      if (!selectedType || !model.categories.includes(selectedType)) return false;
    }
  }

  if (
    filters.contextWindow &&
    (model.contextWindow === null ||
      model.contextWindow < Number(filters.contextWindow))
  ) {
    return false;
  }
  if (
    filters.inputPrice &&
    (model.inputPrice === null ||
      model.inputPrice / 1000 > Number(filters.inputPrice))
  ) {
    return false;
  }
  if (
    filters.outputPrice &&
    (model.outputPrice === null ||
      model.outputPrice / 1000 > Number(filters.outputPrice))
  ) {
    return false;
  }
  if (
    filters.openWeights &&
    (model.classification === "open-source" ||
      model.classification === "open-weight") !==
      (filters.openWeights === "true")
  ) {
    return false;
  }
  if (
    filters.toolsSupport &&
    model.supportsTools !== (filters.toolsSupport === "true")
  ) {
    return false;
  }

  return true;
}

type ModelExplorerProps = {
  models: Model[];
  warnings: string[];
  query: string;
  category: string;
  provider: string;
  filters: Omit<ModelFilters, "provider">;
  sort: "popular" | "downloads" | "trending" | "updated" | "newest";
  pageNumber: number;
  currentCursor: string | null;
  nextCursor: string | null;
  totalResults: number | null;
};

const sortingOptions = [
  { value: "popular", label: "Most popular" },
  { value: "downloads", label: "Most downloaded" },
  { value: "trending", label: "Trending" },
  { value: "updated", label: "Recently updated" },
  { value: "newest", label: "Recently added" },
] as const;

export function ModelExplorer({
  models,
  warnings,
  query: search,
  category: selectedCategory,
  provider,
  filters,
  sort,
  pageNumber,
  currentCursor,
  nextCursor,
  totalResults,
}: ModelExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const category: CategoryFilter = categories.some(
    (item) => item.value === selectedCategory,
  )
    ? (selectedCategory as CategoryFilter)
    : "all";
  const activeFilters = useMemo(
    () => ({ ...filters, provider }),
    [filters, provider],
  );
  const [draftFilters, setDraftFilters] = useState<ModelFilters>({
    ...emptyFilters,
    provider,
    ...filters,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const comparedIds = useSyncExternalStore(
    subscribeToCompareSelection,
    getCompareSelectionSnapshot,
    getEmptyCompareSelection,
  );
  const paginationContext = useMemo(
    () =>
      JSON.stringify([
        search,
        category,
        provider,
        filters.modelType,
        filters.contextWindow,
        filters.inputPrice,
        filters.outputPrice,
        filters.openWeights,
        filters.toolsSupport,
        sort,
      ]),
    [
      category,
      filters.contextWindow,
      filters.inputPrice,
      filters.modelType,
      filters.openWeights,
      filters.outputPrice,
      filters.toolsSupport,
      provider,
      search,
      sort,
    ],
  );
  const paginationStorageKey = `freellmagents:model-page-cursors:${paginationContext}`;
  const subscribeToPageCursors = useCallback(
    (onChange: () => void) =>
      subscribeToModelPageCursors(paginationStorageKey, onChange),
    [paginationStorageKey],
  );
  const getPageCursorSnapshot = useCallback(
    () => getModelPageCursors(paginationStorageKey),
    [paginationStorageKey],
  );
  const pageCursors = useSyncExternalStore(
    subscribeToPageCursors,
    getPageCursorSnapshot,
    getEmptyModelPageCursors,
  );

  const navigate = useCallback(
    (
      updates: Record<string, string | null>,
      resetPagination = true,
    ) => {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      if (resetPagination) {
        params.delete("cursor");
        params.delete("page");
      }
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );
  const handleSearch = useCallback(
    (value: string) => navigate({ q: value || null }),
    [navigate],
  );

  const providers = useMemo(
    () => [...new Map(models.map((model) => [model.authorId, model.provider]))],
    [models],
  );
  const providerOptions: FilterOption[] = [
    { value: null, label: "Any provider" },
    ...providers.map(([id, name]) => ({ value: id, label: name })),
  ];

  const visibleModels = useMemo(() => {
    return models.filter((model) => {
      const matchesCategory =
        category === "all" ||
        (category === "open-source"
          ? model.classification === "open-source"
          : model.categories.includes(category));

      return matchesCategory && matchesFilters(model, activeFilters);
    });
  }, [activeFilters, category, models]);

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;
  const showResultCount =
    search.trim() !== "" ||
    category !== "all" ||
    activeFilterCount > 0 ||
    pageNumber > 1;

  function updateDraft(key: keyof ModelFilters, value: string) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setDraftFilters({ ...emptyFilters });
    navigate({
      provider: null,
      f_type: null,
      f_context: null,
      f_input: null,
      f_output: null,
      f_weights: null,
      f_tools: null,
    });
  }

  function handleCategoryChange(value: string[]) {
    const nextCategory = categories.find((item) => item.value === value[0]);
    const next = nextCategory?.value ?? "all";
    navigate({ category: next === "all" ? null : next });
  }

  function handleCompareChange(modelId: string, selected: boolean) {
    const next = new Set(comparedIds);
    if (selected) next.add(modelId);
    else next.delete(modelId);
    writeCompareSelection(next);
  }

  function clearSearchAndCategory() {
    setDraftFilters({ ...emptyFilters });
    navigate({
      q: null,
      category: null,
      provider: null,
      f_type: null,
      f_context: null,
      f_input: null,
      f_output: null,
      f_weights: null,
      f_tools: null,
    });
  }

  function applyFilters() {
    setFiltersOpen(false);
    navigate({
      provider: draftFilters.provider || null,
      f_type: draftFilters.modelType || null,
      f_context: draftFilters.contextWindow || null,
      f_input: draftFilters.inputPrice || null,
      f_output: draftFilters.outputPrice || null,
      f_weights: draftFilters.openWeights || null,
      f_tools: draftFilters.toolsSupport || null,
    });
  }

  const availableCursors = {
    ...pageCursors,
    ...(pageNumber > 1 && currentCursor
      ? { [pageNumber]: currentCursor }
      : {}),
    ...(nextCursor ? { [pageNumber + 1]: nextCursor } : {}),
  };
  const knownPages = [...new Set([1, pageNumber, ...Object.keys(availableCursors).map(Number)])]
    .filter((page) => page >= 1)
    .sort((left, right) => left - right);
  const totalPages =
    totalResults !== null ? Math.ceil(totalResults / 24) : null;
  const canGoPrevious =
    pageNumber > 1 &&
    (pageNumber - 1 === 1 || Boolean(availableCursors[pageNumber - 1]));
  const displayPages = knownPages.filter(
    (page) =>
      page === 1 ||
      Math.abs(page - pageNumber) <= 2 ||
      (totalPages === page && page === knownPages.at(-1)),
  );

  function storePageCursor(page: number, cursor: string) {
    saveModelPageCursor(paginationStorageKey, page, cursor);
  }

  function navigateToPage(nextPage: number) {
    let cursor = nextPage === 1 ? null : availableCursors[nextPage];
    if (nextPage === pageNumber + 1 && nextCursor) {
      cursor = nextCursor;
      storePageCursor(nextPage, nextCursor);
    }
    if (nextPage > 1 && !cursor) return;
    navigate(
      {
        page: nextPage === 1 ? null : String(nextPage),
        cursor,
      },
      false,
    );
  }

  function changeSort(nextSort: string | null) {
    navigate({ sort: nextSort === "popular" ? null : nextSort });
  }

  return (
    <>
      <div className="mt-[21px] flex items-stretch gap-[17px]">
        <ModelSearch
          key={search}
          search={search}
          onSearch={handleSearch}
        />

        <Popover
          open={filtersOpen}
          onOpenChange={(open) => {
            setFiltersOpen(open);
            if (open) setDraftFilters({ ...activeFilters });
          }}
        >
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className="h-[51px] min-w-[157px] shrink-0 gap-3 rounded-[9px] border-primary bg-surface px-[17px] text-[16px] font-semibold text-primary hover:bg-muted"
              />
            }
          >
            <SlidersHorizontal data-icon="inline-start" />
            Filters
            <span className="flex size-[23px] items-center justify-center rounded-full bg-primary text-[12px] leading-none text-primary-foreground">
              {activeFilterCount}
            </span>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={8}
            className="max-h-(--available-height) w-[490px] max-w-[calc(100vw-48px)] gap-0 overflow-y-auto overscroll-contain rounded-[11px] border border-[#dad8d0] bg-[#fdfcf8] p-[19px] shadow-[0_8px_24px_rgba(27,30,26,0.12)]"
          >
            <div className="grid grid-cols-1 gap-x-[18px] gap-y-[15px] sm:grid-cols-2 lg:grid-cols-3">
              <FilterField
                id="filter-provider"
                label="Provider"
                value={draftFilters.provider}
                options={providerOptions}
                onChange={(value) => updateDraft("provider", value)}
              />
              <FilterField
                id="filter-type"
                label="Model type"
                value={draftFilters.modelType}
                options={modelTypeOptions}
                onChange={(value) => updateDraft("modelType", value)}
              />
              <FilterField
                id="filter-context"
                label="Context window"
                value={draftFilters.contextWindow}
                options={contextOptions}
                onChange={(value) => updateDraft("contextWindow", value)}
              />
              <FilterField
                id="filter-input-price"
                label="Input price"
                value={draftFilters.inputPrice}
                options={priceOptions}
                onChange={(value) => updateDraft("inputPrice", value)}
              />
              <FilterField
                id="filter-output-price"
                label="Output price"
                value={draftFilters.outputPrice}
                options={priceOptions}
                onChange={(value) => updateDraft("outputPrice", value)}
              />
              <FilterField
                id="filter-open-weights"
                label="Open weights"
                value={draftFilters.openWeights}
                options={booleanOptions("Any option")}
                onChange={(value) => updateDraft("openWeights", value)}
              />
              <FilterField
                id="filter-tools"
                label="Tools support"
                value={draftFilters.toolsSupport}
                options={booleanOptions("Any option")}
                onChange={(value) => updateDraft("toolsSupport", value)}
              />
            </div>

            <div className="sticky bottom-0 mt-[14px] grid grid-cols-2 gap-3 bg-[#fdfcf8] pt-2">
              <Button
                variant="secondary"
                className="h-[37px] rounded-[6px] bg-muted text-[14px] font-semibold text-foreground hover:bg-[#e8e5db]"
                onClick={clearFilters}
              >
                Clear all
              </Button>
              <Button
                className="h-[37px] rounded-[6px] bg-primary text-[14px] font-semibold text-primary-foreground hover:bg-[#0b3826]"
                onClick={applyFilters}
              >
                Apply filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-[25px] border-b border-border">
        <ToggleGroup
          aria-label="Filter models by category"
          value={[category]}
          onValueChange={handleCategoryChange}
          className="w-full gap-1 overflow-x-auto rounded-none pb-[5px]"
          spacing={0}
        >
          {categories.map((item) => (
            <ToggleGroupItem
              key={item.value}
              value={item.value}
              className="h-[45px] shrink-0 rounded-[9px] px-[20px] text-[16px] font-medium text-foreground hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-[#0b3826]"
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {warnings.map((warning) => (
        <Alert
          key={warning}
          className="mt-4 border-border bg-surface text-sm text-muted-foreground"
        >
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      ))}

      <section
        id="models"
        aria-label="AI models"
        className="mt-[104px] pb-16 max-md:mt-10"
      >
        <div className="mb-4 flex items-center justify-end gap-3">
          <label htmlFor="model-sort" className="text-sm text-muted-foreground">
            Sort by
          </label>
          <Select
            value={sort}
            onValueChange={changeSort}
            items={sortingOptions}
          >
            <SelectTrigger
              id="model-sort"
              className="h-9 w-[190px] border-border bg-surface"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                {sortingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {(showResultCount || comparedIds.size > 0) && (
          <div className="mb-[15px] flex min-h-5 items-center justify-between text-[13px] text-muted-foreground">
            {showResultCount ? (
              <span>
                {visibleModels.length}{" "}
                {visibleModels.length === 1 ? "model" : "models"} on this page
              </span>
            ) : (
              <span />
            )}
            {comparedIds.size > 0 && (
              <div className="flex items-center gap-3">
                <span>{comparedIds.size} selected to compare</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-1 py-0 text-[13px] text-primary"
                  onClick={() => writeCompareSelection(new Set())}
                >
                  Clear selection
                </Button>
              </div>
            )}
          </div>
        )}

        {visibleModels.length > 0 ? (
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2 xl:grid-cols-3">
            {visibleModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                selected={comparedIds.has(model.id)}
                onCompareChange={handleCompareChange}
              />
            ))}
          </div>
        ) : (
          <Empty className="min-h-[230px] border border-dashed border-border bg-surface">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle className="font-heading text-xl">
                No models found
              </EmptyTitle>
              <EmptyDescription>
                Try a different search or clear the selected filters.
              </EmptyDescription>
            </EmptyHeader>
            <Button
              variant="outline"
              className="mt-1 border-border bg-surface"
              onClick={clearSearchAndCategory}
            >
              Clear search and filters
            </Button>
          </Empty>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <span className="text-sm text-muted-foreground">
            Page {pageNumber}
            {totalPages !== null ? ` of ${Math.max(1, totalPages)}` : ""}
          </span>
          <Pagination aria-label="Model directory pages" className="mx-0 w-auto">
            <PaginationContent className="flex-wrap">
              <PaginationItem>
                <PaginationPrevious
                  href="#models"
                  aria-disabled={!canGoPrevious}
                  className={
                    !canGoPrevious
                      ? "pointer-events-none border-border bg-surface opacity-50"
                      : "border-border bg-surface"
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    if (canGoPrevious) navigateToPage(pageNumber - 1);
                  }}
                />
              </PaginationItem>
              {displayPages.map((page, index) => {
                const previousPage = displayPages[index - 1];
                const hasGap = previousPage !== undefined && page - previousPage > 1;
                return (
                  <Fragment key={page}>
                    {hasGap && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem
                      className={
                        page === 1 && pageNumber !== 1 ? "hidden sm:block" : ""
                      }
                    >
                      <PaginationLink
                        href="#models"
                        isActive={page === pageNumber}
                        aria-label={`Go to page ${page}`}
                        className={
                          page === pageNumber
                            ? "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                            : "text-foreground"
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          navigateToPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </Fragment>
                );
              })}
              {nextCursor &&
                totalPages !== pageNumber + 1 &&
                displayPages.at(-1) === pageNumber + 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              <PaginationItem>
                <PaginationNext
                  href="#models"
                  aria-disabled={!nextCursor}
                  className={
                    nextCursor
                      ? "border-border bg-surface"
                      : "pointer-events-none border-border bg-surface opacity-50"
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    if (nextCursor) navigateToPage(pageNumber + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </section>
    </>
  );
}

