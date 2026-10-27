import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const roots = [
  "src/app/site",
  "src/app/worker",
  "src/components/auth",
  "src/components/public",
  "src/components/app",
  "src/components/ui",
  "src/components/ds",
];
const sourceFiles = [];

function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "staff" || file.includes(`${path.sep}kit${path.sep}`)) continue;
      collect(file);
    } else if (/\.(?:ts|tsx|js|jsx)$/.test(entry.name)) {
      sourceFiles.push(file);
    }
  }
}

for (const root of roots) collect(root);

const failures = [];
const legacyPalette = /#1f4e79|#faf8f5|#eef2f6|--hero(?:-[a-z0-9-]+)?\s*:/i;
const oldUtility = /(?:^|[\s"'`])(?:bg-sky|from|to|shadow)-[a-z0-9-[\]#/.%]+/i;
const rawHex = /#[0-9a-f]{3,8}\b/i;

for (const file of sourceFiles) {
  const source = readFileSync(file, "utf8");
  const relative = path.relative(process.cwd(), file);
  if (legacyPalette.test(source)) failures.push(`${relative}: old palette token or color`);
  if (oldUtility.test(source)) failures.push(`${relative}: legacy color, gradient, or shadow utility`);
  if (rawHex.test(source)) failures.push(`${relative}: raw hex color outside globals.css`);
  if (source.includes("dangerouslySetInnerHTML")) {
    failures.push(`${relative}: dangerouslySetInnerHTML is not allowed`);
  }
}

const css = readFileSync("src/app/globals.css", "utf8");
const staffStart = css.indexOf("STAFF SHELL (v2)");
const staffEnd = staffStart < 0
  ? -1
  : css.indexOf("@media (prefers-reduced-motion: reduce)", staffStart);
const publicCss =
  staffStart >= 0 && staffEnd >= 0
    ? `${css.slice(0, staffStart)}${css.slice(staffEnd)}`
    : css;
const transitions = publicCss.matchAll(/transition(?:-property)?\s*:\s*([^;{}]+)/gs);
for (const match of transitions) {
  const declarationIndex = match.index;
  const openBrace = publicCss.lastIndexOf("{", declarationIndex);
  const selectorStart = publicCss.lastIndexOf("}", openBrace) + 1;
  const selector = publicCss.slice(selectorStart, openBrace);
  if (/\bstaff\b|data-staff|\.st-[a-z0-9-]+/i.test(selector)) continue;
  if (/\b(?:width|height|top|left|margin(?:-[a-z]+)?)\b/i.test(match[1])) {
    failures.push(`globals.css: layout property in motion declaration: ${match[1].trim()}`);
  }
}

for (const match of publicCss.matchAll(/@keyframes\s+[a-z0-9_-]+\s*\{([\s\S]*?)\n\}/gi)) {
  const body = match[1];
  if (/\b(?:width|height|top|left|margin(?:-[a-z]+)?)\s*:/i.test(body)) {
    failures.push(`globals.css: layout property animated in @keyframes ${match[0].split(/\s+/)[1]}`);
  }
}

if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/i.test(publicCss)) {
  failures.push("globals.css: missing prefers-reduced-motion handling");
}
if (/\.hero-[a-z0-9_-]+[^{]*\{[^}]*opacity\s*:\s*0/is.test(publicCss)) {
  failures.push("globals.css: hero content starts hidden");
}

if (failures.length > 0) {
  console.error("Design check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Design check passed (${sourceFiles.length} public source files scanned).`);
}
