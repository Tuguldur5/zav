import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostKind, hostOf, siteUrl, workerUrl } from "@/lib/hosts";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerList = await headers();
  const kind = hostKind(hostOf(headerList));

  if (kind === "worker") {
    return [
      { url: workerUrl("/"), changeFrequency: "monthly", priority: 1 },
      { url: workerUrl("/terms"), changeFrequency: "yearly", priority: 0.3 },
      { url: workerUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    ];
  }

  if (kind === "customer") {
    return [
      { url: siteUrl("/"), changeFrequency: "monthly", priority: 1 },
      { url: siteUrl("/help"), changeFrequency: "monthly", priority: 0.4 },
      { url: siteUrl("/terms"), changeFrequency: "yearly", priority: 0.3 },
      { url: siteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    ];
  }

  return [];
}
