type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Step 1: post a job. */
export function StepIcon1({ className }: IconProps) {
  return (
    <svg {...base} className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="3.5" width="14" height="17" rx="3" />
      <path d="M9 3.5h6v2.5H9z" />
      <path d="M12 10.5v6M9 13.5h6" />
    </svg>
  );
}

/** Step 2: an admin matches a worker. */
export function StepIcon2({ className }: IconProps) {
  return (
    <svg {...base} className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="3" />
      <path d="M2.5 20c0-3.3 2.5-5.5 5.5-5.5 1.6 0 3 .6 4 1.7" />
      <circle cx="17" cy="13.5" r="2.5" />
      <path d="M13.5 21c0-2.2 1.6-3.9 3.5-3.9s3.5 1.7 3.5 3.9" />
    </svg>
  );
}

/** Step 3: the job is confirmed. */
export function StepIcon3({ className }: IconProps) {
  return (
    <svg {...base} className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.2 2.7 2.8L16 9.5" />
    </svg>
  );
}
