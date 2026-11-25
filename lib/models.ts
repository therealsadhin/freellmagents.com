import { getHuggingFaceModels } from "@/lib/model-sources/huggingface";

export type ModelCategory =
  | "chat"
  | "coding"
  | "reasoning"
  | "image"
  | "audio";

export type ModelClassification =
  | "open-source"
  | "open-weight"
  | "proprietary"
  | "gated"
  | "unknown";

export type ModelPricing = {
  provider: string;
  inputPerMillion: number;
  outputPerMillion: number;
};

export type Model = {
  id: string;
  name: string;
  provider: string;
  providerId: string;
  authorId: string;
  description: string | null;
  logo: string | null;
  logoFallbacks: string[];
  license: string | null;
  classification: ModelClassification;
  gated: boolean | null;
  contextWindow: number | null;
  modelType: string | null;
  parameterCount: number | null;
  downloads: number | null;
  likes: number | null;
  lastUpdated: string | null;
  createdAt: string | null;
  supportedTasks: string[];
  supportedProviders: string[];
  supportsTools: boolean | null;
  providerPricing: ModelPricing[];
  inputPrice: number | null;
  outputPrice: number | null;
  modelUrl: string;
  categories: ModelCategory[];
};

export type ModelSort =
  | "popular"
  | "downloads"
  | "trending"
  | "updated"
  | "newest";

export type ModelQuery = {
  search?: string;
  category?: string;
  provider?: string;
  sort?: ModelSort;
  cursor?: string;
};

export type ModelPage = {
  models: Model[];
  nextCursor: string | null;
  totalResults: number | null;
  warnings: string[];
};

export type ModelBenchmark = {
  name: string;
  score: string | number;
  source: string | null;
  sourceUrl: string | null;
  evaluatedAt: string | null;
};

export type ModelRevision = {
  name: string;
  kind: "branch" | "tag";
  commit: string;
};

export type ModelDetails = Model & {
  architecture: string[];
  modelType: string | null;
  inputModalities: string[];
  outputModalities: string[];
  languages: string[];
  intendedUses: string[];
  limitations: string[];
  trainingDatasets: string[];
  benchmarks: ModelBenchmark[];
  revisions: ModelRevision[];
  detailWarnings: string[];
};

export type ModelFile = {
  path: string;
  size: number | null;
  format: string | null;
  quantization: string | null;
  url: string;
};

export type ModelFilesPage = {
  files: ModelFile[];
  nextCursor: string | null;
};

export async function getModels(query: ModelQuery = {}): Promise<ModelPage> {
  return getHuggingFaceModels(query);
}

export async function getModelDetails(
  modelId: string,
): Promise<ModelDetails | null> {
  const { getHuggingFaceModelDetails } = await import(
    "@/lib/model-sources/huggingface"
  );
  return getHuggingFaceModelDetails(modelId);
}

export async function getModelFiles(
  modelId: string,
  cursor?: string | null,
): Promise<ModelFilesPage> {
  const { getHuggingFaceModelFiles } = await import(
    "@/lib/model-sources/huggingface"
  );
  return getHuggingFaceModelFiles(modelId, cursor);
}
