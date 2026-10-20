import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Check,
  Clock,
  HandHeart,
  MapPin,
  Phone,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { getSupportPhone, getSupportText } from "@/lib/settings";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { Card } from "@/components/ui/Card";
import { HeroArt } from "@/components/art/HeroArt";
import { WaveDivider } from "@/components/art/WaveDivider";
import { StepIcon1, StepIcon2, StepIcon3 } from "@/components/art/StepIcons";
import { LandingFooter, LandingHeader } from "@/components/site/LandingChrome";
import { buttonClass } from "@/components/ui/styles";

export const dynamic = "force-dynamic";

const steps = [
  {
    title: "Зар үүсгэх",
    body: "Ямар ажил, хэзээ, хаана хийлгэхээ бичээрэй.",
  },
  {
    title: "Админ тохируулна",
    body: "Манай админ зарыг хүлээж аваад тохирох ажилтныг утсаар ярилцана.",
  },
  {
    title: "Ажил амжилттай",
    body: "Ажилтан баталгаажмагц хаяг, холбоо барих мэдээлэл харагдана.",
  },
];

const safeguards = [
  {
    icon: UserCheck,
    text: "Ажилтан зөвхөн баталгаажсаны дараа хаягаа харна.",
  },
  {
    icon: ShieldCheck,
    text: "Ажилтны утасны дугаар захиалагчид харагдахгүй.",
  },
  {
    icon: Phone,
    text: "Админ ажилтан бүрийг утсаар шалгана.",
  },
];

const trust = [
  { icon: Phone, text: "Админ утсаар шалгана" },
  { icon: MapPin, text: "Хаяг зөвхөн баталгаажсаны дараа харагдана" },
  { icon: Check, text: "Бүртгэл үнэгүй" },
];

