/**
 * Three virtual hosts, compared EXACTLY. A request belongs to one host and one
 * audience: customer (/site), worker (/worker) or staff (/staff). Anything else
 * is a 404. Never use startsWith/includes for a host check.
 */

export const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_HOST ?? "").trim().toLowerCase();
export const WORKER_HOST = (process.env.NEXT_PUBLIC_WORKER_HOST ?? "").trim().toLowerCase();
export const STAFF_HOST = (process.env.NEXT_PUBLIC_STAFF_HOST ?? "").trim().toLowerCase();

const VERCEL_PROJECT_HOST = (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "").trim().toLowerCase();
const VERCEL_DEPLOYMENT_HOST = (process.env.VERCEL_URL ?? "").trim().toLowerCase();

/** Local development defaults (plain localhost is the customer host). */
export const LOCAL_SITE_HOST = "localhost:3000";
export const LOCAL_WORKER_HOST = "ajil.zav.localhost:3000";
export const LOCAL_STAFF_HOST = "admin.zav.localhost:3000";
const LOOPBACK_SITE_HOST = "127.0.0.1:3000";

const SITE_FALLBACK = "zav.localhost:3000";
const WORKER_FALLBACK = "ajil.zav.localhost:3000";
const STAFF_FALLBACK = "admin.zav.localhost:3000";

export type HostKind = "customer" | "worker" | "staff" | "unknown";

export function normalizeHost(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.split(",")[0].trim().toLowerCase();
}

export function hostKind(host: string): HostKind {
  if (!host) return "unknown";
  if (SITE_HOST && host === SITE_HOST) return "customer";
  if (WORKER_HOST && host === WORKER_HOST) return "worker";
  if (STAFF_HOST && host === STAFF_HOST) return "staff";

  // Preview deployments are single-host: treat them as the customer site only.
  if (
    (VERCEL_PROJECT_HOST && host === VERCEL_PROJECT_HOST) ||
    (VERCEL_DEPLOYMENT_HOST && host === VERCEL_DEPLOYMENT_HOST)
  ) {
    return "customer";
  }

  // Local development only. Production accepts nothing but the configured hosts.
  if (process.env.NODE_ENV !== "production") {
    if (host === LOCAL_STAFF_HOST) return "staff";
    if (host === LOCAL_WORKER_HOST) return "worker";
    if (host === LOCAL_SITE_HOST || host === LOOPBACK_SITE_HOST) return "customer";
  }
  return "unknown";
}

export function isCustomerHost(host: string): boolean {
  return hostKind(host) === "customer";
}

export function isWorkerHost(host: string): boolean {
  return hostKind(host) === "worker";
}

export function isStaffHost(host: string): boolean {
  return hostKind(host) === "staff";
}

/** Host of the current request, as seen by server components and actions. */
export function hostOf(headersList: Headers): string {
  return normalizeHost(
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "",
  );
}

/** Local names are plain HTTP; every real domain is HTTPS. */
export function schemeFor(host: string): "http" | "https" {
  const bare = host.split(":")[0];
  return bare === "localhost" || bare === "127.0.0.1" || bare.endsWith(".localhost")
    ? "http"
    : "https";
}

function protocol(): string {
  return process.env.NODE_ENV === "production" ? "https" : "http";
}

export function siteHost(): string {
  return (
    SITE_HOST || VERCEL_PROJECT_HOST || VERCEL_DEPLOYMENT_HOST || LOCAL_SITE_HOST || SITE_FALLBACK
  );
}

export function workerHost(): string {
  return WORKER_HOST || LOCAL_WORKER_HOST || WORKER_FALLBACK;
}

export function staffHost(): string {
  return STAFF_HOST || LOCAL_STAFF_HOST || STAFF_FALLBACK;
}

/**
 * Origin of the CURRENT host, chosen from the configured names after an exact
 * host match. Never built from a raw request header or any user input, so an
 * auth email can never be pointed at another domain.
 */
export function hostOrigin(host: string): string | null {
  const kind = hostKind(host);
  if (kind === "unknown") return null;
  const name = kind === "customer" ? siteHost() : kind === "worker" ? workerHost() : staffHost();
  return `${schemeFor(name)}://${name}`;
}

/** Absolute URLs for every cross-host link. */
export function siteUrl(path = "/"): string {
  return `${protocol()}://${siteHost()}${path}`;
}

export function workerUrl(path = "/"): string {
  return `${protocol()}://${workerHost()}${path}`;
}

export function staffUrl(path = "/"): string {
  return `${protocol()}://${staffHost()}${path}`;
}

/** The host a signed-in role must use. */
export function homeHostForRole(role: string): "customer" | "worker" | "staff" {
  if (role === "worker") return "worker";
  if (role === "admin" || role === "super_admin") return "staff";
  return "customer";
}
