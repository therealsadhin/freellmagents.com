"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  GitCompareArrows,
  Info,
  LoaderCircle,
  RotateCw,
} from "lucide-react";
import { ProviderLogo } from "@/components/provider-logo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getCompareSelectionSnapshot,
  getEmptyCompareSelection,
  subscribeToCompareSelection,
  writeCompareSelection,
} from "@/lib/compare-selection";
import type {
  ModelDetails,
  ModelFile,
  ModelFilesPage,
} from "@/lib/models";
import { Skeleton } from "@/components/ui/skeleton";

const tabItems = [
  { value: "overview", label: "Overview" },
  { value: "specifications", label: "Specifications" },
  { value: "pricing", label: "Pricing" },
  { value: "benchmarks", label: "Benchmarks" },
  { value: "files", label: "Files & Versions" },
] as const;

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatParameters(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}M`;
  }
  return formatInteger(value);
}

function formatContext(contextWindow: number) {
  if (contextWindow >= 1_000_000) {
    return `${(contextWindow / 1_000_000).toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}M tokens`;
  }
  if (contextWindow >= 1_000) {
    return `${Math.round(contextWindow / 1_000)}K tokens`;
  }
  return `${formatInteger(contextWindow)} tokens`;
}

function formatPrice(value: number) {
  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(value)}`;
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

