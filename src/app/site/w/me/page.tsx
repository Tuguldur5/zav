import Link from "next/link";
import { LifeBuoy, LogOut, Smartphone } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getSupportPhone, getSupportText } from "@/lib/settings";
import { TopAppBar } from "@/components/ui/TopAppBar";
import { Card } from "@/components/ui/Card";
import { TextSizeSwitch } from "@/components/ui/TextSizeSwitch";
import { PhoneButton } from "@/components/ui/PhoneButton";
import { Button } from "@/components/ui/Button";
import { logoutAction } from "@/lib/actions/session";

export const dynamic = "force-dynamic";

export default async function WorkerMePage() {
  const { profile } = await requireRole(["worker"]);
  const [phone, text] = await Promise.all([getSupportPhone(), getSupportText()]);

  return (
    <>
      <TopAppBar title="Би" subtitle="Миний мэдээлэл" />
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-4">
        <Card className="flex flex-col gap-1">
          <p className="text-[0.9em] text-muted">Нэр</p>
          <p className="text-[1.05em] font-semibold">{profile.full_name}</p>
          <p className="mt-2 text-[0.9em] text-muted">Утас</p>
          <p className="font-medium">{profile.phone ?? "Оруулаагүй"}</p>
          <p className="mt-2 text-[0.9em] text-muted">Бүртгэлийн төлөв</p>
          <p className="font-medium">
            {profile.status === "pending" ? "Админд хуваарилагдаж байна" : "Идэвхтэй"}
          </p>
        </Card>

        <Card>
          <TextSizeSwitch />
        </Card>

        <Card className="flex flex-col gap-3">
          <p className="flex items-center gap-2 font-semibold">
            <Smartphone aria-hidden className="size-5 text-primary" />
            Нүүр дэлгэцэнд нэмэх
          </p>
          <Link
            href="/help#install"
            className="text-[0.9em] text-primary underline underline-offset-2"
          >
            iPhone болон Android заавар
          </Link>
        </Card>

        <Card className="flex flex-col gap-3">
          <p className="flex items-center gap-2 font-semibold">
            <LifeBuoy aria-hidden className="size-5 text-primary" />
            Тусламж
          </p>
          {text ? <p className="text-[0.9em] text-muted">{text}</p> : null}
          <PhoneButton phone={phone} label="Тусламжийн дугаар" name="Тусламж" full />
        </Card>

        <form action={logoutAction}>
          <Button variant="outline" full icon={<LogOut aria-hidden className="size-5" />}>
            Гарах
          </Button>
        </form>
      </main>
    </>
  );
}
