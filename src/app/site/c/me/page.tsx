import Link from "next/link";
import { LogOut, Phone } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getSupportPhone, getSupportText } from "@/lib/settings";
import { TextSizeSwitch } from "@/components/ui/TextSizeSwitch";
import { logoutAction } from "@/lib/actions/session";
import { Container, Card, buttonCls } from "@/components/public/ui";

export const dynamic = "force-dynamic";

export default async function CustomerMePage() {
  const { profile } = await requireRole(["customer"]);
  const [phone, supportText] = await Promise.all([getSupportPhone(), getSupportText()]);

  return (
    <Container className="max-w-[720px] py-6 sm:py-8">
      <h1 className="text-[24px] font-semibold leading-[30px] sm:text-[28px] sm:leading-[32px]">
        Би
      </h1>

      <div className="mt-5 flex flex-col gap-4">
        <Card className="p-5">
          <dl className="flex flex-col gap-3 text-[0.95em]">
            <div>
              <dt className="text-[0.85em] text-muted">Нэр</dt>
              <dd className="font-medium">{profile.full_name}</dd>
            </div>
            <div>
              <dt className="text-[0.85em] text-muted">Утас</dt>
              <dd className="font-medium">{profile.phone ?? "Оруулаагүй"}</dd>
            </div>
            <div>
              <dt className="text-[0.85em] text-muted">Бүртгэлийн төрөл</dt>
              <dd className="font-medium">Захиалагч</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <TextSizeSwitch />
        </Card>

        <Card className="p-5">
          <p className="font-medium">Тусламж</p>
          {supportText ? <p className="mt-1 text-[0.88em] text-muted">{supportText}</p> : null}
          {phone ? (
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              className={`${buttonCls("secondary", true)} mt-3`}
            >
              <Phone aria-hidden className="size-4" strokeWidth={1.75} />
              {phone}
            </a>
          ) : null}
          <div className="mt-3 flex flex-col gap-2 text-[0.9em]">
            <Link href="/help" className="text-primary underline underline-offset-2">
              Тусламжийн хуудас
            </Link>
            <Link href="/terms" className="text-muted hover:text-primary">
              Үйлчилгээний нөхцөл
            </Link>
            <Link href="/privacy" className="text-muted hover:text-primary">
              Нууцлалын бодлого
            </Link>
          </div>
        </Card>

        <form action={logoutAction}>
          <button type="submit" className={buttonCls("secondary", true)}>
            <LogOut aria-hidden className="size-4" strokeWidth={1.75} />
            Гарах
          </button>
        </form>
      </div>
    </Container>
  );
}
