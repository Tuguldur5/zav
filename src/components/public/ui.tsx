import type { ReactNode } from "react";
import { Check, CircleDot, CircleX, Clock3, Inbox } from "lucide-react";

/** Shared Slots styles for customer and worker app screens. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("public-container", className)}>
      {children}
    </div>
  );
}

export function Card({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={cx("public-card", className)}>
      {children}
    </div>
  );
}

export function buttonCls(
  kind: "primary" | "secondary" | "text" = "primary",
  full = false,
): string {
  const base = "public-button";
  const kinds: Record<string, string> = {
    primary: "public-button--primary",
    secondary: "public-button--secondary",
    text: "public-button--text",
  };
  return cx(
    base,
    kinds[kind],
    full && "public-button--full",
  );
}

export const inputCls = "public-input";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="public-field">
      <span>{label}</span>
      {children}
      {hint ? <span className="public-field-hint">{hint}</span> : null}
      {error ? <span className="public-field-error" role="alert">{error}</span> : null}
    </label>
  );
}

export function PageTitle({
  title,
  lead,
  action,
}: {
  title: string;
  lead?: string;
  action?: ReactNode;
}) {
  return (
    <div className="public-page-title-row">
      <div className="min-w-0">
        <h1 className="public-page-title">{title}</h1>
        {lead ? <p className="public-page-lead">{lead}</p> : null}
      </div>
      {action ? <div className="public-page-action">{action}</div> : null}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="public-section-title">
      <h2>{children}</h2>
      {action}
    </div>
  );
}

export function Note({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "ok" | "warn" | "err";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: "public-note--neutral",
    ok: "public-note--ok",
    warn: "public-note--warn",
    err: "public-note--err",
  };
  return (
    <div className={cx("public-note", tones[tone])}>{children}</div>
  );
}

export function StatusTag({
  tone,
  children,
}: {
  tone: "primary" | "ok" | "warn" | "err" | "neutral" | "success" | "warm" | "error";
  children: ReactNode;
}) {
  const normalized =
    tone === "success" ? "ok" : tone === "warm" ? "warn" : tone === "error" ? "err" : tone;
  const tones: Record<string, string> = {
    primary: "public-status--primary",
    ok: "public-status--ok",
    warn: "public-status--warn",
    err: "public-status--err",
    neutral: "public-status--neutral",
  };
  const Icon =
    normalized === "ok"
      ? Check
      : normalized === "warn"
        ? Clock3
        : normalized === "err"
          ? CircleX
          : CircleDot;
  return (
    <span className={cx("public-status", tones[normalized])}>
      <Icon aria-hidden className="size-4" />
      {children}
    </span>
  );
}

export function EmptyBox({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="public-empty">
      <Inbox aria-hidden className="public-empty-icon" />
      <p className="public-empty-title">{title}</p>
      {body ? <p className="public-empty-body">{body}</p> : null}
      {action}
    </div>
  );
}
