import { headers } from "next/headers";

/** Public origin of the current request (proxy-aware, display-only). */
export async function currentOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "zav.localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host.split(",")[0].trim()}`;
}

/**
 * Caller IP for rate limiting. The reverse proxy must OVERWRITE
 * `x-forwarded-for`; never pass a client-supplied value through.
 */
export function clientIp(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headerList.get("x-real-ip");
  return real ? real.trim() : "unknown";
}
