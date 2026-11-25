"use client";

import { useState, type ReactNode } from "react";
import { CostIntelligenceNavigation } from "@/components/cost-intelligence-navigation";
import { ModelCatalogPicker } from "@/components/model-catalog-picker";
import { ProviderLogo } from "@/components/provider-logo";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatTokens } from "@/lib/cost-format";
import type { Model } from "@/lib/models";

type ComparisonFeature = {
  id: string;
  label: string;
  value: (model: Model) => string;
  render?: (model: Model) => ReactNode;
};

function classificationLabel(classification: Model["classification"]): string {
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
      return "Unknown";
  }
}

function toolSupportLabel(support: boolean | null): string {
  if (support === null) return "Not reported";
  return support ? "Supported" : "Not supported";
}

function taskSupportLabel(
  model: Model,
  tasks: string[],
  category?: Model["categories"][number],
): string {
  if (tasks.some((task) => model.supportedTasks.includes(task))) {
    return "Supported";
  }
  if (category && model.categories.includes(category)) {
    return "Supported";
  }
  return "Not reported";
}

function pricingValue(model: Model, direction: "input" | "output"): string {
  if (model.providerPricing.length === 0) return "Not reported";
  return model.providerPricing
    .map((pricing) => {
      const value =
        direction === "input"
          ? pricing.inputPerMillion
          : pricing.outputPerMillion;
      return `${pricing.provider}: ${formatCurrency(value)} / 1M`;
    })
    .join(" · ");
}

const features: ComparisonFeature[] = [
  {
    id: "model",
    label: "Model name",
    value: (model) => model.name,
    render: (model) => (
      <a
        href={model.modelUrl}
        target="_blank"
        rel="noreferrer"
        className="font-medium underline-offset-4 hover:text-primary hover:underline"
      >
        {model.name}
      </a>
    ),
  },
  { id: "provider", label: "Provider", value: (model) => model.provider },
  {
    id: "model-type",
    label: "Model type",
    value: (model) => model.modelType ?? "Not reported",
  },
  {
    id: "input-price",
    label: "Input token pricing (USD / 1M tokens)",
    value: (model) => pricingValue(model, "input"),
    render: (model) =>
      model.providerPricing.length === 0 ? (
        <span className="text-muted-foreground">Not reported</span>
      ) : (
        <div className="flex flex-col gap-1">
          {model.providerPricing.map((pricing) => (
            <span key={pricing.provider} className="whitespace-nowrap">
              <span className="text-muted-foreground">{pricing.provider}</span>{" "}
              <span className="font-medium">
                {formatCurrency(pricing.inputPerMillion)}
              </span>
            </span>
          ))}
        </div>
      ),
  },
  {
    id: "output-price",
    label: "Output token pricing (USD / 1M tokens)",
    value: (model) => pricingValue(model, "output"),
    render: (model) =>
      model.providerPricing.length === 0 ? (
        <span className="text-muted-foreground">Not reported</span>
      ) : (
        <div className="flex flex-col gap-1">
          {model.providerPricing.map((pricing) => (
            <span key={pricing.provider} className="whitespace-nowrap">
              <span className="text-muted-foreground">{pricing.provider}</span>{" "}
              <span className="font-medium">
                {formatCurrency(pricing.outputPerMillion)}
              </span>
            </span>
          ))}
        </div>
      ),
  },
  {
    id: "context-window",
    label: "Context window",
    value: (model) =>
      model.contextWindow === null
        ? "Not reported"
        : `${formatTokens(model.contextWindow)} tokens`,
  },
  {
    id: "reasoning",
    label: "Reasoning support",
    value: (model) => taskSupportLabel(model, [], "reasoning"),
  },
  {
    id: "vision",
    label: "Vision input",
    value: (model) =>
      taskSupportLabel(model, [
        "image-text-to-text",
        "image-to-text",
        "visual-question-answering",
      ]),
  },
  {
    id: "image-generation",
    label: "Image generation",
    value: (model) => taskSupportLabel(model, ["text-to-image"]),
  },
  {
    id: "audio",
    label: "Audio support",
    value: (model) =>
      taskSupportLabel(model, [
        "text-to-speech",
        "automatic-speech-recognition",
        "audio-to-audio",
      ]),
  },
  {
    id: "tools",
    label: "Tool / function calling",
    value: (model) => toolSupportLabel(model.supportsTools),
  },
  {
    id: "open-weight",
    label: "Open-weight status",
    value: (model) => classificationLabel(model.classification),
  },
  {
    id: "parameters",
    label: "Parameter count",
    value: (model) =>
      model.parameterCount === null
        ? "Not reported"
        : formatTokens(model.parameterCount),
  },
  {
    id: "pricing-providers",
    label: "Providers with published pricing",
    value: (model) =>
      model.providerPricing.length > 0
        ? model.providerPricing.map((pricing) => pricing.provider).join(", ")
        : "Not reported",
  },
  {
    id: "supported-tasks",
    label: "Other reported capabilities",
    value: (model) =>
      model.supportedTasks.length > 0
        ? model.supportedTasks.join(", ")
        : "Not reported",
  },
];

