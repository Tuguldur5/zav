#!/usr/bin/env node
/**
 * Static route-ownership check for the staff areas.
 *
 * - a file under the super area must never link to an admin-only route
 * - a file under the admin area must never link to a /super route
 * - shared files may link to both, because the shared layout picks the shell
 *   by the signed-in role
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ADMIN_ONLY = ["/today", "/jobs", "/workers", "/calendar"];
const AREAS = [
  path.join(ROOT, "src/app/staff/(super)"),
  path.join(ROOT, "src/app/staff/(admin)"),
  path.join(ROOT, "src/components/staff"),
];

const HREF = /(?:href|link|redirect|router\.push)\s*[=:]\s*["'`]([^"'`$]+)["'`]/g;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|ts|mjs)$/.test(entry)) out.push(full);
  }
  return out;
}

function linksIn(text) {
  const found = [];
  for (const match of text.matchAll(HREF)) found.push(match[1]);
  return found;
}

function isAdminOnly(target) {
  const clean = target.split("?")[0].split("#")[0];
  return ADMIN_ONLY.some((route) => clean === route || clean.startsWith(`${route}/`));
}

let failures = 0;
const rows = [];

for (const area of AREAS) {
  for (const file of walk(area)) {
    const relative = path.relative(ROOT, file).replace(/\\/g, "/");
    const superSide = relative.includes("/staff/(super)");
    const adminSide = relative.includes("/staff/(admin)");
    if (!superSide && !adminSide) continue;

    for (const target of linksIn(readFileSync(file, "utf8"))) {
      if (!target.startsWith("/")) continue;
      if (target.startsWith("/api/") || target.startsWith("/auth")) continue;
      if (superSide && isAdminOnly(target)) {
        rows.push({ file: relative, target, role: "super", verdict: "FAIL" });
        failures += 1;
      }
      if (adminSide && (target === "/super" || target.startsWith("/super/"))) {
        rows.push({ file: relative, target, role: "admin", verdict: "FAIL" });
        failures += 1;
      }
    }
  }
}

if (rows.length > 0) {
  console.error("Wrong staff links:");
  for (const row of rows) console.error(`  ${row.verdict} ${row.role}: ${row.file} -> ${row.target}`);
} else {
  console.log("Staff links OK: super files stay in /super, admin files never link to /super.");
}

if (failures > 0) process.exit(1);
