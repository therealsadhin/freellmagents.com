"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { ProviderLogo } from "@/components/provider-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/cost-format";
import {
  matchesModelPreference,
  type ModelPreference,
} from "@/lib/cost-intelligence";
import type { Model } from "@/lib/models";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isModel(value: unknown): value is Model {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.provider === "string" &&
    typeof value.modelUrl === "string" &&
    Array.isArray(value.providerPricing) &&
    Array.isArray(value.categories) &&
    Array.isArray(value.supportedTasks)
  );
}

function classificationLabel(model: Model): string {
  switch (model.classification) {
    case "open-source":
      return "Open source";
    case "open-weight":
      return "Open weights";
    case "proprietary":
      return "Proprietary";
    case "gated":
      return "Gated";
    default:
      return "Classification not reported";
  }
}

function priceLabel(value: number | null): string {
  return value === null ? "Not reported" : formatCurrency(value);
}

export function ModelCatalogPicker({
  initialModels,
  initialError,
  initialWarnings,
  selectedModels,
  onSelectionChange,
  maximumSelections,
  classificationPreference = "any",
}: {
  initialModels: Model[];
  initialError: string | null;
  initialWarnings: string[];
  selectedModels: Model[];
  onSelectionChange: (models: Model[]) => void;
  maximumSelections: number;
  classificationPreference?: ModelPreference;
}) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Model[] | null>(null);
  const [searchWarnings, setSearchWarnings] = useState<string[] | null>(null);
  const [searchError, setSearchError] = useState(initialError);
  const [isSearching, setIsSearching] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const search = query.trim();
    if (!search) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const response = await fetch(
          `/api/cost-models?q=${encodeURIComponent(search)}`,
          { signal: controller.signal },
        );
        const payload: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            isRecord(payload) && typeof payload.error === "string"
              ? payload.error
              : "Model search is temporarily unavailable.",
          );
        }
        if (
          !isRecord(payload) ||
          !Array.isArray(payload.models) ||
          !payload.models.every(isModel)
        ) {
          throw new Error("Model search returned an invalid response.");
        }

        setSearchResults(payload.models);
        setSearchWarnings(
          Array.isArray(payload.warnings)
            ? payload.warnings.filter(
                (warning): warning is string => typeof warning === "string",
              )
            : [],
        );
      } catch (cause) {
        if (controller.signal.aborted) return;
        console.error("Model catalogue search failed.", { cause });
        setSearchError(
          cause instanceof Error
            ? cause.message
            : "Model search is temporarily unavailable.",
        );
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const sourceModels = searchResults ?? initialModels;
  const selectedIds = new Set(selectedModels.map((model) => model.id));
  const visibleModels = sourceModels.filter(
    (model) =>
      selectedIds.has(model.id) ||
      matchesModelPreference(model.classification, classificationPreference),
  );
  const warnings = searchWarnings ?? initialWarnings;

  function handleQueryChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setSearchResults(null);
      setSearchWarnings(null);
      setSearchError(initialError);
      setIsSearching(false);
    }
  }

  function toggleModel(model: Model) {
    const selected = selectedIds.has(model.id);
    if (selected) {
      onSelectionChange(selectedModels.filter((item) => item.id !== model.id));
      setAnnouncement(`${model.name} removed from the selection.`);
      return;
    }

    if (maximumSelections === 1) {
      onSelectionChange([model]);
      setAnnouncement(`${model.name} selected.`);
      return;
    }

    if (selectedModels.length >= maximumSelections) {
      setAnnouncement(`Choose up to ${maximumSelections} models.`);
      return;
    }

    onSelectionChange([...selectedModels, model]);
    setAnnouncement(`${model.name} added to the selection.`);
  }

  return (
    <div className="flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor="model-catalog-search">Search models</FieldLabel>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="model-catalog-search"
            type="search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Search models or providers"
            className="h-11 bg-surface pl-10"
          />
        </div>
      </Field>

      <p className="text-xs text-muted-foreground">
        {selectedModels.length} of {maximumSelections} selected
      </p>
      {selectedModels.length > 0 ? (
        <div
          aria-label="Selected models"
          className="flex flex-wrap gap-2"
        >
          {selectedModels.map((model) => (
            <Button
              key={model.id}
              type="button"
              size="sm"
              variant="secondary"
              aria-label={`Remove ${model.name} by ${model.provider}`}
              onClick={() => toggleModel(model)}
              className="h-auto min-h-8 max-w-full justify-start gap-1.5 whitespace-normal text-left"
            >
              <span className="min-w-0">
                <span className="block truncate">{model.name}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {model.provider}
                </span>
              </span>
              <X aria-hidden="true" data-icon="inline-end" />
            </Button>
          ))}
        </div>
      ) : null}

      {searchError ? (
        <p role="alert" className="text-sm text-destructive">
          {searchError}
        </p>
      ) : null}
      {warnings.map((warning) => (
        <p key={warning} role="status" className="text-xs text-muted-foreground">
          {warning}
        </p>
      ))}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {isSearching ? (
        <div aria-label="Searching models" className="flex flex-col gap-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : visibleModels.length > 0 ? (
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
          {visibleModels.map((model) => {
            const selected = selectedIds.has(model.id);
            const disabled =
              !selected &&
              maximumSelections > 1 &&
              selectedModels.length >= maximumSelections;

            return (
              <div
                key={model.id}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
              >
                <ProviderLogo
                  providerName={model.provider}
                  logo={model.logo}
                  logoFallbacks={model.logoFallbacks}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={model.name}>
                    {model.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {model.provider} · {classificationLabel(model)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Input {priceLabel(model.inputPrice)} / 1M · Output{" "}
                    {priceLabel(model.outputPrice)} / 1M
                  </p>
                </div>
                {model.providerPricing.length === 0 ? (
                  <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
                    No rates
                  </Badge>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant={selected ? "secondary" : "outline"}
                  aria-pressed={selected}
                  aria-label={`${selected ? "Remove" : "Select"} ${model.name}`}
                  disabled={disabled}
                  onClick={() => toggleModel(model)}
                >
                  {selected ? "Selected" : "Select"}
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty className="min-h-32 border border-dashed border-border">
          <EmptyHeader>
            <EmptyTitle>
              {sourceModels.length === 0
                ? "No matching models"
                : "No models match this preference"}
            </EmptyTitle>
            <EmptyDescription>
              Try another model or provider name, or change the model preference.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
