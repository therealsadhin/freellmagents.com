export function getModelDetailPath(modelId: string): string {
  return `/models/${encodeURIComponent(modelId)}`;
}
