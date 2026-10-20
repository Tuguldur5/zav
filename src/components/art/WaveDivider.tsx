/**
 * Soft wave that joins a tinted band to the section above it. The fill is
 * `currentColor`, so the caller sets the band colour with a text-* class.
 */
export function WaveDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 72"
      preserveAspectRatio="none"
      aria-hidden="true"
      role="presentation"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 72V38c96 0 150-18 248-18s168 22 286 22 194-26 316-26 208 18 320 18 176-16 270-16v54z"
        fill="currentColor"
      />
    </svg>
  );
}