function formatBytes(bytes: number) {
  if (bytes >= 1_073_741_824) {
    return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  }
  if (bytes >= 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
  if (bytes >= 1_024) {
    return `${(bytes / 1_024).toFixed(1)} KB`;
  }
  return `${formatInteger(bytes)} B`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isModelFilesPage(value: unknown): value is ModelFilesPage {
  if (!isRecord(value) || !Array.isArray(value.files)) return false;
  if (value.nextCursor !== null && typeof value.nextCursor !== "string") {
    return false;
  }
  return value.files.every(
    (file: unknown): file is ModelFile =>
      isRecord(file) &&
      typeof file.path === "string" &&
      (typeof file.size === "number" || file.size === null) &&
      (typeof file.format === "string" || file.format === null) &&
      (typeof file.quantization === "string" || file.quantization === null) &&
      typeof file.url === "string",
  );
}

async function requestModelFiles(
  modelId: string,
  cursor: string | null,
): Promise<ModelFilesPage> {
  const params = new URLSearchParams({ model: modelId });
  if (cursor) params.set("cursor", cursor);
  const response = await fetch(`/api/model-files?${params.toString()}`);
  const payload: unknown = await response.json();

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : "Repository files could not be loaded.";
    throw new Error(message);
  }
  if (!isModelFilesPage(payload)) {
    throw new Error("The repository returned an invalid file list.");
  }
  return payload;
}

function classificationLabel(classification: ModelDetails["classification"]) {
  switch (classification) {
    case "open-source":
      return "Open source";
    case "open-weight":
      return "Open weights";
    case "proprietary":
      return "Proprietary";
    case "gated":
      return "Gated";
    default:
      return null;
  }
}

function ModelCompareButton({ modelId }: { modelId: string }) {
  const compareSelection = useSyncExternalStore(
    subscribeToCompareSelection,
    getCompareSelectionSnapshot,
    getEmptyCompareSelection,
  );
  const selected = compareSelection.has(modelId);

  function toggleSelection() {
    const next = new Set(compareSelection);
    if (next.has(modelId)) next.delete(modelId);
    else next.add(modelId);
    writeCompareSelection(next);
  }

  return (
    <Button
      variant={selected ? "default" : "outline"}
      className="h-10 border-border bg-surface px-4"
      aria-pressed={selected}
      onClick={toggleSelection}
    >
      <GitCompareArrows data-icon="inline-start" />
      {selected ? "Added to compare" : "Compare"}
    </Button>
  );
}

function ModelInfoSidebar({ model }: { model: ModelDetails }) {
  const details = [
    { label: "Provider", value: model.provider },
    { label: "Last updated", value: formatDate(model.lastUpdated) },
    {
      label: "Downloads",
      value: model.downloads === null ? null : formatInteger(model.downloads),
    },
    {
      label: "Likes",
      value: model.likes === null ? null : formatInteger(model.likes),
    },
  ].filter(
    (item): item is { label: string; value: string } => item.value !== null,
  );

  return (
    <Card className="h-fit gap-0 rounded-[10px] border border-border bg-surface shadow-none ring-0">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="font-heading text-xl font-semibold">
          Model information
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col px-5 pb-5">
        {details.map((item, index) => (
          <div key={item.label}>
            {index > 0 && <Separator className="my-3" />}
            <dl className="flex items-start justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="text-right font-medium">{item.value}</dd>
            </dl>
          </div>
        ))}
        {model.supportedTasks.length > 0 && (
          <>
            <Separator className="my-3" />
            <div>
              <h3 className="text-sm text-muted-foreground">Supported tasks</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {model.supportedTasks.map((task) => (
                  <Badge key={task} variant="outline" className="border-border">
                    {task.replace(/[-_]/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
        <Separator className="my-3" />
        <a
          href={model.modelUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Original model repository
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </a>
      </CardContent>
    </Card>
  );
}

function SpecificationTable({ model }: { model: ModelDetails }) {
  const specifications = [
    {
      label: "Parameters",
      value:
        model.parameterCount === null
          ? null
          : formatParameters(model.parameterCount),
      help: "Parameter count reported in the model repository metadata.",
    },
    {
      label: "Architecture",
      value: model.architecture.length
        ? model.architecture.join(", ")
        : null,
      help: "Architecture identifiers reported in the repository configuration.",
    },
    {
      label: "Model type",
      value: model.modelType,
      help: "Model type reported in the repository configuration.",
    },
    {
      label: "Context window",
      value:
        model.contextWindow === null
          ? null
          : formatContext(model.contextWindow),
      help: "Reported by an inference provider or model configuration.",
    },
    {
      label: "Input modalities",
      value: model.inputModalities.length
        ? model.inputModalities.join(", ")
        : null,
      help: "Input modalities explicitly listed in the model metadata.",
    },
    {
      label: "Output modalities",
      value: model.outputModalities.length
        ? model.outputModalities.join(", ")
        : null,
      help: "Output modalities explicitly listed in the model metadata.",
    },
    {
      label: "Languages",
      value: model.languages.length ? model.languages.join(", ") : null,
      help: "Languages listed in the model card metadata.",
    },
    { label: "License", value: model.license, help: "License declared by the model repository." },
    {
      label: "Training datasets",
      value: model.trainingDatasets.length
        ? model.trainingDatasets.join(", ")
        : null,
      help: "Training datasets listed in the model card metadata.",
    },
    {
      label: "Availability",
      value: model.gated === true ? "Gated" : model.gated === false ? "Public" : null,
      help: "Access status reported by the Hub.",
    },
  ].filter(
    (item): item is { label: string; value: string; help: string } =>
      item.value !== null,
  );

  if (specifications.length === 0) {
    return (
      <Empty className="min-h-36 border border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle className="font-heading text-lg">
            Specifications not listed
          </EmptyTitle>
          <EmptyDescription>
            The repository has not published technical specifications for this model.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table className="text-sm">
      <TableBody>
        {specifications.map((item) => (
          <TableRow key={item.label} className="border-border hover:bg-transparent">
            <TableHead scope="row" className="w-[38%] px-3 py-3 text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                {item.label}
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        aria-label={`Information about ${item.label}`}
                        className="rounded-full text-muted-foreground hover:text-foreground"
                      />
                    }
                  >
                    <Info aria-hidden="true" className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>{item.help}</TooltipContent>
                </Tooltip>
              </span>
            </TableHead>
            <TableCell className="whitespace-normal px-3 py-3 font-medium">
              {item.value}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function FilesTab({ modelId }: { modelId: string }) {
  const [files, setFiles] = useState<ModelFile[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const result = await requestModelFiles(modelId, cursor);
        setFiles((current) =>
          append ? [...current, ...result.files] : result.files,
        );
        setNextCursor(result.nextCursor);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Repository files could not be loaded.",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [modelId],
  );

  useEffect(() => {
    let active = true;
    void requestModelFiles(modelId, null)
      .then((result) => {
        if (!active) return;
        setFiles(result.files);
        setNextCursor(result.nextCursor);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Repository files could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [modelId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-label="Loading repository files">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (error && files.length === 0) {
    return (
      <Empty className="min-h-44 border border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle className="font-heading text-lg">
            Files could not be loaded
          </EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
        <Button
          variant="outline"
          className="border-border bg-surface"
          onClick={() => void loadPage(null, false)}
        >
          <RotateCw data-icon="inline-start" />
          Try again
        </Button>
      </Empty>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Showing {formatInteger(files.length)} repository files
        </p>
        <a
          href={`https://huggingface.co/${modelId}/tree/main`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Browse repository
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </a>
      </div>
      {files.length > 0 ? (
        <Table>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.path} className="border-border">
                <TableCell className="min-w-[220px] whitespace-normal px-3 py-3">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all font-medium text-primary hover:underline"
                  >
                    {file.path}
                  </a>
                </TableCell>
                <TableCell className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                  {file.size === null ? "—" : formatBytes(file.size)}
                </TableCell>
                <TableCell className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                  {file.format ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                  {file.quantization ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Empty className="min-h-36 border border-dashed border-border">
          <EmptyHeader>
            <EmptyTitle className="font-heading text-lg">
              No repository files found
            </EmptyTitle>
            <EmptyDescription>
              The Hub did not return files for this repository revision.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {error && (
        <p role="status" className="mt-3 text-sm text-destructive">
          More files could not be loaded: {error}
        </p>
      )}
      {nextCursor && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            className="border-border bg-surface"
            disabled={loadingMore}
            onClick={() => void loadPage(nextCursor, true)}
          >
            {loadingMore ? (
              <LoaderCircle
                data-icon="inline-start"
                className="animate-spin"
              />
            ) : null}
            {loadingMore ? "Loading files" : "Load more files"}
          </Button>
        </div>
      )}
    </div>
  );
}

function ModelDetailTabs({ model }: { model: ModelDetails }) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const hasOverviewDetails =
    model.intendedUses.length > 0 ||
    model.limitations.length > 0 ||
    model.trainingDatasets.length > 0;

  return (
    <div className="mt-9 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value)}
        className="min-w-0"
      >
        <TabsList
          variant="line"
          className="w-full justify-start gap-2 overflow-x-auto border-b border-border p-0"
        >
          {tabItems.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="h-11 flex-none rounded-none px-3 text-sm data-active:text-primary after:bg-primary sm:px-4"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <section aria-labelledby="model-overview-heading">
            <h2
              id="model-overview-heading"
              className="font-heading text-2xl font-semibold tracking-[-0.025em]"
            >
              Model overview
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-muted-foreground">
              {model.description ??
                "The publisher has not provided a summary in the model metadata."}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="font-heading text-xl font-semibold">Capabilities</h2>
            {model.supportedTasks.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {model.supportedTasks.map((task) => (
                  <Badge
                    key={task}
                    variant="outline"
                    className="border-border bg-surface px-2.5 py-1 text-xs"
                  >
                    {task.replace(/[-_]/g, " ")}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Supported tasks are not listed in the available repository metadata.
              </p>
            )}
          </section>

          {hasOverviewDetails && (
            <Accordion className="mt-8 border-t border-border">
              {model.intendedUses.length > 0 && (
                <AccordionItem value="intended-uses" className="border-border">
                  <AccordionTrigger className="py-4 text-base">
                    Intended use
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-muted-foreground">
                      {model.intendedUses.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
              {model.limitations.length > 0 && (
                <AccordionItem value="limitations" className="border-border">
                  <AccordionTrigger className="py-4 text-base">
                    Limitations
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-muted-foreground">
                      {model.limitations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
              {model.trainingDatasets.length > 0 && (
                <AccordionItem value="training-datasets" className="border-border">
                  <AccordionTrigger className="py-4 text-base">
                    Training information
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-muted-foreground">
                      {model.trainingDatasets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="specifications" className="mt-6">
          <section>
            <h2 className="mb-4 font-heading text-2xl font-semibold tracking-[-0.025em]">
              Specifications
            </h2>
            <SpecificationTable model={model} />
          </section>
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <section>
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.025em]">
              Inference pricing
            </h2>
            {model.providerPricing.length > 0 ? (
              <>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Prices are those listed by supported inference providers and may change.
                </p>
                <Table className="mt-4">
                  <TableBody>
                    {model.providerPricing.map((pricing) => (
                      <TableRow
                        key={pricing.provider}
                        className="border-border hover:bg-transparent"
                      >
                        <TableHead
                          scope="row"
                          className="px-3 py-3 font-medium"
                        >
                          {pricing.provider}
                        </TableHead>
                        <TableCell className="px-3 py-3 text-muted-foreground">
                          Input {formatPrice(pricing.inputPerMillion)} / 1M tokens
                        </TableCell>
                        <TableCell className="px-3 py-3 text-muted-foreground">
                          Output {formatPrice(pricing.outputPerMillion)} / 1M tokens
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {model.providerPricing.some(
                  (item) => item.inputPerMillion === 0 && item.outputPerMillion === 0,
                ) && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    A provider currently reports zero per-token prices for this model.
                  </p>
                )}
              </>
            ) : (
              <Empty className="mt-4 min-h-40 border border-dashed border-border">
                <EmptyHeader>
                  <EmptyTitle className="font-heading text-lg">
                    Pricing is not listed
                  </EmptyTitle>
                  <EmptyDescription>
                    No verified per-token pricing is available from the supported inference-provider data.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
            {model.supportedProviders.length > 0 && (
              <section className="mt-8">
                <h3 className="font-heading text-xl font-semibold">
                  Supported inference providers
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {model.supportedProviders.map((provider) => (
                    <Badge
                      key={provider}
                      variant="secondary"
                      className="rounded-full"
                    >
                      {provider}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </section>
        </TabsContent>

        <TabsContent value="benchmarks" className="mt-6">
          <section>
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.025em]">
              Benchmarks
            </h2>
            {model.benchmarks.length > 0 ? (
              <Table className="mt-4">
                <TableBody>
                  {model.benchmarks.map((benchmark, index) => (
                    <TableRow
                      key={`${benchmark.name}-${benchmark.source ?? ""}-${index}`}
                      className="border-border"
                    >
                      <TableHead
                        scope="row"
                        className="min-w-[150px] whitespace-normal px-3 py-3 font-medium"
                      >
                        {benchmark.name}
                      </TableHead>
                      <TableCell className="px-3 py-3">
                        {String(benchmark.score)}
                      </TableCell>
                      <TableCell className="whitespace-normal px-3 py-3 text-muted-foreground">
                        {benchmark.sourceUrl ? (
                          <a
                            href={benchmark.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            {benchmark.source ?? "Source"}
                          </a>
                        ) : (
                          benchmark.source ?? "—"
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                        {formatDate(benchmark.evaluatedAt) ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty className="mt-4 min-h-44 border border-dashed border-border">
                <EmptyHeader>
                  <EmptyTitle className="font-heading text-lg">
                    No benchmark results listed
                  </EmptyTitle>
                  <EmptyDescription>
                    The model repository does not include verified benchmark results.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </section>
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <section>
            <h2 className="mb-4 font-heading text-2xl font-semibold tracking-[-0.025em]">
              Files &amp; versions
            </h2>
            {model.detailWarnings.includes(
              "Repository versions are temporarily unavailable.",
            ) ? (
              <p className="mb-4 text-sm text-muted-foreground">
                Repository versions could not be loaded. Current files are still available below.
              </p>
            ) : null}
            {model.revisions.length > 0 && (
              <Accordion className="mb-5 border-y border-border">
                <AccordionItem value="repository-versions">
                  <AccordionTrigger className="py-4 text-base">
                    Repository versions ({model.revisions.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="flex flex-col gap-2 text-sm">
                      {model.revisions.map((revision) => (
                        <li
                          key={`${revision.kind}-${revision.name}`}
                          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1"
                        >
                          <a
                            href={`${model.modelUrl}/tree/${encodeURIComponent(revision.name)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-primary hover:underline"
                          >
                            {revision.name}
                          </a>
                          <span className="text-muted-foreground">
                            {revision.kind} · {revision.commit.slice(0, 8)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
            {activeTab === "files" ? <FilesTab modelId={model.id} /> : null}
          </section>
        </TabsContent>
      </Tabs>

      <ModelInfoSidebar model={model} />
    </div>
  );
}

export function ModelDetailView({ model }: { model: ModelDetails }) {
  const availability = classificationLabel(model.classification);
  const updated = formatDate(model.lastUpdated);

  return (
    <TooltipProvider>
      <main className="mx-auto w-full max-w-[1320px] flex-1 px-5 py-8 sm:px-7 sm:py-10 lg:px-12">
        <Breadcrumb className="mb-7">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>Models</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>
                {model.provider}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{model.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <section className="grid gap-7 border-b border-border pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="flex min-w-0 items-start gap-4 sm:gap-6">
            <div className="mt-1 flex size-16 shrink-0 items-center justify-center sm:size-[76px]">
              <div className="scale-110 sm:scale-125">
                <ProviderLogo
                  providerName={model.provider}
                  logo={model.logo}
                  logoFallbacks={model.logoFallbacks}
                />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
                {model.name}
              </h1>
              <p className="mt-2 text-base font-medium text-primary sm:text-lg">
                {model.provider}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {availability && (
                  <Badge variant="secondary" className="rounded-full">
                    {availability}
                  </Badge>
                )}
                {model.license && (
                  <Badge variant="outline" className="rounded-full border-border">
                    {model.license}
                  </Badge>
                )}
                {model.gated === true && (
                  <Badge variant="outline" className="rounded-full border-border">
                    Gated access
                  </Badge>
                )}
              </div>
              <p className="mt-4 max-w-3xl text-[15px] leading-7 text-muted-foreground">
                {model.description ??
                  "The publisher has not provided a summary in the model metadata."}
              </p>
              {model.supportedTasks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {model.supportedTasks.map((task) => (
                    <Badge
                      key={task}
                      variant="outline"
                      className="border-border bg-surface px-2.5 py-1 text-xs"
                    >
                      {task.replace(/[-_]/g, " ")}
                    </Badge>
                  ))}
                </div>
              )}
              {updated && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Updated {updated}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <ModelCompareButton modelId={model.id} />
            <Button
              variant="default"
              className="h-10 px-4"
              nativeButton={false}
              render={
                <a href={model.modelUrl} target="_blank" rel="noreferrer" />
              }
            >
              Visit model
              <ArrowUpRight data-icon="inline-end" />
            </Button>
          </div>
        </section>

        <ModelDetailTabs model={model} />
      </main>
    </TooltipProvider>
  );
}