export function ModelComparison({
  initialModels,
  initialError,
  initialWarnings,
}: {
  initialModels: Model[];
  initialError: string | null;
  initialWarnings: string[];
}) {
  const [selectedModels, setSelectedModels] = useState<Model[]>(() =>
    initialModels.slice(0, 3),
  );

  return (
    <main
      data-workspace="model-comparison"
      className="mx-auto w-full max-w-[1720px] flex-1 px-5 pb-14 pt-9 sm:px-7 sm:pt-12 lg:px-12 lg:pt-14"
    >
      <header className="max-w-4xl">
        <h1 className="font-heading text-5xl font-semibold tracking-[-0.06em] text-foreground sm:text-6xl lg:text-[72px] lg:leading-[1.05]">
          Model Comparison
        </h1>
        <p className="mt-3 max-w-3xl font-heading text-xl leading-8 text-foreground sm:text-2xl">
          Compare model specifications, capabilities, and published pricing
          side by side.
        </p>
      </header>

      <CostIntelligenceNavigation current="comparison" />

      <div className="mt-6 flex flex-col gap-5">
        <Card className="gap-0 rounded-2xl border border-border bg-surface py-0 shadow-none ring-0">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <CardTitle className="font-heading text-xl sm:text-2xl">
              Select models
            </CardTitle>
            <CardDescription>
              Search the live catalogue and compare up to 8 models. This
              selection is independent of the Cost Calculator.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6">
            <ModelCatalogPicker
              initialModels={initialModels}
              initialError={initialError}
              initialWarnings={initialWarnings}
              selectedModels={selectedModels}
              onSelectionChange={setSelectedModels}
              maximumSelections={8}
            />
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-2xl border border-border bg-surface py-0 shadow-none ring-0">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <CardTitle className="font-heading text-xl sm:text-2xl">
                  Specifications and pricing
                </CardTitle>
                <CardDescription className="mt-1">
                  Values come from the live model catalogue. Missing
                  specifications are marked as not reported.
                </CardDescription>
              </div>
              <Badge variant="outline">
                {selectedModels.length}{" "}
                {selectedModels.length === 1 ? "model" : "models"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-5 sm:px-5">
            {selectedModels.length === 0 ? (
              <Empty className="min-h-48 border border-dashed border-border">
                <EmptyHeader>
                  <EmptyTitle>No models selected</EmptyTitle>
                  <EmptyDescription>
                    Search the catalogue above and add models to build a
                    side-by-side comparison.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                <div
                  className="max-h-[70vh] max-w-full overflow-auto rounded-xl border border-border"
                  role="region"
                  aria-label="Model specification comparison table"
                  tabIndex={0}
                >
                  <Table className="w-max min-w-full">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="sticky top-0 left-0 z-20 min-w-56 bg-muted">
                          Feature
                        </TableHead>
                        {selectedModels.map((model) => (
                          <TableHead
                            key={model.id}
                            className="sticky top-0 z-10 min-w-56 bg-muted align-top"
                          >
                            <a
                              href={model.modelUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex min-w-0 items-center gap-2.5 text-foreground hover:text-primary"
                            >
                              <ProviderLogo
                                providerName={model.provider}
                                logo={model.logo}
                                logoFallbacks={model.logoFallbacks}
                              />
                              <span className="min-w-0">
                                <span className="block truncate font-semibold">
                                  {model.name}
                                </span>
                                <span className="block truncate text-xs font-normal text-muted-foreground">
                                  {model.provider}
                                </span>
                              </span>
                            </a>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {features.map((feature) => {
                        const values = selectedModels.map((model) =>
                          feature.value(model),
                        );
                        const reportedValues = new Set(
                          values.filter(
                            (value) =>
                              value !== "Not reported" && value !== "Unknown",
                          ),
                        );
                        const hasDifference = reportedValues.size > 1;

                        return (
                          <TableRow key={feature.id}>
                            <TableHead
                              scope="row"
                              className="sticky left-0 z-10 min-w-56 bg-background font-medium text-foreground"
                            >
                              {feature.label}
                            </TableHead>
                            {selectedModels.map((model, index) => {
                              const value = values[index];
                              const isUnknown =
                                value === "Not reported" || value === "Unknown";
                              const content =
                                feature.render?.(model) ?? value;

                              return (
                                <TableCell
                                  key={`${model.id}-${feature.id}`}
                                  className={`min-w-56 align-top ${
                                    hasDifference && !isUnknown
                                      ? "bg-primary/5"
                                      : ""
                                  } ${
                                    isUnknown
                                      ? "text-muted-foreground"
                                      : "text-foreground"
                                  }`}
                                >
                                  {content}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Pricing is shown in USD per 1 million tokens for each
                  published provider rate. A capability is marked not reported
                  when the catalogue does not provide evidence either way.
                  Fields not present in the catalogue are omitted.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="mt-7 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
        Model specifications and published pricing are supplied by Hugging Face
        and its Inference Providers. Upstream metadata and rates can change.
      </footer>
    </main>
  );
}
