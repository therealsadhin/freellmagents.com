import type { Model, ModelClassification, ModelPricing } from "@/lib/models";

export type CostWorkload = {
  requestsPerDay: number;
  daysPerMonth: number;
  turnsPerConversation: number;
  inputTokensPerTurn: number;
  outputTokensPerTurn: number;
};

export type MonthlyTokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type CostModel = Pick<
  Model,
  | "id"
  | "name"
  | "provider"
  | "logo"
  | "logoFallbacks"
  | "classification"
  | "modelUrl"
  | "providerPricing"
>;

export type ModelCostEstimate =
  | {
      status: "calculable";
      model: CostModel;
      provider: string;
      pricing: ModelPricing;
      inputTokens: number;
      outputTokens: number;
      inputCost: number;
      outputCost: number;
      monthlyCost: number;
    }
  | {
      status: "not-calculable";
      model: CostModel;
      reason:
        | "invalid-usage"
        | "pricing-unavailable"
        | "provider-pricing-unavailable"
        | "additional-usage-unpriced"
        | "invalid-pricing";
      textTokenCost?: number;
    };

export type ModelPreference = "any" | "open" | "proprietary";

export function calculateMonthlyTokenUsage(
  workload: CostWorkload,
): MonthlyTokenUsage | null {
  const values = [
    workload.requestsPerDay,
    workload.daysPerMonth,
    workload.turnsPerConversation,
    workload.inputTokensPerTurn,
    workload.outputTokensPerTurn,
  ];
  if (
    values.some(
      (value) => !Number.isSafeInteger(value) || value < 0,
    )
  ) {
    return null;
  }

  const conversationsPerMonth =
    workload.requestsPerDay * workload.daysPerMonth;
  const turnsPerMonth =
    conversationsPerMonth * workload.turnsPerConversation;
  const inputTokens = turnsPerMonth * workload.inputTokensPerTurn;
  const outputTokens = turnsPerMonth * workload.outputTokensPerTurn;

  if (
    !Number.isSafeInteger(conversationsPerMonth) ||
    !Number.isSafeInteger(turnsPerMonth) ||
    !Number.isSafeInteger(inputTokens) ||
    !Number.isSafeInteger(outputTokens)
  ) {
    return null;
  }

  return { inputTokens, outputTokens };
}

function costForPricing(
  pricing: ModelPricing,
  usage: MonthlyTokenUsage,
): Omit<
  Extract<ModelCostEstimate, { status: "calculable" }>,
  "model" | "provider" | "pricing" | "status"
> | null {
  if (
    !Number.isFinite(pricing.inputPerMillion) ||
    pricing.inputPerMillion < 0 ||
    !Number.isFinite(pricing.outputPerMillion) ||
    pricing.outputPerMillion < 0
  ) {
    return null;
  }

  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost =
    (usage.outputTokens / 1_000_000) * pricing.outputPerMillion;
  const monthlyCost = inputCost + outputCost;
  if (![inputCost, outputCost, monthlyCost].every(Number.isFinite)) return null;

  return {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    inputCost,
    outputCost,
    monthlyCost,
  };
}

export function estimateModelCost(
  model: CostModel,
  workload: CostWorkload,
  options: {
    provider?: string | null;
    requiresAdditionalUsagePricing?: boolean;
  } = {},
): ModelCostEstimate {
  const usage = calculateMonthlyTokenUsage(workload);
  if (!usage) {
    return { status: "not-calculable", model, reason: "invalid-usage" };
  }

  const availablePricing = model.providerPricing;
  if (availablePricing.length === 0) {
    return { status: "not-calculable", model, reason: "pricing-unavailable" };
  }

  let candidates = availablePricing;
  if (options.provider) {
    candidates = availablePricing.filter(
      (pricing) => pricing.provider === options.provider,
    );
    if (candidates.length === 0) {
      return {
        status: "not-calculable",
        model,
        reason: "provider-pricing-unavailable",
      };
    }
  }

  const estimates = candidates
    .map((pricing) => ({
      pricing,
      cost: costForPricing(pricing, usage),
    }))
    .filter(
      (
        estimate,
      ): estimate is {
        pricing: ModelPricing;
        cost: NonNullable<ReturnType<typeof costForPricing>>;
      } => estimate.cost !== null,
    )
    .sort(
      (left, right) =>
        left.cost.monthlyCost - right.cost.monthlyCost ||
        left.pricing.provider.localeCompare(right.pricing.provider),
    );
  const best = estimates[0];
  if (!best) {
    return { status: "not-calculable", model, reason: "invalid-pricing" };
  }

  if (options.requiresAdditionalUsagePricing) {
    return {
      status: "not-calculable",
      model,
      reason: "additional-usage-unpriced",
      textTokenCost: best.cost.monthlyCost,
    };
  }

  return {
    status: "calculable",
    model,
    provider: best.pricing.provider,
    pricing: best.pricing,
    ...best.cost,
  };
}

export function matchesModelPreference(
  classification: ModelClassification,
  preference: ModelPreference,
): boolean {
  if (preference === "any") return true;
  if (preference === "open") {
    return classification === "open-source" || classification === "open-weight";
  }
  return classification === "proprietary";
}

export function calculateHybridMonthlyCost(
  firstMonthlyCost: number,
  secondMonthlyCost: number,
  firstSharePercent: number,
): number | null {
  if (
    !Number.isFinite(firstMonthlyCost) ||
    firstMonthlyCost < 0 ||
    !Number.isFinite(secondMonthlyCost) ||
    secondMonthlyCost < 0 ||
    !Number.isFinite(firstSharePercent) ||
    firstSharePercent < 0 ||
    firstSharePercent > 100
  ) {
    return null;
  }

  const share = firstSharePercent / 100;
  return firstMonthlyCost * share + secondMonthlyCost * (1 - share);
}

export function calculatePotentialSavings(
  baselineMonthlyCost: number,
  alternativeMonthlyCost: number,
): number | null {
  if (
    !Number.isFinite(baselineMonthlyCost) ||
    baselineMonthlyCost < 0 ||
    !Number.isFinite(alternativeMonthlyCost) ||
    alternativeMonthlyCost < 0
  ) {
    return null;
  }

  return Math.max(0, baselineMonthlyCost - alternativeMonthlyCost);
}

export function calculateBudgetUtilization(
  monthlyCost: number,
  monthlyBudget: number,
): number | null {
  if (
    !Number.isFinite(monthlyCost) ||
    monthlyCost < 0 ||
    !Number.isFinite(monthlyBudget) ||
    monthlyBudget <= 0
  ) {
    return null;
  }

  return (monthlyCost / monthlyBudget) * 100;
}
