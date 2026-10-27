"use client";

import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { LoginPanel } from "./LoginPanel";
import { RegisterPanel } from "./RegisterPanel";
import { mn } from "@/lib/i18n/mn";
import type { District, Skill } from "@/lib/types";

const copy = mn.marketing.auth;
export type AuthTab = "login" | "register";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AuthDialog({
  audience,
  tab,
  next,
  districts,
  skills,
  formToken,
  switchHref,
  onTab,
  onClose,
}: {
  audience: "customer" | "worker";
  tab: AuthTab;
  next?: string;
  districts: District[];
  skills: Skill[];
  formToken: string;
  /** Absolute link to the other public host, opened on the register tab. */
  switchHref: string;
  onTab: (tab: AuthTab) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const closingRef = useRef(false);

  const hasInput = useCallback(() => {
    const root = panelRef.current;
    if (!root) return false;
    const fields = root.querySelectorAll<HTMLInputElement>(
      'input:not([type="hidden"]):not([type="checkbox"]), select, textarea',
    );
    for (const field of fields) {
      if (field.id === "website-field") continue;
      if (field.value.trim().length > 0) return true;
    }
    return Boolean(root.querySelector('input[type="checkbox"]:checked'));
  }, []);

  const requestClose = useCallback(() => {
    if (hasInput() && !window.confirm(copy.unsaved)) return;
    if (closingRef.current) return;
    const dialog = panelRef.current;
    if (!dialog?.open) {
      onClose();
      return;
    }
    closingRef.current = true;
    dialog.close();
    window.setTimeout(onClose, 240);
  }, [hasInput, onClose]);

  // Native dialog supplies focus containment and Escape; the page lock avoids
  // background scroll while it is modal.
  useEffect(() => {
    const dialog = panelRef.current;
    if (!dialog) return;
    closingRef.current = false;
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    dialog.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      requestClose();
    };
    const handleBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) requestClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("click", handleBackdrop);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("click", handleBackdrop);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      if (openerRef.current?.isConnected) openerRef.current.focus();
    };
  }, [requestClose]);

  function onTabKeys(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextTab: AuthTab = tab === "login" ? "register" : "login";
    onTab(nextTab);
    const container = event.currentTarget.parentElement;
    const target = container?.querySelector<HTMLButtonElement>(
      `[data-tab-button="${nextTab}"]`,
    );
    target?.focus();
  }

  return (
    <dialog
      ref={panelRef}
      aria-labelledby="auth-dialog-title"
      className="auth-panel"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span
          id="auth-dialog-title"
          className="inline-flex min-h-7 items-center rounded-[6px] bg-primary-soft px-2 text-[0.78em] font-semibold text-primary-ink"
        >
          {audience === "customer" ? copy.roleCustomer : copy.roleWorker}
        </span>
        <button
          type="button"
          onClick={requestClose}
          aria-label={copy.close}
          className="flex size-11 items-center justify-center rounded-[8px] text-muted hover:text-ink"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>

      <div role="tablist" aria-label={copy.tabLogin} className="auth-tabs mb-3">
        <span aria-hidden className="auth-tab-indicator" data-tab={tab} />
        <button
          type="button"
          role="tab"
          data-tab-button="login"
          id="tab-login"
          aria-selected={tab === "login"}
          aria-controls="auth-panel-body"
          tabIndex={tab === "login" ? 0 : -1}
          onClick={() => onTab("login")}
          onKeyDown={onTabKeys}
          className="auth-tab"
        >
          {copy.tabLogin}
        </button>
        <button
          type="button"
          role="tab"
          data-tab-button="register"
          id="tab-register"
          aria-selected={tab === "register"}
          aria-controls="auth-panel-body"
          tabIndex={tab === "register" ? 0 : -1}
          onClick={() => onTab("register")}
          onKeyDown={onTabKeys}
          className="auth-tab"
        >
          {copy.tabRegister}
        </button>
      </div>

      <p className="mb-4">
        <a
          href={switchHref}
          className="text-[0.85em] text-primary underline underline-offset-2"
        >
          {audience === "customer" ? copy.customerToWorker : copy.workerToCustomer}
        </a>
      </p>

      <div id="auth-panel-body" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <div key={tab} className="auth-swap">
          <div className="auth-swap-inner">
            {tab === "login" ? (
              <LoginPanel next={next} formToken={formToken} onSwitch={() => onTab("register")} />
            ) : (
              <RegisterPanel
                audience={audience}
                districts={districts}
                skills={skills}
                next={next}
                formToken={formToken}
                onSwitch={() => onTab("login")}
              />
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
