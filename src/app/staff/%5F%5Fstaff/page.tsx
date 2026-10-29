import { notFound } from "next/navigation";
import { mn } from "@/lib/i18n/mn";

export const dynamic = "force-dynamic";

/**
 * Dev-only gallery for the staff redesign. Lives on the staff host as /__staff
 * (middleware rewrites the staff host to /staff/...), 404 in production.
 * T0 shows the tokens of both themes and both tones; the component catalogue
 * is added in T2.
 */
export default function StaffKitPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const copy = mn.staffKit;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8">
      <header className="mb-10 max-w-[70ch]">
        <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-[color:var(--st-muted)]">
          {copy.label}
        </p>
        <h1 className="mt-2 text-[28px] font-semibold leading-[34px] tracking-tight">
          {copy.title}
        </h1>
        <p className="mt-3 text-[14px] text-[color:var(--st-muted)]">{copy.intro}</p>
      </header>

      <section aria-labelledby="staff-kit-tokens" className="mb-10">
        <h2 id="staff-kit-tokens" className="mb-4 text-[18px] font-semibold">
          {copy.tokensTitle}
        </h2>
        <div className="flex flex-col gap-6">
          {copy.tones.map((group) => (
            <div
              key={group.label}
              className="staff-theme rounded-[20px] p-4"
              data-theme={group.theme}
              data-staff-tone={group.tone}
              style={{
                background: "var(--st-bg)",
                border: "1px solid var(--st-line)",
                color: "var(--st-ink)",
              }}
            >
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.08em] text-[color:var(--st-muted)]">
                {group.label}
              </p>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {copy.tokens.map((item) => (
                  <li
                    key={item.token}
                    className="rounded-[14px] p-3"
                    style={{
                      background: "var(--st-surface)",
                      border: "1px solid var(--st-line)",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="block h-9 rounded-[10px]"
                      style={{
                        background: `var(${item.token})`,
                        border: "1px solid var(--st-line)",
                      }}
                    />
                    <span className="mt-2 block text-[13px] font-semibold">{item.label}</span>
                    <code className="block text-[11px] text-[color:var(--st-muted)]">
                      {item.token}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="staff-kit-samples" className="mb-10">
        <h2 id="staff-kit-samples" className="mb-3 text-[18px] font-semibold">
          {copy.samplesTitle}
        </h2>
        <div
          className="staff-theme rounded-[20px] p-5"
          style={{ background: "var(--st-surface)", border: "1px solid var(--st-line)" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="rounded-[12px] px-4 py-3 text-[14px] font-semibold"
              style={{ background: "var(--st-btn)", color: "var(--st-on-btn)" }}
            >
              {copy.samples.primary}
            </span>
            <span
              className="rounded-[12px] px-4 py-3 text-[14px] font-semibold"
              style={{ border: "1px solid var(--st-outline)", color: "var(--st-ink)" }}
            >
              {copy.samples.outline}
            </span>
            <span
              className="rounded-full px-4 py-2 text-[14px] font-semibold"
              style={{ background: "var(--st-accent-soft)", color: "var(--st-accent-ink)" }}
            >
              {copy.samples.activeTab}
            </span>
            {[
              ["--st-ok", "--st-ok-bg", copy.samples.ok],
              ["--st-warn", "--st-warn-bg", copy.samples.warn],
              ["--st-err", "--st-err-bg", copy.samples.err],
            ].map(([ink, background, label]) => (
              <span
                key={label}
                className="rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{ background: `var(${background})`, color: `var(${ink})` }}
              >
                {label}
              </span>
            ))}
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {copy.samples.tiles.map((tile, index) => (
              <li
                key={tile.label}
                className="rounded-[18px] p-4"
                style={{ background: `var(${tile.token})`, color: "var(--st-ink)" }}
              >
                <span className="block text-[13px] text-[color:var(--st-muted)]">
                  {tile.label}
                </span>
                <span className="mt-1 block text-[28px] font-bold leading-[34px] tabular-nums">
                  {index + 1}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="staff-kit-type" className="mb-10">
        <h2 id="staff-kit-type" className="mb-3 text-[18px] font-semibold">
          {copy.typeTitle}
        </h2>
        <p className="text-[28px] font-semibold leading-[34px] tracking-tight">{copy.typeSample}</p>
        <p className="mt-2 text-[14px] text-[color:var(--st-muted)]">{copy.typeBody}</p>
      </section>

      <section aria-labelledby="staff-kit-components">
        <h2 id="staff-kit-components" className="mb-3 text-[18px] font-semibold">
          {copy.componentsTitle}
        </h2>
        <p className="max-w-[70ch] text-[14px] text-[color:var(--st-muted)]">
          {copy.componentsNote}
        </p>
      </section>
    </main>
  );
}
