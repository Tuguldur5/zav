"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ReauthDialog, type ReauthResult } from "@/components/ui/ReauthDialog";
import { reauthenticate } from "@/lib/actions/reauth";
import type { ActionResult } from "@/lib/action-result";
import type { ButtonVariant } from "@/components/ui/styles";

/**
 * Runs a dangerous staff action. When the server reports `needsReauth`, the
 * password dialog opens and the action retries after a successful re-auth.
 */
export function ReauthAction({
  label,
  action,
  variant = "filled",
  full = false,
  icon,
  refresh = true,
  onSuccess,
  children,
}: {
  label: string;
  action: () => Promise<ActionResult>;
  variant?: ButtonVariant;
  full?: boolean;
  icon?: ReactNode;
  refresh?: boolean;
  onSuccess?: (result: ActionResult) => void;
  children?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (result.ok) {
      if (refresh) router.refresh();
      onSuccess?.(result);
      return;
    }
    if (result.needsReauth) {
      setOpen(true);
      return;
    }
    setError(result.error ?? "Алдаа гарлаа");
  }

  async function onSubmit(password: string): Promise<ReauthResult> {
    const reauth = await reauthenticate(password);
    if (!reauth.ok) return reauth;
    setOpen(false);
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result.ok) {
      if (refresh) router.refresh();
      onSuccess?.(result);
      return { ok: true };
    }
    setError(result.error ?? "Алдаа гарлаа");
    return { ok: true };
  }

  return (
    <>
      <Button variant={variant} full={full} loading={busy} icon={icon} onClick={run}>
        {label}
      </Button>
      <ReauthDialog open={open} onClose={() => setOpen(false)} onSubmit={onSubmit} />
      {error ? <p className="text-[0.9em] text-error">{error}</p> : null}
      {children}
    </>
  );
}
