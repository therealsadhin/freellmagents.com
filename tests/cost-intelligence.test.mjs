import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateBudgetUtilization,
  calculateHybridMonthlyCost,
  calculateMonthlyTokenUsage,
  calculatePotentialSavings,
  estimateModelCost,
} from "../lib/cost-intelligence.ts";

const workload = {
  requestsPerDay: 100,
  daysPerMonth: 30,
  turnsPerConversation: 2,
  inputTokensPerTurn: 1_000,
  outputTokensPerTurn: 500,
};

function model(providerPricing = []) {
  return {
    id: "org/model",
    name: "Model",
    provider: "Organization",
    logo: null,
    logoFallbacks: [],
    classification: "open-weight",
    modelUrl: "https://huggingface.co/org/model",
    providerPricing,
  };
}

test("projects monthly tokens from the complete workload", () => {
  assert.deepEqual(calculateMonthlyTokenUsage(workload), {
    inputTokens: 6_000_000,
    outputTokens: 3_000_000,
  });
  assert.deepEqual(
    calculateMonthlyTokenUsage({ ...workload, requestsPerDay: 0 }),
    { inputTokens: 0, outputTokens: 0 },
  );
});

test("rejects fractional and overflowing token workloads", () => {
  assert.equal(
    calculateMonthlyTokenUsage({ ...workload, daysPerMonth: 30.5 }),
    null,
  );
  assert.equal(
    calculateMonthlyTokenUsage({
      ...workload,
      requestsPerDay: Number.MAX_SAFE_INTEGER,
    }),
    null,
  );
});

test("chooses a provider using this workload's input/output mix", () => {
  const estimate = estimateModelCost(
    model([
      { provider: "input-cheap", inputPerMillion: 0.1, outputPerMillion: 2 },
      { provider: "output-cheap", inputPerMillion: 0.5, outputPerMillion: 0.2 },
    ]),
    workload,
  );

  assert.equal(estimate.status, "calculable");
  if (estimate.status === "calculable") {
    assert.equal(estimate.provider, "output-cheap");
    assert.equal(estimate.monthlyCost, 3.6);
  }
});

test("does not turn missing provider prices into a zero-cost estimate", () => {
  assert.deepEqual(
    estimateModelCost(model(), workload),
    {
      status: "not-calculable",
      model: model(),
      reason: "pricing-unavailable",
    },
  );
});

test("preserves zero-priced models and rejects unknown providers", () => {
  const freeModel = model([
    { provider: "verified-free", inputPerMillion: 0, outputPerMillion: 0 },
  ]);
  const zeroEstimate = estimateModelCost(freeModel, workload);
  assert.equal(zeroEstimate.status, "calculable");
  if (zeroEstimate.status === "calculable") {
    assert.equal(zeroEstimate.monthlyCost, 0);
  }

  assert.equal(
    estimateModelCost(freeModel, workload, { provider: "unknown" }).reason,
    "provider-pricing-unavailable",
  );
});

test("marks non-token workloads incomplete while retaining text-token subtotal", () => {
  const estimate = estimateModelCost(
    model([
      { provider: "verified-provider", inputPerMillion: 1, outputPerMillion: 2 },
    ]),
    workload,
    { requiresAdditionalUsagePricing: true },
  );
  assert.equal(estimate.status, "not-calculable");
  if (estimate.status === "not-calculable") {
    assert.equal(estimate.reason, "additional-usage-unpriced");
    assert.equal(estimate.textTokenCost, 12);
  }
});

test("recalculates every comparison model from a changed shared workload", () => {
  const comparisonWorkload = { ...workload, turnsPerConversation: 1 };
  const lowerRateModel = model([
    { provider: "provider-a", inputPerMillion: 0.5, outputPerMillion: 1 },
  ]);
  const higherRateModel = model([
    { provider: "provider-b", inputPerMillion: 1, outputPerMillion: 2 },
  ]);

  const initialEstimates = [lowerRateModel, higherRateModel].map((item) =>
    estimateModelCost(item, comparisonWorkload),
  );
  assert.deepEqual(
    initialEstimates.map((estimate) =>
      estimate.status === "calculable" ? estimate.monthlyCost : null,
    ),
    [3, 6],
  );

  const updatedWorkload = {
    ...comparisonWorkload,
    requestsPerDay: comparisonWorkload.requestsPerDay * 2,
  };
  const updatedEstimates = [lowerRateModel, higherRateModel].map((item) =>
    estimateModelCost(item, updatedWorkload),
  );
  assert.deepEqual(
    updatedEstimates.map((estimate) =>
      estimate.status === "calculable" ? estimate.monthlyCost : null,
    ),
    [6, 12],
  );
});

test("calculates hybrid routing, savings, and budget utilization", () => {
  assert.equal(calculateHybridMonthlyCost(20, 10, 75), 17.5);
  assert.equal(calculateHybridMonthlyCost(20, 10, 101), null);
  assert.equal(calculatePotentialSavings(20, 10), 10);
  assert.equal(calculatePotentialSavings(10, 20), 0);
  assert.equal(calculateBudgetUtilization(42, 100), 42);
  assert.equal(calculateBudgetUtilization(42, 0), null);
});
