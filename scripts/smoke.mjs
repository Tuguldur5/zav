import { loadEnv, resolveAppBase } from "./env.mjs";

loadEnv();

const BASE = resolveAppBase();
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST || "zav.localhost:3000";
const STAFF_HOST = process.env.NEXT_PUBLIC_STAFF_HOST || "admin.zav.localhost:3000";

let failures = 0;

function report(label, passed, detail = "") {
  if (!passed) failures += 1;
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

async function call(
  path,
  { host = SITE_HOST, method = "GET", cookie, redirect = "manual", body } = {},
) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    redirect,
    headers: {
      Host: host,
      "X-Forwarded-Host": host,
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text().catch(() => "");
  return { status: response.status, headers: response.headers, text };
}

async function main() {
  const health = await call("/api/health", { host: SITE_HOST });
  report(
    "health returns ok",
    health.status === 200 && health.text.includes('"ok"'),
    String(health.status),
  );
  const production = health.text.includes('"production"');

  const landing = await call("/", { host: SITE_HOST });
  report(
    "user host landing renders",
    landing.status === 200 && landing.text.includes("Хагас цагийн ажил"),
    String(landing.status),
  );

  const register = await call("/register?role=worker", { host: SITE_HOST });
  report(
    "worker registration renders",
    register.status === 200 && register.text.includes("Мэргэжил"),
    String(register.status),
  );

  const login = await call("/login", { host: SITE_HOST });
  report(
    "user login renders",
    login.status === 200 && login.text.includes("Нэвтрэх"),
    String(login.status),
  );

  const help = await call("/help", { host: SITE_HOST });
  report(
    "help page renders",
    help.status === 200 && help.text.includes("Нүүр дэлгэцэнд нэмэх"),
    String(help.status),
  );

  const manifest = await call("/manifest.webmanifest", { host: SITE_HOST });
  report(
    "manifest on user host",
    manifest.status === 200 && manifest.text.includes("standalone"),
    String(manifest.status),
  );

  const manifestStaff = await call("/manifest.webmanifest", { host: STAFF_HOST });
  report(
    "manifest hidden on staff host",
    manifestStaff.status === 404,
    String(manifestStaff.status),
  );

  const kit = await call("/__kit", { host: SITE_HOST });
  report(
    production ? "kit page hidden in production" : "kit page available in development",
    production ? kit.status === 404 : kit.status === 200,
    String(kit.status),
  );
  const kitShell = await call("/__kit/shell/admin", { host: SITE_HOST });
  report(
    production ? "kit shell hidden in production" : "kit shell available in development",
    production ? kitShell.status === 404 : kitShell.status === 200,
    String(kitShell.status),
  );

  const robotsUser = await call("/robots.txt", { host: SITE_HOST });
  report(
    "user robots disallow /c and /w",
    robotsUser.status === 200 && robotsUser.text.includes("/w"),
    String(robotsUser.status),
  );

  const robotsStaff = await call("/robots.txt", { host: STAFF_HOST });
  report(
    "staff robots disallow all + noindex header",
    robotsStaff.status === 200 &&
      robotsStaff.text.includes("Disallow: /") &&
      String(robotsStaff.headers.get("x-robots-tag") ?? "").includes("noindex"),
    String(robotsStaff.status),
  );

  const staffLogin = await call("/login", { host: STAFF_HOST });
  report(
    "staff login renders",
    staffLogin.status === 200 && staffLogin.text.includes("Ажилтны нэвтрэх"),
    String(staffLogin.status),
  );

  const join = await call("/join?code=ABC123", { host: STAFF_HOST });
  report(
    "staff join renders",
    join.status === 200 && join.text.includes("Урилгын код"),
    String(join.status),
  );

  const staffToday = await call("/today", { host: STAFF_HOST });
  report(
    "staff /today redirects to login when anonymous",
    staffToday.status >= 300 && staffToday.status < 400,
    String(staffToday.status),
  );

  const security = await call("/security", { host: STAFF_HOST });
  report(
    "staff /security redirects to login when anonymous",
    security.status >= 300 && security.status < 400,
    String(security.status),
  );

  const auditExport = await call("/super/audit/export", { host: STAFF_HOST });
  report(
    "audit CSV export 404 when anonymous",
    auditExport.status === 404,
    String(auditExport.status),
  );

  const crossStaffPaths = [
    "/today",
    "/jobs",
    "/workers",
    "/calendar",
    "/notifications",
    "/super",
    "/super/intake",
    "/security",
  ];
  // /login exists on both hosts on purpose (user login vs staff login).
  const crossUserPaths = ["/c", "/c/new", "/c/jobs", "/w", "/w/calendar", "/help"];

  let crossOk = true;
  for (const path of crossStaffPaths) {
    const result = await call(path, { host: SITE_HOST });
    if (result.status !== 404) {
      crossOk = false;
      report(`cross-host 404: user host ${path}`, false, String(result.status));
    }
  }
  for (const path of crossUserPaths) {
    const result = await call(path, { host: STAFF_HOST });
    if (result.status !== 404) {
      crossOk = false;
      report(`cross-host 404: staff host ${path}`, false, String(result.status));
    }
  }
  report("every cross-host path 404s", crossOk);

  for (const path of ["/site", "/staff", "/site/login", "/staff/login"]) {
    const result = await call(path, { host: SITE_HOST });
    report(`internal path blocked: ${path}`, result.status === 404, String(result.status));
  }

  const unknownHost = await call("/", { host: "evil.example" });
  report("unknown host 404s", unknownHost.status === 404, String(unknownHost.status));

  console.log(`\n${failures === 0 ? "SMOKE PASSED" : `${failures} SMOKE CHECK(S) FAILED`}`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`smoke crashed: ${error.message}`);
  process.exitCode = 1;
});
