import Link from "next/link";
import { Container, Card, buttonCls } from "@/components/public/ui";
import { PublicFooter } from "@/components/public/PublicFooter";
import { getSupportPhone, getSupportText } from "@/lib/settings";
import { siteUrl, workerUrl } from "@/lib/hosts";

const customerSteps = [
  "Ажлын төрлөө сонгоно.",
  "Огноо, дүүрэг, хаягаа бичнэ.",
  "Баталгаажуулалтын гурван нүдийг тэмдэглэж захиалгаа илгээнэ.",
  "Манай админ утсаар холбогдож, тохирох ажилтныг олно.",
];

const workerSteps = [
  "Мэргэжил, дүүргээ сонгож бүртгүүлнэ.",
  "Манай админ утсаар шалгана.",
  "Календарь дээр чөлөөтэй өдрөө тэмдэглэнэ.",
  "Ажлын санал ирэхэд зөвшөөрөх эсвэл татгалзана.",
];

export async function HelpScreen({ audience }: { audience: "customer" | "worker" }) {
  const [phone, supportText] = await Promise.all([getSupportPhone(), getSupportText()]);
  const tel = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;

  return (
    <div className="min-h-dvh bg-bg">
      <header className="public-legal-header">
        <Container className="public-legal-header-inner">
          <Link href="/" className="public-legal-brand">
            Зав байна
          </Link>
          <nav className="public-legal-links">
            <Link href="/terms" className="text-muted hover:text-primary">
              Нөхцөл
            </Link>
            <Link href="/privacy" className="text-muted hover:text-primary">
              Нууцлал
            </Link>
            {audience === "worker" ? (
              <Link href="/login" className="text-muted hover:text-primary">
                Нэвтрэх
              </Link>
            ) : (
              <Link href="/login" className="text-muted hover:text-primary">
                Нэвтрэх
              </Link>
            )}
          </nav>
        </Container>
      </header>

      <main>
        <Container className="py-8 sm:py-12">
          <div className="max-w-[720px]">
            <h1 className="public-page-title">
              Тусламж
            </h1>
            <p className="mt-2 text-muted">
              {audience === "worker"
                ? "Ажилтанд хэрэгтэй богино заавар, холбоо барих мэдээлэл."
                : "Ажил захиалахад хэрэгтэй богино заавар, холбоо барих мэдээлэл."}
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex flex-col gap-6">
              <Card className="p-5">
                <h2 className="font-semibold">Хэрхэн ажилладаг</h2>
                <ol className="mt-3 flex flex-col gap-2 text-[0.95em] text-muted">
                  {(audience === "worker" ? workerSteps : customerSteps).map((step, index) => (
                    <li key={step} className="flex gap-2">
                      <span className="font-medium text-ink">{index + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </Card>

              <Card className="p-5" id="install">
                <h2 className="font-semibold">Нүүр дэлгэцэнд нэмэх</h2>
                <p className="mt-2 text-[0.92em] text-muted">
                  Ингэвэл утсаасаа нэг товчоор нээж, мэдэгдэл авах боломжтой.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[8px] border border-divider p-3">
                    <p className="font-medium">iPhone</p>
                    <p className="mt-1 text-[0.9em] text-muted">
                      Safari → Share (дөрвөлжин сум) → “Add to Home Screen” → Add.
                    </p>
                  </div>
                  <div className="rounded-[8px] border border-divider p-3">
                    <p className="font-medium">Android</p>
                    <p className="mt-1 text-[0.9em] text-muted">
                      Chrome → баруун дээд цэс → “Install app” → Install.
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[0.85em] text-muted">
                  iPhone дээр мэдэгдэл зөвхөн нүүр дэлгэцэнд нэмсний дараа ажиллана.
                </p>
              </Card>

              <Card className="p-5">
                <h2 className="font-semibold">Нэг и-мэйл — нэг бүртгэл</h2>
                <p className="mt-2 text-[0.92em] text-muted">
                  Нэг и-мэйл хаягаар зөвхөн нэг бүртгэл нээгдэж, нэг үүрэгтэй байна. Ажил
                  захиалах ба ажил хийх хоёуланг нь хийх бол хоёр өөр и-мэйл ашиглана.
                </p>
                <div className="mt-3 flex flex-col gap-2 text-[0.9em]">
                  <a href={siteUrl("/register")} className="text-primary underline underline-offset-2">
                    Захиалагчаар бүртгүүлэх
                  </a>
                  <a href={workerUrl("/register")} className="text-primary underline underline-offset-2">
                    Ажилтнаар бүртгүүлэх
                  </a>
                </div>
              </Card>
            </div>

            <aside className="flex flex-col gap-4">
              <Card className="p-5">
                <p className="text-[0.82em] text-muted">Тусламжийн утас</p>
                {phone ? (
                  <>
                    <p className="mt-1 text-[1.1em] font-semibold">{phone}</p>
                    {supportText ? <p className="text-[0.85em] text-muted">{supportText}</p> : null}
                    {tel ? (
                      <a href={tel} className={buttonCls("primary", true)}>
                        Залгах
                      </a>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-1 text-[0.9em] text-muted">Ажлын цагаар админ хариулна.</p>
                )}
              </Card>
              <Card className="p-5">
                <p className="font-medium">Хууль эрх зүй</p>
                <div className="mt-2 flex flex-col gap-2 text-[0.9em]">
                  <Link href="/terms" className="text-primary underline underline-offset-2">
                    Үйлчилгээний нөхцөл
                  </Link>
                  <Link href="/privacy" className="text-primary underline underline-offset-2">
                    Нууцлалын бодлого
                  </Link>
                </div>
              </Card>
            </aside>
          </div>
        </Container>
      </main>

      <PublicFooter supportPhone={phone} />
    </div>
  );
}
