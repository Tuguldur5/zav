"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Snackbar } from "@/components/ui/Snackbar";
import {
  cancelAssignmentAction,
  completeAssignmentAction,
  confirmAssignmentAction,
  confirmAvailabilityAction,
  offerAssignmentAction,
  recordPhoneAnswerAction,
  releaseJobAction,
} from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/action-result";

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  async function run(key: string, action: () => Promise<ActionResult>) {
    if (busy) return;
    setBusy(key);
    const result = await action();
    setBusy(null);
    setMessage({
      text: result.ok ? "Хадгаллаа" : (result.error ?? "Алдаа гарлаа"),
      tone: result.ok ? "success" : "error",
    });
    if (result.ok) router.refresh();
  }

  return { busy, message, setMessage, run, router };
}

function Snack({
  message,
  onClose,
}: {
  message: { text: string; tone: "success" | "error" } | null;
  onClose: () => void;
}) {
  return (
    <Snackbar
      open={Boolean(message)}
      message={message?.text ?? ""}
      tone={message?.tone ?? "success"}
      onClose={onClose}
    />
  );
}

export function AssignmentActions({
  assignmentId,
  status,
}: {
  assignmentId: string;
  status: string;
}) {
  const { busy, message, setMessage, run } = useAction();
  const [cancelOpen, setCancelOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {status === "offered" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            loading={busy === "phone-yes"}
            onClick={() => run("phone-yes", () => recordPhoneAnswerAction(assignmentId, true))}
          >
            Утсаар зөвшөөрсөн
          </Button>
          <Button
            variant="outline"
            loading={busy === "phone-no"}
            onClick={() => run("phone-no", () => recordPhoneAnswerAction(assignmentId, false))}
          >
            Утсаар татгалзсан
          </Button>
        </div>
      ) : null}

      {status === "accepted" ? (
        <Button
          full
          loading={busy === "confirm"}
          onClick={() => run("confirm", () => confirmAssignmentAction(assignmentId))}
        >
          Баталгаажуулах
        </Button>
      ) : null}

      {status === "confirmed" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            loading={busy === "complete"}
            onClick={() => run("complete", () => completeAssignmentAction(assignmentId))}
          >
            Дууссан
          </Button>
          <Button variant="outline" onClick={() => setCancelOpen(true)}>
            Цуцлах
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={cancelOpen}
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => {
          setCancelOpen(false);
          void run("cancel", () => cancelAssignmentAction(assignmentId));
        }}
        message="Энэ ажилтны томилолтыг цуцлах уу?"
        confirmLabel="Тийм, цуцлах"
        loading={busy === "cancel"}
      />
      <Snack message={message} onClose={() => setMessage(null)} />
    </div>
  );
}

export function OfferWorkerButton({
  jobId,
  workerId,
  day,
  disabled,
}: {
  jobId: string;
  workerId: string;
  day: string;
  disabled: boolean;
}) {
  const { busy, message, setMessage, run } = useAction();
  return (
    <>
      <Button
        full
        loading={busy === "offer"}
        disabled={disabled}
        onClick={() => run("offer", () => offerAssignmentAction(jobId, workerId, day))}
      >
        Санал болгох
      </Button>
      <Snack message={message} onClose={() => setMessage(null)} />
    </>
  );
}

export function AvailabilityConfirmButton({
  workerId,
  day,
  confirmed,
}: {
  workerId: string;
  day: string;
  confirmed: boolean;
}) {
  const { busy, message, setMessage, run } = useAction();
  if (confirmed) return null;
  return (
    <>
      <Button
        variant="tonal"
        loading={busy === "confirm-av"}
        onClick={() => run("confirm-av", () => confirmAvailabilityAction(workerId, day, true))}
      >
        Утсаар баталгаажлаа
      </Button>
      <Snack message={message} onClose={() => setMessage(null)} />
    </>
  );
}

export function ReleaseJobButton({ jobId }: { jobId: string }) {
  const { busy, message, setMessage, run } = useAction();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Буцаах
      </Button>
      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          void run("release", () => releaseJobAction(jobId));
        }}
        message="Энэ зарыг буцааж, шинэ зарын пулд оруулах уу?"
        confirmLabel="Тийм, буцаах"
        loading={busy === "release"}
      />
      <Snack message={message} onClose={() => setMessage(null)} />
    </>
  );
}
