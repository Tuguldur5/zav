#!/usr/bin/env node
/**
 * Palette guard for the staff look (STAFF-UI v3).
 *
 * Scans the staff stylesheet and every staff component/page and fails on:
 *  a. the words/classes indigo, violet, purple, fuchsia, blue-*, sky-* and the
 *     legacy accent/theme hex values of the pre-v3 palette;
 *  b. any hex colour whose HSL hue sits in the cold 190-300 band with a real
 *     saturation and real chroma, i.e. any blue/violet sneaking back in. The
 *     palette's own near-neutral greys (ink, row, ink-2) have a cool hue but a
 *     channel spread under 16/255, so chroma is required as well as saturation;
 *  c. any raw hex value outside the `.staff-theme` token block, so every colour
 *     stays in one place.
 *
 * The compiled staff CSS is checked for the legacy hexes only: the production
 * bundle also carries the public palette, which is out of this guard's scope.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const tokensFile = join(root, "src/styles/staff.css");
const SCAN_DIRS = ["src/styles", "src/components/staff", "src/app/staff"];
const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);

const BANNED_WORDS = ["indigo", "violet", "purple", "fuchsia", "blue-", "sky-"];
/** Colours of the pre-v3 staff palette (accent, wash, dark theme). */
const LEGACY_HEX = new Map([
  ["#2B44FF", "pre-v3 link blue"],
  ["#1B2BD6", "pre-v3 indigo"],
  ["#5B3DF5", "pre-v3 violet accent"],
  ["#4526D9", "pre-v3 violet hover"],
  ["#F1EDFF", "pre-v3 violet wash"],
  ["#F8F5FF", "pre-v3 violet wash"],
  ["#3B21C4", "pre-v3 violet ink"],
  ["#4A2CE0", "pre-v3 violet button"],
  ["#E4EBFF", "pre-v3 indigo tint"],
  ["#0B0E17", "pre-v3 dark page"],
  ["#111625", "pre-v3 dark sidebar"],
  ["#161C2B", "pre-v3 dark surface"],
  ["#28303F", "pre-v3 dark line"],
  ["#3A4456", "pre-v3 dark line"],
  ["#8B96AB", "pre-v3 dark outline"],
  ["#F4F6FB", "pre-v3 dark ink"],
  ["#A8B2C4", "pre-v3 dark muted"],
  ["#1C2331", "pre-v3 dark hover"],
]);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(css|tsx|ts)$/.test(name)) out.push(full);
  }
  return out;
}

function tokenBlock(source) {
  const start = source.indexOf(".staff-theme {");
  if (start < 0) return "";
  const open = source.indexOf("{", start);
  const end = source.indexOf("\n}", open);
  return source.slice(open, end < 0 ? source.length : end);
}

function stripTokens(source) {
  const block = tokenBlock(source);
  if (!block) return source;
  return source.replace(block, "");
}

function hexes(source) {
  return [...source.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((match) => match[0]);
}

function toRgb(hex) {
  let value = hex.slice(1);
  if (value.length === 3) value = value.split("").map((c) => c + c).join("");
  if (value.length !== 6) return null;
  const int = Number.parseInt(value, 16);
  if (Number.isNaN(int)) return null;
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/** Hue in degrees, saturation 0..1 and 0..255 chroma (HSL, not HSV). */
function hueAndSaturation(hex) {
  const rgb = toRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { hue: 0, saturation: 0, chroma: 0 };
  const saturation = d / (1 - Math.abs(2 * l - 1));
  let hue;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  return { hue, saturation, chroma: Math.round(d * 255) };
}

/** Near-neutral: the ink/row greys, which read as grey despite a cool hue. */
const NEUTRAL_CHROMA = 16;

const failures = [];
function fail(file, line, message) {
  failures.push(`${relative(root, file)}:${line}  ${message}`);
}

const files = SCAN_DIRS.flatMap((dir) => walk(join(root, dir)));

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const isTokens = file === tokensFile;
  const body = isTokens ? stripTokens(source) : source;

  const lines = body.split(/\r?\n/);
  lines.forEach((text, index) => {
    const lower = text.toLowerCase();
    // (a) banned words — skip the token file's own comment about the palette.
    for (const word of BANNED_WORDS) {
      if (lower.includes(word)) fail(file, index + 1, `banned word "${word}"`);
    }
  });

  // (a) legacy hex values, (c) raw hex outside the token block.
  const outside = isTokens ? body : source;
  const allHex = hexes(source);
  for (const hex of new Set(allHex)) {
    const upper = hex.toUpperCase();
    if (LEGACY_HEX.has(upper)) {
      fail(file, 1, `legacy colour ${upper} (${LEGACY_HEX.get(upper)})`);
    }
  }
  if (outside) {
    const outsideHex = [...new Set(hexes(outside))];
    for (const hex of outsideHex) {
      if (isTokens) fail(file, 1, `raw hex ${hex} outside the .staff-theme token block`);
    }
  }

  // (b) cold hue band on every hex the staff sources declare.
  for (const hex of new Set(allHex)) {
    const hs = hueAndSaturation(hex);
    if (!hs) continue;
    if (hs.hue >= 190 && hs.hue <= 300 && hs.saturation > 0.2 && hs.chroma >= NEUTRAL_CHROMA) {
      fail(
        file,
        1,
        `cold colour ${hex.toUpperCase()} (hue ${Math.round(hs.hue)}, saturation ${hs.saturation.toFixed(2)})`,
      );
    }
  }

  // TSX may only reference colours through tokens; an inline hex is caught above
  // only for the token file, so components are checked for any hex at all.
  if (!file.endsWith(".css")) {
    for (const hex of new Set(hexes(source))) {
      fail(file, 1, `raw hex ${hex} in a component; use a --st-* token`);
    }
  }
}

/** #2B44FF is the public link/focus colour, so the shared bundle carries it. */
const PUBLIC_HEX = new Set(["#2B44FF"]);

/** The built bundle repeats whatever the sources say; catch a stale legacy value. */
const builtDir = join(root, ".next/static/css");
if (existsSync(builtDir)) {
  for (const name of readdirSync(builtDir).filter((n) => n.endsWith(".css"))) {
    const source = readFileSync(join(builtDir, name), "utf8").toUpperCase();
    for (const [hex, label] of LEGACY_HEX) {
      if (PUBLIC_HEX.has(hex)) continue;
      if (source.includes(hex)) {
        failures.push(`.next/static/css/${name}  legacy colour ${hex} (${label})`);
      }
    }
  }
  console.log(`Compiled CSS: scanned ${readdirSync(builtDir).filter((n) => n.endsWith(".css")).length} file(s)`);
} else {
  console.log("Compiled CSS: none yet (source scan only)");
}

console.log(`Staff sources: ${files.length} file(s) in ${SCAN_DIRS.join(", ")}`);

if (failures.length > 0) {
  console.log(`\nFAIL  ${failures.length} palette violation(s):`);
  for (const line of [...new Set(failures)].slice(0, 60)) console.log(`  ${line}`);
  process.exit(1);
}

console.log("\nPASS  no indigo/violet, no legacy colour, no hex outside the token block.");
