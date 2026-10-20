"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { AdminDesk } from "./AdminDesk";
import { CommandPalette } from "./CommandPalette";
import { Dock } from "./Dock";
import { FloatingRail } from "./FloatingRail";
import { StaffHeader } from "./StaffHeader";
import {
  adminDock,
  adminNav,
  adminPhone,
  adminPlus,
  superDock,
  superNav,
  superPhone,
  superPlus,
} from "./nav";
import type {
  StaffCounts,
  StaffDeskData,
  StaffNotice,
  StaffPaletteItem,
  StaffTone,
} from "./types";
import type { Role } from "@/lib/types";

const DENSITY_KEY = "zav.staff.density";
const VIEW_KEY = "zav.staff.view";

type View = "auto" | "table" | "cards";

/**
 * The Control Center shell. All breakpoints are CSS; the only state is what the
 * rail switches (palette, density, list view) plus the aside drawer. The paper
 * scrolls its main column and its desk independently.
 */
export function StaffShell({
  tone,
  role,
  name,
  email,
  lastSignIn,
  counts,
  desk,
  palette,
  notices,
  activeHref,
  children,
}: {
  tone: StaffTone;
  role: Role;
  /** Dev previews only: the real shell derives it from the pathname. */
  activeHref?: string;
  name: string;
  email: string;
  lastSignIn: string | null;
  counts: StaffCounts;
  desk: StaffDeskData;
  palette: StaffPaletteItem[];
  notices: StaffNotice[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const superAdmin = tone === "super";
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [view, setView] = useState<View>("auto");
  const [hasLists, setHasLists] = useState(false);

  // Remembered density/view (private-mode safe), applied after mount.
  useEffect(() => {
    try {
      setCompact(window.localStorage.getItem(DENSITY_KEY) === "compact");
      const stored = window.localStorage.getItem(VIEW_KEY);
      if (stored === "table" || stored === "cards") setView(stored);
    } catch {
      // Defaults stay.
    }
  }, []);

  // Only pages that render both a table and a card list get the view switch.
  useEffect(() => {
    setHasLists(Boolean(document.querySelector(".paper [data-staff-table]")));
    setDrawerOpen(false);
  }, [pathname, children]);

  const toggleView = useCallback(() => {
    setView((current) => {
      const effective =
        current === "auto"
          ? window.matchMedia("(min-width: 1024px)").matches
            ? "table"
            : "cards"
          : current;
      const next = effective === "table" ? "cards" : "table";
      try {
        window.localStorage.setItem(VIEW_KEY, next);
      } catch {
        // Ignore.
      }
      return next;
    });
  }, []);

  const toggleDensity = useCallback(() => {
    setCompact((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(DENSITY_KEY, next ? "compact" : "comfortable");
      } catch {
        // Ignore.
      }
      return next;
    });
  }, []);

  // Global shortcuts/events: "/" palette; page-title menu and the phone sheet
  // reach the rail actions through custom events (no context needed).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (target?.isContentEditable) return;
      event.preventDefault();
      setPaletteOpen(true);
    }
    const openPalette = () => setPaletteOpen(true);
    const openDesk = () => setDrawerOpen(true);
    const density = () => toggleDensity();
    const viewEvent = () => toggleView();
    document.addEventListener("keydown", onKey);
    window.addEventListener("zav:staff-palette", openPalette);
    window.addEventListener("zav:staff-desk", openDesk);
    window.addEventListener("zav:staff-density", density);
    window.addEventListener("zav:staff-view", viewEvent);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("zav:staff-palette", openPalette);
      window.removeEventListener("zav:staff-desk", openDesk);
      window.removeEventListener("zav:staff-density", density);
      window.removeEventListener("zav:staff-view", viewEvent);
    };
  }, [toggleDensity, toggleView]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const nav = superAdmin ? superNav : adminNav;
  const railQuick = superAdmin ? superPlus : adminPlus;

  return (
    <div className="staff-app" data-staff-frame="" data-tone={tone}>
      <StaffHeader
        tone={tone}
        role={role}
        nav={nav}
        counts={counts}
        name={name}
        email={email}
        lastSignIn={lastSignIn}
        activeHref={activeHref}
        onOpenDesk={() => setDrawerOpen(true)}
      />

      <div
        className="paper"
        data-staff-panel=""
        data-staff-density={compact ? "compact" : "comfortable"}
        data-staff-view={view === "auto" ? undefined : view}
        data-staff-aside="open"
      >
        <span className="staff-notch" aria-hidden />

        <FloatingRail
          onOpenPalette={() => setPaletteOpen(true)}
          hasLists={hasLists}
          view={view === "cards" ? "cards" : "table"}
          onToggleView={toggleView}
          compact={compact}
          onToggleDensity={toggleDensity}
          unread={counts.alerts}
          notices={notices}
          quick={railQuick}
        />

        <div className="staff-main">
          <div className="staff-content">{children}</div>
        </div>

        <aside className="staff-aside" aria-label={desk.title}>
          <AdminDesk desk={desk} />
        </aside>
      </div>

      <Dock
        items={superAdmin ? superDock : adminDock}
        phoneItems={superAdmin ? superPhone : adminPhone}
        plus={railQuick}
        more={nav.map((item) => ({ label: item.label, href: item.href }))}
        onOpenDesk={() => setDrawerOpen(true)}
      />

      {drawerOpen ? (
        <div className="staff-drawer" role="dialog" aria-modal="true" aria-label={desk.title}>
          <button
            type="button"
            className="staff-drawer-scrim"
            aria-label="Хаах"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="staff-drawer-panel" data-staff-desk-drawer="">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Хаах"
              title="Хаах"
              className="press grid size-10 place-items-center self-end rounded-full"
            >
              <X aria-hidden className="size-5" />
            </button>
            <AdminDesk desk={desk} />
          </div>
        </div>
      ) : null}

      <CommandPalette
        items={palette}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  );
}
