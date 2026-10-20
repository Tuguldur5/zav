/**
 * Calm empty-state art. Same stroke language as the hero: 1.75 stroke, rounded,
 * sky/green/amber tints. Decorative only, so every SVG is aria-hidden.
 */
const base = {
  viewBox: "0 0 160 120",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true,
  role: "presentation" as const,
};

const stroke = {
  stroke: "var(--primary)",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function EmptyJobs({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <circle cx="126" cy="28" r="20" fill="var(--backdrop-glow-amber)" />
      <rect x="34" y="38" width="92" height="62" rx="12" fill="#fff" stroke="var(--divider)" strokeWidth="1.5" />
      <rect x="60" y="28" width="40" height="16" rx="7" fill="var(--primary-container)" stroke="var(--primary)" strokeWidth="1.5" />
      <path {...stroke} d="M34 60h92" opacity=".5" />
      <path {...stroke} d="M80 74v12M74 80h12" />
      <circle cx="120" cy="92" r="16" fill="var(--success-container)" />
      <path {...stroke} stroke="var(--success)" d="m113 92 4.5 4.5L127 88" />
    </svg>
  );
}

export function EmptyCalendar({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <circle cx="32" cy="30" r="18" fill="var(--backdrop-glow-mint)" />
      <rect x="36" y="30" width="88" height="76" rx="12" fill="#fff" stroke="var(--divider)" strokeWidth="1.5" />
      <path {...stroke} d="M36 52h88" />
      <path {...stroke} d="M56 24v12M104 24v12" />
      <rect x="52" y="64" width="16" height="14" rx="4" fill="var(--primary-container)" />
      <rect x="74" y="64" width="16" height="14" rx="4" fill="var(--primary-container)" />
      <rect x="96" y="64" width="16" height="14" rx="4" fill="var(--warm)" />
      <rect x="52" y="84" width="16" height="14" rx="4" fill="#fff" stroke="var(--divider)" />
      <rect x="74" y="84" width="16" height="14" rx="4" fill="#fff" stroke="var(--divider)" />
      <circle cx="122" cy="80" r="17" fill="var(--primary)" />
      <path d="M122 73v14M115 80h14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyOffers({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <circle cx="126" cy="88" r="20" fill="var(--backdrop-glow-sky)" />
      <path {...stroke} d="M32 54h20l8 16h40l8-16h20v46a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8z" />
      <path {...stroke} d="M32 70h96" opacity=".45" />
      <path {...stroke} stroke="var(--success)" d="M80 34v14M73 41h14" />
      <circle cx="122" cy="30" r="4" fill="var(--warm)" />
    </svg>
  );
}

export function EmptyWorkers({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <circle cx="36" cy="86" r="20" fill="var(--backdrop-glow-mint)" />
      <circle cx="64" cy="46" r="16" fill="var(--primary-container)" stroke="var(--primary)" strokeWidth="1.5" />
      <path {...stroke} d="M40 84c4-10 12-15 24-15s20 5 24 15" />
      <circle cx="108" cy="54" r="12" fill="var(--warm)" stroke="var(--warm-ink)" strokeWidth="1.5" />
      <path {...stroke} stroke="var(--warm-ink)" d="M90 84c3-8 9-12 18-12s15 4 18 12" />
      <path {...stroke} d="M122 92h6M125 89v6" opacity=".6" />
    </svg>
  );
}
