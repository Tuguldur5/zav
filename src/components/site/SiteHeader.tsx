"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { AuthTrigger, useAuthDialog } from "@/components/auth/AuthDialogProvider";
import { AudienceSwitch } from "@/components/ds";
import { SlotStrip, type SlotRow } from "@/components/ds/SlotStrip";
import { mn } from "@/lib/i18n/mn";
import { siteUrl, workerUrl } from "@/lib/hosts";

const copy = mn.marketing.header;
const LOGO_ROW: SlotRow[] = [
  {
    label: "",
    blocks: [
      { span: 3, state: "free" },
      { span: 3, state: "taken" },
      { span: 2, state: "empty" },
      { span: 4, state: "free" },
    ],
  },
];

const ANCHORS = {
  customer: [
    { href: "#services", label: copy.services },
    { href: "#how", label: copy.how },
    { href: "#trust", label: copy.benefits },
    { href: "#faq", label: copy.faq },
  ],
  worker: [
    { href: "#benefits", label: copy.benefits },
    { href: "#how", label: copy.how },
    { href: "#requirements", label: copy.services },
    { href: "#faq", label: copy.faq },
  ],
} as const;

export function SiteHeader({ audience }: { audience: "customer" | "worker" }) {
  const headerRef = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dialog = useAuthDialog();
  const anchors = ANCHORS[audience];

  useEffect(() => {
    let frame = 0;
    let previous = window.scrollY;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const current = window.scrollY;
        const header = headerRef.current;
        const menu = document.getElementById("site-mobile-menu");
        const menuOpen = menu?.matches(":popover-open") ?? false;
        setScrolled(current > 16);
        if (
          current < 16 ||
          current < previous ||
          menuOpen ||
          dialog?.isOpen ||
          Boolean(header?.contains(document.activeElement))
        ) {
          setHidden(false);
        } else if (current - previous > 4) {
          setHidden(true);
        }
        previous = current;
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, [dialog?.isOpen]);

  return (
    <header
      className="site-header"
      data-hidden={hidden || undefined}
      data-scrolled={scrolled || undefined}
      ref={headerRef}
    >
      <div className="site-header-inner">
        <a href="/" className="site-brand" aria-label={copy.brand}>
          <span className="site-brand-mark">
            <SlotStrip rows={LOGO_ROW} variant="divider" description="" />
          </span>
          <span>{copy.brand}</span>
        </a>

        <div className="site-audience">
          <AudienceSwitch
            active={audience}
            customerHref={siteUrl("/")}
            workerHref={workerUrl("/")}
            customerLabel={copy.order}
            workerLabel={copy.find}
            label={copy.brand}
          />
        </div>

        <nav className="site-links" aria-label={copy.menu}>
          {anchors.map((anchor) => (
            <a key={anchor.href} href={anchor.href}>
              {anchor.label}
            </a>
          ))}
        </nav>

        <AuthTrigger href="/login" tab="login" className="ds-button ds-button--primary site-login">
          <span>{copy.login}</span>
          <ArrowRight aria-hidden className="ds-button-arrow" />
        </AuthTrigger>

        <button
          className="site-menu-trigger"
          type="button"
          popoverTarget="site-mobile-menu"
          aria-label={copy.menu}
        >
          <Menu aria-hidden className="site-menu-icon" />
          <X aria-hidden className="site-close-icon" />
        </button>

        <div className="site-mobile-menu" id="site-mobile-menu" popover="auto">
          <div className="site-mobile-menu-top">
            <a href="/" className="site-brand" aria-label={copy.brand}>
              <span className="site-brand-mark">
                <SlotStrip rows={LOGO_ROW} variant="divider" description="" />
              </span>
              <span>{copy.brand}</span>
            </a>
            <button
              className="site-menu-trigger site-menu-close"
              type="button"
              popoverTarget="site-mobile-menu"
              aria-label={copy.menu}
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <AudienceSwitch
            active={audience}
            customerHref={siteUrl("/")}
            workerHref={workerUrl("/")}
            customerLabel={copy.order}
            workerLabel={copy.find}
            label={copy.brand}
          />
          <nav className="site-mobile-links" aria-label={copy.menu}>
            {anchors.map((anchor, index) => (
              <a key={anchor.href} href={anchor.href} style={{ animationDelay: `${index * 60}ms` }}>
                <span className="ds-label">{String(index + 1).padStart(2, "0")}</span>
                {anchor.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
