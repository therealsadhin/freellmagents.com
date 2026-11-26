import type { MetadataRoute } from "next";
import { getModels } from "@/lib/models";
import { getModelDetailPath } from "@/lib/model-routes";
import { siteUrl } from "@/lib/seo-metadata";

const publicPaths = [
  "",
  "/about",
  "/contact",
  "/providers",
  "/pricing",
  "/cost-calculator",
  "/model-comparison",
  "/privacy",
  "/terms",
  "/cookies",
];

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let popularModels: Awaited<ReturnType<typeof getModels>>["models"] = [];
  try {
    const modelPage = await getModels({ sort: "popular" });
    popularModels = modelPage.models;
  } catch (error) {
    console.error("Could not add popular model URLs to the sitemap.", {
      error,
    });
  }

  return [
    ...publicPaths.map((path) => ({
      url: new URL(path, siteUrl).toString(),
    })),
    ...popularModels.map((model) => ({
      url: new URL(getModelDetailPath(model.id), siteUrl).toString(),
    })),
  ];
}
