import { statusMeta, type StatusMeta, type StatusTone } from "@/lib/status";
import { cx } from "./styles";

const tones: Record<StatusTone, string> = {
  primary: "bg-primary-container text-on-primary-container",
  success: "bg-success-container text-success",
  warm: "bg-warm text-warm-ink",
  error: "bg-error-container text-error",
  neutral: "bg-surface2 text-ink",
};

/** Status is never colour alone: always colour + icon + text. */
export function StatusPill({
  status,
  table,
  meta,
  className,
}: {
  status?: string;
  table?: Record<string, StatusMeta>;
  meta?: StatusMeta;
  className?: string;
}) {
  const resolved = meta ?? (status && table ? statusMeta(status, table) : undefined);
  if (!resolved) return null;
  const Icon = resolved.icon;

  return (
    <span
      data-status-pill=""
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8em] font-medium",
        tones[resolved.tone],
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {resolved.label}
    </span>
  );
}
