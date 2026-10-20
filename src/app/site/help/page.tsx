import Link from "next/link";
import { Headphones, HelpCircle, Smartphone } from "lucide-react";
import { getSupportPhone, getSupportText } from "@/lib/settings";
import { PhoneButton } from "@/components/ui/PhoneButton";
import { TextSizeSwitch } from "@/components/ui/TextSizeSwitch";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/styles";

export const dynamic = "force-dynamic";

const faq = [
  {
    q: "Ажил хэрхэн олдог вэ?",
    a: "Та зар үүсгэсний дараа манай админ таны зарыг хүлээж аваад чөлөөтэй, тохирох мэргэжилтэй ажилтнуудаас санал гаргана.",
  },
  {
    q: "Ажилтны утасны дугаар хэрхэн харагдах вэ?",
    a: "Ажилтан зөвхөн хаягийг баталгаажсаны дараа хардаг. Захиалагч ажилтны утсыг харахгүй — зөвхөн хариуцсан админы утас харагдана.",
  },
  {
    q: "Ажил үнэгүй юу?",
    a: "Бүртгэл, зар үүсгэх үнэгүй. Ажлын төлбөрийг захиалагч, ажилтан хоорондоо тохиролцоно.",
  },
  {
    q: "Алдаа гарвал хэнтэй холбогдох вэ?",
    a: "Доорх тусламжийн утсаар холбогдоно уу.",
  },
];

const iphone = [
  "iPhone дээрээ Safari хөтчөөр сайтыг нээнэ",
  "Доод талын «Хуваалцах» товчийг (дөрвөлжин дотроос дээшээ сум) дарна",
  "Цэснээс доош гүйлгээд «Нүүр дэлгэцэнд нэмэх»-ийг сонгоно",
  "Баруун дээд хэсэгт «Нэмэх»-ийг дарна — дүрс нь нүүр дэлгэцэн дээр гарна",
];

const android = [
  "Android дээрээ Chrome хөтчөөр сайтыг нээнэ",
  "Баруун дээд хэсэгт «⋮» цэсийг дарна",
  "«Нүүр дэлгэцэнд нэмэх»-ийг сонгоно (зарим утсанд «Апп суулгах» гэж гардаг)",
  "«Нэмэх»-ийг дарна — дүрс нь нүүр дэлгэцэн дээр гарна",
];

export default async function HelpPage() {
  const [phone, text] = await Promise.all([getSupportPhone(), getSupportText()]);

  return (
    <div data-tone="user" className="min-h-dvh text-ink">
      <main className="mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col gap-6 px-5 py-8">
        <header className="flex flex-col gap-2">
          <h1 className="flex items-center gap-2 text-[1.5em] font-semibold">
            <HelpCircle aria-hidden className="size-8 text-primary" />
            Тусламж
          </h1>
          <p className="text-muted">Хамгийн олон асуулт хариулт энд байна.</p>
        </header>

        <section id="install" aria-labelledby="install-title" className="flex flex-col gap-3">
          <h2 id="install-title" className="flex items-center gap-2 text-[1.2em] font-semibold">
            <Smartphone aria-hidden className="size-5 text-primary" />
            Нүүр дэлгэцэнд нэмэх
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="flex flex-col gap-2">
              <p className="font-semibold">iPhone (Safari)</p>
              <ol className="flex list-decimal flex-col gap-1 pl-5 text-[0.9em]">
                {iphone.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </Card>
            <Card className="flex flex-col gap-2">
              <p className="font-semibold">Android (Chrome)</p>
              <ol className="flex list-decimal flex-col gap-1 pl-5 text-[0.9em]">
                {android.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </Card>
          </div>
          <p className="rounded-md bg-container px-3 py-2 text-[0.9em]">
            Хөтөч «Суулгах» эсвэл «Нүүр дэлгэцэнд нэмэх»-ийг өөрөө санал болговол шууд
            дарж болно. Бид таны бусад аппын мэдээлэл, зураг, холбоо барих жагсаалт руу
            хандах эрх шаарддаггүй.
          </p>
        </section>

        <section aria-labelledby="faq-title" className="flex flex-col gap-3">
          <h2 id="faq-title" className="text-[1.2em] font-semibold">
            Асуулт, хариулт
          </h2>
          {faq.map((item) => (
            <Card key={item.q} className="flex flex-col gap-1">
              <p className="font-semibold">{item.q}</p>
              <p className="text-[0.9em] text-muted">{item.a}</p>
            </Card>
          ))}
        </section>

        <section aria-labelledby="textsize-title" className="flex flex-col gap-3">
          <h2 id="textsize-title" className="text-[1.2em] font-semibold">
            Үсгийн хэмжээ
          </h2>
          <Card>
            <TextSizeSwitch />
          </Card>
        </section>

        <section aria-labelledby="contact-title" className="flex flex-col gap-3">
          <h2 id="contact-title" className="flex items-center gap-2 text-[1.2em] font-semibold">
            <Headphones aria-hidden className="size-5 text-primary" />
            Холбогдох
          </h2>
          <Card className="flex flex-col gap-3">
            {text ? <p className="text-[0.9em] text-muted">{text}</p> : null}
            <PhoneButton phone={phone} label="Тусламжийн утас" name="Тусламж" full />
          </Card>
        </section>

        <div className="flex flex-col gap-2 pb-6">
          <Link href="/" className={buttonClass("filled", true)}>
            Нүүр хуудас
          </Link>
          <Link href="/login" className={buttonClass("outline", true)}>
            Нэвтрэх
          </Link>
        </div>
      </main>
    </div>
  );
}
