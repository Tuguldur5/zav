"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AuthTrigger } from "@/components/auth/AuthDialogProvider";

export function StickyActionBar({
  targetId,
  label,
  next,
  signedInHref,
}: {
  targetId: string;
  label: string;
  next?: string;
  signedInHref?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [fieldFocused, setFieldFocused] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    observer.observe(target);

    const focusIn = (event: FocusEvent) => {
      const element = event.target;
      if (element instanceof HTMLElement && element.matches("input, select, textarea")) {
        setFieldFocused(true);
      }
    };
    const focusOut = () => {
      requestAnimationFrame(() => {
        setFieldFocused(
          document.activeElement instanceof HTMLElement &&
            document.activeElement.matches("input, select, textarea"),
        );
      });
    };
    document.addEventListener("focusin", focusIn);
    document.addEventListener("focusout", focusOut);

    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", focusIn);
      document.removeEventListener("focusout", focusOut);
    };
  }, [targetId]);

  return (
    <div
      className="mobile-sticky-action"
      data-visible={visible && !fieldFocused || undefined}
      aria-hidden={!visible || fieldFocused}
    >
      {signedInHref ? (
        <Link href={signedInHref} className="ds-button ds-button--accent">
          <span>{label}</span>
          <ArrowRight aria-hidden className="ds-button-arrow" />
        </Link>
      ) : (
        <AuthTrigger
          href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
          tab="register"
          next={next}
          className="ds-button ds-button--accent"
        >
          <span>{label}</span>
          <ArrowRight aria-hidden className="ds-button-arrow" />
        </AuthTrigger>
      )}
    </div>
  );
}
