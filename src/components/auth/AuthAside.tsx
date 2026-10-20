import { CalendarCheck, Headphones } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getSupportPhone } from "@/lib/settings";

/** Short explanation shown next to the auth form on >=1024px screens. */
export async function AuthAside({ steps }: { steps: { title: string; body: string }[] }) {
  const phone = await getSupportPhone();

  return (
    <>
      <Card className="flex flex-col gap-3">
        <p className="text-[0.95em] font-semibold">Хэрхэн ажилладаг вэ?</p>
        <ol className="flex flex-col gap-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-[0.85em] font-semibold text-on-primary-container">
                {index + 1}
              </span>
              <span>
                <span className="block font-medium">{step.title}</span>
                <span className="block text-[0.9em] text-muted">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="flex items-start gap-2 text-[0.9em] text-muted">
        <CalendarCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
        Ажилтан зөвхөн баталгаажсаны дараа хаягаа хардаг.
      </Card>

      {phone ? (
        <Card className="flex items-start gap-2 text-[0.9em] text-muted">
          <Headphones aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
          <span>Асуулт байвал {phone} дугаараас асууна уу.</span>
        </Card>
      ) : null}
    </>
  );
}
