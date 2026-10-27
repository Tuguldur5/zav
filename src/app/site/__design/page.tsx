import { notFound } from "next/navigation";
import { Briefcase } from "lucide-react";
import {
  BentoTile,
  Button,
  ButtonLink,
  CalendarDemo,
  Chip,
  DesignDialog,
  Faq,
  Field,
  Marquee,
  Skeleton,
  SlotStrip,
  StatusPill,
  Toast,
} from "@/components/ds";
import { mn } from "@/lib/i18n/mn";

export const dynamic = "force-dynamic";

export default function DesignPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const copy = mn.design;
  const sampleItems = copy.marqueeItems.map((label) => ({
    label,
    icon: <Briefcase aria-hidden className="size-4" />,
  }));

  return (
    <main className="design-page">
      <header className="design-container design-heading">
        <p className="ds-label">{copy.label}</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>

      <section className="design-section design-container" aria-labelledby="design-colors">
        <h2 id="design-colors">{copy.colorsTitle}</h2>
        <div className="design-colors">
          {copy.colors.map((color) => (
            <div className="design-color" key={color.token}>
              <span
                aria-hidden="true"
                className="design-swatch"
                style={{ backgroundColor: `var(${color.token})` }}
              />
              <span>{color.label}</span>
              <code>{color.token}</code>
              <small>{color.contrast}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="design-section design-container">
        <h2>{copy.typeTitle}</h2>
        <p className="design-type-sample">{copy.sample}</p>
        <p>{copy.bodySample}</p>
      </section>

      <section className="design-section design-container">
        <h2>{copy.controlsTitle}</h2>
        <div className="design-row">
          <Button>{copy.primary}</Button>
          <Button variant="accent">{copy.accent}</Button>
          <Button variant="secondary">{copy.secondary}</Button>
          <Button disabled>{copy.primary}</Button>
          <ButtonLink href="#design-components">{copy.textLink}</ButtonLink>
          <a className="ds-text-link" href="#design-components">
            {copy.textLink}
          </a>
        </div>
      </section>

      <section className="design-section design-container" id="design-components">
        <h2>{copy.componentsTitle}</h2>
        <div className="design-row">
          <Chip>{copy.chip}</Chip>
          <StatusPill tone="warn">{copy.statuses[0]}</StatusPill>
          <StatusPill tone="ok">{copy.statuses[1]}</StatusPill>
          <StatusPill tone="err">{copy.statuses[2]}</StatusPill>
        </div>
        <Field label={copy.field} htmlFor="design-district" error={copy.fieldError}>
          <select className="ds-input" id="design-district" defaultValue="">
            <option value="" disabled>
              {copy.fieldPlaceholder}
            </option>
            <option value="sample">{copy.chip}</option>
          </select>
        </Field>
        <div className="design-demo">
          <span className="ds-label">{mn.common.sample}</span>
          <SlotStrip
            rows={copy.sampleRows}
            variant="board"
            description={copy.slotDescription}
          />
          <SlotStrip
            rows={[copy.sampleRows[0]]}
            variant="divider"
            description={copy.slotDescription}
          />
          <Skeleton
            rows={copy.sampleRows.slice(0, 3)}
            description={copy.slotDescription}
          />
        </div>
        <div className="design-demo">
          <span className="ds-label">{mn.common.sample}</span>
          <Marquee items={sampleItems} pauseLabel={copy.pause} />
        </div>
        <BentoTile title={copy.bentoTitle} body={copy.bentoBody}>
          <SlotStrip
            rows={copy.sampleRows.slice(0, 2)}
            variant="divider"
            description={copy.slotDescription}
          />
        </BentoTile>
        <Faq items={[{ q: copy.faqQuestion, a: copy.faqAnswer }]} />
        <Toast>{copy.toast}</Toast>
        <CalendarDemo
          label={copy.calendarLabel}
          title={copy.calendarTitle}
          hint={copy.calendarHint}
          freeLabel={copy.calendarFree}
          emptyLabel={copy.calendarEmpty}
        />
        <DesignDialog
          openLabel={copy.openDialog}
          title={copy.dialogTitle}
          closeLabel={copy.closeDialog}
        />
      </section>
    </main>
  );
}
