import type { ReactNode } from "react";
import { cx } from "./styles";

export type ChipTone = "default" | "primary" | "success" | "warm" | "error";

const tones: Record<ChipTone, string> = {
  default: "bg-surface text-muted border-divider",
  primary: "bg-primary-container text-on-primary-container border-transparent",
  success: "bg-success-container text-success border-transparent",
  warm: "bg-warm text-warm-ink border-transparent",
  error: "bg-error-container text-error border-transparent",
};

export function Chip({
  children,
  tone = "default",
  selected = false,
  onClick,
  className,
  title,
}: {
  children: ReactNode;
  tone?: ChipTone;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
}) {
  const shared = cx(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.85em] font-medium",
    selected ? "border-primary bg-primary-container text-on-primary-container" : tones[tone],
    onClick && "press cursor-pointer hover:border-primary",
    className,
  );

  if (!onClick) {
    return (
      <span className={shared} title={title}>
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      // Chips are controls on touch screens, so they keep a 44px hit area there.
      className={cx(shared, "min-h-9 [@media(pointer:coarse)]:min-h-11")}
      title={title}
    >
      {children}
    </button>
  );
}
