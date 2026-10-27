import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostKind, hostOf, siteUrl, workerUrl } from "@/lib/hosts";

export const dynamic = "force-dynamic";

/**
 * One robots policy per host: the customer site is indexable except the app
 * area, the worker site only shows its landing to search engines, and the staff
 * host is closed entirely.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = hostOf(await headers());
  const kind = hostKind(host);

  if (kind === "staff") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  if (kind === "worker") {
    return {
      rules: { userAgent: "*", allow: ["/", "/terms", "/privacy"], disallow: "/" },
      sitemap: `${workerUrl("/sitemap.xml")}`,
    };
  }

  if (kind === "customer") {
    return {
      rules: { userAgent: "*", allow: "/", disallow: ["/c"] },
      sitemap: `${siteUrl("/sitemap.xml")}`,
    };
  }

  return { rules: { userAgent: "*", disallow: "/" } };
}
