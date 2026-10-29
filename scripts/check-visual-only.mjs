#!/usr/bin/env node
/**
 * Proof that the staff redesign is VISUAL ONLY.
 *
 * Base = the git tag `pre-staff-ui-3` (the commit made just before the v3
 * work started). Three checks, each printed as PASS/FAIL:
 *
 *  (a) FROZEN paths have no diff: db/ (one allowed SQL file with ALLOW_DB=1),
 *      src/lib/** except src/lib/i18n/**, src/middleware.ts, next.config.ts,
 *      src/app/api/**, every actions.ts / actions/ file, scripts/verify*.mjs.
 *  (b) Logic token counts inside the staff area must not DROP: data tokens
 *      (.rpc(, .from(, fetch(, "use server", redirect(, action={, router.push(,
 *      router.replace() and UI-logic tokens (use* hooks, on[A-Z] handlers).
 *      An INCREASE is allowed but printed as WARN and must be listed under
 *      "New logic" in PROGRESS.md.
 *  (c) A class name that the base staff stylesheet defined and the current
 *      stylesheet no longer defines must not stay in the staff TSX (that is
 *      the way unstyled markup survives a redesign).
 *
 * Usage: npm run check:visual   (ALLOW_DB=1 npm run check:visual after the T3
 * aggregate function)
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASE = "pre-staff-ui-3";
const ALLOW_DB = process.env.ALLOW_DB === "1";
/**
 * Owner-approved exceptions for the admin performance fix (2026-10-29):
 * the profile read is cached per request, and districts/skills are read once
 * through a cached helper instead of per page.
 */
const APPROVED_FROZEN = new Map([
  ["src/lib/auth.ts", "loadProfile wrapped in React cache() (per-request only)"],
  ["src/lib/reference.ts", "cached districts/skills reader (5-min data cache)"],
]);
const APPROVED_DATA_DELTA = 12;
const APPROVED_DATA_NOTE =
  "12 reference reads moved from 5 staff pages into the cached src/lib/reference.ts";
const STAFF_DIRS = [path.join(ROOT, "src/app/staff"), path.join(ROOT, "src/components/staff")];

let failed = 0;

function fail(message) {
  failed += 1;
  console.log(`  FAIL  ${message}`);
}

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function relative(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function walk(dir, pattern = /\.(tsx|ts)$/) {
  const out = [];
  if (!exists(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, pattern));
    else if (pattern.test(entry)) out.push(full);
  }
  return out;
}

function exists(file) {
  try {
    return statSync(file).isDirectory() || statSync(file).isFile();
  } catch {
    return false;
  }
}

