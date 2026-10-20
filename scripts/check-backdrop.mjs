import { mkdirSync } from "node:fs";
import { loadEnv, resolveAppBase } from "./env.mjs";

loadEnv();

const BASE = resolveAppBase();
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST || "zav.localhost:3000";
const STAFF_HOST = process.env.NEXT_PUBLIC_STAFF_HOST || "admin.zav.localhost:3000";
const SHOTS = "tmp/backdrop";
const WIDTHS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];
const MIN_SPREAD = 14;

const routes = [
  { path: "/", name: "landing" },
  { path: "/login", name: "login" },
  { path: "/register?role=worker", name: "register" },
  { path: "/c", name: "customer", auth: true },
];

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("SKIP  check-backdrop: playwright is not installed (npm i -D playwright).");
  process.exit(0);
}

const siteName = SITE_HOST.split(":")[0];
const staffName = STAFF_HOST.split(":")[0];
let browser;
try {
  browser = await chromium.launch({
    args: [
      `--host-resolver-rules=MAP ${siteName} 127.0.0.1, MAP ${staffName} 127.0.0.1`,
    ],
  });
} catch (error) {
  console.log(`SKIP  check-backdrop: chromium could not launch (${error.message}).`);
  console.log("      Run: npx playwright install chromium");
  process.exit(0);
}

mkdirSync(SHOTS, { recursive: true });

