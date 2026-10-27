import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const customer = read("../src/app/site/page.tsx");
const customerSections = read("../src/components/site/CustomerLandingSections.tsx");
const worker = read("../src/app/worker/page.tsx");
const workerSections = read("../src/components/site/WorkerLandingSections.tsx");
const orderBar = read("../src/components/site/OrderBar.tsx");
const orderPage = read("../src/app/site/c/new/page.tsx");
const skillLoader = read("../src/lib/marketing/skills.ts");
const copy = read("../src/lib/i18n/mn.marketing.ts");
const header = read("../src/components/site/SiteHeader.tsx");
const css = read("../src/app/globals.css");
const customerSurface = `${customer}\n${customerSections}`;
const workerSurface = `${worker}\n${workerSections}`;

function ordered(source, markers) {
  let position = -1;
  return markers.every((marker) => {
    position = source.indexOf(marker, position + 1);
    return position >= 0;
  });
}

function hasSectionLayouts(source) {
  const sections = [...source.matchAll(/<section\b[^>]*>/g)].map(([tag]) => tag);
  return sections.length > 0 && sections.every((tag) =>
    /landing-hero|landing-section|trust-section|worker-band|closing-cta|worker-requirements-section|landing-marquee/.test(
      tag,
    ),
  );
}

const hiddenHeroRule = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/gs)].some(([, selector, body]) =>
  /(?:\.hero-[\w-]+|\.landing-title|\.landing-lead)/.test(selector) &&
  /\bopacity\s*:\s*0(?:\s|;|$)/.test(body),
);

const checks = [
  [
    "customer landing sections follow hero, marquee, services, process, trust, FAQ, and CTA order",
    ordered(customerSurface, [
      'id="customer-hero"',
      'className="landing-marquee"',
      'id="services"',
      'id="how"',
      'id="trust"',
      'id="faq"',
      'className="closing-cta"',
    ]),
  ],
  [
    "worker landing sections follow hero, marquee, benefits, process, requirements, FAQ, and CTA order",
    ordered(workerSurface, [
      'id="worker-hero"',
      'className="landing-marquee"',
      'id="benefits"',
      'id="how"',
      'id="requirements"',
      'id="faq"',
      'className="closing-cta worker-closing-cta"',
    ]),
  ],
  [
    "customer landing has exactly one H1 and at least eight semantic sections",
    (customerSurface.match(/<h1\b/g) ?? []).length === 1 &&
      (customerSurface.match(/<section\b/g) ?? []).length >= 8,
  ],
  [
    "worker landing has exactly one H1 and at least six semantic sections",
    (workerSurface.match(/<h1\b/g) ?? []).length === 1 &&
      (workerSurface.match(/<section\b/g) ?? []).length >= 6,
  ],
  [
    "every landing section uses a defined Slots layout class",
    hasSectionLayouts(customerSurface) && hasSectionLayouts(workerSurface),
  ],
  [
    "landing header has an audience switch and exactly one sign-in action, without a register button",
    header.includes("<AudienceSwitch") &&
      (header.match(/<AuthTrigger\b/g) ?? []).length === 1 &&
      !header.includes("Бүртгүүлэх"),
  ],
  [
    "both landing pages mount audience-specific auth dialogs",
    /audience="customer"/.test(customer) && /audience="worker"/.test(worker),
  ],
  [
    "public skill catalogs exclude inactive and sensitive skills",
    [customer, worker, orderPage].every((source) => source.includes("loadPublicSkills")) &&
      skillLoader.includes('.eq("active", true)') &&
      skillLoader.includes('.eq("sensitive", false)') &&
      skillLoader.includes("publicSkills((legacy.data as Skill[] | null) ?? [])"),
  ],
  [
    "order bar passes only skill, district, and timing prefills",
    orderBar.includes('["skill", "district", "when"]') &&
      orderBar.includes('dialog.open("register", { next })'),
  ],
  [
    "order route validates catalog and timing prefills",
    orderPage.includes("skills.some((skill) => skill.id === params.skill") &&
      orderPage.includes("districts.some((district) => district.id === params.district)") &&
      orderPage.includes('params.when === "today"') &&
      orderPage.includes('params.when === "tomorrow"'),
  ],
  [
    "worker benefits and combined requirements/install section contain the Slots motif",
    workerSections.includes("className=\"benefit-slot-sample\"") &&
      workerSections.includes("className=\"worker-requirements-section\"") &&
      workerSections.includes("<SlotStrip"),
  ],
  [
    "marquees use catalog skills with an i18n fallback list and visible pause control",
    [customerSurface, workerSurface].every((source) =>
      source.includes("mn.design.marqueeItems.map") &&
      source.includes("pauseLabel={mn.design.pause}") &&
      source.includes("landing-motion-toggle"),
    ),
  ],
  [
    "worker age policy is disclosed without asserting an age limit",
    copy.includes("Насны доод хязгаар бий юу?") &&
      copy.includes("Насны шаардлагыг админаас тодруулна уу."),
  ],
  [
    "policy-sensitive FAQ copy has no unresolved owner markers",
    !copy.includes("Confirm with owner"),
  ],
  [
    "no landing heading starts hidden and no example support number is included",
    !hiddenHeroRule &&
      !`${customerSurface}\n${workerSurface}\n${copy}`.includes("7000 1234"),
  ],
  [
    "motion and mobile sticky action honor reduced motion and focus",
    css.includes("prefers-reduced-motion: reduce") &&
      css.includes("mobile-sticky-action") &&
      css.includes("body:has(.landing-page select:focus)"),
  ],
];

let failures = 0;
for (const [label, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}`);
  if (!passed) failures += 1;
}

if (failures) process.exitCode = 1;
else console.log(`Landing check passed (${checks.length} checks).`);
