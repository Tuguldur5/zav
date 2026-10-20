import { headers } from "next/headers";

/** Public origin of the current request (proxy-aware). */
export async function currentOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "zav.localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host.split(",")[0].trim()}`;
}