const hex = (c) =>
  `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;

const distance = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);

function hsl({ r, g, b }) {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s: s * 100, l: l * 100 };
}

function luminance({ r, g, b }) {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255].map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const INK = { r: 15, g: 23, b: 42 };
const ACCENT = { r: 7, g: 89, b: 133 };

function pointsFor(width, height) {
  return [
    { name: "top-left", x: 6, y: 6 },
    { name: "top-right", x: width - 6, y: 6 },
    { name: "bottom-left", x: 6, y: height - 6 },
    { name: "bottom-right", x: width - 6, y: height - 6 },
    { name: "centre", x: width / 2, y: height / 2 },
    { name: "glow-top-left", x: width * 0.1, y: height * 0.14 },
    { name: "glow-right", x: width * 0.9, y: height * 0.2 },
    { name: "bottom-centre", x: width / 2, y: height - 6 },
  ];
}

function heroPointsFor(width, height) {
  return [
    { name: "hero-1", x: width * 0.08, y: height * 0.2 },
    { name: "hero-2", x: width * 0.3, y: height * 0.26 },
    { name: "hero-3", x: width * 0.08, y: height * 0.42 },
    { name: "hero-4", x: width * 0.34, y: height * 0.16 },
    { name: "hero-5", x: width * 0.12, y: height * 0.55 },
  ];
}

/** Read pixels out of a screenshot inside the page (canvas is not available in Node). */
async function samplePixels(page, buffer, points) {
  const dataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
  return page.evaluate(
    async ({ dataUrl, points }) => {
      const image = new Image();
      image.src = dataUrl;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      return points.map((point) => {
        const x = Math.max(0, Math.min(canvas.width - 1, Math.round(point.x)));
        const y = Math.max(0, Math.min(canvas.height - 1, Math.round(point.y)));
        const [r, g, b] = context.getImageData(x, y, 1, 1).data;
        return { name: point.name, r, g, b };
      });
    },
    { dataUrl, points },
  );
}

/**
 * (b) No wrapper may cover the backdrop: find elements at 5 viewport points
 * that are larger than 90% of the viewport in both axes and paint an opaque
 * background of their own.
 */
async function findCovers(page) {
  return page.evaluate(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const probes = [
      [width / 2, height / 2],
      [8, 8],
      [width - 8, 8],
      [width / 2, height - 8],
      [8, height / 2],
    ];
    const opaque = (color) => {
      const match = color.match(/rgba?\(([^)]+)\)/);
      if (!match) return false;
      const parts = match[1].split(",").map((part) => part.trim());
      return parts.length < 4 || Number(parts[3]) >= 0.999;
    };
    const covers = [];
    for (const [x, y] of probes) {
      for (const element of document.elementsFromPoint(x, y)) {
        if (element.tagName === "HTML" || element.tagName === "BODY") continue;
        const rect = element.getBoundingClientRect();
        if (rect.width < width * 0.9 || rect.height < height * 0.9) continue;
        const style = getComputedStyle(element);
        // Cards are allowed to be opaque (design rules). A long form card on a
        // phone is nearly viewport-wide, so only flat wrappers are a problem.
        if (Number.parseFloat(style.borderTopLeftRadius) >= 8) continue;
        const image = style.backgroundImage !== "none";
        if (opaque(style.backgroundColor) || image) {
          const label = `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 48)}`;
          if (!covers.includes(label)) covers.push(label);
        }
      }
    }
    return covers;
  });
}

const probe = await fetch(`${BASE}/`, {
  headers: { Host: SITE_HOST, "X-Forwarded-Host": SITE_HOST },
  redirect: "manual",
}).catch(() => null);
if (!probe) {
  console.log(`FAIL  check-backdrop: ${BASE} is unreachable. Start the app first (npm start).`);
  await browser.close();
  process.exit(1);
}

let failures = 0;
let checked = 0;

for (const route of routes) {
  const response = await fetch(`${BASE}${route.path}`, {
    headers: { Host: SITE_HOST, "X-Forwarded-Host": SITE_HOST },
    redirect: "manual",
  }).catch(() => null);

  if (!response || response.status >= 400 || (response.status >= 300 && response.status < 400)) {
    console.log(
      `SKIP  ${route.name} — HTTP ${response ? response.status : "unreachable"}` +
        (route.auth ? " (auth needed)" : ""),
    );
    continue;
  }

  for (const { width, height } of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.goto(`http://${SITE_HOST}${route.path}`, { waitUntil: "networkidle" });

    const pathname = new URL(page.url()).pathname;
    if (route.auth && pathname.startsWith("/login")) {
      console.log(`SKIP  ${route.name} @${width}px — redirected to ${pathname} (auth needed)`);
      await context.close();
      continue;
    }

    const gradients = await page.evaluate(() => {
      const image = getComputedStyle(document.body).backgroundImage;
      return { image, count: (image.match(/gradient\(/g) ?? []).length };
    });
    const covers = await findCovers(page);

    await page.screenshot({ path: `${SHOTS}/${route.name}-${width}.png` });

    // Hide the content but keep layout: every sampled pixel is the backdrop.
    await page.evaluate(() => {
      for (const child of document.body.children) {
        child.style.visibility = "hidden";
      }
    });
    const clean = await page.screenshot({ path: `${SHOTS}/${route.name}-${width}-backdrop.png` });
    const samples = await samplePixels(page, clean, pointsFor(width, height));
    const heroSamples = await samplePixels(page, clean, heroPointsFor(width, height));

    const byName = Object.fromEntries(samples.map((sample) => [sample.name, sample]));
    let spread = 0;
    let pair = "";
    for (let i = 0; i < samples.length; i += 1) {
      for (let j = i + 1; j < samples.length; j += 1) {
        const value = distance(samples[i], samples[j]);
        if (value > spread) {
          spread = value;
          pair = `${samples[i].name}/${samples[j].name}`;
        }
      }
    }

    // The literal top-left point sits in the strongest part of the glow.
    const glow = hsl(byName["top-left"]);
    const ambient = hsl(byName["glow-top-left"]);
    const bottom = hsl(byName["bottom-centre"]);
    const glowWins = glow.s >= bottom.s + 5 || glow.l <= bottom.l - 4;
    const flat = spread < MIN_SPREAD;
    const gradientOk = gradients.count >= 4;

    const inkMin = Math.min(...heroSamples.map((sample) => contrast(INK, sample)));
    const accentMin = Math.min(...heroSamples.map((sample) => contrast(ACCENT, sample)));
    const contrastOk = inkMin >= 7 && accentMin >= 4.5;

    const ok = !flat && glowWins && covers.length === 0 && gradientOk && contrastOk;
    if (!ok) failures += 1;
    checked += 1;

    console.log(`\n${ok ? "PASS" : "FAIL"}  ${route.name} @${width}x${height}`);
    console.log(
      `  colours  ${samples.map((sample) => `${sample.name} ${hex(sample)}`).join(" | ")}`,
    );
    console.log(
      `  spread   ${spread.toFixed(1)} (${pair}) — minimum ${MIN_SPREAD}  ${flat ? "FAIL" : "ok"}`,
    );
    console.log(
      `  glow     top-left sat ${glow.s.toFixed(1)}% / light ${glow.l.toFixed(1)}% vs bottom ` +
        `${bottom.s.toFixed(1)}% / ${bottom.l.toFixed(1)}%  ${glowWins ? "ok" : "FAIL"}` +
        ` (ambient ${ambient.s.toFixed(1)}% / ${ambient.l.toFixed(1)}%)`,
    );
    console.log(
      `  cover    ${covers.length === 0 ? "none" : covers.join(" | ")}`,
    );
    console.log(
      `  body     ${gradients.count} gradients  ${gradientOk ? "ok" : "FAIL (need >= 4)"}`,
    );
    console.log(
      `  contrast ink ${inkMin.toFixed(2)}:1 (min 7), #075985 ${accentMin.toFixed(2)}:1 (min 4.5)  ` +
        `${contrastOk ? "ok" : "FAIL"}`,
    );

    await context.close();
  }
}

