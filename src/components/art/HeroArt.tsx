/**
 * Landing hero art: a calendar card, an overlapping phone with two chips and
 * two abstract avatars. Tokens only, no raster images, no numbers, no faces.
 * The 35 day cells are one pattern fill, which keeps the SVG small.
 */
const SKY_CELLS = [9, 10, 11, 24];
const GREEN_CELL = 17;
const AMBER_CELL = 30;

const cellAt = (index: number) => ({
  x: 138 + (index % 7) * 36,
  y: 90 + Math.floor(index / 7) * 34,
});

export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 440 430"
      role="presentation"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="hero-days" x="138" y="90" width="36" height="34" patternUnits="userSpaceOnUse">
          <rect width="30" height="26" rx="7" fill="#fff" stroke="var(--divider)" />
        </pattern>
      </defs>

      {/* Soft blobs behind everything. */}
      <circle cx="338" cy="336" r="86" fill="var(--backdrop-glow-sky)" />
      <circle cx="66" cy="304" r="58" fill="var(--backdrop-glow-mint)" />
      <circle cx="402" cy="62" r="46" fill="var(--backdrop-glow-amber)" />

      {/* Calendar card and its day grid. */}
      <rect x="118" y="28" width="294" height="264" rx="18" fill="#fff" stroke="var(--divider)" strokeWidth="1.5" />
      <rect x="138" y="48" width="104" height="14" rx="7" fill="var(--surface-2)" />
      <circle cx="374" cy="55" r="4" fill="var(--primary-container)" />
      <circle cx="388" cy="55" r="4" fill="var(--primary-container)" />
      <path d="M138 75h254" stroke="var(--divider)" strokeWidth="1.5" />
      <rect x="138" y="90" width="246" height="162" fill="url(#hero-days)" />

      {SKY_CELLS.map((index) => {
        const cell = cellAt(index);
        return (
          <rect
            key={index}
            x={cell.x}
            y={cell.y}
            width="30"
            height="26"
            rx="7"
            fill="var(--primary-container)"
            stroke="var(--divider)"
          />
        );
      })}

      {/* One green cell with a check badge, one amber cell. */}
      <rect
        x={cellAt(GREEN_CELL).x}
        y={cellAt(GREEN_CELL).y}
        width="30"
        height="26"
        rx="7"
        fill="var(--success-container)"
        stroke="var(--success)"
        strokeWidth="1.75"
      />
      <circle cx={cellAt(GREEN_CELL).x + 27} cy={cellAt(GREEN_CELL).y + 24} r="8" fill="var(--success)" />
      <path
        d={`M${cellAt(GREEN_CELL).x + 23.5} ${cellAt(GREEN_CELL).y + 24}l2.6 2.6 4-5`}
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect
        x={cellAt(AMBER_CELL).x}
        y={cellAt(AMBER_CELL).y}
        width="30"
        height="26"
        rx="7"
        fill="var(--warm)"
        stroke="var(--divider)"
      />

      {/* Abstract avatars, no faces. */}
      <circle cx="72" cy="126" r="25" fill="var(--primary-container)" stroke="#fff" strokeWidth="3" />
      <circle cx="109" cy="92" r="17" fill="var(--warm)" stroke="#fff" strokeWidth="3" />
      <path
        d="M96 118c16 10 24 18 30 30"
        stroke="var(--primary)"
        strokeWidth="1.5"
        strokeDasharray="4 5"
        strokeLinecap="round"
        opacity=".55"
        fill="none"
      />

      {/* Phone overlapping the lower-left corner of the calendar. */}
      <rect x="28" y="192" width="146" height="222" rx="22" fill="#fff" stroke="var(--primary)" strokeWidth="1.75" />
      <rect x="36" y="206" width="130" height="190" rx="14" fill="var(--surface-2)" />
      <rect x="46" y="220" width="100" height="26" rx="13" fill="var(--primary-container)" />
      <text x="96" y="237" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--on-primary-container)">
        Чөлөөтэй
      </text>
      <rect x="46" y="254" width="114" height="26" rx="13" fill="var(--success-container)" />
      <text x="103" y="271" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--success)">
        Баталгаажсан
      </text>
      <rect x="46" y="294" width="96" height="10" rx="5" fill="var(--divider)" />
      <rect x="46" y="312" width="68" height="10" rx="5" fill="var(--divider)" />
      <circle cx="62" cy="350" r="12" fill="var(--success-container)" />
      <rect x="82" y="342" width="70" height="8" rx="4" fill="var(--divider)" />
      <rect x="82" y="356" width="46" height="8" rx="4" fill="var(--divider)" />
      <rect x="78" y="398" width="46" height="4" rx="2" fill="var(--outline)" />
    </svg>
  );
}
