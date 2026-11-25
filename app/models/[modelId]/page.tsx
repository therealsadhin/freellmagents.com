import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModelDetailView } from "@/components/model-detail-view";
import { getModelDetailPath } from "@/lib/model-routes";
import { getModelDetails } from "@/lib/models";
import { isValidHuggingFaceModelId } from "@/lib/model-sources/huggingface";

const loadModelDetails = cache((modelId: string) => getModelDetails(modelId));

function decodeModelId(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
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
      title: "Model not found",
      robots: { index: false, follow: false },
    };
  }

  const description =
    model.description ??
    `Explore the ${model.name} model by ${model.provider}, including available specifications, pricing, and repository files.`;
  const url = getModelDetailPath(model.id);
  const title = `${model.name} by ${model.provider}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: "FreeLLMAgents",
      title: `${title} | FreeLLMAgents`,
      description,
      url,
    },
    twitter: {
      card: "summary",
      title: `${title} | FreeLLMAgents`,
      description,
    },
  };
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

  return <ModelDetailView model={model} />;
}
