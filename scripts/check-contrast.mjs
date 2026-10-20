import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const vars = Object.fromEntries(
  [...css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6});/g)].map((match) => [match[1], match[2]]),
);
vars.white = "#FFFFFF";

/** Palette blocks need separate parsing: the super tone overrides the frame. */
function block(startMarker) {
  const start = css.indexOf(startMarker);
  if (start < 0) return {};
  const open = css.indexOf("{", start);
  const end = css.indexOf("\n}", open);
  const body = css.slice(open, end);
  return Object.fromEntries(
    [...body.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6});/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );
}

const staff = block(".staff-theme {");
// The super tone only overrides the frame and the active pill.
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
  ["ink", "surface", "body on surface"],
  ["ink", "bg", "body on page"],
  ["ink", "surface-2", "body on container"],
  ["muted", "surface", "muted on surface"],
  ["muted", "bg", "muted on page"],
  ["muted", "surface-2", "muted on container"],
  ["primary", "surface", "primary link on surface"],
  ["primary", "bg", "primary link on page"],
  ["primary", "surface-2", "primary link on container"],
  ["on-primary", "primary", "filled button"],
  ["on-primary-container", "primary-container", "tonal chip/button"],
  ["warm-ink", "warm", "warning text"],
  ["success", "success-container", "success text"],
  ["error", "error-container", "error text"],
  ["success", "surface", "success text on surface"],
  ["error", "surface", "error text on surface"],
  ["white", "super", "super app bar"],
  ["white", "primary", "user app bar"],
];

const iconPairs = [
  ["outline", "surface", "border/icon on surface"],
  ["outline", "bg", "border/icon on page"],
  ["outline", "surface-2", "border/icon on container"],
  ["primary", "surface", "primary icon on surface"],
  ["primary", "bg", "primary icon on page"],
  ["error", "surface", "error icon on surface"],
  ["success", "surface", "success icon on surface"],
  ["warm-ink", "warm", "warm icon on warm"],
];

let failed = 0;

function run(pairs, minimum, kind) {
  console.log(`\n${kind} pairs (minimum ${minimum}:1)`);
  for (const [fgName, bgName, label] of pairs) {
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
      `${ok ? "PASS" : "FAIL"}  ${value.toFixed(2)}:1  ${label}  (${fgName} on ${bgName})`,
    );
  }
}

run(textPairs, 4.5, "Text");
run(iconPairs, 3, "Border/icon");

/** Staff Control Center: one blue family, status colours on pills only. */
const staffTextPairs = [
  ["adm-frame-ink", "adm-frame", "white on admin frame", staff, 4.5],
  ["adm-frame-ink", "adm-frame", "white on super frame", staffSuper, 4.5],
  ["adm-frame-ink", "adm-pill-active", "white on admin active pill", staff, 7],
  ["adm-frame-ink", "adm-pill-active", "white on super active pill", staffSuper, 7],
  ["adm-ink", "adm-tint-1", "ink on tint-1", staff, 7],
  ["adm-ink", "adm-tint-2", "ink on tint-2", staff, 7],
  ["adm-ink", "adm-tint-3", "ink on tint-3", staff, 7],
  ["adm-ink", "adm-tint-4", "ink on tint-4", staff, 7],
  ["adm-muted", "adm-tint-1", "muted on tint-1", staff, 4.5],
  ["adm-muted", "adm-tint-2", "muted on tint-2", staff, 4.5],
  ["adm-muted", "adm-tint-3", "muted on tint-3", staff, 4.5],
  ["adm-muted", "adm-paper", "muted on paper", staff, 4.5],
  ["adm-outline", "adm-paper", "outline on paper", staff, 3],
  ["adm-ok", "adm-ok-bg", "success pill", staff, 4.5],
  ["adm-warn", "adm-warn-bg", "warning pill", staff, 4.5],
  ["adm-err", "adm-err-bg", "error pill", staff, 4.5],
];

console.log("\nStaff token pairs (per-pair minimum)");
for (const [fgKey, bgKey, label, palette, minimum] of staffTextPairs) {
  const fg = palette[fgKey];
  const bg = palette[bgKey];
  if (!fg || !bg) {
    console.log(`FAIL  ${label}: missing staff token (${fgKey}/${bgKey})`);
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
