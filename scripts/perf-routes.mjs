/**
 * Anonymous GET latency for the public routes of all three hosts.
 *
 * Sends `SAMPLES` measured requests per route plus one warm-up, with the Host
 * and X-Forwarded-Host headers of the configured audience, and prints median /
 * p95 time-to-first-byte and total time. Budget: median < 400 ms and
 * p95 < 1000 ms (checked on both TTFB and total). Exit code 1 when a route is
 * over budget or fails.
 *
 * Usage: npm run perf   (expects the production server on 127.0.0.1:3000)
 */
import http from "node:http";
import { loadEnv } from "./env.mjs";

loadEnv();

const BASE = { hostname: "127.0.0.1", port: 3000 };
const SAMPLES = 6;
const MEDIAN_BUDGET = 400;
const P95_BUDGET = 1000;
const TIMEOUT_MS = 15_000;

const HOSTS = {
  customer: (process.env.NEXT_PUBLIC_SITE_HOST || "").trim(),
  worker: (process.env.NEXT_PUBLIC_WORKER_HOST || "").trim(),
  staff: (process.env.NEXT_PUBLIC_STAFF_HOST || "").trim(),
};

const ROUTES = [
  ["customer", "/"],
  ["customer", "/login"],
  ["customer", "/register"],
  ["customer", "/forgot-password"],
  ["customer", "/terms"],
  ["worker", "/"],
  ["worker", "/login"],
  ["worker", "/register"],
  ["worker", "/forgot-password"],
  ["staff", "/login"],
];

function hostFor(audience) {
  const host = HOSTS[audience];
  if (!host) {
    const key = {
      customer: "NEXT_PUBLIC_SITE_HOST",
      worker: "NEXT_PUBLIC_WORKER_HOST",
      staff: "NEXT_PUBLIC_STAFF_HOST",
    }[audience];
    console.error(`${key} is not set. Add it to .env.local (see .env.example).`);
    process.exit(1);
  }
  return host;
}

/** One GET; resolves to { ttfb, total, status } and never rejects. */
function get(path, host) {
  return new Promise((resolve) => {
    const started = performance.now();
    let ttfb = Number.NaN;
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const req = http.request(
      {
        ...BASE,
        path,
        method: "GET",
        headers: {
          Host: host,
          "X-Forwarded-Host": host,
          "X-Forwarded-Proto": "http",
          Accept: "text/html",
          "Accept-Encoding": "identity",
          "User-Agent": "zav-perf/1.0",
        },
      },
      (res) => {
        ttfb = performance.now() - started;
        res.on("data", () => {});
        res.on("end", () =>
          finish({ ttfb, total: performance.now() - started, status: res.statusCode }),
        );
        res.on("error", (error) =>
          finish({ ttfb, total: performance.now() - started, status: res.statusCode, error }),
        );
        res.resume();
      },
    );

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error("timeout"));
    });
    req.on("error", (error) => {
      const total = performance.now() - started;
      finish({ ttfb: Number.isNaN(ttfb) ? Number.NaN : ttfb, total, status: 0, error });
    });
    req.end();
  });
}

/** Nearest-rank-free percentile (linear interpolation, R-7). */
function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return Number.NaN;
  const index = (sorted.length - 1) * p;
  const low = Math.floor(index);
  const high = Math.ceil(index);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (index - low);
}

const median = (values) => percentile(values, 0.5);
const ms = (value) => (Number.isFinite(value) ? Math.round(value) : "—");

function verdict(medTtfb, p95Ttfb, medTotal, p95Total, statuses) {
  if (statuses.some((status) => status !== 200)) return "FAIL (status)";
  if (medTotal > MEDIAN_BUDGET) return `FAIL (total median ${Math.round(medTotal)} ms)`;
  if (p95Total > P95_BUDGET) return `FAIL (total p95 ${Math.round(p95Total)} ms)`;
  if (medTtfb > MEDIAN_BUDGET) return `FAIL (ttfb median ${Math.round(medTtfb)} ms)`;
  if (p95Ttfb > P95_BUDGET) return `FAIL (ttfb p95 ${Math.round(p95Ttfb)} ms)`;
  return "ok";
}

async function main() {
  console.log(
    `perf: ${SAMPLES} samples per route after 1 warm-up, ` +
      `budget median < ${MEDIAN_BUDGET} ms and p95 < ${P95_BUDGET} ms`,
  );

  const rows = [];
  for (const [audience, path] of ROUTES) {
    const host = hostFor(audience);
    await get(path, host); // warm-up, discarded
    const samples = [];
    for (let i = 0; i < SAMPLES; i += 1) samples.push(await get(path, host));

    const ok = samples.filter((sample) => !sample.error);
    const ttfb = ok.map((sample) => sample.ttfb).filter(Number.isFinite);
    const total = ok.map((sample) => sample.total);
    const statuses = [...new Set(samples.map((sample) => sample.status))];

    rows.push({
      route: path,
      audience,
      host,
      status: statuses.join("/"),
      ttfb: ms(median(ttfb)),
      ttfbP95: ms(percentile(ttfb, 0.95)),
      total: ms(median(total)),
      totalP95: ms(percentile(total, 0.95)),
      verdict: verdict(
        median(ttfb),
        percentile(ttfb, 0.95),
        median(total),
        percentile(total, 0.95),
        statuses,
      ),
      errors: samples.filter((sample) => sample.error).map((sample) => sample.error.message),
    });
  }

  const headers = ["route", "host", "status", "ttfb med", "ttfb p95", "total med", "total p95", ""];
  const cells = rows.map((row) => [
    row.route,
    row.host,
    row.status,
    row.ttfb,
    row.ttfbP95,
    row.total,
    row.totalP95,
    row.verdict,
  ]);
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...cells.map((row) => String(row[column]).length)),
  );
  const line = (row) =>
    row.map((cell, column) => String(cell).padEnd(widths[column])).join("  ");

  console.log("");
  console.log(line(headers).trimEnd());
  console.log(widths.map((width) => "-".repeat(width)).join("  "));
  for (const row of cells) console.log(line(row).trimEnd());

  const failed = rows.filter((row) => row.verdict !== "ok");
  console.log("");
  for (const row of rows) {
    if (row.errors.length) console.error(`${row.route}: ${[...new Set(row.errors)].join(", ")}`);
  }
  if (failed.length === 0) {
    console.log(`PASS — ${rows.length} routes within budget.`);
    return;
  }
  console.log(`FAIL — ${failed.length}/${rows.length} routes over budget or failing.`);
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
