"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calculator,
  ChartNoAxesCombined,
  CircleHelp,
  Play,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { CostIntelligenceNavigation } from "@/components/cost-intelligence-navigation";
import { ModelCatalogPicker } from "@/components/model-catalog-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  calculateBudgetUtilization,
  calculateMonthlyTokenUsage,
  calculatePotentialSavings,
  estimateModelCost,
  type CostWorkload,
  type ModelCostEstimate,
} from "@/lib/cost-intelligence";
import { formatCurrency, formatTokens } from "@/lib/cost-format";
import type { Model } from "@/lib/models";

type WorkloadInputs = Record<keyof CostWorkload, string>;
type SortKey = "model" | "provider" | "inputCost" | "outputCost" | "monthlyCost";
type EstimateRow = { model: Model; estimate: ModelCostEstimate };
type Analysis = {
  signature: string;
  workload: CostWorkload;
  budget: number;
  estimates: EstimateRow[];
};

const initialWorkload: WorkloadInputs = {
  requestsPerDay: "10000",
  daysPerMonth: "30",
  turnsPerConversation: "5",
  inputTokensPerTurn: "1500",
  outputTokensPerTurn: "500",
};

const monthlyCostConfig = {
  monthlyCost: { label: "Monthly cost", color: "var(--chart-1)" },
} satisfies ChartConfig;

const spendMixConfig = {
  inputCost: { label: "Input tokens", color: "var(--chart-1)" },
  outputCost: { label: "Output tokens", color: "var(--chart-3)" },
} satisfies ChartConfig;

const projectionConfig = {
  projectedSpend: { label: "Cumulative projected spend", color: "var(--chart-1)" },
} satisfies ChartConfig;

const differenceConfig = {
  monthlyCost: { label: "Monthly cost", color: "var(--chart-3)" },
} satisfies ChartConfig;

const budgetConfig = {
  projectedSpend: { label: "Projected spend", color: "var(--chart-1)" },
  budget: { label: "Monthly budget", color: "var(--chart-3)" },
} satisfies ChartConfig;

function parseNonNegativeInteger(value: string): number | null {
  if (!value.trim() || !/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function toWorkload(inputs: WorkloadInputs): CostWorkload | null {
  const requestsPerDay = parseNonNegativeInteger(inputs.requestsPerDay);
  const daysPerMonth = parseNonNegativeInteger(inputs.daysPerMonth);
  const turnsPerConversation = parseNonNegativeInteger(
    inputs.turnsPerConversation,
  );
  const inputTokensPerTurn = parseNonNegativeInteger(inputs.inputTokensPerTurn);
  const outputTokensPerTurn = parseNonNegativeInteger(
    inputs.outputTokensPerTurn,
  );

  if (
    requestsPerDay === null ||
    daysPerMonth === null ||
    daysPerMonth < 1 ||
    daysPerMonth > 31 ||
    turnsPerConversation === null ||
    inputTokensPerTurn === null ||
    outputTokensPerTurn === null
  ) {
    return null;
  }

  const workload = {
    requestsPerDay,
    daysPerMonth,
    turnsPerConversation,
    inputTokensPerTurn,
    outputTokensPerTurn,
  };
  return calculateMonthlyTokenUsage(workload) ? workload : null;
}

function parseBudget(value: string): number | null {
  const budget = Number(value);
  return value.trim() && Number.isFinite(budget) && budget > 0 ? budget : null;
}

function getCost(estimate: ModelCostEstimate): number | null {
  return estimate.status === "calculable" ? estimate.monthlyCost : null;
}

function getInputCost(estimate: ModelCostEstimate): number | null {
  return estimate.status === "calculable" ? estimate.inputCost : null;
}

function getOutputCost(estimate: ModelCostEstimate): number | null {
  return estimate.status === "calculable" ? estimate.outputCost : null;
}

function formatProviderName(provider: string): string {
  return provider
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function estimateReason(estimate: ModelCostEstimate): string {
  if (estimate.status === "calculable") return "Calculated";
  switch (estimate.reason) {
    case "pricing-unavailable":
      return "No published rates";
    case "provider-pricing-unavailable":
      return "Provider rate unavailable";
    case "additional-usage-unpriced":
      return "Additional usage unpriced";
    case "invalid-usage":
      return "Review workload";
    case "invalid-pricing":
      return "Provider rate invalid";
  }
}

function inputSignature(
  inputs: WorkloadInputs,
  budgetInput: string,
  models: Model[],
): string {
  return JSON.stringify({
    inputs,
    budgetInput,
    models: models.map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      providerPricing: model.providerPricing,
    })),
  });
}