export default async function LandingPage() {
  const [phone, supportText] = await Promise.all([getSupportPhone(), getSupportText()]);

  return (
    <div className="min-h-dvh text-ink">
      <OfflineBanner />
      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="hero-dots">
          <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:min-h-[600px] lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-[72px]">
            <div className="flex flex-col gap-6 lg:col-span-7">
              <p className="eyebrow">Хагас цагийн ажил</p>
              <h1 className="hero-title">
                Ажил хайх, ажилтан олох{" "}
                <span className="marker-sky">хамгийн хялбар зам</span>
              </h1>
              <p className="max-w-xl text-[1.02em] text-muted">
                Ажил хэрэгтэй юу, эсвэл зав гарвал ажиллах уу? Бид утсаар ярилцаж, тохирох
                хүнийг тааруулна.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Эхлэх">
                <Link href="/register?role=customer" className="block h-full">
                  <Card className="option-card flex h-full flex-col gap-3 p-5">
                    <span className="flex size-11 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                      <Briefcase aria-hidden className="size-6" />
                    </span>
                    <span className="text-[1.1em] font-semibold">Би ажил захиалъя</span>
                    <span className="text-[0.9em] text-muted">
                      Цэвэрлэгээ, засвар, нүүлгэлт — ямар ч ажил зарлаарай.
                    </span>
                    <span className="mt-auto inline-flex items-center gap-1 pt-2 font-medium text-primary">
                      Зар үүсгэх <ArrowRight aria-hidden className="size-4" />
                    </span>
                  </Card>
                </Link>

                <Link href="/register?role=worker" className="block h-full">
                  <Card className="option-card flex h-full flex-col gap-3 p-5">
                    <span className="flex size-11 items-center justify-center rounded-full bg-success-container text-success">
                      <HandHeart aria-hidden className="size-6" />
                    </span>
                    <span className="text-[1.1em] font-semibold">Би зав гарвал ажиллая</span>
                    <span className="text-[0.9em] text-muted">
                      Чөлөөт өдрөө тэмдэглээд, ойролцоо ажил аваарай.
                    </span>
                    <span className="mt-auto inline-flex items-center gap-1 pt-2 font-medium text-primary">
                      Бүртгүүлэх <ArrowRight aria-hidden className="size-4" />
                    </span>
                  </Card>
                </Link>
              </div>

              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[0.85em] text-muted">
                {trust.map((item) => (
                  <li key={item.text} className="flex items-center gap-1.5">
                    <item.icon aria-hidden className="size-4 shrink-0 text-primary-hover" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mx-auto w-4/5 max-w-[460px] lg:col-span-5 lg:w-full">
              <HeroArt className="h-auto w-full" />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-16 border-y border-divider bg-surface">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 sm:py-[72px] lg:px-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="eyebrow">Гурван алхам</p>
              <h2 className="text-[1.6em] font-semibold sm:text-[2em]">Хэрхэн ажилладаг</h2>
              <p className="max-w-xl text-[0.95em] text-muted">
                Зар үүсгэхээс эхлээд ажилтантай холбогдох хүртэл бүх зүйл энгийн.
              </p>
            </div>

            <div className="relative mt-10">
              <div
                aria-hidden
                className="absolute inset-x-[16%] top-6 hidden border-t border-divider sm:block"
              />
              <ol className="relative grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
                {steps.map((step, index) => {
                  const Icon = [StepIcon1, StepIcon2, StepIcon3][index];
                  return (
                    <li key={step.title} className="flex flex-col items-center gap-3 text-center">
                      <span className="relative z-10 flex size-12 items-center justify-center rounded-full border border-divider bg-surface text-primary">
                        <Icon className="size-6" />
                        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[0.7em] font-semibold text-on-primary">
                          {index + 1}
                        </span>
                      </span>
                      <p className="font-semibold">{step.title}</p>
                      <p className="max-w-[32ch] text-[0.9em] text-muted">{step.body}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        {/* Safeguards */}
        <section className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 sm:py-[72px] lg:px-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="eyebrow">Ил тод, аюулгүй</p>
              <h2 className="text-[1.5em] font-semibold sm:text-[1.8em]">
                Таны мэдээлэл хамгаалагдсан
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {safeguards.map((item) => (
                <Card key={item.text} className="flex flex-col gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-success-container text-success">
                    <item.icon aria-hidden className="size-5" />
                  </span>
                  <p className="text-[0.95em]">{item.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="relative">
          <div className="text-primary-container">
            <WaveDivider className="block h-8 w-full sm:h-14" />
          </div>
          <div className="bg-primary-container">
            <div className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 pb-10 sm:px-6 sm:pb-[72px] lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:gap-10 lg:px-8">
              <div className="flex flex-col gap-3">
                <p className="eyebrow">Тусламж</p>
                <h2 className="text-[1.6em] font-semibold text-on-primary-container sm:text-[2em]">
                  Тусламж хэрэгтэй юу?
                </h2>
                <p className="max-w-lg text-[0.95em] text-muted">
                  {supportText ??
                    "Асуулт байвал бидэнтэй утсаар холбогдоорой. Ажлын цагаар админ танд туслана."}
                </p>
                <p className="flex items-center gap-2 text-[0.9em] font-medium text-on-primary-container">
                  <Clock aria-hidden className="size-4" />
                  Даваа–Бямба · 09:00–19:00
                </p>
              </div>

              <Card className="flex flex-col gap-3">
                <p className="text-[0.8em] font-semibold uppercase tracking-[0.08em] text-muted">
                  Тусламжийн утас
                </p>
                <p className="text-[1.45em] font-semibold">{phone ?? "Утас тохируулаагүй"}</p>
                {phone ? (
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={buttonClass("filled", true)}>
                    <Phone aria-hidden className="size-5" />
                    Залгах
                  </a>
                ) : (
                  <Link href="/help" className={buttonClass("outline", true)}>
                    Тусламжийн хуудас
                  </Link>
                )}
              </Card>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
