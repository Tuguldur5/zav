/**
 * Auth panel art: a confirmed-job card with a check seal, a mini row of
 * availability cells and two abstract people. Same stroke language as HeroArt.
 */
export function AuthArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 210"
      role="presentation"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="262" cy="42" r="34" fill="var(--backdrop-glow-amber)" />
      <circle cx="42" cy="168" r="30" fill="var(--backdrop-glow-mint)" />

      <rect x="40" y="26" width="214" height="158" rx="16" fill="#fff" stroke="var(--divider)" strokeWidth="1.5" />
      <rect x="58" y="44" width="76" height="11" rx="5.5" fill="var(--surface-2)" />
      <rect x="58" y="64" width="126" height="9" rx="4.5" fill="var(--surface-2)" />

      {[0, 1, 2, 3, 4, 5, 6].map((index) => (
        <rect
          key={index}
          x={58 + index * 27}
          y={86}
          width="21"
          height="20"
          rx="6"
          fill={index === 2 || index === 3 ? "var(--primary-container)" : "#fff"}
          stroke="var(--divider)"
        />
      ))}

      <rect x="58" y="118" width="132" height="30" rx="9" fill="var(--success-container)" />
      <circle cx="74" cy="133" r="7" fill="var(--success)" />
      <path d="m71 133 2.2 2.2 3.6-4.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="88" y="126" width="64" height="6" rx="3" fill="var(--success)" opacity=".55" />
      <rect x="88" y="136" width="42" height="5" rx="2.5" fill="var(--success)" opacity=".35" />

      <circle cx="256" cy="132" r="30" fill="var(--primary-container)" stroke="#fff" strokeWidth="4" />
      <circle cx="256" cy="125" r="9" fill="var(--primary)" opacity=".8" />
      <path d="M239 152c3-8 9-12 17-12s14 4 17 12" fill="var(--primary)" opacity=".55" />

      <circle cx="236" cy="176" r="17" fill="var(--warm)" stroke="#fff" strokeWidth="3" />
      <path d="M40 184h130" stroke="var(--divider)" strokeWidth="1.5" />
    </svg>
  );
}