function sortValue(row: EstimateRow, key: SortKey): number | string {
  switch (key) {
    case "model":
      return row.model.name;
    case "provider":
      return row.model.provider;
    case "inputCost":
      return getInputCost(row.estimate) ?? Number.POSITIVE_INFINITY;
    case "outputCost":
      return getOutputCost(row.estimate) ?? Number.POSITIVE_INFINITY;
    case "monthlyCost":
      return getCost(row.estimate) ?? Number.POSITIVE_INFINITY;
  }
}

function SortableHeading({
  label,
  sortKey,
  currentKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  direction: "ascending" | "descending";
  onSort: (key: SortKey) => void;
}) {
  const Icon =
    currentKey !== sortKey
      ? ArrowUpDown
      : direction === "ascending"
        ? ArrowUp
        : ArrowDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onSort(sortKey)}
      className="-ml-3 h-8 gap-1.5 px-2 font-medium"
    >
      {label}
      <Icon aria-hidden="true" data-icon="inline-end" />
    </Button>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Card className="min-w-0 gap-2 rounded-xl border border-border bg-surface py-4 shadow-none ring-0">
      <CardHeader className="gap-1 px-4">
        <CardDescription className="text-xs leading-5">{label}</CardDescription>
        <CardTitle
          className="truncate font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
          title={value}
        >
          {value}
        </CardTitle>
      </CardHeader>
      {detail ? (
        <CardContent className="px-4 pt-0">
          <p className="truncate text-xs leading-5 text-muted-foreground" title={detail}>
            {detail}
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
}) {
  const parsed = parseNonNegativeInteger(value);
  const invalid =
    parsed === null || parsed < min || (max !== undefined && parsed > max);

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        step="1"
        inputMode="numeric"
        value={value}
        onChange={onChange}
        aria-invalid={invalid}
        className="h-10 bg-background"
      />
    </Field>
  );
}

