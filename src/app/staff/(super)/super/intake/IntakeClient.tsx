"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BulkBar } from "@/components/staff";
import { ReauthDialog, type ReauthResult } from "@/components/ui/ReauthDialog";
import { Snackbar } from "@/components/ui/Snackbar";
import { inputClass } from "@/components/ui/styles";
import { reauthenticate } from "@/lib/actions/reauth";
import { assignWorkerAction, bulkAssignWorkersAction } from "@/lib/actions/super";
import type { ActionResult } from "@/lib/action-result";

type IntakeWorker = {
  id: string;
  name: string;
  phone: string | null;
  districtName: string;
  skillNames: string[];
  suggestedAdminId: string | null;
  suggestedAdminName: string | null;
};

type AdminOption = { id: string; full_name: string; load: number };

export function IntakeClient({ rows, admins }: { rows: IntakeWorker[]; admins: AdminOption[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkAdminId, setBulkAdminId] = useState(admins[0]?.id ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  function notify(result: ActionResult, successText: string) {
    setSnack({
      message: result.ok ? successText : (result.error ?? "Алдаа гарлаа"),
      tone: result.ok ? "success" : "error",
    });
  }

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function bulkAssign(): Promise<ActionResult> {
    if (!bulkAdminId) return { ok: false, error: "Админ сонгоно уу" };
    setBusy(true);
    const result = await bulkAssignWorkersAction(selected, bulkAdminId);
    setBusy(false);
    notify(result, `${selected.length} ажилтныг хуваариллаа`);
    if (result.ok) {
      setSelected([]);
      setConfirmOpen(false);
      router.refresh();
    } else if (result.needsReauth) {
      setConfirmOpen(false);
      setReauthOpen(true);
    }
    return result;
  }

  async function reauthSubmit(password: string): Promise<ReauthResult> {
    const reauth = await reauthenticate(password);
    if (!reauth.ok) return reauth;
    setReauthOpen(false);
    await bulkAssign();
    return { ok: true };
  }

  async function assignOne(workerId: string, adminId: string) {
    setRowBusy(workerId);
    const result = await assignWorkerAction(workerId, adminId);
    setRowBusy(null);
    notify(result, "Хуваариллаа");
    if (result.ok) router.refresh();
  }

  const adminName = (id: string) => admins.find((admin) => admin.id === id)?.full_name ?? "";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => setSelected(selected.length === rows.length ? [] : rows.map((row) => row.id))}
        >
          {selected.length === rows.length ? "Болих" : `Бүгдийг сонгох (${rows.length})`}
        </Button>
        <span className="text-[13px] text-[color:var(--st-muted)]">
          Мөр бүр дээр тэмдэглээд доод самбараас админд хуваарилна.
        </span>
      </div>

      <div className="st-rows">
        {rows.map((worker) => {
          const checked = selected.includes(worker.id);
          return (
            <div key={worker.id} className="st-row">
              <input
                type="checkbox"
                aria-label={`${worker.name} сонгох`}
                checked={checked}
                onChange={() => toggle(worker.id)}
                className="size-5 accent-[var(--st-accent)]"
              />
              <div className="st-row-main">
                <span className="st-row-title">
                  <Link href={`/super/workers?q=${encodeURIComponent(worker.name)}`}>{worker.name}</Link>
                </span>
                <span className="st-row-meta">
                  <span>{worker.phone ?? "Утасгүй"}</span>
                  <span>{worker.districtName}</span>
                  <span>
                    {worker.suggestedAdminName
                      ? `Санал: ${worker.suggestedAdminName}`
                      : "Админ саналгүй"}
                  </span>
                </span>
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {worker.skillNames.map((name) => (
                    <Chip key={name} tone="primary">
                      {name}
                    </Chip>
                  ))}
                </span>
              </div>
              <div className="st-row-action">
                <Button
                  size="sm"
                  loading={rowBusy === worker.id}
                  disabled={!worker.suggestedAdminId}
                  onClick={() => worker.suggestedAdminId && assignOne(worker.id, worker.suggestedAdminId)}
                  icon={<Check aria-hidden className="size-4" />}
                >
                  {worker.suggestedAdminId
                    ? `${worker.suggestedAdminName}-д өгөх`
                    : "Админ байхгүй"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <BulkBar count={selected.length} onClear={() => setSelected([])}>
        <label className="sr-only" htmlFor="bulk-admin">
          Админ сонгох
        </label>
        <select
          id="bulk-admin"
          value={bulkAdminId}
          onChange={(event) => setBulkAdminId(event.target.value)}
          className={`${inputClass} !min-h-9 w-auto max-w-[200px]`}
        >
          <option value="" disabled>
            Админ сонгох
          </option>
          {admins.map((admin) => (
            <option key={admin.id} value={admin.id}>
              {admin.full_name} ({admin.load})
            </option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={!bulkAdminId}
          loading={busy}
          onClick={() => setConfirmOpen(true)}
          icon={<UserPlus aria-hidden className="size-4" />}
        >
          Хуваарилах
        </Button>
      </BulkBar>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void bulkAssign()}
        loading={busy}
        message={`Сонгосон ${selected.length} ажилтныг "${adminName(bulkAdminId)}" админд хуваарилагдах уу?`}
        confirmLabel="Тийм, хуваариалах"
      />
      <ReauthDialog open={reauthOpen} onClose={() => setReauthOpen(false)} onSubmit={reauthSubmit} />
      <Snackbar
        open={Boolean(snack)}
        message={snack?.message ?? ""}
        tone={snack?.tone ?? "success"}
        onClose={() => setSnack(null)}
      />
    </>
  );
}
