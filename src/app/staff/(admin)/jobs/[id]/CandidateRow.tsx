"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Snackbar } from "@/components/ui/Snackbar";
import { confirmAvailabilityAction, offerAssignmentAction } from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/action-result";

/**
 * One candidate in "Ажилтан олох": two actions by default, and after "Залгах"
 * the four short phone outcomes. Everything long lives in the detail page.
 */
export function CandidateRow({
  jobId,
  workerId,
  name,
  phone,
  skills,
  district,
  availabilityLabel,
  day,
  confirmed,
  canOffer,
}: {
  jobId: string;
  workerId: string;
  name: string;
  phone: string | null;
  skills: string[];
  district: string | null;
  availabilityLabel: string;
  day: string;
  confirmed: boolean;
  canOffer: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [answered, setAnswered] = useState<string | null>(null);
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

  const visibleSkills = skills.slice(0, 2);
  const extraSkills = skills.length - visibleSkills.length;

  return (
    <div className="st-row !flex-col !items-stretch gap-2" data-row="">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/workers/${workerId}`} className="st-row-title min-w-0 truncate">
          {name}
        </Link>
        {visibleSkills.map((skill) => (
          <Chip key={skill}>{skill}</Chip>
        ))}
        {extraSkills > 0 ? <Chip>+{extraSkills}</Chip> : null}
        <span className="text-[13px] text-muted">{district ?? "—"}</span>
        <Chip tone="primary">{availabilityLabel}</Chip>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setOpen((value) => !value)}
          icon={<Phone aria-hidden className="size-4" />}
        >
          Залгах
        </Button>
        <Button
          loading={busy === "offer"}
          disabled={!canOffer}
          onClick={() => run("offer", () => offerAssignmentAction(jobId, workerId, day))}
        >
          Санал болгох
        </Button>
      </div>

      {open ? (
        <div className="flex flex-col gap-2 rounded-md bg-surface-2 px-3 py-2">
          <p className="text-[13px] text-muted">
            {phone ? (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="font-medium text-primary">
                {phone}
              </a>
            ) : (
              "Утас бүртгэгдээгүй."
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setAnswered("Холбогдлоо. Өдрийг баталгаажуулаад санал болгоно уу.")}
            >
              Холбогдсон
            </Button>
            <Button variant="outline" onClick={() => setAnswered("Авсангүй. Дараагийн ажилтан руу.")}>
              Авсангүй
            </Button>
            <Button variant="text" onClick={() => setAnswered("Завгүй гэж тэмдэглэлээ.")}>
              Завгүй
            </Button>
            <Button variant="text" onClick={() => setOpen(false)}>
              Дараа
            </Button>
            {!confirmed ? (
              <Button
                variant="outline"
                loading={busy === "confirm-av"}
                onClick={() =>
                  run("confirm-av", () => confirmAvailabilityAction(workerId, day, true))
                }
              >
                Утсаар баталгаажлаа
              </Button>
            ) : null}
          </div>
          {answered ? <p className="text-[13px] text-muted">{answered}</p> : null}
        </div>
      ) : null}

      <Snackbar
        open={Boolean(message)}
        message={message?.text ?? ""}
        tone={message?.tone ?? "success"}
        onClose={() => setMessage(null)}
      />
    </div>
  );
}
