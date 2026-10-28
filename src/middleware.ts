import { NextResponse, type NextRequest } from "next/server";
import { hostKind, normalizeHost } from "@/lib/hosts";
import { PERF_LOG, perfLog } from "@/lib/perf";
import { SUPABASE_URL } from "@/lib/supabase/config";
import {
  clearSupabaseCookies,
  logStaleCookieOnce,
  readSession,
  requestCookieNames,
} from "@/lib/supabase/middleware";

/** POST endpoints that start a session or send an email: 5 per minute per IP. */
const POST_LIMIT_PATHS = ["/login", "/register", "/forgot-password"];
const POST_LIMIT = 5;
/** Email-link endpoints: 30 per minute per IP (mail scanners follow links). */
const LINK_LIMIT_PATHS = ["/auth/confirm", "/auth/callback"];
const LINK_LIMIT = 30;
const WINDOW_MS = 60_000;
const STAFF_IDLE_MS = 30 * 60 * 1000;
const SEEN_COOKIE = "zav_staff_seen";

/**
 * Next may re-enter middleware for an internal rewrite. This unguessable
 * per-process token lets those requests through while keeping the internal
 * folders (/site, /worker, /staff) 404 for real clients.
 */
const INTERNAL_HEADER = "x-zav-internal";
const globalStore = globalThis as unknown as { __zavInternalToken?: string };
const INTERNAL_TOKEN = (globalStore.__zavInternalToken ??= crypto.randomUUID());

