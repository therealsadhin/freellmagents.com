import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { ModelDetailView } from "@/components/model-detail-view";
import type { ModelDetails } from "@/lib/models";
import { getModelDetailPath } from "@/lib/model-routes";
import { getModelDetails } from "@/lib/models";
import { isValidHuggingFaceModelId } from "@/lib/model-sources/huggingface";
import { createPageMetadata, siteUrl } from "@/lib/seo-metadata";
import { createWebPageStructuredData } from "@/lib/structured-data";

const loadModelDetails = cache((modelId: string) => getModelDetails(modelId));

function decodeModelId(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getModelMetadataText(model: ModelDetails) {
  const suffix = " | AI Model Details | FreeLLMAgents";
  const minimumPrefixLength = 50 - suffix.length;
  const maximumPrefixLength = 60 - suffix.length;
  let titlePrefix = `${model.name} by ${model.provider}`
    .replace(/\s+/g, " ")
    .trim();

  if (titlePrefix.length < minimumPrefixLength) {
    titlePrefix = `${titlePrefix} model specifications`;
  }
  if (titlePrefix.length > maximumPrefixLength) {
    titlePrefix = `${titlePrefix.slice(0, maximumPrefixLength - 1).trimEnd()}…`;
  }

  const identity = `${model.name} by ${model.provider}`
    .replace(/\s+/g, " ")
    .trim();
  const compactIdentity =
    identity.length > 25 ? `${identity.slice(0, 24).trimEnd()}…` : identity;
  const rawDescription = `Explore ${compactIdentity}: review reported specs, licensing, model files, and provider availability in FreeLLMAgents. Confirm current details with the provider.`;
  const description =
    rawDescription.length > 160
      ? `${rawDescription.slice(0, 157).trimEnd()}...`
      : rawDescription;

  return { title: `${titlePrefix}${suffix}`, description };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ modelId: string }>;
}): Promise<Metadata> {
  const { modelId: routeId } = await params;
  const modelId = decodeModelId(routeId);
  if (!isValidHuggingFaceModelId(modelId)) {
    return {
      title: "Model not found",
      robots: { index: false, follow: false },
    };
  }

  const model = await loadModelDetails(modelId);
  if (!model) {
    return {
      title: { absolute: "AI Model Not Found | FreeLLMAgents" },
      robots: { index: false, follow: false },
    };
  }

  const url = getModelDetailPath(model.id);
  const { title, description } = getModelMetadataText(model);

  return createPageMetadata({ title, description, canonical: url });
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ modelId: string }>;
}) {
  const { modelId: routeId } = await params;
  const modelId = decodeModelId(routeId);
  if (!isValidHuggingFaceModelId(modelId)) notFound();

  const model = await loadModelDetails(modelId);
  if (!model) notFound();

  const canonical = getModelDetailPath(model.id);
  const { title, description } = getModelMetadataText(model);

  return (
    <>
      <JsonLd
        data={createWebPageStructuredData({
          canonical: new URL(canonical, siteUrl).toString(),
          title,
          description,
        })}
      />
      <ModelDetailView model={model} />
    </>
  );
}