/**
 * Staff routes paint a flat frame colour by design, so the public glow, cover
 * and gradient rules do not apply. Here the frame must BE the paper's colour
 * family: body background = --adm-frame, and the panel must stay light.
 */
const staffRoutes = [
  { path: "/login", name: "staff-login", host: STAFF_HOST },
  { path: "/security", name: "staff-security", host: STAFF_HOST, auth: true },
  { path: "/today", name: "staff-today", host: STAFF_HOST, auth: true },
  { path: "/__kit/shell/admin", name: "staff-shell-admin", host: SITE_HOST },
  { path: "/__kit/shell/super", name: "staff-shell-super", host: SITE_HOST },
];

for (const route of staffRoutes) {
  const port = new URL(`http://${SITE_HOST}`).port || "3000";
  const response = await fetch(`${BASE}${route.path}`, {
    headers: { Host: route.host, "X-Forwarded-Host": route.host },
    redirect: "manual",
  }).catch(() => null);
  if (!response || response.status >= 400) {
    console.log(
      `SKIP  ${route.name} — HTTP ${response ? response.status : "unreachable"}` +
        (route.auth ? " (auth needed)" : ""),
    );
    continue;
  }

  for (const { width, height } of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.goto(`http://${route.host}${route.path}`, { waitUntil: "networkidle" });
    const pathname = new URL(page.url()).pathname;
    if (route.auth && pathname.startsWith("/login")) {
      console.log(`SKIP  ${route.name} @${width}px — redirected to ${pathname} (auth needed)`);
      await context.close();
      continue;
    }

    const result = await page.evaluate(() => {
      const html = getComputedStyle(document.documentElement);
      const frame = html.getPropertyValue("--adm-frame").trim().toLowerCase();
      const body = getComputedStyle(document.body).backgroundColor;
      const panel =
        document.querySelector(".paper") ??
        document.querySelector(".staff-auth-card") ??
        document.querySelector("[data-staff-panel]");
      const panelBg = panel ? getComputedStyle(panel).backgroundColor : "none";
      const channel = (value) => Number.parseFloat(value) / 255;
      const luminance = (rgb) => {
        const parts = rgb.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
        const [r, g, b] = parts.slice(0, 3).map(channel).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      return { frame, body, panelBg, panelLight: panelBg === "none" ? false : luminance(panelBg) > 0.7 };
    });

    const frameHex = result.frame
      ? `rgb(${[1, 3, 5]
          .map((index) => parseInt(result.frame.slice(index, index + 2), 16))
          .join(", ")})`
      : "";
    const frameOk = frameHex ? result.body === frameHex : false;
    const tone = await page.evaluate(() => document.documentElement.dataset.staffTone ?? "-" );
    const ok = frameOk && result.panelLight;
    checked += 1;
    if (!ok) failures += 1;
    console.log(`\n${ok ? "PASS" : "FAIL"}  ${route.name} @${width}x${height} (tone ${tone})`);
    console.log(
      `  frame    --adm-frame ${result.frame} — body ${result.body}  ${frameOk ? "ok" : "FAIL"}`,
    );
    console.log(
      `  paper    ${result.panelBg} — light panel ${result.panelLight ? "ok" : "FAIL"}`,
    );
    await page.screenshot({ path: `${SHOTS}/${route.name}-${width}.png` });
    void port;
    await context.close();
  }
}

await browser.close();
console.log(`\nScreenshots: ${SHOTS}/`);
console.log(
  failures === 0
    ? `BACKDROP OK (${checked} page/width combinations)`
    : `${failures} BACKDROP PROBLEM(S)`,
);
if (failures > 0) process.exitCode = 1;
