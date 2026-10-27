/**
 * Auth-route contract: the three hosts each serve their own login, recovery and
 * email-link endpoints, and no email link may ever answer 500.
 *
 * Static part (always): the route files and the middleware limits exist.
 * HTTP part (only when the app answers on APP_URL): pages render, anonymous
 * /reset-password is refused, and a bad/expired link redirects with an error
 * flag instead of throwing.
 *
 *   npm run check:auth
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadEnv, resolveAppBase } from "./env.mjs";

loadEnv();

const BASE = resolveAppBase();
const HOSTS = {
  customer: process.env.NEXT_PUBLIC_SITE_HOST || "zav.localhost:3000",
  worker: process.env.NEXT_PUBLIC_WORKER_HOST || "ajil.zav.localhost:3000",
  staff: process.env.NEXT_PUBLIC_STAFF_HOST || "admin.zav.localhost:3000",
};
const ROOTS = { customer: "src/app/site", worker: "src/app/worker", staff: "src/app/staff" };

let failures = 0;

function check(label, passed, detail = "") {
  if (!passed) failures += 1;
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

function fileExists(relative) {
  return existsSync(path.join(process.cwd(), relative));
}

async function call(host, requestPath) {
  const response = await fetch(`${BASE}${requestPath}`, {
    redirect: "manual",
    headers: { Host: host, "X-Forwarded-Host": host },
  });
  return { status: response.status, location: response.headers.get("location") ?? "" };
}

function locationPath(location) {
  if (!location) return "";
  try {
    return new URL(location).pathname + new URL(location).search;
  } catch {
    return location;
  }
}

function staticChecks() {
  for (const [kind, root] of Object.entries(ROOTS)) {
    for (const route of ["login", "forgot-password", "reset-password"]) {
      check(`${kind}: /${route} page exists`, fileExists(`${root}/${route}/page.tsx`));
    }
    for (const route of ["confirm", "callback"]) {
      check(`${kind}: /auth/${route} route exists`, fileExists(`${root}/auth/${route}/route.ts`));
    }
  }

  const middleware = path.join(process.cwd(), "src/middleware.ts");
  const source = existsSync(middleware) ? readFileSync(middleware, "utf8") : "";
  check("middleware rate-limits POST /login, /register, /forgot-password", /POST_LIMIT_PATHS/.test(source));
  check("middleware rate-limits GET /auth/confirm and /auth/callback", /LINK_LIMIT_PATHS/.test(source));
  check(
    "middleware keeps /auth/confirm addressable on the staff host",
    /pathname !== "\/auth\/confirm"/.test(source),
  );

  const confirm = path.join(process.cwd(), "src/lib/auth-confirm.ts");
  const confirmSource = existsSync(confirm) ? readFileSync(confirm, "utf8") : "";
  check("confirm handler allow-lists the token types", /ALLOWED_TYPES/.test(confirmSource));
  check(
    "confirm handler never sends the visitor to a URL from the query",
    !/searchParams\.get\("(next|redirect)/.test(confirmSource),
  );
}

async function reachable() {
  try {
    const response = await fetch(`${BASE}/api/health`, {
      headers: { Host: HOSTS.customer, "X-Forwarded-Host": HOSTS.customer },
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function httpChecks() {
  for (const [kind, host] of Object.entries(HOSTS)) {
    for (const page of ["/login", "/forgot-password"]) {
      const result = await call(host, page);
      check(`${kind}: ${page} renders`, result.status === 200, String(result.status));
    }

    const reset = await call(host, "/reset-password");
    check(
      `${kind}: anonymous /reset-password is refused`,
      reset.status === 307 || reset.status === 308,
      `${reset.status} ${locationPath(reset.location)}`,
    );
    check(
      `${kind}: refusal points at the recovery form`,
      locationPath(reset.location) === "/forgot-password?error=link",
      `${reset.status} ${locationPath(reset.location)}`,
    );

    const noToken = await call(host, "/auth/confirm");
    check(
      `${kind}: /auth/confirm without a token redirects, not 500`,
      noToken.status >= 300 && noToken.status < 400,
      `${noToken.status} ${locationPath(noToken.location)}`,
    );
    check(
      `${kind}: missing link token lands on the login page`,
      locationPath(noToken.location) === "/login?error=link",
      locationPath(noToken.location),
    );

    const badRecovery = await call(host, "/auth/confirm?type=recovery&token_hash=not-a-real-token");
    check(
      `${kind}: an expired recovery link returns to /forgot-password`,
      badRecovery.status >= 300 &&
        badRecovery.status < 400 &&
        locationPath(badRecovery.location) === "/forgot-password?error=link",
      `${badRecovery.status} ${locationPath(badRecovery.location)}`,
    );

    const badCallback = await call(host, "/auth/callback?code=not-a-real-code");
    check(
      `${kind}: /auth/callback with a bad code redirects, not 500`,
      badCallback.status >= 300 && badCallback.status < 400,
      `${badCallback.status} ${locationPath(badCallback.location)}`,
    );

    const internal = await call(host, `${kind === "customer" ? "/site" : kind === "worker" ? "/worker" : "/staff"}/login`);
    check(`${kind}: internal folder path 404s`, internal.status === 404, String(internal.status));
  }
}

staticChecks();

if (await reachable()) {
  console.log(`\nHTTP checks against ${BASE}\n`);
  await httpChecks();
} else {
  console.log(`\nApp not reachable on ${BASE} — HTTP checks skipped. Start it and rerun.`);
}

console.log(`\n${failures === 0 ? "AUTH ROUTES OK" : `${failures} AUTH ROUTE CHECK(S) FAILED`}`);
if (failures > 0) process.exitCode = 1;
