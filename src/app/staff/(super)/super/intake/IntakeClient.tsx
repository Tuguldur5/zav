"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BulkBar, QueueCard, RoundAction } from "@/components/staff";
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
  const [error, setError] = useState<string | null>(null);

  function notify(result: ActionResult, successText: string) {
    setSnack({
      message: result.ok ? successText : (result.error ?? "Алдаа гарлаа"),
      tone: result.ok ? "success" : "error",
    });
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
    const result = await bulkAssign();
    if (!result.ok && !result.needsReauth) setError(result.error ?? null);
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() =>
            setSelected(selected.length === rows.length ? [] : rows.map((row) => row.id))
          }
        >
          {selected.length === rows.length ? "Болих" : `Бүгдийг сонгох (${rows.length})`}
        </Button>
        <span className="text-[13px] text-muted">
          Карт бүр дээр тэмдэглээд доод самбараас админд хуваарилна.
        </span>
        {error ? <p className="text-[13px] text-error">{error}</p> : null}
      </div>

      <ul className="staff-card-grid">
        {rows.map((worker, index) => {
          const defaultAdmin = worker.suggestedAdminId ?? bulkAdminId;
          const checked = selected.includes(worker.id);
          return (
            <QueueCard
              key={worker.id}
              featured={index === 0}
              title={worker.name}
              href={`/workers/${worker.id}`}
              description={`${worker.phone ?? "Утасгүй"} · ${worker.districtName}`}
              icon={UserPlus}
              meta={
                <>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      aria-label={`${worker.name} сонгох`}
                      checked={checked}
                      onChange={() =>
                        setSelected((current) =>
                          current.includes(worker.id)
                            ? current.filter((value) => value !== worker.id)
                            : [...current, worker.id],
                        )
                      }
                      className="size-5"
                    />
                    <span>{checked ? "Сонгосон" : "Сонгох"}</span>
                  </label>
                  <span>
                    {worker.suggestedAdminName
                      ? `Санал: ${worker.suggestedAdminName}`
                      : "Админ саналгүй"}
                  </span>
                </>
              }
              actions={
                <RoundAction href={`/workers/${worker.id}`} label="Холбоо харах" icon={Users} />
              }
            >
              <div className="flex flex-wrap gap-1.5">
                {worker.skillNames.map((name) => (
                  <Chip key={name} tone="primary">
                    {name}
                  </Chip>
                ))}
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <label className="flex min-w-40 flex-1 flex-col gap-1 text-[0.9em]">
                  Админ
                  <select
                    value={defaultAdmin}
                    onChange={() => undefined}
                    className={inputClass}
                    disabled
                  >
                    <option>{worker.suggestedAdminName ?? "Саналгүй"}</option>
                  </select>
                </label>
                <Button
                  loading={rowBusy === worker.id}
                  disabled={!worker.suggestedAdminId}
                  onClick={() =>
                    worker.suggestedAdminId && assignOne(worker.id, worker.suggestedAdminId)
                  }
                  icon={<Check aria-hidden className="size-5" />}
                >
                  {worker.suggestedAdminId
                    ? `${worker.suggestedAdminName}-д хуваарилагдах`
                    : "Админ байхгүй"}
                </Button>
              </div>
              {worker.suggestedAdminId ? (
                <p className="text-[0.8em] text-muted">
                  Санал: {worker.suggestedAdminName} (хамгийн бага ачаалалтай) — өөрөөр сонгож
                  болно.
                </p>
              ) : (
                <p className="text-[0.8em] text-muted">
                  Идэвхтэй админ байхгүй тул эхлээд админ урилга үүсгэнэ үү.
                </p>
              )}
            </QueueCard>
          );
        })}
      </ul>

      <BulkBar count={selected.length} onClear={() => setSelected([])}>
        <label className="sr-only" htmlFor="bulk-admin">
          Админ сонгох
        </label>
        <select
          id="bulk-admin"
          value={bulkAdminId}
          onChange={(event) => setBulkAdminId(event.target.value)}
          className={`${inputClass} !min-h-9 w-auto max-w-[180px] !rounded-full text-[13px]`}
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
      <ReauthDialog
        open={reauthOpen}
        onClose={() => setReauthOpen(false)}
        onSubmit={reauthSubmit}
      />
      <Snackbar
        open={Boolean(snack)}
        message={snack?.message ?? ""}
        tone={snack?.tone ?? "success"}
        onClose={() => setSnack(null)}
      />
    </div>
  );
}
