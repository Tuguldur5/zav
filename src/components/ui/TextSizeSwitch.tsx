"use client";

import { useEffect, useState } from "react";
import { cx } from "./styles";

const KEY = "zav-text-size";
const OPTIONS = [
  { id: "normal", label: "Хэвийн", sample: "Аа" },
  { id: "large", label: "Том", sample: "Аа" },
  { id: "xlarge", label: "Маш том", sample: "Аа" },
] as const;

type SizeId = (typeof OPTIONS)[number]["id"];

function apply(size: SizeId) {
  document.documentElement.dataset.textsize = size;
}

function readStored(): SizeId {
  if (typeof window === "undefined") return "normal";
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "normal" || saved === "large" || saved === "xlarge") return saved;
  } catch {
    // localStorage can be unavailable in private mode; ignore.
  }
  return "normal";
}

export function TextSizeSwitch() {
  const [size, setSize] = useState<SizeId>(readStored);

  useEffect(() => {
    apply(size);
  }, [size]);

  function choose(next: SizeId) {
    setSize(next);
    apply(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // Ignore persistence failures.
    }
  }

  return (
    <fieldset className="flex flex-col gap-2" suppressHydrationWarning>
      <legend className="text-[0.9em] font-semibold">Үсгийн хэмжээ</legend>
      <div className="flex gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => choose(option.id)}
            aria-pressed={size === option.id}
            className={cx(
              "press flex min-h-[var(--control-h)] flex-1 flex-col items-center justify-center rounded-md border-2",
              size === option.id
                ? "border-primary bg-primary-container text-on-primary-container"
                : "border-outline bg-surface text-ink",
            )}
          >
            <span
              aria-hidden
              className={cx(
                "font-semibold leading-none",
                option.id === "normal" && "",
                option.id === "large" && "text-[1.2em]",
                option.id === "xlarge" && "text-[1.35em]",
              )}
            >
              {option.sample}
            </span>
            <span className="mt-1 text-[0.8em]">{option.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
