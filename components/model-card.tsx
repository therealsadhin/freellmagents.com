import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProviderLogo } from "@/components/provider-logo";
import { Separator } from "@/components/ui/separator";
import { getModelDetailPath } from "@/lib/model-routes";
import type { Model } from "@/lib/models";

type ModelCardProps = {
  model: Model;
  selected: boolean;
  onCompareChange: (modelId: string, selected: boolean) => void;
};

function formatPrice(price: number) {
  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(price)}`;
}

function formatParameterCount(count: number) {
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}B`;
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}M`;
  }
  return count.toLocaleString("en-US");
}

function formatContextWindow(contextWindow: number) {
  if (contextWindow >= 1_000_000) {
    return `${(contextWindow / 1_000_000).toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}M tokens`;
  }
  if (contextWindow >= 1_000) {
    return `${Math.round(contextWindow / 1_000)}K tokens`;
  }
  return `${contextWindow.toLocaleString("en-US")} tokens`;
}

function classificationLabel(classification: Model["classification"]) {
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
      return null;
  }
}

function taskLabel(task: string) {
  return task
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ModelCard({
  model,
  selected,
  onCompareChange,
}: ModelCardProps) {
  const classification = classificationLabel(model.classification);
  const metadata = [
    model.supportedTasks[0]
      ? { label: taskLabel(model.supportedTasks[0]), key: "task" }
      : null,
    model.license ? { label: model.license, key: "license" } : null,
    model.parameterCount !== null
      ? {
          label: `${formatParameterCount(model.parameterCount)} parameters`,
          key: "parameters",
        }
      : null,
  ].filter((item): item is { label: string; key: string } => item !== null);

  const footerMetadata = [
    model.contextWindow !== null
      ? `Context ${formatContextWindow(model.contextWindow)}`
      : null,
    model.downloads !== null
      ? `${model.downloads.toLocaleString("en-US")} downloads`
      : null,
    model.providerPricing[0]
      ? `From ${formatPrice(model.providerPricing[0].inputPerMillion / 1000)} / ${formatPrice(model.providerPricing[0].outputPerMillion / 1000)} per 1K`
      : null,
  ].filter((item): item is string => item !== null);

  return (
    <Card className="min-h-[208px] gap-0 rounded-[10px] border border-border bg-surface px-[20px] py-[19px] shadow-none ring-0">
      <CardHeader className="flex flex-row items-center gap-[18px] p-0">
        <ProviderLogo
          providerName={model.provider}
          logo={model.logo}
          logoFallbacks={model.logoFallbacks}
        />
        <div className="min-w-0">
          <CardTitle className="font-heading text-[24px] leading-[1.15] font-semibold tracking-[-0.035em] text-foreground">
            <Link
              href={getModelDetailPath(model.id)}
              className="line-clamp-2 break-words hover:text-primary"
            >
              {model.name}
            </Link>
          </CardTitle>
          <CardDescription className="mt-1 text-[16px] leading-5 text-primary">
            {model.provider}
          </CardDescription>
          {classification && (
            <Badge
              variant="secondary"
              className="mt-1 h-5 rounded-full px-2 text-[11px] font-medium"
            >
              {classification}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col items-start gap-2 px-0 pt-[13px] pb-[10px]">
        {model.description && (
          <p className="line-clamp-2 text-[15px] leading-[1.35] text-foreground">
            {model.description}
          </p>
        )}
        {metadata.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {metadata.map((item) => (
              <Badge
                key={item.key}
                variant="outline"
                className="h-5 max-w-full rounded-full border-border px-2 text-[11px] font-normal text-muted-foreground"
              >
                {item.label}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 bg-transparent px-0 pt-[12px] pb-0 text-[13px] text-foreground">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          {footerMetadata.map((item, index) => (
            <span key={item} className="inline-flex items-center gap-2">
              {index > 0 && (
                <Separator
                  orientation="vertical"
                  className="h-[16px] bg-border"
                />
              )}
              <span className="text-muted-foreground">{item}</span>
            </span>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href={getModelDetailPath(model.id)}
            className="text-[13px] font-semibold text-primary hover:underline"
          >
            View details
          </Link>
          <label className="flex cursor-pointer items-center gap-2 text-[14px]">
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) =>
                onCompareChange(model.id, checked === true)
              }
              aria-label={`Compare ${model.name}`}
            />
            Compare
          </label>
        </div>
      </CardFooter>
    </Card>
  );
}
