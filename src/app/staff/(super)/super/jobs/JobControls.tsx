"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Snackbar } from "@/components/ui/Snackbar";
import { inputClass } from "@/components/ui/styles";
import { forceCancelJobAction, reassignJobAction } from "@/lib/actions/super";

type AdminOption = { id: string; full_name: string };

export function JobControls({
  jobId,
  admins,
  status,
}: {
  jobId: string;
  admins: AdminOption[];
  status: string;
}) {
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [confirmReassign, setConfirmReassign] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  async function reassign() {
    if (!adminId) {
      setSnack({ message: "Админ сонгоно уу", tone: "error" });
      setConfirmReassign(false);
      return;
    }
    setBusy(true);
    const result = await reassignJobAction(jobId, adminId);
    setBusy(false);
    setConfirmReassign(false);
    setSnack({
      message: result.ok ? "Зар шилжүүллээ" : (result.error ?? "Алдаа гарлаа"),
      tone: result.ok ? "success" : "error",
    });
    if (result.ok) router.refresh();
  }

  async function forceCancel() {
    setBusy(true);
    const result = await forceCancelJobAction(jobId);
    setBusy(false);
    setConfirmCancel(false);
    setSnack({
      message: result.ok ? "Зарыг цуцаллаа" : (result.error ?? "Алдаа гарлаа"),
      tone: result.ok ? "success" : "error",
    });
    if (result.ok) router.refresh();
  }

  const active = status !== "done" && status !== "cancelled";

  return (
    <div className="flex flex-col gap-2">
      {active ? (
        <>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor={`admin-${jobId}`}>
              Шинэ админ
            </label>
            <select
              id={`admin-${jobId}`}
              value={adminId}
              onChange={(event) => setAdminId(event.target.value)}
              className={`${inputClass} min-h-11`}
            >
              <option value="">Админ сонгоно уу</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.full_name}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => setConfirmReassign(true)} loading={busy}>
              Шилжүүлэх
            </Button>
          </div>
          <Button variant="text" onClick={() => setConfirmCancel(true)}>
            Зарыг хүчээр цуцлах
          </Button>
        </>
      ) : (
        <p className="text-[0.8em] text-muted">Дууссан/цуцлагдсан зар — өөрчлөх боломжгүй.</p>
      )}

      <ConfirmDialog
        open={confirmReassign}
        onCancel={() => setConfirmReassign(false)}
        onConfirm={reassign}
        loading={busy}
        message="Энэ зарыг өөр админд шилжүүлэх үү?"
        confirmLabel="Тийм, шилжүүлэх"
      />
      <ConfirmDialog
        open={confirmCancel}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={forceCancel}
        loading={busy}
        destructive
        message="Захиалагч, ажилтнуудад мэдэгдэнэ. Энэ зарыг цуцлах уу?"
        confirmLabel="Тийм, цуцлах"
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
