"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import type { StaffPaletteItem } from "./types";

/**
 * Staff-only command palette. It searches the page names, job titles and worker
 * names the server handed over — never emails, phones or private notes. The
 * rail search button and the page search pill open it; "/" also works.
 */
export function CommandPalette({
  items,
  open,
  onClose,
}: {
  items: StaffPaletteItem[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool = needle
      ? items.filter((item) => item.label.toLowerCase().includes(needle))
      : items;
    return pool.slice(0, 12);
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setIndex(0);
    const timer = window.setTimeout(() => input.current?.focus(), 20);
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  function go(item: StaffPaletteItem | undefined) {
    if (!item) return;
    onClose();
    router.push(item.href);
  }

  return (
    <div className="staff-palette" role="dialog" aria-modal="true" aria-label="Хайлт">
      <button type="button" className="staff-palette-scrim" aria-label="Хаах" onClick={onClose} />
      <div className="staff-palette-panel">
        <div className="flex items-center gap-2 px-4">
          <Search aria-hidden className="size-4 shrink-0 text-muted" />
          <input
            ref={input}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setIndex((value) => Math.min(results.length - 1, value + 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setIndex((value) => Math.max(0, value - 1));
              } else if (event.key === "Enter") {
                event.preventDefault();
                go(results[index]);
              }
            }}
            className="staff-palette-input"
            placeholder="Хуудас, зар эсвэл ажилтан хайх"
            aria-label="Хайлтын үг"
            autoComplete="off"
          />
        </div>
        <div className="staff-palette-list" role="listbox" aria-label="Хайлтын үр дүн">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-muted">Тохирох зүйл олдсонгүй.</p>
          ) : (
            results.map((item, position) => (
              <button
                key={`${item.kind}-${item.href}-${item.label}`}
                type="button"
                role="option"
                aria-selected={position === index}
                onMouseEnter={() => setIndex(position)}
                onClick={() => go(item)}
                className="staff-palette-item press"
              >
                <span className="min-w-0 truncate">{item.label}</span>
                <span className="staff-palette-kind">{item.kind}</span>
              </button>
            ))
          )}
        </div>
        <p className="flex items-center gap-1 border-t border-line px-4 py-2 text-[11px] text-muted">
          <CornerDownLeft aria-hidden className="size-3" />
          Сонгох · Esc хаах · / нээх
        </p>
      </div>
    </div>
  );
}
