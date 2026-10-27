import { loadEnv, resolveAppBase } from "./env.mjs";

loadEnv();

const BASE = resolveAppBase();
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST || "zav.localhost:3000";
const WORKER_HOST = process.env.NEXT_PUBLIC_WORKER_HOST || "ajil.zav.localhost:3000";
const STAFF_HOST = process.env.NEXT_PUBLIC_STAFF_HOST || "admin.zav.localhost:3000";
const HOSTS = [SITE_HOST, WORKER_HOST, STAFF_HOST];

let failures = 0;

function report(label, passed, detail = "") {
  if (!passed) failures += 1;
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

async function call(path, { host = SITE_HOST, method = "GET", cookie, redirect = "manual", body } = {}) {
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

  // ------------------------------------------------------------ customer host
  const landing = await call("/", { host: SITE_HOST });
  report(
    "customer landing renders",
    landing.status === 200 &&
      landing.text.includes("Ажлаа хэлээрэй.") &&
      landing.text.includes("Ажилтныг бид олно."),
    String(landing.status),
  );
  report(
    "customer landing links to the worker site",
    landing.text.includes("Ажил хайж байна уу? Ажилтны хэсэг"),
  );

  const register = await call("/register", { host: SITE_HOST });
  report(
    "customer registration renders and states its purpose",
    register.status === 200 && register.text.includes("ЗАХИАЛАХ"),
    String(register.status),
  );

  for (const path of ["/login", "/terms", "/privacy", "/help"]) {
    const page = await call(path, { host: SITE_HOST });
    report(`customer ${path} renders`, page.status === 200, String(page.status));
  }

  const manifest = await call("/manifest.webmanifest", { host: SITE_HOST });
  report(
    "customer manifest starts at /c",
    manifest.status === 200 && manifest.text.includes('"start_url":"/c"'),
    String(manifest.status),
  );

  const robotsCustomer = await call("/robots.txt", { host: SITE_HOST });
  report(
    "customer robots disallow /c",
    robotsCustomer.status === 200 && robotsCustomer.text.includes("Disallow: /c"),
    String(robotsCustomer.status),
  );

  // -------------------------------------------------------------- worker host
  const workerLanding = await call("/", { host: WORKER_HOST });
  report(
    "worker landing renders",
    workerLanding.status === 200 &&
      workerLanding.text.includes("Зав гарвал") &&
      workerLanding.text.includes("ажиллаарай."),
    String(workerLanding.status),
  );

  const workerRegister = await call("/register", { host: WORKER_HOST });
  report(
    "worker registration asks for skills",
    workerRegister.status === 200 && workerRegister.text.includes("Юу хийж чадах вэ?"),
    String(workerRegister.status),
  );

  for (const path of ["/login", "/terms", "/privacy", "/help"]) {
    const page = await call(path, { host: WORKER_HOST });
    report(`worker ${path} renders`, page.status === 200, String(page.status));
  }

  const workerManifest = await call("/manifest.webmanifest", { host: WORKER_HOST });
  report(
    "worker manifest starts at /home",
    workerManifest.status === 200 && workerManifest.text.includes('"start_url":"/home"'),
    String(workerManifest.status),
  );

  const manifestStaff = await call("/manifest.webmanifest", { host: STAFF_HOST });
  report("manifest hidden on staff host", manifestStaff.status === 404, String(manifestStaff.status));

  const robotsWorker = await call("/robots.txt", { host: WORKER_HOST });
  report(
    "worker robots disallow the app",
    robotsWorker.status === 200 && robotsWorker.text.includes("Disallow: /"),
    String(robotsWorker.status),
  );

  // --------------------------------------------------------------- staff host
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

  for (const path of ["/today", "/security"]) {
    const page = await call(path, { host: STAFF_HOST });
    report(
      `staff ${path} redirects to login when anonymous`,
      page.status >= 300 && page.status < 400,
      String(page.status),
    );
  }

  const auditExport = await call("/super/audit/export", { host: STAFF_HOST });
  report("audit CSV export 404 when anonymous", auditExport.status === 404, String(auditExport.status));

  // -------------------------------------------------------- cross-host 404s
  // Only paths that exist on the target host can be checked anonymously:
  // a real route on the right host answers 307 (login), not 404.
  const staffPaths = ["/today", "/jobs", "/workers", "/super", "/security"];
  const customerPaths = ["/c", "/c/new", "/c/me"];
  const workerPaths = ["/home", "/offers", "/me"];

  let crossOk = true;
  const expect404 = async (path, host, label) => {
    const result = await call(path, { host });
    if (result.status !== 404) {
      crossOk = false;
      report(`cross-host 404: ${label} ${path}`, false, String(result.status));
    }
  };

  for (const path of staffPaths) {
    await expect404(path, SITE_HOST, "customer host");
    await expect404(path, WORKER_HOST, "worker host");
  }
  for (const path of customerPaths) {
    await expect404(path, WORKER_HOST, "worker host");
    await expect404(path, STAFF_HOST, "staff host");
  }
  for (const path of workerPaths) {
    await expect404(path, SITE_HOST, "customer host");
    await expect404(path, STAFF_HOST, "staff host");
  }
  // /calendar exists on the worker and staff hosts, so only the customer host
  // must reject it.
  await expect404("/calendar", SITE_HOST, "customer host");
  report("every cross-host path 404s", crossOk);

  let internalOk = true;
  for (const host of HOSTS) {
    for (const path of ["/site", "/worker", "/staff", "/site/login", "/worker/login", "/staff/login"]) {
      const result = await call(path, { host });
      if (result.status !== 404) {
        internalOk = false;
        report(`internal path blocked ${path} on ${host}`, false, String(result.status));
      }
    }
  }
  report("internal host prefixes are blocked on every host", internalOk);

  const unknownHost = await call("/", { host: "evil.example" });
  report("unknown host 404s", unknownHost.status === 404, String(unknownHost.status));

  // -------------------------------------------------------------- email links
  let authOk = true;
  for (const host of HOSTS) {
    const reset = await call("/reset-password", { host });
    if (reset.status < 300 || reset.status >= 400) {
      authOk = false;
      report(`anonymous /reset-password refused on ${host}`, false, String(reset.status));
    }
    const confirm = await call("/auth/confirm", { host });
    if (confirm.status < 300 || confirm.status >= 400) {
      authOk = false;
      report(`tokenless /auth/confirm redirects on ${host}`, false, String(confirm.status));
    }
    const forgot = await call("/forgot-password", { host });
    if (forgot.status !== 200) {
      authOk = false;
      report(`/forgot-password renders on ${host}`, false, String(forgot.status));
    }
  }
  report("every host serves recovery pages and turns bad links into redirects", authOk);

  // ------------------------------------------------------------- dev-only kit
  const kit = await call("/__kit", { host: SITE_HOST });
  report(
    production ? "kit page hidden in production" : "kit page available in development",
    production ? kit.status === 404 : kit.status === 200,
    String(kit.status),
  );

  console.log(`\n${failures === 0 ? "SMOKE PASSED" : `${failures} SMOKE CHECK(S) FAILED`}`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`smoke crashed: ${error.message}`);
  process.exitCode = 1;
});
