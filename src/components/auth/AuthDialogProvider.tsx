"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AuthDialog, type AuthTab } from "./AuthDialog";
import type { District, Skill } from "@/lib/types";

type OpenOptions = { next?: string };
type DialogApi = {
  open: (tab: AuthTab, options?: OpenOptions) => void;
  isOpen: boolean;
};

const AuthDialogContext = createContext<DialogApi | null>(null);

/** Null on hosts without the dialog (staff, app screens): links still work. */
export function useAuthDialog(): DialogApi | null {
  return useContext(AuthDialogContext);
}

/**
 * One popup for login + register, mounted by the two marketing layouts only.
 * State lives in the URL (`?auth=login|register&next=…`) so a refresh or a
 * shared link keeps the dialog open, and closing removes both params.
 */
export function AuthDialogProvider({
  audience,
  districts,
  skills,
  formToken,
  switchHref,
  children,
}: {
  audience: "customer" | "worker";
  districts: District[];
  skills: Skill[];
  formToken: string;
  switchHref: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [state, setState] = useState<{ tab: AuthTab; next?: string } | null>(null);

  // The URL is the source of truth, including browser back/forward.
  useEffect(() => {
    const params = new URLSearchParams(query);
    const tab = params.get("auth");
    if (tab === "login" || tab === "register") {
      setState({ tab, next: params.get("next") ?? undefined });
    } else {
      setState(null);
    }
  }, [query]);

  const open = useCallback(
    (tab: AuthTab, options?: OpenOptions) => {
      const params = new URLSearchParams(query);
      params.set("auth", tab);
      if (options?.next) params.set("next", options.next);
      else params.delete("next");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      setState({ tab, next: options?.next });
    },
    [pathname, query, router],
  );

  const close = useCallback(() => {
    const params = new URLSearchParams(query);
    params.delete("auth");
    params.delete("next");
    const rest = params.toString();
    router.replace(rest ? `${pathname}?${rest}` : pathname, { scroll: false });
    setState(null);
  }, [pathname, query, router]);

  const api = useMemo<DialogApi>(() => ({ open, isOpen: Boolean(state) }), [open, state]);

  return (
    <AuthDialogContext.Provider value={api}>
      {children}
      {state ? (
        <AuthDialog
          audience={audience}
          tab={state.tab}
          next={state.next}
          districts={districts}
          skills={skills}
          formToken={formToken}
          switchHref={switchHref}
          onTab={(tab) => open(tab, { next: state.next })}
          onClose={close}
        />
      ) : null}
    </AuthDialogContext.Provider>
  );
}

/**
 * A real anchor to /login or /register, progressively enhanced: with JS the
 * dialog opens instead of navigating, without JS the page loads normally.
 */
export function AuthTrigger({
  href,
  tab,
  next,
  className,
  children,
  ariaLabel,
}: {
  href: string;
  tab: AuthTab;
  next?: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const dialog = useAuthDialog();
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={className}
      onClick={(event) => {
        if (!dialog) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        dialog.open(tab, { next });
      }}
    >
      {children}
    </Link>
  );
}
