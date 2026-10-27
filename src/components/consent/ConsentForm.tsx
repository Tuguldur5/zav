"use client";

import { useActionState } from "react";
import Link from "next/link";
import { acceptConsentsAction, type ConsentState } from "@/lib/actions/consent";
import { buttonCls, Note } from "@/components/public/ui";

export function ConsentForm({ kind }: { kind: "customer" | "worker" }) {
  const [state, formAction, pending] = useActionState<ConsentState, FormData>(
    acceptConsentsAction,
    {},
  );
  const isWorker = kind === "worker";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? <Note tone="err">{state.error}</Note> : null}

      <fieldset className="flex flex-col gap-3 rounded-[8px] border border-divider p-4">
        <legend className="px-1 text-[0.82em] font-medium text-muted">Баталгаажуулалт</legend>

        <label className="flex items-start gap-2 text-[0.92em]">
          <input type="checkbox" name="declaration" required className="mt-0.5 size-5 shrink-0" />
          <span>
            {isWorker
              ? "Би ажил хийх хүн мөн. Өгсөн мэдээллээ үнэн зөв гэж баталж байна."
              : "Би өөрөө ажил хийлгэх хүн мөн. Энэ нь ажил хайж буй хүний зар биш."}
            {state.fieldErrors?.declaration ? (
              <span className="block text-[0.9em] text-error">{state.fieldErrors.declaration}</span>
            ) : null}
          </span>
        </label>

        {isWorker ? (
          <label className="flex items-start gap-2 text-[0.92em]">
            <input type="checkbox" name="phoneCheck" required className="mt-0.5 size-5 shrink-0" />
            <span>
              Админ надтай утсаар холбогдож мэдээллийг шалгахыг зөвшөөрч байна.
              {state.fieldErrors?.phoneCheck ? (
                <span className="block text-[0.9em] text-error">{state.fieldErrors.phoneCheck}</span>
              ) : null}
            </span>
          </label>
        ) : null}

        <label className="flex items-start gap-2 text-[0.92em]">
          <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0" />
          <span>
            Би{" "}
            <Link href="/terms" target="_blank" className="text-primary underline underline-offset-2">
              Үйлчилгээний нөхцөл
            </Link>{" "}
            болон{" "}
            <Link href="/privacy" target="_blank" className="text-primary underline underline-offset-2">
              Нууцлалын бодлогыг
            </Link>{" "}
            уншиж, зөвшөөрч байна.
            {state.fieldErrors?.consent ? (
              <span className="block text-[0.9em] text-error">{state.fieldErrors.consent}</span>
            ) : null}
          </span>
        </label>
      </fieldset>

      <p className="text-[0.88em] text-muted">
        {isWorker
          ? "Зөвшөөрсний дараа админ тань утсаар шалгана. Мэдэгдэл авахын тулд дараа нь «Мэдэгдэл асаах» товч дарна."
          : "Манай админ таны өгсөн утсаар холбогдож захиалгыг баталгаажуулна."}
      </p>

      <button type="submit" disabled={pending} className={buttonCls("primary", true)}>
        {pending ? "Түр хүлээнэ үү…" : "Зөвшөөрч үргэлжлүүлэх"}
      </button>
    </form>
  );
}
