import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hostKind, normalizeHost } from "@/lib/hosts";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabaseConfig } from "@/lib/supabase/config";

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/join"];
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const STAFF_IDLE_MS = 30 * 60 * 1000;
const SEEN_COOKIE = "zav_staff_seen";
/**
 * Next may re-enter middleware for an internal rewrite. This unguessable
 * per-process token lets those requests through while keeping /site and
 * /staff 404 for real clients.
 */
const INTERNAL_HEADER = "x-zav-internal";
/**
 * Kept on globalThis: dev rebuilds the middleware module between requests, and
 * a per-module token made the rewritten request look external and 404.
 */
const globalStore = globalThis as unknown as { __zavInternalToken?: string };
const INTERNAL_TOKEN = (globalStore.__zavInternalToken ??= crypto.randomUUID());

/**
 * In-memory limiter. It is intentionally per-process: run exactly ONE app
 * instance (no PM2 cluster). Redis replaces this in production scale-out.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = normalizeHost(req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  const kind = hostKind(host);

  const headers = securityHeaders();
  headers.set(
    "X-Zav-In",
    `${req.headers.get("x-zav-path") ?? "-"}|${req.headers.get("x-zav-internal") ?? "-"}`,
  );
  if (kind === "staff") headers.set("X-Robots-Tag", "noindex, nofollow");

  if (
    req.headers.get(INTERNAL_HEADER) === INTERNAL_TOKEN ||
    req.headers.get("x-zav-path")
  ) {
    const res = NextResponse.next();
    headers.forEach((value, key) => res.headers.set(key, value));
    res.headers.set("x-zav-debug", `pass|${pathname}|${req.headers.get("x-zav-path") ?? "-"}`);
    return res;
  }

  if (kind === "unknown") return notFound(headers);
  if (pathname.startsWith("/site") || pathname.startsWith("/staff")) {
    return notFound(headers);
  }
  if (kind === "staff" && pathname.startsWith("/auth")) return notFound(headers);
  if (kind === "staff" && (pathname === "/__kit" || pathname.startsWith("/__kit/"))) {
    return notFound(headers);
  }
  if (process.env.NODE_ENV === "production" && pathname.startsWith("/__kit")) {
    return notFound(headers);
  }
  if (pathname === "/kit" || pathname.startsWith("/kit/")) return notFound(headers);

  // API routes are host-neutral; only the health probe exists.
  if (pathname === "/api/health") {
    const res = NextResponse.next();
    headers.forEach((value, key) => res.headers.set(key, value));
    return res;
  }
  if (pathname.startsWith("/api/")) return notFound(headers);

  if (pathname === "/robots.txt") {
    const res = NextResponse.next();
    headers.forEach((value, key) => res.headers.set(key, value));
    return res;
  }

  if (kind === "site" && (pathname === "/manifest.webmanifest" || pathname === "/icon.svg")) {
    const res = NextResponse.next();
    headers.forEach((value, key) => res.headers.set(key, value));
    return res;
  }

  if (
    req.method === "POST" &&
    AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"))
  ) {
    if (rateLimited(`${clientIp(req)}:${pathname}`)) {
      return new NextResponse("Хэт олон оролдлого. 1 минутын дараа дахин оролдоно уу.", {
        status: 429,
        headers: { ...Object.fromEntries(headers), "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  }

  // Refresh the Supabase session and collect cookies to set on the response.
  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
  let hasUser = false;
  let signedOutForIdle = false;

  if (hasSupabaseConfig()) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options: options ?? {} });
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasUser = Boolean(user);

    if (hasUser && kind === "staff" && !pathname.startsWith("/login")) {
      const seen = Number(req.cookies.get(SEEN_COOKIE)?.value ?? 0);
      if (seen > 0 && Date.now() - seen > STAFF_IDLE_MS) {
        await supabase.auth.signOut();
        signedOutForIdle = true;
      }
    }
  }

  const prefix = kind === "staff" ? "/staff" : "/site";
  const target = req.nextUrl.clone();
  if (pathname === "/") target.pathname = prefix;
  else if (pathname === "/__kit" || pathname.startsWith("/__kit/")) {
    // Dev-only component gallery, e.g. /__kit/shell/admin -> /site/kit/shell/admin.
    target.pathname = `/site/kit${pathname.slice("/__kit".length)}`;
  } else target.pathname = `${prefix}${pathname}`;

  const rewriteHeaders = new Headers(req.headers);
  rewriteHeaders.set(INTERNAL_HEADER, INTERNAL_TOKEN);
  // The root layout reads these to put data-audience/data-tone on <html>
  // server-side: the staff frame colour is chosen in the first byte of HTML.
  // The dev-only shell previews of the staff area paint the frame too, so the
  // verification script can measure them on the user host.
  const kitStaff = pathname === "/__kit/shell/admin" || pathname === "/__kit/shell/super";
  rewriteHeaders.set("x-zav-audience", kind === "staff" || kitStaff ? "staff" : "public");
  rewriteHeaders.set(
    "x-zav-tone",
    pathname.startsWith("/super") || pathname.endsWith("/super") ? "super" : "admin",
  );
  rewriteHeaders.set("x-zav-path", pathname);

  const res = signedOutForIdle
    ? NextResponse.redirect(new URL("/login?timeout=1", req.url))
    : NextResponse.rewrite(target, { request: { headers: rewriteHeaders } });

  pendingCookies.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, { ...options, domain: undefined });
  });

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
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
