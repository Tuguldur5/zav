import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

/** Every raw custom-property value, hex or `var(--alias)`. */
function rawDeclarations(source) {
  return new Map(
    [...source.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  );
}

const allRaw = rawDeclarations(css);

function palette(source) {
  const local = rawDeclarations(source);
  function resolve(raw, depth = 0) {
    if (!raw || depth > 10) return null;
    const hex = raw.match(/#[0-9a-fA-F]{6}/);
    if (hex) return hex[0].toUpperCase();
    const alias = raw.match(/var\(--([a-z0-9-]+)\)/);
    if (alias) {
      return resolve(local.get(alias[1]) ?? allRaw.get(alias[1]), depth + 1);
    }
    return null;
  }

  const out = {};
  for (const [name, raw] of local) {
    const hex = resolve(raw);
    if (hex) out[name] = hex;
  }
  return out;
}

/** `:root` is the public palette; later blocks (staff) redefine some names. */
function block(startMarker) {
  const start = css.indexOf(startMarker);
  if (start < 0) return {};
  const open = css.indexOf("{", start);
  const end = css.indexOf("\n}", open);
  return palette(css.slice(open, end));
}

const vars = block(":root {");
vars.white = "#FFFFFF";

const staff = block(".staff-theme {");
// The super tone only redefines the teal accent family.
const staffSuper = { ...staff, ...block('.staff-theme[data-staff-tone="super"]') };

function channels(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
}

function luminance(hex) {
  const [r, g, b] = channels(hex).map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return (light + 0.05) / (dark + 0.05);
}

const textPairs = [
  ["ink", "paper", "ink on paper", 7],
  ["ink", "surface", "ink on surface", 7],
  ["muted", "paper", "muted on paper", 4.5],
  ["muted", "surface", "muted on surface", 4.5],
  ["muted-on-ink", "ink", "muted-on-ink on ink", 4.5],
  ["muted-on-ink", "ink-2", "muted-on-ink on ink-2", 4.5],
  ["ink", "signal", "ink on signal", 7],
  ["ink", "signal-hover", "ink on signal-hover", 7],
  ["white", "ink", "white on ink", 7],
  ["link", "paper", "link on paper", 4.5],
  ["link", "surface", "link on surface", 4.5],
  ["line-strong", "paper", "line-strong on paper", 3],
  ["line-strong", "surface", "line-strong on surface", 3],
  ["ok", "ok-bg", "ok on ok-bg", 4.5],
  ["warn", "warn-bg", "warn on warn-bg", 4.5],
  ["err", "err-bg", "err on err-bg", 4.5],
];

let failed = 0;

function run(pairs, kind) {
  console.log(`\n${kind} pairs`);
  for (const [fgName, bgName, label, minimum] of pairs) {
    const fg = vars[fgName];
    const bg = vars[bgName];
    if (!fg || !bg) {
      console.log(`FAIL  ${label}: missing token (${fgName}/${bgName})`);
      failed += 1;
      continue;
    }
    const value = ratio(fg, bg);
    const ok = value >= minimum;
    if (!ok) failed += 1;
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${value.toFixed(2)}:1  ${label} (minimum ${minimum}:1)`,
    );
  }
}

run(textPairs, "Public");

/**
 * Staff v2: white page, 1px borders, teal only for actions and active state.
 * Each pair carries its own minimum from the acceptance table.
 */
const staffPairs = () => [
  ["st-ink", "st-surface", "ink on white", 7],
  ["st-muted", "st-surface", "muted on white", 4.5],
  ["st-muted", "st-subtle", "muted on subtle", 4.5],
  ["st-on-accent", "st-accent", "white on accent", 4.5],
  ["st-accent", "st-surface", "accent text on white", 4.5],
  ["st-accent", "st-accent-soft", "accent text on accent-soft", 4.5],
  ["st-accent-ink", "st-accent-soft", "accent-ink on accent-soft", 7],
  ["st-accent-ink", "st-accent-soft-2", "accent-ink on accent-soft-2", 7],
  ["st-ok", "st-ok-bg", "success pill", 4.5],
  ["st-warn", "st-warn-bg", "warning pill", 4.5],
  ["st-err", "st-err-bg", "error pill", 4.5],
  ["st-outline", "st-surface", "outline on white", 3],
];

console.log("\nStaff token pairs — admin tone");
for (const [fgKey, bgKey, label, minimum] of staffPairs()) {
  const fg = staff[fgKey];
  const bg = staff[bgKey];
  if (!fg || !bg) {
    console.log(`FAIL  ${label}: missing staff token (${fgKey}/${bgKey})`);
    failed += 1;
    continue;
  }
  const value = ratio(fg, bg);
  const ok = value >= minimum;
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${value.toFixed(2)}:1  ${label} (minimum ${minimum}:1)`);
}

console.log("\nStaff token pairs — super tone");
for (const [fgKey, bgKey, label, minimum] of staffPairs()) {
  const fg = staffSuper[fgKey];
  const bg = staffSuper[bgKey];
  if (!fg || !bg) {
    console.log(`FAIL  ${label}: missing staff token (${fgKey}/${bgKey})`);
    failed += 1;
    continue;
  }
  const value = ratio(fg, bg);
  const ok = value >= minimum;
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${value.toFixed(2)}:1  ${label} (minimum ${minimum}:1)`);
}

const INK = vars.ink;
const ACCENT = vars["primary-hover"] ?? "#075985";
const MIN_INK = 7;
const MIN_ACCENT = 4.5;

function contrastRgb(rgb, hex) {
  const bg = `#${rgb.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
  return ratio(hex, bg);
}

/**
 * Sample the real backdrop near the hero text. The browser check is skipped
 * when the app is not running; the token pairs above still run standalone.
 */
async function checkBackdrop() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.log("\nSKIP  backdrop sampling: playwright is not installed.");
    return;
  }

  const host = process.env.NEXT_PUBLIC_SITE_HOST || "zav.localhost:3000";
  const base = (process.env.APP_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
  const url = base.includes("127.0.0.1")
    ? `http://${host}/`
    : `${base.replace(/\/$/, "")}/`;

  let browser;
  try {
    browser = await chromium.launch({
      args: [`--host-resolver-rules=MAP ${host.split(":")[0]} 127.0.0.1`],
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
    await page.evaluate(() => {
      for (const child of document.body.children) child.style.visibility = "hidden";
    });
    const shot = await page.screenshot();
    const dataUrl = `data:image/png;base64,${shot.toString("base64")}`;
    const samples = await page.evaluate(async ({ dataUrl, points }) => {
      const image = new Image();
      image.src = dataUrl;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      return points.map((point) => {
        const data = context.getImageData(Math.round(point.x), Math.round(point.y), 1, 1).data;
        return [data[0], data[1], data[2]];
      });
    }, {
      dataUrl,
      points: [
        { x: 1440 * 0.08, y: 900 * 0.2 },
        { x: 1440 * 0.3, y: 900 * 0.26 },
        { x: 1440 * 0.08, y: 900 * 0.42 },
        { x: 1440 * 0.34, y: 900 * 0.16 },
        { x: 1440 * 0.12, y: 900 * 0.55 },
      ],
    });
    await browser.close();

    const inkMin = Math.min(...samples.map((rgb) => contrastRgb(rgb, INK)));
    const accentMin = Math.min(...samples.map((rgb) => contrastRgb(rgb, ACCENT)));
    const printed = samples
      .map((rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`)
      .join(", ");

    console.log(`\nBackdrop near the hero (${printed})`);
    const inkOk = inkMin >= MIN_INK;
    const accentOk = accentMin >= MIN_ACCENT;
    if (!inkOk) failed += 1;
    if (!accentOk) failed += 1;
    console.log(
      `${inkOk ? "PASS" : "FAIL"}  ${inkMin.toFixed(2)}:1  ink on backdrop (minimum ${MIN_INK}:1)`,
    );
    console.log(
      `${accentOk ? "PASS" : "FAIL"}  ${accentMin.toFixed(2)}:1  ${ACCENT} on backdrop ` +
        `(minimum ${MIN_ACCENT}:1)`,
    );
  } catch (error) {
    console.log(`\nSKIP  backdrop sampling: ${error.message.split("\n")[0]}`);
    console.log("      Start the app (npm start) to include the rendered backdrop.");
    await browser?.close();
  }
}

await checkBackdrop();

console.log(`\n${failed === 0 ? "All contrast checks passed." : `${failed} pair(s) failed.`}`);
process.exit(failed === 0 ? 0 : 1);