export function CostCalculator({
  initialModels,
  initialError,
  initialWarnings,
}: {
  initialModels: Model[];
  initialError: string | null;
  initialWarnings: string[];
}) {
  const [workloadInputs, setWorkloadInputs] =
    useState<WorkloadInputs>(initialWorkload);
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState("500");
  const [selectedModels, setSelectedModels] = useState<Model[]>(() =>
    initialModels.filter((model) => model.providerPricing.length > 0).slice(0, 3),
  );
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("monthlyCost");
  const [sortDirection, setSortDirection] =
    useState<"ascending" | "descending">("ascending");

  const currentSignature = inputSignature(
    workloadInputs,
    monthlyBudgetInput,
    selectedModels,
  );
  const currentWorkload = useMemo(
    () => toWorkload(workloadInputs),
    [workloadInputs],
  );
  const previewUsage = currentWorkload
    ? calculateMonthlyTokenUsage(currentWorkload)
    : null;
  const currentBudget = parseBudget(monthlyBudgetInput);
  const displayedAnalysis =
    analysis?.signature === currentSignature ? analysis : null;

  const rows = useMemo(() => {
    if (!displayedAnalysis) return [];
    return [...displayedAnalysis.estimates].sort((left, right) => {
      const first = sortValue(left, sortKey);
      const second = sortValue(right, sortKey);
      const comparison =
        typeof first === "string" && typeof second === "string"
          ? first.localeCompare(second)
          : Number(first) - Number(second);
      return sortDirection === "ascending" ? comparison : -comparison;
    });
  }, [displayedAnalysis, sortDirection, sortKey]);

  const calculableRows = displayedAnalysis
    ? displayedAnalysis.estimates.filter(
        (row) => row.estimate.status === "calculable",
      )
    : [];
  const cheapest = calculableRows.reduce<EstimateRow | null>(
    (best, row) =>
      best === null ||
      (row.estimate.status === "calculable" &&
        best.estimate.status === "calculable" &&
        row.estimate.monthlyCost < best.estimate.monthlyCost)
        ? row
        : best,
    null,
  );
  const mostExpensive = calculableRows.reduce<EstimateRow | null>(
    (highest, row) =>
      highest === null ||
      (row.estimate.status === "calculable" &&
        highest.estimate.status === "calculable" &&
        row.estimate.monthlyCost > highest.estimate.monthlyCost)
        ? row
        : highest,
    null,
  );
  const savings =
    calculableRows.length > 1 &&
    cheapest?.estimate.status === "calculable" &&
    mostExpensive?.estimate.status === "calculable"
      ? calculatePotentialSavings(
          mostExpensive.estimate.monthlyCost,
          cheapest.estimate.monthlyCost,
        )
      : null;
  const budgetUtilization =
    cheapest?.estimate.status === "calculable" && displayedAnalysis
      ? calculateBudgetUtilization(
          cheapest.estimate.monthlyCost,
          displayedAnalysis.budget,
        )
      : null;
  const monthlyUsage = displayedAnalysis
    ? calculateMonthlyTokenUsage(displayedAnalysis.workload)
    : null;

  function updateWorkload(
    key: keyof CostWorkload,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setWorkloadInputs((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));
    setRunError(null);
  }

  function handleRunAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunError(null);

    const workload = toWorkload(workloadInputs);
    if (!workload) {
      setRunError(
        "Check the workload values. Use whole numbers and choose 1–31 days per month.",
      );
      return;
    }

    const budget = parseBudget(monthlyBudgetInput);
    if (budget === null) {
      setRunError("Enter a monthly budget greater than $0.");
      return;
    }

    if (selectedModels.length === 0) {
      setRunError("Select at least one model before running the analysis.");
      return;
    }

    const estimates = selectedModels.map((model) => ({
      model,
      estimate: estimateModelCost(model, workload),
    }));

    setAnalysis({
      signature: inputSignature(
        workloadInputs,
        monthlyBudgetInput,
        selectedModels,
      ),
      workload,
      budget,
      estimates,
    });
  }

  function sortBy(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((direction) =>
        direction === "ascending" ? "descending" : "ascending",
      );
      return;
    }
    setSortKey(key);
    setSortDirection("ascending");
  }

  const cheapestCost =
    cheapest?.estimate.status === "calculable"
      ? cheapest.estimate.monthlyCost
      : null;
  const chartRows = calculableRows.map(({ model, estimate }) => ({
    label: `${model.name} · ${model.provider}`,
    monthlyCost:
      estimate.status === "calculable" ? estimate.monthlyCost : 0,
    isCheapest:
      estimate.status === "calculable" &&
      estimate.monthlyCost === cheapestCost,
  }));
  const costDifferenceRows = calculableRows.map(({ model, estimate }) => ({
    label: `${model.name} · ${model.provider}`,
    monthlyCost:
      estimate.status === "calculable" ? estimate.monthlyCost : 0,
    isCheapest:
      estimate.status === "calculable" &&
      cheapestCost !== null &&
      estimate.monthlyCost === cheapestCost,
  }));
  const spendMix =
    cheapest?.estimate.status === "calculable"
      ? [
          { name: "Input tokens", value: cheapest.estimate.inputCost },
          { name: "Output tokens", value: cheapest.estimate.outputCost },
        ]
      : [];
  const projection =
    cheapestCost !== null && displayedAnalysis
      ? Array.from(
          { length: displayedAnalysis.workload.daysPerMonth },
          (_, index) => ({
            day: index + 1,
            projectedSpend:
              (cheapestCost / displayedAnalysis.workload.daysPerMonth) *
              (index + 1),
          }),
        )
      : [];
  const budgetChartData =
    cheapestCost !== null && displayedAnalysis
      ? [{ label: "Monthly budget", projectedSpend: cheapestCost }]
      : [];

  return (
    <main
      data-workspace="cost-calculator"
      className="mx-auto w-full max-w-[1720px] flex-1 px-5 pb-14 pt-9 sm:px-7 sm:pt-12 lg:px-12 lg:pt-14"
    >
      <header className="max-w-4xl">
        <h1 className="font-heading text-5xl font-semibold tracking-[-0.06em] text-foreground sm:text-6xl lg:text-[72px] lg:leading-[1.05]">
          AI Cost Analytics
        </h1>
        <p className="mt-3 max-w-3xl font-heading text-xl leading-8 text-foreground sm:text-2xl">
          Understand, estimate, and optimize your AI model spending.
        </p>
      </header>

      <CostIntelligenceNavigation current="calculator" />

      <form onSubmit={handleRunAnalysis} className="mt-6">
        <Card className="gap-0 rounded-2xl border border-border bg-surface py-0 shadow-none ring-0">
          <CardHeader className="px-5 pt-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="font-heading text-xl sm:text-2xl">
                  Configure your workload
                </CardTitle>
                <CardDescription className="mt-1">
                  Choose models and describe a typical day. Results update only
                  when you run a new analysis.
                </CardDescription>
              </div>
              <Badge variant="outline" className="gap-1.5">
                <Calculator aria-hidden="true" data-icon="inline-start" />
                Token pricing projection
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="px-5 pb-5 sm:px-6">
            <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <section aria-labelledby="calculator-model-heading" className="min-w-0">
                <div className="mb-3">
                  <h2
                    id="calculator-model-heading"
                    className="text-sm font-semibold"
                  >
                    Models to compare
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Search the live catalogue. Select up to 8 models.
                  </p>
                </div>
                <ModelCatalogPicker
                  initialModels={initialModels}
                  initialError={initialError}
                  initialWarnings={initialWarnings}
                  selectedModels={selectedModels}
                  onSelectionChange={(models) => {
                    setSelectedModels(models);
                    setRunError(null);
                  }}
                  maximumSelections={8}
                />
              </section>

              <section aria-labelledby="calculator-workload-heading">
                <h2
                  id="calculator-workload-heading"
                  className="mb-3 text-sm font-semibold"
                >
                  Monthly workload assumptions
                </h2>
                <FieldGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <NumberField
                    id="calculator-input-tokens"
                    label="Input tokens per turn"
                    value={workloadInputs.inputTokensPerTurn}
                    onChange={(event) => updateWorkload("inputTokensPerTurn", event)}
                  />
                  <NumberField
                    id="calculator-output-tokens"
                    label="Output tokens per turn"
                    value={workloadInputs.outputTokensPerTurn}
                    onChange={(event) => updateWorkload("outputTokensPerTurn", event)}
                  />
                  <NumberField
                    id="calculator-requests-per-day"
                    label="Requests per day"
                    value={workloadInputs.requestsPerDay}
                    onChange={(event) => updateWorkload("requestsPerDay", event)}
                  />
                  <NumberField
                    id="calculator-turns-per-request"
                    label="Average turns per request"
                    value={workloadInputs.turnsPerConversation}
                    onChange={(event) =>
                      updateWorkload("turnsPerConversation", event)
                    }
                  />
                  <NumberField
                    id="calculator-days-per-month"
                    label="Days per month"
                    value={workloadInputs.daysPerMonth}
                    min={1}
                    max={31}
                    onChange={(event) => updateWorkload("daysPerMonth", event)}
                  />
                  <Field data-invalid={currentBudget === null}>
                    <FieldLabel htmlFor="calculator-monthly-budget">
                      Monthly budget (USD)
                    </FieldLabel>
                    <Input
                      id="calculator-monthly-budget"
                      type="number"
                      min="0.01"
                      step="any"
                      inputMode="decimal"
                      value={monthlyBudgetInput}
                      onChange={(event) => {
                        setMonthlyBudgetInput(event.target.value);
                        setRunError(null);
                      }}
                      aria-invalid={currentBudget === null}
                      className="h-10 bg-background"
                    />
                  </Field>
                </FieldGroup>
                {previewUsage ? (
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Tokens are multiplied by requests and turns; include
                    repeated conversation context in average input tokens.
                  </p>
                ) : (
                  <p role="status" className="mt-3 text-xs text-muted-foreground">
                    Enter whole-number workload values; days per month must be
                    between 1 and 31.
                  </p>
                )}
              </section>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
                Estimates use published input and output token rates. Image,
                audio, hosting, and other non-token charges are not included.
              </p>
              <Button
                type="submit"
                size="lg"
                className="w-full shrink-0 gap-2 sm:w-auto"
              >
                <Play aria-hidden="true" data-icon="inline-start" />
                Run Cost Analysis
              </Button>
            </div>
            {runError ? (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {runError}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </form>

      {displayedAnalysis ? (
        <section
          aria-labelledby="analytics-heading"
          aria-live="polite"
          className="mt-7 flex flex-col gap-5"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="analytics-heading"
                className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Analytics overview
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Projection from your latest completed analysis—not historical
                usage.
              </p>
            </div>
            <Badge variant="secondary" className="gap-1.5">
              <ChartNoAxesCombined aria-hidden="true" data-icon="inline-start" />
              {formatTokens(
                displayedAnalysis.workload.requestsPerDay *
                  displayedAnalysis.workload.daysPerMonth,
              )}{" "}
              requests / month
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            <Metric
              label="Estimated monthly cost"
              value={cheapestCost === null ? "Unavailable" : formatCurrency(cheapestCost)}
              detail={
                cheapest
                  ? `Using ${cheapest.model.name}`
                  : "No selected model has usable pricing"
              }
            />
            <Metric
              label="Cheapest selected model"
              value={cheapest?.model.name ?? "Unavailable"}
              detail={cheapest?.model.provider ?? "No calculable estimates"}
            />
            <Metric
              label="Potential savings"
              value={savings === null ? "Unavailable" : formatCurrency(savings)}
              detail={
                calculableRows.length > 1 && cheapest && mostExpensive
                  ? "Compared with the highest-cost option"
                  : "Requires at least two priced models"
              }
            />
            <Metric
              label="Models compared"
              value={String(displayedAnalysis.estimates.length)}
              detail={`${calculableRows.length} with usable pricing`}
            />
            <Metric
              label="Projected budget utilization"
              value={
                budgetUtilization === null
                  ? "Unavailable"
                  : `${budgetUtilization.toFixed(1)}%`
              }
              detail={
                cheapest
                  ? `Cheapest estimate against ${formatCurrency(displayedAnalysis.budget)}`
                  : "Requires a calculable estimate"
              }
            />
          </div>

          {monthlyUsage ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Workload used: {formatTokens(monthlyUsage.inputTokens)} input ·{" "}
              {formatTokens(monthlyUsage.outputTokens)} output tokens per month
              · {displayedAnalysis.workload.daysPerMonth} active days.
            </p>
          ) : null}

          {calculableRows.length > 0 ? (
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                <Card className="min-w-0 gap-3 rounded-2xl border border-border bg-surface py-0 shadow-none ring-0">
                  <CardHeader className="px-5 pt-5">
                    <CardTitle className="font-heading text-lg">
                      Monthly cost by model
                    </CardTitle>
                    <CardDescription>
                      Estimated token spend for the same workload.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <ChartContainer
                      config={monthlyCostConfig}
                      className="h-[260px] w-full"
                    >
                      <BarChart
                        accessibilityLayer
                        data={chartRows}
                        margin={{ top: 8, right: 12, left: 4, bottom: 24 }}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          tickMargin={8}
                          tickFormatter={(value: string) =>
                            value.length > 16 ? `${value.slice(0, 14)}…` : value
                          }
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value: number) =>
                            formatCurrency(value)
                          }
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              labelFormatter={(label) => String(label)}
                              formatter={(value) => formatCurrency(Number(value))}
                            />
                          }
                        />
                        <Bar
                          dataKey="monthlyCost"
                          radius={[5, 5, 0, 0]}
                        >
                          {chartRows.map((row) => (
                            <Cell
                              key={row.label}
                              fill={
                                row.isCheapest
                                  ? "var(--chart-1)"
                                  : "var(--chart-3)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="min-w-0 gap-3 rounded-2xl border border-border bg-surface py-0 shadow-none ring-0">
                  <CardHeader className="px-5 pt-5">
                    <CardTitle className="font-heading text-lg">
                      Input vs output cost
                    </CardTitle>
                    <CardDescription>
                      Token-spend mix for{" "}
                      {cheapest?.model.name ?? "the lowest-cost model"}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center px-4 pb-4 sm:flex-row">
                    <ChartContainer
                      config={spendMixConfig}
                      className="h-[220px] w-full max-w-[320px]"
                    >
                      <PieChart accessibilityLayer>
                        <Pie
                          data={spendMix}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={88}
                          paddingAngle={3}
                        >
                          <Cell fill="var(--color-inputCost)" />
                          <Cell fill="var(--color-outputCost)" />
                        </Pie>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => formatCurrency(Number(value))}
                            />
                          }
                        />
                      </PieChart>
                    </ChartContainer>
                    <div className="flex w-full flex-col gap-3 sm:max-w-44">
                      {spendMix.map((item, index) => {
                        const total = spendMix.reduce(
                          (sum, current) => sum + current.value,
                          0,
                        );
                        const share = total > 0 ? (item.value / total) * 100 : 0;
                        return (
                          <div key={item.name} className="flex items-start gap-2.5">
                            <span
                              aria-hidden="true"
                              className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                                index === 0 ? "bg-chart-1" : "bg-chart-3"
                              }`}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(item.value)} · {share.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="min-w-0 gap-3 rounded-2xl border border-border bg-surface py-0 shadow-none ring-0">
                  <CardHeader className="px-5 pt-5">
                    <CardTitle className="font-heading text-lg">
                      Projected daily spending
                    </CardTitle>
                    <CardDescription>
                      Cumulative projection across {displayedAnalysis.workload.daysPerMonth}{" "}
                      active days using the lowest-cost model.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <ChartContainer
                      config={projectionConfig}
                      className="h-[250px] w-full"
                    >
                      <LineChart
                        accessibilityLayer
                        data={projection}
                        margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="day"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value: number) => `Day ${value}`}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value: number) =>
                            formatCurrency(value)
                          }
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              labelFormatter={(label) => `Day ${label}`}
                              formatter={(value) => formatCurrency(Number(value))}
                            />
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="projectedSpend"
                          stroke="var(--color-projectedSpend)"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ChartContainer>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Projection only; this is not historical usage data.
                    </p>
                  </CardContent>
                </Card>

                <Card className="min-w-0 gap-3 rounded-2xl border border-border bg-surface py-0 shadow-none ring-0">
                  <CardHeader className="px-5 pt-5">
                    <CardTitle className="font-heading text-lg">
                      Cost comparison
                    </CardTitle>
                    <CardDescription>
                      Projected monthly spend with the lowest-cost option
                      highlighted.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <ChartContainer
                      config={differenceConfig}
                      className="h-[260px] w-full"
                    >
                      <BarChart
                        accessibilityLayer
                        data={costDifferenceRows}
                        layout="vertical"
                        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid horizontal={false} />
                        <XAxis
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value: number) =>
                            formatCurrency(value)
                          }
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          width={120}
                          tickFormatter={(value: string) =>
                            value.length > 18 ? `${value.slice(0, 16)}…` : value
                          }
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              labelFormatter={(label) => String(label)}
                              formatter={(value) => formatCurrency(Number(value))}
                            />
                          }
                        />
                        <Bar dataKey="monthlyCost" radius={[0, 5, 5, 0]}>
                          {costDifferenceRows.map((row) => (
                            <Cell
                              key={row.label}
                              fill={
                                row.isCheapest
                                  ? "var(--chart-1)"
                                  : "var(--chart-3)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="min-w-0 gap-3 rounded-2xl border border-border bg-surface py-0 shadow-none ring-0 lg:col-span-2">
                  <CardHeader className="px-5 pt-5">
                    <CardTitle className="font-heading text-lg">
                      Budget utilization
                    </CardTitle>
                    <CardDescription>
                      Lowest-cost model projection against your monthly budget.
                      The marker shows the budget limit.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <ChartContainer
                      config={budgetConfig}
                      className="h-[150px] w-full"
                    >
                      <BarChart
                        accessibilityLayer
                        data={budgetChartData}
                        layout="vertical"
                        margin={{ top: 16, right: 24, left: 8, bottom: 8 }}
                      >
                        <XAxis
                          type="number"
                          domain={[
                            0,
                            Math.max(displayedAnalysis.budget, cheapestCost ?? 0) *
                              1.08,
                          ]}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value: number) =>
                            formatCurrency(value)
                          }
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          hide
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => formatCurrency(Number(value))}
                            />
                          }
                        />
                        <ReferenceLine
                          x={displayedAnalysis.budget}
                          stroke="var(--chart-3)"
                          strokeDasharray="4 4"
                          label={{
                            value: `Budget ${formatCurrency(displayedAnalysis.budget)}`,
                            position: "top",
                            fill: "var(--foreground)",
                            fontSize: 11,
                          }}
                        />
                        <Bar
                          dataKey="projectedSpend"
                          fill="var(--color-projectedSpend)"
                          radius={[0, 5, 5, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        Projected{" "}
                        {cheapestCost === null
                          ? "unavailable"
                          : formatCurrency(cheapestCost)}
                      </span>
                      <span>
                        {budgetUtilization === null
                          ? "Utilization unavailable"
                          : `${budgetUtilization.toFixed(1)}% of budget`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
            </div>
          ) : (
            <Empty className="min-h-48 border border-dashed border-border bg-surface">
              <EmptyHeader>
                <CircleHelp
                  aria-hidden="true"
                  className="text-muted-foreground"
                />
                <EmptyTitle>No usable pricing in this selection</EmptyTitle>
                <EmptyDescription>
                  No selected model has valid published input/output token
                  rates for this workload. The comparison table below shows
                  which models are unavailable.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

              <Card className="gap-3 rounded-2xl border border-border bg-surface py-0 shadow-none ring-0">
                <CardHeader className="px-5 pt-5 sm:px-6">
                  <CardTitle className="font-heading text-xl sm:text-2xl">
                    Detailed model comparison
                  </CardTitle>
                  <CardDescription>
                    Published token rates are selected by estimated workload
                    cost. Unavailable pricing is never treated as zero.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-5 sm:px-5">
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <Table className="min-w-[900px]">
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="min-w-48">
                            <SortableHeading
                              label="Model"
                              sortKey="model"
                              currentKey={sortKey}
                              direction={sortDirection}
                              onSort={sortBy}
                            />
                          </TableHead>
                          <TableHead className="min-w-40">
                            <SortableHeading
                              label="Provider"
                              sortKey="provider"
                              currentKey={sortKey}
                              direction={sortDirection}
                              onSort={sortBy}
                            />
                          </TableHead>
                          <TableHead className="min-w-32 text-right">
                            <SortableHeading
                              label="Input cost"
                              sortKey="inputCost"
                              currentKey={sortKey}
                              direction={sortDirection}
                              onSort={sortBy}
                            />
                          </TableHead>
                          <TableHead className="min-w-32 text-right">
                            <SortableHeading
                              label="Output cost"
                              sortKey="outputCost"
                              currentKey={sortKey}
                              direction={sortDirection}
                              onSort={sortBy}
                            />
                          </TableHead>
                          <TableHead className="min-w-36 text-right">
                            <SortableHeading
                              label="Monthly cost"
                              sortKey="monthlyCost"
                              currentKey={sortKey}
                              direction={sortDirection}
                              onSort={sortBy}
                            />
                          </TableHead>
                          <TableHead className="min-w-36">Budget status</TableHead>
                          <TableHead className="min-w-40 text-right">
                            vs. cheapest
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map(({ model, estimate }) => {
                          const cost = getCost(estimate);
                          const difference =
                            cost !== null && cheapestCost !== null
                              ? cost - cheapestCost
                              : null;
                          const status =
                            cost === null
                              ? estimateReason(estimate)
                              : cost <= displayedAnalysis.budget
                                ? "Within budget"
                                : "Over budget";

                          return (
                            <TableRow
                              key={model.id}
                              className={
                                cheapest?.model.id === model.id
                                  ? "bg-primary/5"
                                  : undefined
                              }
                            >
                              <TableCell className="font-medium">
                                <span className="block truncate">{model.name}</span>
                                {cheapest?.model.id === model.id ? (
                                  <Badge variant="secondary" className="mt-1">
                                    Lowest cost
                                  </Badge>
                                ) : null}
                              </TableCell>
                              <TableCell>
                                <span className="block">{model.provider}</span>
                                {estimate.status === "calculable" ? (
                                  <span className="block text-xs text-muted-foreground">
                                    Priced via {formatProviderName(estimate.provider)}
                                  </span>
                                ) : null}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {getInputCost(estimate) === null
                                  ? estimateReason(estimate)
                                  : formatCurrency(getInputCost(estimate) ?? 0)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {getOutputCost(estimate) === null
                                  ? estimateReason(estimate)
                                  : formatCurrency(getOutputCost(estimate) ?? 0)}
                              </TableCell>
                              <TableCell className="text-right font-medium tabular-nums">
                                {cost === null
                                  ? estimateReason(estimate)
                                  : formatCurrency(cost)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    status === "Within budget"
                                      ? "secondary"
                                      : status === "Over budget"
                                        ? "destructive"
                                        : "outline"
                                  }
                                >
                                  {status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {difference === null
                                  ? "—"
                                  : difference === 0
                                    ? "Lowest"
                                    : `${formatCurrency(difference)} more`}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
        </section>
      ) : (
        <Empty className="mt-7 min-h-52 border border-dashed border-border bg-surface">
          <EmptyHeader>
            <ChartNoAxesCombined
              aria-hidden="true"
              className="text-muted-foreground"
            />
            <EmptyTitle>
              {analysis
                ? "Configuration changed"
                : "Your analytics will appear here"}
            </EmptyTitle>
            <EmptyDescription>
              {analysis
                ? "The previous results are hidden because the workload or model selection has changed. Run a new analysis to calculate current estimates."
                : "Choose one or more models, enter your workload and budget, then run an analysis to generate cost projections."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <footer className="mt-7 flex flex-col gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Model metadata and provider prices are supplied by Hugging Face
          Inference Providers. Upstream rates can change.
        </p>
        <a
          href="https://huggingface.co/docs/inference-providers"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Pricing source
        </a>
      </footer>
    </main>
  );
}
