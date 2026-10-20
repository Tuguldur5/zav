import { cx } from "./styles";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex w-full items-start gap-1 overflow-x-auto pb-2" aria-label="Алхмууд">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center gap-1">
              <span
                className={cx(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-[0.8em] font-semibold",
                  done && "bg-success text-white",
                  active && "bg-primary text-on-primary",
                  !done && !active && "bg-container text-muted",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? "✓" : index + 1}
              </span>
              {index < steps.length - 1 ? (
                <span
                  className={cx("h-1 flex-1 rounded-full", done ? "bg-success" : "bg-container")}
                />
              ) : null}
            </div>
            <span
              className={cx(
                "w-full truncate text-center text-[11px] leading-tight",
                active ? "font-semibold text-ink" : "text-muted",
              )}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
