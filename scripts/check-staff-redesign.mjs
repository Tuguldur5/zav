/**
 * Dev-only proof of the staff look: one H1 per screen, the lime selection
 * system painted by the browser, and no horizontal overflow at the desktop,
 * tablet and phone widths.
 *
 * Needs `npm run dev` on port 3000. The shell gallery lives on the CUSTOMER
 * host (localhost:3000/__kit/shell/<admin|super>); the staff host answers 404
 * there, and `/__kit` is 404 in a production build.
 *
 * Usage: npm run check:redesign
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const ACCENT = "rgb(200, 241, 53)";
const INK_BTN = "rgb(14, 17, 22)";
const ACCENT_SOFT = "rgb(240, 251, 196)";
const ACCENT_INK = "rgb(14, 17, 22)";

let failed = 0;
const pass = (label, ok, detail = "") => {
  if (!ok) failed += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` (${detail})` : ""}`);
};

const browser = await chromium.launch();

async function size(width) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/__kit/shell/admin`, { waitUntil: "networkidle", timeout: 120_000 });
  return { context, page };
}

console.log("\n(a) page title rendered once");
{
  const { context, page } = await size(1440);
  const info = await page.evaluate(() => {
    const h1 = [...document.querySelectorAll("h1")];
    const head = document.querySelector(".st-page-head");
    return {
      count: h1.length,
      text: h1[0]?.textContent?.trim() ?? "",
      cls: h1[0]?.className ?? "",
      headHeadings: head ? head.querySelectorAll("h1, h2").length : -1,
      hasHead: Boolean(head),
    };
  });
  pass("exactly one H1 on the page", info.count === 1, `${info.count}`);
  pass("H1 is the topbar crumb title", info.cls.includes("st-crumb-title"), info.cls);
  pass("H1 carries a page title", info.text.length > 0, info.text);
  pass("intro band renders without a heading", info.hasHead && info.headHeadings === 0, `${info.headHeadings}`);
  await context.close();
}

console.log("\n(b) accent system painted by the browser (light / admin)");
{
  const { context, page } = await size(1440);
  // The gallery lives on the customer host, so no nav href matches its path:
  // mark one item selected to read the rule the real pages hit. The item has a
  // 140ms background/colour transition, so let it settle before measuring.
  await page.evaluate(() => {
    document.querySelector(".st-nav-item")?.setAttribute("aria-current", "page");
  });
  await page.waitForTimeout(300);
  const painted = await page.evaluate(() => {
    const nav = document.querySelector('.st-nav-item[aria-current="page"]');
    const navStyle = nav ? getComputedStyle(nav) : null;
    const icon = nav?.querySelector(".st-nav-icon");
    const primary =
      document.querySelector('.st-btn[data-variant="primary"]') ??
      document.querySelector("button.bg-primary");
    const head = document.querySelector(".st-page-head");
    const tileIcon = document.querySelector(".st-tile-icon");
    const mark = document.querySelector(".st-mark");
    return {
      navBg: navStyle?.backgroundColor ?? "",
      navColor: navStyle?.color ?? "",
      navIcon: icon ? getComputedStyle(icon).color : "",
      primaryBg: primary ? getComputedStyle(primary).backgroundColor : "",
      headBg: head ? getComputedStyle(head).backgroundColor : "",
      headBar: head ? getComputedStyle(head).borderLeftColor : "",
      tileIconBg: tileIcon ? getComputedStyle(tileIcon).backgroundColor : "",
      tileIconColor: tileIcon ? getComputedStyle(tileIcon).color : "",
      markBg: mark ? getComputedStyle(mark).backgroundColor : "",
    };
  });
  pass("active nav pill uses the lime fill", painted.navBg === ACCENT, painted.navBg);
  pass("active nav label uses ink", painted.navColor === ACCENT_INK, painted.navColor);
  pass("active nav icon uses ink", painted.navIcon === ACCENT_INK, painted.navIcon);
  pass("primary button is ink", painted.primaryBg === INK_BTN, painted.primaryBg);
  pass("stat tile icon chip is lime-tinted", painted.tileIconBg === ACCENT_SOFT, painted.tileIconBg);
  pass("brand mark is lime", painted.markBg === ACCENT, painted.markBg);
  await context.close();
}

console.log("\n(c) super tone keeps the same system");
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/__kit/shell/super`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.evaluate(() => {
    document.querySelector(".st-nav-item")?.setAttribute("aria-current", "page");
  });
  await page.waitForTimeout(300);
  const nav = await page.evaluate(() => {
    const el = document.querySelector('.st-nav-item[aria-current="page"]');
    return el ? getComputedStyle(el).backgroundColor : "";
  });
  pass("super active nav uses the lime fill", nav === ACCENT, nav);
  await context.close();
}

console.log("\n(d) tabs use the accent for the selected pill");
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/__kit/staff`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.evaluate(() => {
    document.documentElement.classList.add("staff-theme");
    document.documentElement.dataset.staffTone = "admin";
    document.documentElement.dataset.theme = "light";
  });
  const tab = await page.evaluate(() => {
    const el = document.querySelector('.st-tabs a[aria-current="page"]');
    const rail = document.querySelector(".st-tabs");
    return {
      bg: el ? getComputedStyle(el).backgroundColor : "",
      color: el ? getComputedStyle(el).color : "",
      railBorder: rail ? getComputedStyle(rail).borderTopWidth : "",
    };
  });
  pass("selected tab is a lime pill", tab.bg === ACCENT, tab.bg);
  pass("selected tab label uses ink", tab.color === ACCENT_INK, tab.color);
  pass("tab rail is a bordered segmented control", tab.railBorder === "1px", tab.railBorder);
  await context.close();
}

console.log("\n(e) no horizontal overflow, desktop -> phone");
for (const width of [1440, 1280, 1024, 768, 390]) {
  const { context, page } = await size(width);
  const result = await page.evaluate(() => {
    const style = getComputedStyle(document.querySelector(".st-tabbar"));
    const sidebar = getComputedStyle(document.querySelector(".st-sidebar"));
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      tabbar: style.display,
      sidebarTransform: sidebar.transform,
    };
  });
  pass(`@${width}px no horizontal overflow`, result.overflow <= 1, `${result.overflow}px`);
  if (width < 1024) {
    pass(`@${width}px bottom tab bar visible`, result.tabbar !== "none", result.tabbar);
    pass(`@${width}px sidebar hidden off-canvas`, result.sidebarTransform !== "none", result.sidebarTransform);
  }
  await context.close();
}

console.log("\n(f) phone drawer opens and the page still fits");
{
  const { context, page } = await size(390);
  await page.getByRole("button", { name: "Цэс нээх" }).click();
  await page.waitForTimeout(250);
  const drawer = await page.evaluate(() => {
    const sidebar = document.querySelector(".st-sidebar");
    const box = sidebar.getBoundingClientRect();
    return {
      open: sidebar.dataset.open === "1",
      left: Math.round(box.left),
      width: Math.round(box.width),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  pass("drawer opens on the left edge", drawer.open && drawer.left === 0, `left ${drawer.left}, width ${drawer.width}`);
  pass("open drawer adds no page scroll", drawer.overflow <= 1, `${drawer.overflow}px`);
  await context.close();
}

await browser.close();
console.log(failed === 0 ? "\ncheck-redesign PASS\n" : `\ncheck-redesign FAIL (${failed})\n`);
process.exit(failed === 0 ? 0 : 1);
