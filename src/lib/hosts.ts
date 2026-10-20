/**
 * Host separation lives here. A request is served by exactly one of the two
 * virtual hosts; anything else gets a 404. Hosts are compared exactly.
 */

export const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_HOST ?? "").trim().toLowerCase();
export const STAFF_HOST = (process.env.NEXT_PUBLIC_STAFF_HOST ?? "").trim().toLowerCase();
const VERCEL_PROJECT_HOST = (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "").trim().toLowerCase();
const VERCEL_DEPLOYMENT_HOST = (process.env.VERCEL_URL ?? "").trim().toLowerCase();

export const LOCAL_SITE_HOST = "localhost:3000";
export const LOCAL_SITE_HOST_ALT = "zav.localhost:3000";
export const LOCAL_STAFF_HOST = "admin.zav.localhost:3000";
const SITE_HOST_FALLBACK = "zav.localhost:3000";

export type HostKind = "site" | "staff" | "unknown";

export function normalizeHost(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.split(",")[0].trim().toLowerCase();
}

export function hostKind(host: string): HostKind {
  if (!host) return "unknown";
  if (STAFF_HOST && host === STAFF_HOST) return "staff";
  if (SITE_HOST && host === SITE_HOST) return "site";
  if (
    (VERCEL_PROJECT_HOST && host === VERCEL_PROJECT_HOST) ||
    (VERCEL_DEPLOYMENT_HOST && host === VERCEL_DEPLOYMENT_HOST)
  ) {
    return "site";
  }
  if (host === LOCAL_SITE_HOST || host === LOCAL_SITE_HOST_ALT) return "site";
  if (host === LOCAL_STAFF_HOST) return "staff";
  // `next dev` forwards the socket address (and picks a free port when 3000 is
  // taken), so loopback and *.localhost requests would 404 in development.
  // Production never accepts anything but the two configured hosts.
  if (process.env.NODE_ENV !== "production") {
    if (host.startsWith("admin.")) return "staff";
    if (/^(127\.0\.0\.1|localhost|.*\.localhost):\d+$/.test(host)) return "site";
  }
  return "unknown";
}

export function siteHost(): string {
  return SITE_HOST || VERCEL_PROJECT_HOST || VERCEL_DEPLOYMENT_HOST || SITE_HOST_FALLBACK;
}

/** Absolute URL on the user host, used in links and emails. */
export function siteUrl(path = "/"): string {
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${siteHost()}${path}`;
}
