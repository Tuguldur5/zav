"use client";

import { useState } from "react";
import { Bell, Check, ClipboardList, Phone, Search } from "lucide-react";
import {
  AppShell,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  DataTable,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageContainer,
  PageHeader,
  PhoneActions,
  Section,
  SegmentedControl,
  Select,
  SkeletonCard,
  Snackbar,
  SplitPane,
  StatusPill,
  Stepper,
  Textarea,
  TextSizeSwitch,
} from "@/components/ui";
import { CustomerBottomNav, CustomerSidebar } from "@/components/app/navs";
import { jobStatus } from "@/lib/status";

/** Dev-only gallery for visual QA: every component on one scrollable page. */
export function KitDemo() {
  const [scope, setScope] = useState<"day" | "week">("day");
  const [dialog, setDialog] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [snack, setSnack] = useState(false);

  return (
    <AppShell
      audience="public"
      tone="user"
      sidebar={<CustomerSidebar />}
      bottomNav={<CustomerBottomNav />}
    >
      <PageContainer>
        <PageHeader
          title="Дизайн систем"
          description="Бүх компонентын жишиг хуудас. Зөвхөн хөгжүүлэлтийн горимд харагдана."
          actions={
            <>
              <Button variant="outline" icon={<Search aria-hidden className="size-4" />}>
                Хайх
              </Button>
              <Button>Ажил захиалах</Button>
            </>
          }
        />

        <Section title="Товчлуур">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Үндсэн</Button>
            <Button variant="tonal">Тунгалаг</Button>
            <Button variant="outline">Хүрээтэй</Button>
            <Button variant="text">Текст</Button>
            <Button size="sm">Жижиг</Button>
            <Button loading>Илгээж байна</Button>
            <IconButton label="Мэдэгдэл">
              <Bell aria-hidden className="size-5" />
            </IconButton>
          </div>
        </Section>

        <Section title="Төлөв ба шошго">
          <div className="flex flex-wrap gap-2">
            {Object.keys(jobStatus).map((key) => (
              <StatusPill key={key} status={key} table={jobStatus} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip>Энгийн</Chip>
            <Chip tone="primary" selected>
              Цэвэрлэгээ
            </Chip>
            <Chip tone="success">Батлагдсан</Chip>
            <Chip tone="warm">Хүлээж байна</Chip>
            <Chip tone="error">Цуцлагдсан</Chip>
          </div>
        </Section>

        <Section title="Маягт">
          <Card className="flex flex-col gap-4">
            <Field label="Нэр" htmlFor="kit-name" required hint="Бүтэн нэрээ бичнэ үү">
              <Input id="kit-name" placeholder="Батбаяр" />
            </Field>
            <Field label="Утас" htmlFor="kit-phone" error="8 оронтой дугаар бичнэ үү">
              <Input id="kit-phone" inputMode="numeric" placeholder="88001122" />
            </Field>
            <Field label="Дүүрэг" htmlFor="kit-district">
              <Select id="kit-district" defaultValue="1">
                <option value="1">Баянгол</option>
                <option value="2">Сүхбаатар</option>
              </Select>
            </Field>
            <Field label="Тайлбар" htmlFor="kit-note" hint="Заавал биш">
              <Textarea id="kit-note" rows={3} />
            </Field>
            <SegmentedControl
              name="Календарын харагдац"
              value={scope}
              onChange={setScope}
              options={[
                { value: "day", label: "Өдрөөр" },
                { value: "week", label: "Долоо хоногоор" },
              ]}
            />
          </Card>
        </Section>

        <Section title="Хүснэгт">
          <DataTable
            caption="Ажилчдын жишиг хүснэгт"
            columns={[
              { key: "name", header: "Ажилчин" },
              { key: "skill", header: "Мэргэжил" },
              { key: "status", header: "Төлөв", align: "right" },
            ]}
            rows={[
              {
                id: "1",
                href: "#",
                cells: [
                  "Батбаяр",
                  "Цэвэрлэгээ",
                  <StatusPill key="s1" status="confirmed" table={jobStatus} />,
                ],
              },
              {
                id: "2",
                href: "#",
                cells: [
                  "Сарнай",
                  "Хүүхэд харах",
                  <StatusPill key="s2" status="claimed" table={jobStatus} />,
                ],
              },
            ]}
          />
        </Section>

        <Section title="Хуваасан харагдац">
          <SplitPane
            list={
              <>
                <Card className="flex items-center justify-between">
                  <span>Жагсаалтын хэсэг</span>
                  <Chip>3</Chip>
                </Card>
                <SkeletonCard />
              </>
            }
            detail={
              <Card className="flex flex-col gap-3">
                <p className="font-medium">Дэлгэрэнгүй хэсэг</p>
                <PhoneActions phone="88001122" />
              </Card>
            }
          />
        </Section>

        <Section title="Хоосон байдал, цонх, мэдэгдэл">
          <EmptyState
            icon={ClipboardList}
            title="Одоогоор хоосон"
            body="Эхний бичлэгээ нэмээд эхлээрэй."
            action={<Button variant="outline">Нэмэх</Button>}
          />
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setDialog(true)}>
              Энгийн цонх
            </Button>
            <Button variant="outline" onClick={() => setConfirm(true)}>
              Баталгаажуулах
            </Button>
            <Button variant="outline" onClick={() => setSnack(true)}>
              Мэдэгдэл
            </Button>
          </div>
        </Section>

        <Section title="Алхмууд, хэмжээ, дугаар">
          <Card>
            <Stepper steps={["Мэргэжил", "Өдөр", "Хаяг", "Илгээх"]} current={1} />
          </Card>
          <Card>
            <TextSizeSwitch />
          </Card>
          <Card className="md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                <Phone aria-hidden className="size-5" />
              </span>
              <span>88001122</span>
            </div>
          </Card>
        </Section>
      </PageContainer>

      <Dialog open={dialog} onClose={() => setDialog(false)} title="Жишиг цонх">
        <div className="flex flex-col gap-4">
          <p className="text-[0.95em] text-muted">
            Утсан дээр доороос гарч, дэлгэц дээр голд харагдана.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialog(false)}>
              Хаах
            </Button>
            <Button
              onClick={() => setDialog(false)}
              icon={<Check aria-hidden className="size-4" />}
            >
              Ойлголоо
            </Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirm}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          setSnack(true);
        }}
        message="Энэ үйлдлийг буцаах боломжгүй."
      />

      <Snackbar open={snack} onClose={() => setSnack(false)} message="Хадгаллаа" />
    </AppShell>
  );
}