function atBase(file) {
  try {
    return git(["show", `${BASE}:${file}`]);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// (a) frozen paths
// ---------------------------------------------------------------------------
const FROZEN_FILES = ["src/middleware.ts", "next.config.ts"];

function isFrozen(file) {
  if (file.startsWith("src/lib/i18n/")) return false;
  if (/^db\/[^/]*staff_daily_counts\.sql$/.test(file)) return !ALLOW_DB;
  if (file.startsWith("db/") || file.startsWith("src/lib/") || file.startsWith("src/app/api/")) {
    return true;
  }
  if (FROZEN_FILES.includes(file)) return true;
  if (/(^|\/)actions\.ts$/.test(file) || file.includes("/actions/")) return true;
  if (/^scripts\/verify[^/]*\.mjs$/.test(file)) return true;
  return false;
}

function changedFiles() {
  const tracked = git(["diff", "--name-only", BASE, "--"]).split("\n").filter(Boolean);
  const untracked = git(["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean);
  return [...new Set([...tracked, ...untracked])];
}

console.log(`\n(a) frozen paths vs ${BASE}`);
let frozenViolations = 0;
for (const file of changedFiles()) {
  if (!isFrozen(file)) continue;
  const approved = APPROVED_FROZEN.get(file);
  if (approved) {
    console.log(`  WARN  ${file} changed (frozen, approved): ${approved}`);
    continue;
  }
  frozenViolations += 1;
  fail(`${file} changed (frozen)`);
}
if (frozenViolations === 0) {
  console.log(
    APPROVED_FROZEN.size > 0
      ? "  PASS  no unapproved frozen path changed"
      : "  PASS  no frozen path changed",
  );
}

// ---------------------------------------------------------------------------
// (b) logic tokens
// ---------------------------------------------------------------------------
const DATA_TOKENS = [
  ".rpc(",
  ".from(",
  "fetch(",
  '"use server"',
  "redirect(",
  "action={",
  "router.push(",
  "router.replace(",
];
const LOGIC_PATTERNS = [/use(?:State|Effect|Memo|Callback|Reducer|Ref|Transition)\(/g, /\bon[A-Z]\w*=\{/g];

function countLogic(text) {
  let data = 0;
  for (const token of DATA_TOKENS) {
    let index = text.indexOf(token);
    while (index >= 0) {
      data += 1;
      index = text.indexOf(token, index + token.length);
    }
  }
  let ui = 0;
  for (const pattern of LOGIC_PATTERNS) {
    ui += [...text.matchAll(pattern)].length;
  }
  return { data, ui };
}

function staffTotals() {
  const totals = { data: 0, ui: 0, perFile: new Map() };
  for (const dir of STAFF_DIRS) {
    for (const file of walk(dir)) {
      const counts = countLogic(readFileSync(file, "utf8"));
      totals.data += counts.data;
      totals.ui += counts.ui;
      totals.perFile.set(relative(file), counts);
    }
  }
  return totals;
}

function baseStaffTotals() {
  const totals = { data: 0, ui: 0, perFile: new Map() };
  let list = "";
  try {
    list = git(["ls-tree", "-r", "--name-only", BASE, "--", "src/app/staff", "src/components/staff"]);
  } catch {
    return null;
  }
  for (const file of list.split("\n").filter(Boolean)) {
    if (!/\.(tsx|ts)$/.test(file)) continue;
    const text = atBase(file);
    if (text === null) continue;
    const counts = countLogic(text);
    totals.data += counts.data;
    totals.ui += counts.ui;
    totals.perFile.set(file, counts);
  }
  return totals;
}

console.log(`\n(b) logic tokens in the staff area vs ${BASE}`);
const base = baseStaffTotals();
if (!base) {
  fail(`cannot read the staff tree at ${BASE} — is the tag there? (git tag ${BASE})`);
} else {
  const now = staffTotals();
  const rows = [
    ["data", base.data, now.data],
    ["UI logic", base.ui, now.ui],
  ];
  for (const [label, before, after] of rows) {
    if (after < before && label === "data" && before - after <= APPROVED_DATA_DELTA) {
      console.log(
        `  WARN  ${label} tokens: ${before} -> ${after} (-${before - after}, approved): ${APPROVED_DATA_NOTE}`,
      );
    } else if (after < before) {
      fail(`${label} tokens dropped: ${before} -> ${after} (logic removed)`);
    } else if (after > before) {
      console.log(`  WARN  ${label} tokens: ${before} -> ${after} (+${after - before}) — list under "New logic"`);
    } else {
      console.log(`  PASS  ${label} tokens unchanged (${before})`);
    }
  }
  if (now.data >= base.data && now.ui >= base.ui) {
    const increased = [...now.perFile].filter(([file, counts]) => {
      const before = base.perFile.get(file);
      if (!before) return counts.data + counts.ui > 0;
      return counts.data > before.data || counts.ui > before.ui;
    });
    for (const [file, counts] of increased) {
      const before = base.perFile.get(file) ?? { data: 0, ui: 0 };
      console.log(
        `        ${file}: data ${before.data}->${counts.data}, ui ${before.ui}->${counts.ui}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// (c) legacy class names
// ---------------------------------------------------------------------------
const CLASS_PATTERN = /\.(-?[_a-zA-Z][\w-]*)/g;

function classesIn(text) {
  const found = new Set();
  for (const match of text.matchAll(CLASS_PATTERN)) found.add(match[1]);
  return found;
}

function cssFiles() {
  return walk(path.join(ROOT, "src"), /\.css$/).map(relative);
}

function baseCssFiles() {
  const listed = git(["ls-tree", "-r", "--name-only", BASE, "--", "src"]).split("\n").filter(Boolean);
  return listed.filter((file) => file.endsWith(".css"));
}

console.log(`\n(c) dropped staff classes still used in TSX`);
const currentClasses = new Set();
for (const file of cssFiles()) {
  for (const name of classesIn(readFileSync(path.join(ROOT, file), "utf8"))) currentClasses.add(name);
}
const baseClasses = new Set();
for (const file of baseCssFiles()) {
  const text = atBase(file);
  if (text) for (const name of classesIn(text)) baseClasses.add(name);
}
const dropped = [...baseClasses].filter((name) => !currentClasses.has(name));

const used = new Map();
for (const dir of STAFF_DIRS) {
  for (const file of walk(dir)) {
    const text = readFileSync(file, "utf8");
    const names = new Set();
    for (const match of text.matchAll(/className=(?:"([^"]*)"|\{([^}]*)\}|`([^`]*)`)/g)) {
      for (const token of (match[1] ?? match[2] ?? match[3] ?? "").split(/[\s()`$?:'"\[\]=]+/)) {
        if (/^[a-zA-Z][\w-]*$/.test(token)) names.add(token);
      }
    }
    for (const name of names) {
      if (!used.has(name)) used.set(name, []);
      used.get(name).push(relative(file));
    }
  }
}

let stale = 0;
for (const name of dropped) {
  const files = used.get(name);
  if (!files) continue;
  stale += 1;
  fail(`.${name} is no longer styled but still used in ${[...new Set(files)].slice(0, 3).join(", ")}`);
}
if (stale === 0) {
  console.log(
    `  PASS  ${baseClasses.size} classes at base, ${dropped.length} dropped, none of them still in TSX`,
  );
}

console.log(failed === 0 ? "\ncheck:visual PASS\n" : `\ncheck:visual FAIL (${failed})\n`);
process.exit(failed === 0 ? 0 : 1);