/**
 * In-memory limiter. It is intentionally per-process: run exactly ONE app
 * instance (no PM2 cluster). Redis replaces this in production scale-out.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string, max: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

function clientIp(req: NextRequest): string {
  // The reverse proxy must OVERWRITE this header; never pass client values.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

function securityHeaders(): Headers {
  const headers = new Headers();
  const supabaseOrigin = (() => {
    try {
      return new URL(SUPABASE_URL).origin;
    } catch {
      return "";
    }
  })();
  const dev = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} wss://${new URL(SUPABASE_URL).host}` : ""}`,
    "manifest-src 'self'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  headers.set("Content-Security-Policy", csp);
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return headers;
}

function notFound(headers: Headers): NextResponse {
  const body =
    '<!doctype html><html lang="mn"><meta charset="utf-8"><title>404</title><body style="font-family:sans-serif;padding:2rem"><h1>Хуудас олдсонгүй</h1></body></html>';
  return new NextResponse(body, {
    status: 404,
    headers: { ...Object.fromEntries(headers), "Content-Type": "text/html; charset=utf-8" },
  });
}

function tooManyRequests(headers: Headers): NextResponse {
  return new NextResponse("Хэт олон оролдлого. 1 минутын дараа дахин оролдоно уу.", {
    status: 429,
    headers: { ...Object.fromEntries(headers), "Content-Type": "text/plain; charset=utf-8" },
  });
}

const PREFIX = {
  customer: "/site",
  worker: "/worker",
  staff: "/staff",
} as const;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const startedAt = PERF_LOG ? Date.now() : 0;
  let authMs: number | undefined;
  // One line per request when PERF_LOG=1. Early exits are logged too, so a slow
  // or hanging path is always visible in the server console.
  const finish = (response: NextResponse): NextResponse => {
    perfLog({
      scope: "middleware",
      path: pathname,
      method: req.method,
      ms: Date.now() - startedAt,
      auth_ms: authMs,
      status: response.status,
    });
    return response;
  };

  const host = normalizeHost(req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  const kind = hostKind(host);

  const headers = securityHeaders();
  if (kind === "staff") headers.set("X-Robots-Tag", "noindex, nofollow");

  // Internal rewrite of the same request: apply headers, do not rewrite again.
  if (req.headers.get(INTERNAL_HEADER) === INTERNAL_TOKEN) {
    const res = NextResponse.next();
    headers.forEach((value, key) => res.headers.set(key, value));
    return res;
  }

  if (kind === "unknown") return finish(notFound(headers));

  // The internal folders are never addressable from the outside.
  if (
    pathname === "/site" ||
    pathname.startsWith("/site/") ||
    pathname === "/worker" ||
    pathname.startsWith("/worker/") ||
    pathname === "/staff" ||
    pathname.startsWith("/staff/")
  ) {
    return finish(notFound(headers));
  }

  // Every host serves its own login, recovery and confirm pages, so the email
  // link always lands where the account belongs.
  if (
    kind === "staff" &&
    pathname.startsWith("/auth") &&
    pathname !== "/auth/callback" &&
    pathname !== "/auth/confirm"
  ) {
    return finish(notFound(headers));
  }
  if (kind === "staff" && (pathname === "/__kit" || pathname.startsWith("/__kit/"))) {
    return finish(notFound(headers));
  }
  if (process.env.NODE_ENV === "production" && pathname.startsWith("/__kit")) {
    return finish(notFound(headers));
  }
  if (pathname === "/kit" || pathname.startsWith("/kit/")) return finish(notFound(headers));

  // Host-neutral endpoints and root files. robots.txt and sitemap.xml live at
  // the app root and read the Host header themselves (one policy per host), so
  // they are passed through rather than rewritten under an audience prefix.
  if (
    pathname === "/api/health" ||
    pathname === "/sw.js" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    const res = NextResponse.next();
    headers.forEach((value, key) => res.headers.set(key, value));
    return finish(res);
  }
  if (pathname.startsWith("/api/")) return finish(notFound(headers));

  const ip = clientIp(req);
  if (
    req.method === "POST" &&
    POST_LIMIT_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/")) &&
    rateLimited(`${ip}:post:${pathname}`, POST_LIMIT)
  ) {
    return finish(tooManyRequests(headers));
  }
  if (
    req.method === "GET" &&
    LINK_LIMIT_PATHS.some((path) => pathname === path) &&
    rateLimited(`${ip}:link:${pathname}`, LINK_LIMIT)
  ) {
    return finish(tooManyRequests(headers));
  }

  // Refresh the Supabase session and collect cookies to set on the response.
  // Cookies stay host-only: three hosts, three independent sessions. A stale
  // cookie is cleared and the visitor is treated as logged out.
  const authStartedAt = PERF_LOG ? Date.now() : 0;
  const session = await readSession(req);
  if (PERF_LOG) authMs = Date.now() - authStartedAt;
  let hasUser = Boolean(session.user);
  let signedOutForIdle = false;

  if (session.stale) {
    hasUser = false;
    logStaleCookieOnce();
  }

  if (hasUser && kind === "staff" && !pathname.startsWith("/login")) {
    const seen = Number(req.cookies.get(SEEN_COOKIE)?.value ?? 0);
    if (seen > 0 && Date.now() - seen > STAFF_IDLE_MS) {
      // signOut clears the session cookies through the same `setAll` above.
      if (session.client) await session.client.auth.signOut().catch(() => undefined);
      signedOutForIdle = true;
      hasUser = false;
    }
  }

  const prefix = PREFIX[kind];
  const target = req.nextUrl.clone();
  if (pathname === "/") target.pathname = prefix;
  else if (pathname === "/__kit" || pathname.startsWith("/__kit/")) {
    // Dev-only component gallery, e.g. /__kit -> /site/kit.
    target.pathname = `/site/kit${pathname.slice("/__kit".length)}`;
  } else target.pathname = `${prefix}${pathname}`;

  const rewriteHeaders = new Headers(req.headers);
  rewriteHeaders.set(INTERNAL_HEADER, INTERNAL_TOKEN);
  // The root layout reads this to pick the audience palette server-side, in the
  // first byte of HTML. Staff keeps its own theme; both user hosts share one.
  rewriteHeaders.set("x-zav-audience", kind === "staff" ? "staff" : "public");
  rewriteHeaders.set("x-zav-host-kind", kind);
  rewriteHeaders.set(
    "x-zav-tone",
    pathname.startsWith("/super") || pathname.endsWith("/super") ? "super" : "admin",
  );

  const res = signedOutForIdle
    ? NextResponse.redirect(new URL("/login?timeout=1", req.url))
    : NextResponse.rewrite(target, { request: { headers: rewriteHeaders } });

  if (session.stale) {
    clearSupabaseCookies(res, requestCookieNames(req));
  } else {
    session.pendingCookies.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, { ...options, domain: undefined });
    });
  }

  if (signedOutForIdle) {
    res.cookies.delete(SEEN_COOKIE);
  } else if (hasUser && kind === "staff") {
    res.cookies.set(SEEN_COOKIE, String(Date.now()), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 60,
    });
  }

  headers.forEach((value, key) => res.headers.set(key, value));
  return finish(res);
}

/**
 * Static assets and the icon files skip the middleware entirely. robots.txt and
 * manifest.webmanifest are NOT skipped: they are host-routed dynamic routes.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.(?:ico|png|svg)|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|ttf|otf)$).*)",
  ],
};
