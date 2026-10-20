"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OtpInput, type OtpState } from "@/components/ui/OtpInput";
import { Stepper } from "@/components/ui/Stepper";
import { getBrowserClient } from "@/lib/supabase/browser";
import type { Role } from "@/lib/types";
import { removeFactorAction } from "./actions";

type FactorInfo = { id: string; name: string; createdAt: string };

function qrSrc(qr: string): string {
  return qr.startsWith("<svg") ? `data:image/svg+xml;utf8,${encodeURIComponent(qr)}` : qr;
}

export function SecurityClient({
  role,
  factors,
  currentLevel,
}: {
  role: Role;
  factors: FactorInfo[];
  currentLevel: string;
}) {
  const router = useRouter();
  const [enrollData, setEnrollData] = useState<{
    factorId: string;
    qr: string;
    secret: string;
  } | null>(null);
  const [otpState, setOtpState] = useState<OtpState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const isAal2 = currentLevel === "aal2";
  const home = role === "super_admin" ? "/super" : "/today";

  async function startEnroll() {
    setBusy(true);
    setError(null);
    const supabase = getBrowserClient();
    try {
      const { data: list } = await supabase.auth.mfa.listFactors();
      for (const factor of list?.all ?? []) {
        if (factor.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (enrollError || !data) throw enrollError ?? new Error("enroll failed");
      setEnrollData({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch {
      setError("Төхөөрөмж бүртгэх боломжгүй. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(code: string) {
    const factorId = enrollData?.factorId ?? factors[0]?.id;
    if (!factorId) {
      setError("Эхлээд QR код уншуулна уу.");
      return;
    }
    setOtpState("verifying");
    setError(null);
    const supabase = getBrowserClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) {
      setOtpState("error");
      return;
    }
    const verify = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    });
    if (verify.error) {
      setOtpState("error");
      return;
    }
    setOtpState("success");
    setEnrollData(null);
    router.refresh();
    if (!isAal2) {
      router.replace(home);
    }
  }

  async function copySecret() {
    if (!enrollData) return;
    try {
      await navigator.clipboard.writeText(enrollData.secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function removeFactor(factorId: string) {
    setRemoving(factorId);
    setRemoveError(null);
    const result = await removeFactorAction(factorId);
    setRemoving(null);
    if (!result.ok) {
      setRemoveError(result.error ?? "Устгах боломжгүй");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <Stepper
        steps={["Нэвтрэх", "Төхөөрөмж", "Баталгаажуулалт"]}
        current={isAal2 ? 2 : enrollData ? 1 : 0}
      />

      {isAal2 ? (
        <Card className="flex items-center gap-3 bg-success-container text-success">
          <ShieldCheck aria-hidden className="size-7" />
          <div>
            <p className="font-semibold">Хамгаалалт бэлэн</p>
            <p className="text-[0.9em]">Хоёр шатлалт баталгаажуулалт идэвхтэй байна.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <h2 className="text-[1.05em] font-semibold">Хоёр шатлалт баталгаажуулалт</h2>
          <p className="mt-1 text-[0.9em] text-muted">
            Ажилтны эрхээр ажиллахын тулд утсааны authenticator апп-аар код оруулна уу.
          </p>
        </Card>
      )}

      {error ? (
        <p role="alert" className="rounded-md bg-error-container px-3 py-2 text-[0.9em] text-error">
          {error}
        </p>
      ) : null}

      {!isAal2 && factors.length === 0 && !enrollData ? (
        <Card className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-2">
            <Smartphone aria-hidden className="size-5 text-primary" />
            <p className="font-semibold">1. Authenticator апп суулгана уу</p>
          </div>
          <p className="text-[0.9em] text-muted">
            Google Authenticator, Microsoft Authenticator эсвэл 1Password ашиглаж болно.
          </p>
          <Button onClick={startEnroll} loading={busy}>
            Төхөөрөмж бүртгэж эхлэх
          </Button>
        </Card>
      ) : null}

      {enrollData ? (
        <Card className="flex flex-col items-center gap-3">
          <p className="self-start font-semibold">2. QR кодыг уншуулна уу</p>
          {/* The QR comes from Supabase enroll as an image data URI. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc(enrollData.qr)} alt="Authenticator QR код" className="size-48" />
          <div className="w-full">
            <p className="text-[0.8em] text-muted">
              QR унших боломжгүй бол кодыг гараар оруулна уу:
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-md bg-container px-2 py-1 text-[0.9em]">
                {enrollData.secret}
              </code>
              <Button variant="tonal" onClick={copySecret} aria-label="Кодыг хуулах">
                <Copy aria-hidden className="size-4" />
                {copied ? "Хуулагдлаа" : "Хуулах"}
              </Button>
            </div>
          </div>
          <p className="self-start font-semibold">3. Апп-аас 6 оронтой код оруулна уу</p>
          <OtpInput state={otpState} onComplete={verifyCode} />
        </Card>
      ) : null}

      {!isAal2 && factors.length > 0 && !enrollData ? (
        <Card className="flex flex-col gap-3">
          <p className="font-semibold">Authenticator апп-аас код оруулна уу</p>
          <OtpInput state={otpState} onComplete={verifyCode} />
        </Card>
      ) : null}

      {isAal2 ? (
        <Card className="flex flex-col gap-3">
          <p className="font-semibold">Бүртгэлтэй төхөөрөмжүүд ({factors.length}/2)</p>
          <ul className="flex flex-col gap-2">
            {factors.map((factor) => (
              <li
                key={factor.id}
                className="flex items-center justify-between gap-2 rounded-md border border-container px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[0.9em] font-medium">{factor.name}</span>
                  <span className="block text-[0.8em] text-muted">
                    {factor.createdAt.slice(0, 10)}
                  </span>
                </span>
                <Button
                  variant="text"
                  loading={removing === factor.id}
                  disabled={factors.length <= 1}
                  onClick={() => removeFactor(factor.id)}
                  icon={<Trash2 aria-hidden className="size-4" />}
                >
                  Устгах
                </Button>
              </li>
            ))}
          </ul>
          {removeError ? <p className="text-[0.9em] text-error">{removeError}</p> : null}
          {factors.length < 2 ? (
            <Button variant="outline" onClick={startEnroll} loading={busy}>
              Нөөц төхөөрөмж нэмэх
            </Button>
          ) : null}
          <a
            href={home}
            className="press flex min-h-[var(--control-h)] items-center justify-center rounded-md bg-primary px-5 font-medium text-on-primary"
          >
            Үргэлжлүүлэх
          </a>
        </Card>
      ) : null}

      {!isAal2 && otpState === "success" ? (
        <p className="flex items-center gap-2 text-success">
          <Check aria-hidden className="size-5" /> Амжилттай. Шилжүүлж байна…
        </p>
      ) : null}
    </div>
  );
}
