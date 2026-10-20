import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostKind, normalizeHost } from "@/lib/hosts";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const host = normalizeHost(headerList.get("x-forwarded-host") ?? headerList.get("host"));

  if (hostKind(host) === "staff") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/c", "/w"] },
  };
}
