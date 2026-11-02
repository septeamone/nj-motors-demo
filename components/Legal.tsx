import { PageShell } from "./PageShell";

export type LegalSection = { title: string; text: string[] };

/** Legal pages: a title and numbered sections of plain text. */
export function Legal({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <PageShell>
      <div className="mx-auto max-w-[820px] px-5 py-14 sm:px-8 lg:py-20">
        <h1 className="display text-[clamp(34px,5vw,64px)] !leading-[1]">{title}</h1>
        <div className="mt-10 grid gap-9">
          {sections.map((s, i) => (
            <section key={s.title}>
              <h2 className="font-display text-[22px] tracking-wide uppercase">
                {i + 1}. {s.title}
              </h2>
              <div className="mt-3 grid gap-3 text-[15.5px] leading-relaxed text-ink-2">
                {s.text.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
