import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CircleX,
} from "lucide-react";
import type { ReactNode } from "react";
import { SlotStrip, type SlotRow } from "./SlotStrip";
import { CalendarDemoClient } from "./CalendarDemoClient";
import { NativeDialog } from "./NativeDialog";

type ButtonVariant = "primary" | "accent" | "secondary";

export function Button({
  children,
  variant = "primary",
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`ds-button ds-button--${variant}`}
      disabled={disabled}
    >
      <span>{children}</span>
      {variant !== "secondary" ? <ArrowRight aria-hidden className="ds-button-arrow" /> : null}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
}) {
  return (
    <Link href={href} className={`ds-button ds-button--${variant}`}>
      <span>{children}</span>
      {variant !== "secondary" ? <ArrowRight aria-hidden className="ds-button-arrow" /> : null}
    </Link>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="ds-chip">{children}</span>;
}

export function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "ok" | "warn" | "err";
}) {
  const Icon = tone === "ok" ? Check : tone === "warn" ? AlertTriangle : CircleX;
  return (
    <span className={`ds-status ds-status--${tone}`}>
      <Icon aria-hidden className="size-4" />
      {children}
    </span>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="ds-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? (
        <span className="ds-field-error" role="alert">
          <AlertCircle aria-hidden className="size-4" />
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function Skeleton({
  rows,
  description,
}: {
  rows: ReadonlyArray<SlotRow>;
  description: string;
}) {
  return <SlotStrip rows={rows} variant="loader" description={description} />;
}

export function Toast({ children }: { children: ReactNode }) {
  return (
    <div className="ds-toast" role="status">
      <span aria-hidden className="ds-toast-mark" />
      {children}
    </div>
  );
}

export function BentoTile({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <article className="bento-tile">
      {children}
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </article>
  );
}

export function Faq({
  items,
}: {
  items: ReadonlyArray<{ q: string; a: string }>;
}) {
  return (
    <div className="ds-faq">
      {items.map(({ q, a }) => (
        <details key={q}>
          <summary>
            <span>{q}</span>
            <span aria-hidden className="faq-plus" />
          </summary>
          <div className="faq-answer">
            <p>{a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

export function Marquee({
  items,
  pauseLabel,
  showToggle = true,
}: {
  items: ReadonlyArray<{ label: string; icon?: ReactNode }>;
  pauseLabel: string;
  showToggle?: boolean;
}) {
  const first = items.slice(0, Math.ceil(items.length / 2));
  const second = items.slice(Math.ceil(items.length / 2)).reverse();
  return (
    <div className="ds-marquee">
      {showToggle ? (
        <label className="ds-motion-toggle">
          <input type="checkbox" />
          <span>{pauseLabel}</span>
        </label>
      ) : null}
      {[first, second].map((row, rowIndex) => (
        <div className={`marquee-track marquee-track--${rowIndex}`} key={rowIndex}>
          {[...row, ...row].map((item, itemIndex) => (
            <span className="marquee-chip" key={`${item.label}-${itemIndex}`}>
              {item.icon}
              {item.label}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AudienceSwitch({
  active,
  customerHref,
  workerHref,
  customerLabel,
  workerLabel,
  label,
}: {
  active: "customer" | "worker";
  customerHref: string;
  workerHref: string;
  customerLabel: string;
  workerLabel: string;
  label: string;
}) {
  return (
    <nav className="audience-switch" aria-label={label} data-active={active}>
      <span aria-hidden className="audience-switch-indicator" />
      <Link href={customerHref} aria-current={active === "customer" ? "page" : undefined}>
        {customerLabel}
      </Link>
      <Link href={workerHref} aria-current={active === "worker" ? "page" : undefined}>
        {workerLabel}
      </Link>
    </nav>
  );
}

export function DesignDialog({
  openLabel,
  title,
  closeLabel,
}: {
  openLabel: string;
  title: string;
  closeLabel: string;
}) {
  return <NativeDialog openLabel={openLabel} title={title} closeLabel={closeLabel} />;
}

export function CalendarDemo({
  label,
  title,
  hint,
  freeLabel,
  emptyLabel,
}: {
  label: string;
  title: string;
  hint: string;
  freeLabel: string;
  emptyLabel: string;
}) {
  return (
    <CalendarDemoClient
      label={label}
      title={title}
      hint={hint}
      freeLabel={freeLabel}
      emptyLabel={emptyLabel}
    />
  );
}
