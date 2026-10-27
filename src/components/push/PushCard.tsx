"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  disablePush,
  enablePush,
  isIosWithoutInstall,
  isPushEnabled,
  pushPermission,
  pushSupported,
} from "@/lib/push/client";
import { Card, buttonCls } from "@/components/public/ui";

function usePushState() {
  const [mounted, setMounted] = useState(false);
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [denied, setDenied] = useState(false);
  const [iosInstall, setIosInstall] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMounted(true);
    const ok = pushSupported();
    setSupported(ok);
    setDenied(pushPermission() === "denied");
    setIosInstall(isIosWithoutInstall());
    if (ok) void isPushEnabled().then(setEnabled);
  }, []);

  async function toggle() {
    setBusy(true);
    setMessage("");
    const result = enabled ? await disablePush() : await enablePush();
    setBusy(false);
    if (result.ok) {
      setEnabled(!enabled);
      return;
    }
    if (result.reason === "denied") {
      setDenied(true);
      setMessage("Утсаасаа мэдэгдлийг зөвшөөрөөгүй байна. Тохиргооноос зөвшөөрнө үү.");
    } else if (result.reason === "ios-install") {
      setIosInstall(true);
    } else if (result.reason === "not-configured") {
      setMessage("Мэдэгдлийн тохиргоо хийгдээгүй байна. Админд хэлнэ үү.");
    } else {
      setMessage("Мэдэгдэл асаах боломжгүй. Дахин оролдоно уу.");
    }
  }

  return { mounted, supported, enabled, denied, iosInstall, busy, message, toggle };
}

function StatusLine({ enabled }: { enabled: boolean }) {
  return (
    <p className="flex items-center gap-2 text-[0.9em]">
      {enabled ? (
        <Bell aria-hidden className="size-4 text-ok" strokeWidth={1.75} />
      ) : (
        <BellOff aria-hidden className="size-4 text-muted" strokeWidth={1.75} />
      )}
      Мэдэгдэл: {enabled ? "идэвхтэй" : "идэвхгүй"}
    </p>
  );
}

function Body() {
  const state = usePushState();

  return (
    <div className="flex flex-col gap-3">
      {state.mounted ? <StatusLine enabled={state.enabled} /> : <StatusLine enabled={false} />}

      {!state.mounted ? null : state.iosInstall ? (
        <div className="flex flex-col gap-1 text-[0.9em] text-muted">
          <p>iPhone дээр мэдэгдэл зөвхөн «Нүүр дэлгэцэнд нэмсний» дараа ажиллана.</p>
          <p>Safari → Share → “Add to Home Screen”. Дараа нь энэ хуудсыг нээж дахин оролдоно уу.</p>
        </div>
      ) : !state.supported ? (
        <p className="text-[0.9em] text-muted">
          Энэ утас/хөтөч мэдэгдэл дэмжихгүй байна. Мэдэгдэл ирэхгүй бол админ тантай утсаар
          холбогдоно.
        </p>
      ) : (
        <button
          type="button"
          onClick={state.toggle}
          disabled={state.busy || state.denied}
          className={state.enabled ? buttonCls("secondary", true) : buttonCls("primary", true)}
        >
          {state.busy ? "Түр хүлээнэ үү…" : state.enabled ? "Мэдэгдэл унтраах" : "Мэдэгдэл асаах"}
        </button>
      )}

      {state.denied ? (
        <p className="text-[0.85em] text-warn">
          Мэдэгдлийг хөтчийн тохиргооноос зөвшөөрсний дараа буцаж ирнэ үү.
        </p>
      ) : null}

      {state.message ? <p className="text-[0.85em] text-warn">{state.message}</p> : null}

      <p className="text-[0.85em] text-muted">
        Мэдэгдэл ирэхгүй бол админ тантай утсаар холбогдоно.
      </p>
    </div>
  );
}

export function PushCard() {
  return (
    <Card className="p-5">
      <p className="font-medium">Утасны мэдэгдэл</p>
      <p className="mt-1 text-[0.9em] text-muted">
        Шинэ ажлын санал ирэхэд утаснаас тань мэдэгдэнэ.
      </p>
      <div className="mt-3">
        <Body />
      </div>
    </Card>
  );
}

/** The same control on /me, without the explanatory card wrapper. */
export function PushToggle() {
  return (
    <Card className="p-5">
      <p className="font-medium">Утасны мэдэгдэл</p>
      <div className="mt-2">
        <Body />
      </div>
    </Card>
  );
}
