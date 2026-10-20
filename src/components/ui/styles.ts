export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export type ButtonVariant = "filled" | "tonal" | "outline" | "text";
export type ButtonSize = "md" | "sm";

/**
 * Buttons take their height from --control-h, so the same component looks right
 * on a phone (>=48px, touch) and on a staff desktop (36px) without any JS.
 * Font size is inherited from <body>, which follows --fs-body.
 */
export function buttonClass(
  variant: ButtonVariant = "filled",
  full = false,
  size: ButtonSize = "md",
): string {
  const base =
    "press inline-flex items-center justify-center gap-2 rounded-md font-medium border disabled:opacity-50 disabled:pointer-events-none";

  const sizes: Record<ButtonSize, string> = {
    md: "min-h-[var(--control-h)] px-4",
    // Small buttons stay tappable: 44px whenever the pointer is coarse.
    sm: "min-h-[34px] px-3 text-[0.9em] [@media(pointer:coarse)]:min-h-[44px]",
  };

  const variants: Record<ButtonVariant, string> = {
    filled:
      "bg-primary text-on-primary border-primary hover:bg-primary-hover hover:border-primary-hover",
    tonal:
      "bg-primary-container text-on-primary-container border-transparent hover:brightness-[0.97]",
    outline: "bg-surface text-ink border-outline hover:bg-surface2",
    text: "bg-transparent text-primary border-transparent hover:bg-surface2",
  };

  return cx(base, sizes[size], variants[variant], full && "w-full");
}

export const surfaceCard = "rounded-lg border border-divider bg-surface";

export const inputClass =
  "w-full rounded-md border border-outline bg-surface px-3 text-ink placeholder:text-muted min-h-[var(--control-h)]";

/** Consistent label/hint styling for every form field. */
export const labelClass = "mb-1 block text-[0.9em] font-medium text-ink";
export const hintClass = "mt-1 text-[0.85em] text-muted";
export const fieldErrorClass = "mt-1 text-[0.85em] text-error";
