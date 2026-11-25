import {
  getProviderId,
  getProviderName,
} from "@/lib/provider-logos";
import { resolveProviderLogoSources } from "@/lib/provider-logo-resolver";
import type {
  Model,
  ModelCategory,
  ModelDetails,
  ModelFile,
  ModelFilesPage,
  ModelPage,
  ModelRevision,
  ModelQuery,
  ModelSort,
  ModelPricing,
} from "@/lib/models";

type HubModel = {
  id?: unknown;
  author?: unknown;
  cardData?: unknown;
  gated?: unknown;
  config?: unknown;
  inferenceProviderMapping?: unknown;
  lastModified?: unknown;
  createdAt?: unknown;
  likes?: unknown;
  downloads?: unknown;
  safetensors?: unknown;
  tags?: unknown;
  pipeline_tag?: unknown;
};

type RouterProvider = {
  provider?: unknown;
  status?: unknown;
  context_length?: unknown;
  supports_tools?: unknown;
  pricing?: unknown;
};

type InferenceMetadata = {
  contextWindow: number | null;
  supportedProviders: string[];
  supportsTools: boolean | null;
  pricing: ModelPricing[];
};

const HUB_MODELS_URL = "https://huggingface.co/api/models";
const INFERENCE_MODELS_URL = "https://router.huggingface.co/v1/models";
const PAGE_SIZE = 24;
const allowedOpenSourceLicenses = new Set([
  "0bsd",
  "apache-2.0",
  "bsd-2-clause",
  "bsd-3-clause",
  "cc0-1.0",
  "isc",
  "mit",
  "mpl-2.0",
  "unlicense",
]);
const explicitProprietaryLicenses = new Set([
  "commercial",
  "closed",
  "proprietary",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toModelClassification(
  license: string | null,
  gated: boolean | null,
  parameterCount: number | null,
): Model["classification"] {
  if (gated) return "gated";
  if (!license) return "unknown";

  const normalizedLicense = license.toLowerCase();
  if (allowedOpenSourceLicenses.has(normalizedLicense)) return "open-source";
  if (explicitProprietaryLicenses.has(normalizedLicense)) return "proprietary";
  if (parameterCount !== null) return "open-weight";
  return "unknown";
}

function normalizeLicense(model: HubModel): string | null {
  if (isRecord(model.cardData)) {
    const cardLicense = model.cardData.license;
    if (typeof cardLicense === "string") return cardLicense.toLowerCase();
    if (Array.isArray(cardLicense)) {
      const firstLicense = stringValue(cardLicense[0]);
      if (firstLicense) return firstLicense.toLowerCase();
    }
  }

  if (Array.isArray(model.tags)) {
    const licenseTag = model.tags.find(
      (tag): tag is string =>
        typeof tag === "string" && tag.startsWith("license:"),
    );
    if (licenseTag) return licenseTag.slice("license:".length).toLowerCase();
  }

  return null;
}

function getDescription(cardData: unknown): string | null {
  if (!isRecord(cardData)) return null;

  return (
    stringValue(cardData.description) ??
    stringValue(cardData.short_description) ??
    stringValue(cardData.summary)
  );
}

function stringList(value: unknown): string[] {
  if (typeof value === "string") {
    const item = value.trim();
    return item ? [item] : [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .map(stringValue)
    .filter((item): item is string => item !== null);
}

function getModelBenchmarks(cardData: unknown): ModelDetails["benchmarks"] {
  if (!isRecord(cardData) || !Array.isArray(cardData["model-index"])) {
    return [];
  }

  const benchmarks: ModelDetails["benchmarks"] = [];
  for (const entry of cardData["model-index"]) {
    if (!isRecord(entry) || !Array.isArray(entry.results)) continue;
    for (const result of entry.results) {
      if (!isRecord(result)) continue;
      const dataset = isRecord(result.dataset) ? result.dataset : null;
      const task = isRecord(result.task) ? result.task : null;
      const source = dataset ? stringValue(dataset.name) : null;
      const name =
        source ??
        (task ? stringValue(task.name) : null) ??
        (task ? stringValue(task.type) : null);
      if (!name || !Array.isArray(result.metrics)) continue;

      for (const metric of result.metrics) {
        if (!isRecord(metric)) continue;
        const score = metric.value;
        if (
          typeof score !== "number" &&
          typeof score !== "string"
        ) {
          continue;
        }
        benchmarks.push({
          name:
            stringValue(metric.name) ??
            stringValue(metric.type) ??
            name,
          score,
          source,
          sourceUrl: dataset ? stringValue(dataset.url) : null,
          evaluatedAt: stringValue(result.date),
        });
      }
    }
  }

  return benchmarks;
}

function getModelRevisions(value: unknown): ModelRevision[] {
  if (!isRecord(value)) return [];
  const revisions: ModelRevision[] = [];

  for (const kind of ["branch", "tag"] as const) {
    const entries = kind === "branch" ? value.branches : value.tags;
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (!isRecord(entry)) continue;
      const name = stringValue(entry.name);
      const commit = stringValue(entry.targetCommit);
      if (name && commit) revisions.push({ name, kind, commit });
    }
  }

  return revisions.slice(0, 30);
}

export function isValidHuggingFaceModelId(modelId: string): boolean {
  const parts = modelId.split("/");
  return (
    modelId.length <= 256 &&
    parts.length === 2 &&
    parts.every(
      (part) =>
        part.length > 0 &&
        part !== "." &&
        part !== ".." &&
        !/[\\?#\s\u0000-\u001f]/.test(part),
    )
  );
}

function hubModelUrl(modelId: string): string {
  return `${HUB_MODELS_URL}/${modelId
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function normalizeFilePath(modelId: string, path: string): ModelFile {
  const filename = path.split("/").pop() ?? path;
  const extension = filename.includes(".")
    ? filename.split(".").pop()?.toLowerCase() ?? null
    : null;
  const formatByExtension: Record<string, string> = {
    bin: "BIN",
    gguf: "GGUF",
    json: "JSON",
    model: "Model",
    onnx: "ONNX",
    pb: "Protocol Buffers",
    pt: "PyTorch",
    safetensors: "SafeTensors",
    tflite: "TensorFlow Lite",
    txt: "Text",
  };
  const quantization = filename.match(
    /(?:^|[-_.])(q[2-8](?:_k_[a-z0-9]+|_[a-z0-9]+)?|fp16|bf16|int8|awq|gptq)(?=[-_.]|$)/i,
  )?.[1];
  const encodedPath = path
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return {
    path,
    size: null,
    format: extension ? formatByExtension[extension] ?? extension.toUpperCase() : null,
    quantization: quantization?.toUpperCase() ?? null,
    url: `https://huggingface.co/${modelId}/blob/main/${encodedPath}`,
  };
}

function getParameterCount(safetensors: unknown): number | null {
  if (!isRecord(safetensors)) return null;

  const total = numberValue(safetensors.total);
  if (total !== null) return total;

  if (isRecord(safetensors.parameters)) {
    return Object.values(safetensors.parameters).reduce<number | null>(
      (sum, value) => {
        const count = numberValue(value);
        return count === null || sum === null ? null : sum + count;
      },
      0,
    );
  }

  return null;
}

function getSupportedTasks(model: HubModel): string[] {
  const tasks = new Set<string>();
  const pipelineTag = stringValue(model.pipeline_tag);
  if (pipelineTag) tasks.add(pipelineTag);

  if (Array.isArray(model.tags)) {
    for (const tag of model.tags) {
      if (
        typeof tag === "string" &&
        [
          "text-generation",
          "text-to-image",
          "image-text-to-text",
          "text-to-speech",
          "automatic-speech-recognition",
          "audio-to-audio",
          "image-to-text",
          "feature-extraction",
          "sentence-similarity",
          "visual-question-answering",
        ].includes(tag)
      ) {
        tasks.add(tag);
      }
    }
  }

  return [...tasks];
}

function getCategories(tasks: string[], tags: unknown): ModelCategory[] {
  const values = new Set<string>(tasks);
  if (Array.isArray(tags)) {
    for (const tag of tags) {
      if (typeof tag === "string") values.add(tag.toLowerCase());
    }
  }

  const categories = new Set<ModelCategory>();
  if (values.has("text-generation") || values.has("conversational")) {
    categories.add("chat");
  }
  if ([...values].some((value) => /code|coding|programming/.test(value))) {
    categories.add("coding");
  }
  if ([...values].some((value) => /reasoning|math|logic/.test(value))) {
    categories.add("reasoning");
  }
  if (
    [...values].some((value) =>
      ["text-to-image", "image-to-text", "image-text-to-text"].includes(value),
    )
  ) {
    categories.add("image");
  }
  if (
    [...values].some((value) =>
      [
        "text-to-speech",
        "automatic-speech-recognition",
        "audio-to-audio",
        "audio",
        "speech",
      ].includes(value),
    )
  ) {
    categories.add("audio");
  }

  return [...categories];
}

function makeInferenceMetadata(value: unknown): InferenceMetadata {
  if (!isRecord(value) || !Array.isArray(value.providers)) {
    return {
      contextWindow: null,
      supportedProviders: [],
      supportsTools: null,
      pricing: [],
    };
  }

  const providers = value.providers.filter(
    (provider): provider is RouterProvider =>
      isRecord(provider) && provider.status === "live",
  );
  const contextLengths = providers
    .map((provider) => numberValue(provider.context_length))
    .filter((length): length is number => length !== null);
  const pricing: ModelPricing[] = [];

  for (const provider of providers) {
    const name = stringValue(provider.provider);
    if (!name || !isRecord(provider.pricing)) continue;
    const inputPerMillion = numberValue(provider.pricing.input);
    const outputPerMillion = numberValue(provider.pricing.output);
    if (inputPerMillion === null || outputPerMillion === null) continue;
    pricing.push({ provider: name, inputPerMillion, outputPerMillion });
  }

  pricing.sort(
    (left, right) =>
      left.inputPerMillion +
      left.outputPerMillion -
      (right.inputPerMillion + right.outputPerMillion),
  );

  const toolSupport = providers
    .map((provider) =>
      typeof provider.supports_tools === "boolean"
        ? provider.supports_tools
        : null,
    )
    .filter((value): value is boolean => value !== null);

  return {
    contextWindow:
      contextLengths.length > 0 ? Math.max(...contextLengths) : null,
    supportedProviders: providers
      .map((provider) => stringValue(provider.provider))
      .filter((name): name is string => name !== null),
    supportsTools:
      toolSupport.length > 0 ? toolSupport.some(Boolean) : null,
    pricing,
  };
}

async function getInferenceCatalog(): Promise<Map<string, InferenceMetadata>> {
  const response = await fetch(INFERENCE_MODELS_URL, {
    headers: process.env.HF_TOKEN
      ? { Authorization: `Bearer ${process.env.HF_TOKEN}` }
      : undefined,
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error(
      `Hugging Face Inference Providers returned ${response.status}.`,
    );
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new Error("Hugging Face Inference Providers returned invalid data.");
  }

  const catalog = new Map<string, InferenceMetadata>();
  for (const entry of payload.data) {
    if (!isRecord(entry)) continue;
    const id = stringValue(entry.id);
    if (id) catalog.set(id.toLowerCase(), makeInferenceMetadata(entry));
  }

  return catalog;
}

async function normalizeHubModel(
  rawModel: HubModel,
  inference: InferenceMetadata | undefined,
  logoSourcesByAuthor: Map<string, Promise<string[]>>,
): Promise<Model | null> {
  const id = stringValue(rawModel.id);
  if (!id) return null;

  const cardData = isRecord(rawModel.cardData) ? rawModel.cardData : null;
  const author =
    stringValue(rawModel.author) ?? id.split("/", 1)[0] ?? "unknown";
  const providerId = getProviderId(author);
  const safetensors = isRecord(rawModel.safetensors)
    ? rawModel.safetensors
    : null;
  const parameterCount = getParameterCount(safetensors);
  const license = normalizeLicense(rawModel);
  const gated =
    typeof rawModel.gated === "boolean" ? rawModel.gated : null;
  const tasks = getSupportedTasks(rawModel);
  const pricing = inference?.pricing ?? [];
  const lowestPrice = pricing[0] ?? null;
  const authorKey = author.toLowerCase();
  let logoSources = logoSourcesByAuthor.get(authorKey);
  if (!logoSources) {
    logoSources = resolveProviderLogoSources(author);
    logoSourcesByAuthor.set(authorKey, logoSources);
  }
  const resolvedLogoSources = await logoSources;

  return {
    id,
    name: id.split("/").pop()?.replace(/[-_]+/g, " ") ?? id,
    provider: getProviderName(author),
    providerId,
    authorId: author,
    description: getDescription(cardData),
    logo: resolvedLogoSources[0] ?? null,
    logoFallbacks: resolvedLogoSources.slice(1),
    license,
    classification: toModelClassification(license, gated, parameterCount),
    gated,
    contextWindow: inference?.contextWindow ?? null,
    modelType: isRecord(rawModel.config)
      ? stringValue(rawModel.config.model_type)
      : null,
    parameterCount,
    downloads: numberValue(rawModel.downloads),
    likes: numberValue(rawModel.likes),
    lastUpdated: stringValue(rawModel.lastModified),
    createdAt: stringValue(rawModel.createdAt),
    supportedTasks: tasks,
    supportedProviders: inference?.supportedProviders ?? [],
    supportsTools: inference?.supportsTools ?? null,
    providerPricing: pricing,
    inputPrice: lowestPrice?.inputPerMillion ?? null,
    outputPrice: lowestPrice?.outputPerMillion ?? null,
    modelUrl: `https://huggingface.co/${id}`,
    categories: getCategories(tasks, rawModel.tags),
  };
}

function getSortKey(sort: ModelSort | undefined): string {
  switch (sort) {
    case "downloads":
      return "downloads";
    case "trending":
      return "trendingScore";
    case "updated":
      return "lastModified";
    case "newest":
      return "createdAt";
    case "popular":
    default:
      return "likes";
  }
}

export function getNextCursor(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const nextLink = linkHeader
    .split(/,\s*(?=<)/)
    .find((link) => /rel="?next"?/.test(link));
  if (!nextLink) return null;

  const url = nextLink.match(/<([^>]+)>/)?.[1];
  if (!url) return null;
  const cursor = new URL(url).searchParams.get("cursor");
  return cursor || null;
}

export async function getHuggingFaceModels(
  query: ModelQuery,
): Promise<ModelPage> {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    sort: getSortKey(query.sort),
    direction: "-1",
  });
  params.append("expand[]", "cardData");
  params.append("expand[]", "config");
  params.append("expand[]", "safetensors");
  params.append("expand[]", "inferenceProviderMapping");
  params.append("expand[]", "likes");
  params.append("expand[]", "tags");
  params.append("expand[]", "pipeline_tag");
  params.append("expand[]", "createdAt");
  params.append("expand[]", "lastModified");
  params.append("expand[]", "author");
  params.append("expand[]", "gated");

  const search = query.search?.trim();
  if (search) params.set("search", search);
  if (query.provider) params.set("author", query.provider);

  const task = query.category ? categoryToPipelineTag(query.category) : null;
  if (task) params.set("pipeline_tag", task);
  if (query.cursor) params.set("cursor", query.cursor);

  const headers: Record<string, string> = {};
  if (process.env.HF_TOKEN) {
    headers.Authorization = `Bearer ${process.env.HF_TOKEN}`;
  }

  const [hubResponse, inferenceResult] = await Promise.allSettled([
    fetch(`${HUB_MODELS_URL}?${params.toString()}`, {
      headers,
      next: { revalidate: 300 },
    }),
    getInferenceCatalog(),
  ]);

  if (hubResponse.status === "rejected") {
    throw new Error("Could not connect to the Hugging Face Hub API.");
  }
  if (!hubResponse.value.ok) {
    throw new Error(
      `Hugging Face Hub API returned ${hubResponse.value.status}.`,
    );
  }

  const payload: unknown = await hubResponse.value.json();
  if (!Array.isArray(payload)) {
    throw new Error("Hugging Face Hub API returned invalid model data.");
  }

  const inferenceCatalog =
    inferenceResult.status === "fulfilled" ? inferenceResult.value : new Map();
  const warnings: string[] = [];
  if (inferenceResult.status === "rejected") {
    warnings.push("Inference provider details are temporarily unavailable.");
    console.error("Hugging Face Inference Providers lookup failed.", {
      cause: inferenceResult.reason,
    });
  }

  const uniqueModels = new Map<string, Model>();
  const logoSourcesByAuthor = new Map<string, Promise<string[]>>();
  const normalizedModels = await Promise.all(
    payload.map((raw) => {
      if (!isRecord(raw)) return null;
      const rawModel = raw as HubModel;
      const id = stringValue(rawModel.id);
      if (!id) return null;
      return normalizeHubModel(
        rawModel,
        inferenceCatalog.get(id.toLowerCase()),
        logoSourcesByAuthor,
      );
    }),
  );
  for (const normalized of normalizedModels) {
    if (!normalized) continue;
    const key = normalized.id.toLowerCase();
    const current = uniqueModels.get(key);
    if (!current || (normalized.likes ?? -1) > (current.likes ?? -1)) {
      uniqueModels.set(key, normalized);
    }
  }

  return {
    models: [...uniqueModels.values()],
    nextCursor: getNextCursor(hubResponse.value.headers.get("link")),
    totalResults: parseTotalResults(hubResponse.value.headers),
    warnings,
  };
}

export async function getHuggingFaceModelDetails(
  modelId: string,
): Promise<ModelDetails | null> {
  if (!isValidHuggingFaceModelId(modelId)) return null;

  const detailParams = new URLSearchParams();
  for (const field of [
    "cardData",
    "config",
    "safetensors",
    "pipeline_tag",
    "tags",
    "lastModified",
    "createdAt",
    "likes",
    "downloads",
    "gated",
    "author",
  ]) {
    detailParams.append("expand[]", field);
  }
  const endpoint = hubModelUrl(modelId);
  const headers: Record<string, string> = {};
  if (process.env.HF_TOKEN) {
    headers.Authorization = `Bearer ${process.env.HF_TOKEN}`;
  }

  const [modelResult, inferenceResult, revisionsResult] =
    await Promise.allSettled([
      fetch(`${endpoint}?${detailParams.toString()}`, {
        headers,
        next: { revalidate: 300 },
      }),
      getInferenceCatalog(),
      fetch(`${endpoint}/refs`, {
        headers,
        next: { revalidate: 1800 },
      }),
    ]);

  if (modelResult.status === "rejected") {
    throw new Error("Could not connect to the Hugging Face model API.");
  }
  if (modelResult.value.status === 404) return null;
  if (!modelResult.value.ok) {
    throw new Error(
      `Hugging Face model API returned ${modelResult.value.status}.`,
    );
  }

  const rawModelValue: unknown = await modelResult.value.json();
  if (!isRecord(rawModelValue)) {
    throw new Error("Hugging Face returned invalid model details.");
  }
  const rawModel = rawModelValue as HubModel;
  const id = stringValue(rawModel.id);
  if (!id || id.toLowerCase() !== modelId.toLowerCase()) return null;

  const warnings: string[] = [];
  const inferenceCatalog =
    inferenceResult.status === "fulfilled"
      ? inferenceResult.value
      : new Map<string, InferenceMetadata>();
  if (inferenceResult.status === "rejected") {
    warnings.push("Inference provider data is temporarily unavailable.");
    console.error("Hugging Face Inference Providers lookup failed.", {
      cause: inferenceResult.reason,
    });
  }

  let revisions: ModelRevision[] = [];
  if (
    revisionsResult.status === "fulfilled" &&
    revisionsResult.value.ok
  ) {
    revisions = getModelRevisions(await revisionsResult.value.json());
  } else {
    const cause =
      revisionsResult.status === "rejected"
        ? revisionsResult.reason
        : new Error(
            `Hugging Face refs API returned ${revisionsResult.value.status}.`,
          );
    warnings.push("Repository versions are temporarily unavailable.");
    console.error("Hugging Face repository refs lookup failed.", { cause });
  }

  const normalized = await normalizeHubModel(
    rawModel,
    inferenceCatalog.get(id.toLowerCase()),
    new Map<string, Promise<string[]>>(),
  );
  if (!normalized) return null;

  const config = isRecord(rawModel.config) ? rawModel.config : {};
  const cardData = isRecord(rawModel.cardData) ? rawModel.cardData : {};
  const configuredContext =
    numberValue(config.max_position_embeddings) ??
    numberValue(config.max_sequence_length);

  return {
    ...normalized,
    contextWindow: normalized.contextWindow ?? configuredContext,
    architecture: stringList(config.architectures).length
      ? stringList(config.architectures)
      : stringList(cardData.architecture),
    modelType: stringValue(config.model_type),
    inputModalities: stringList(
      cardData.input_modalities ?? config.input_modalities,
    ),
    outputModalities: stringList(
      cardData.output_modalities ?? config.output_modalities,
    ),
    languages: stringList(cardData.language),
    intendedUses: stringList(
      cardData.intended_use ?? cardData.intended_uses,
    ),
    limitations: stringList(cardData.limitations),
    trainingDatasets: stringList(cardData.datasets),
    benchmarks: getModelBenchmarks(cardData),
    revisions,
    detailWarnings: warnings,
  };
}

export async function getHuggingFaceModelFiles(
  modelId: string,
  cursor?: string | null,
): Promise<ModelFilesPage> {
  if (!isValidHuggingFaceModelId(modelId)) {
    throw new Error("The requested model identifier is invalid.");
  }
  if (cursor && (cursor.length > 4096 || /[\u0000-\u001f]/.test(cursor))) {
    throw new Error("The requested file cursor is invalid.");
  }

  const params = new URLSearchParams({
    limit: "30",
    expand: "true",
  });
  if (cursor) params.set("cursor", cursor);

  const headers: Record<string, string> = {};
  if (process.env.HF_TOKEN) {
    headers.Authorization = `Bearer ${process.env.HF_TOKEN}`;
  }
  const response = await fetch(
    `${hubModelUrl(modelId)}/tree/main?${params.toString()}`,
    {
      headers,
      next: { revalidate: 300 },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Hugging Face repository files API returned ${response.status}.`,
    );
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Hugging Face returned invalid repository file data.");
  }

  const files: ModelFile[] = payload.flatMap((entry) => {
    if (!isRecord(entry) || entry.type !== "file") return [];
    const path = stringValue(entry.path);
    if (!path) return [];
    return [
      {
        ...normalizeFilePath(modelId, path),
        size: numberValue(entry.size),
      },
    ];
  });

  return {
    files,
    nextCursor: getNextCursor(response.headers.get("link")),
  };
}

export function categoryToPipelineTag(category: string): string | null {
  switch (category) {
    case "chat":
    case "coding":
    case "reasoning":
      return "text-generation";
    case "image":
      return "text-to-image";
    case "audio":
      return "text-to-speech";
    default:
      return null;
  }
}

function parseTotalResults(headers: Headers): number | null {
  const value = headers.get("x-total-count");
  if (!value) return null;
  const total = Number(value);
  return Number.isSafeInteger(total) && total >= 0 ? total : null;
}
