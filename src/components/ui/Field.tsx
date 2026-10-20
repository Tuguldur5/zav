import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { AlertCircle } from "lucide-react";
import { buttonClass, cx, fieldErrorClass, hintClass, inputClass, labelClass } from "./styles";

/** Label + control + hint + accessible error text. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col", className)}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
        {required ? <span className="ml-0.5 text-error">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className={fieldErrorClass} role="alert">
          <span className="inline-flex items-center gap-1">
            <AlertIcon />
            {error}
          </span>
        </p>
      ) : hint ? (
        <p className={hintClass}>{hint}</p>
      ) : null}
    </div>
  );
}

function AlertIcon() {
  return <AlertCircle aria-hidden className="size-4 shrink-0" />;
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputClass, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(inputClass, "pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputClass, "py-2", className)} {...rest} />;
}

export function Checkbox({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cx("flex min-h-11 cursor-pointer items-center gap-3", className)}>
      <input type="checkbox" className="size-5 shrink-0 accent-[var(--primary)]" {...rest} />
      <span className="text-[0.95em]">{label}</span>
    </label>
  );
}

export function Radio({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cx("flex min-h-11 cursor-pointer items-center gap-3", className)}>
      <input type="radio" className="size-5 shrink-0 accent-[var(--primary)]" {...rest} />
      <span className="text-[0.95em]">{label}</span>
    </label>
  );
}

/** Square icon-only button, always at least 44px on touch pointers. */
export function IconButton({
  label,
  variant = "outline",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: "outline" | "text" | "tonal";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        buttonClass(variant, false, "sm"),
        "size-[var(--control-h)] min-h-[var(--control-h)] shrink-0 px-0 [@media(pointer:coarse)]:size-11",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Underline tabs, horizontally scrollable on phones. */
export function Tabs({
  items,
  className,
}: {
  items: { href: string; label: string; active: boolean; count?: number }[];
  className?: string;
}) {
  return (
    <div className={cx("-mb-px flex gap-1 overflow-x-auto border-b border-divider", className)}>
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cx(
            "press flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-[0.9em] font-medium",
            item.active
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-ink",
          )}
        >
          {item.label}
          {typeof item.count === "number" ? (
            <span className="rounded-full bg-surface2 px-2 py-0.5 text-[0.8em] text-muted">
              {item.count}
            </span>
          ) : null}
        </a>
      ))}
    </div>
  );
}

/** Two-to-four exclusive choices as one control. */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  name,
  className,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  name?: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cx("inline-flex rounded-md border border-outline bg-surface p-0.5", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cx(
              "press min-h-[calc(var(--control-h)-6px)] rounded-[8px] px-3 text-[0.9em] font-medium",
              active
                ? "bg-primary-container text-on-primary-container"
                : "text-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
