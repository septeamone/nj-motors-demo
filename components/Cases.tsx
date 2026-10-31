import { CASES } from "@/lib/data";
import { rub } from "@/lib/format";
import { Reveal, SectionHead } from "./ui";

/**
 * Real deals against the Russian market: what the client paid through NJ Motors, what a similar car costs in Russia,
 * and the difference. Shows nothing until the owner's own deals are filled in (lib/data CASES).
 */
export function Cases() {
  if (!CASES.length) return null;
  return (
    <section id="cases" className="mx-auto max-w-[var(--page)] px-5 pt-14 pb-6 sm:px-8 lg:px-12 lg:pt-20 xl:px-20">
      <SectionHead title="Сколько сэкономили клиенты" lead="Настоящие сделки Андрея: итог под ключ и цена похожей машины в России." />
      <ul className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CASES.map((c) => {
          const save = c.market - c.ours;
          return (
            <Reveal as="li" key={`${c.car}-${c.city}`} className="plate flex flex-col gap-4 p-6">
              <div>
                <p className="font-display text-[24px] leading-tight tracking-wide uppercase">{c.car}</p>
                <p className="mt-1 text-[16px] text-ink-2">
                  {c.year} · для клиента из {c.city}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3 border-t border-line pt-4">
                <div>
                  <dt className="label">Через NJ Motors</dt>
                  <dd className="num mt-1 text-[22px]">{rub(c.ours)}</dd>
                </div>
                <div>
                  <dt className="label">В России</dt>
                  <dd className="num mt-1 text-[22px] text-ink-3 line-through decoration-1">{rub(c.market)}</dd>
                </div>
              </dl>
              {save > 0 && (
                <p className="text-[18px] font-bold text-ink">
                  Выгода {rub(save)} ({Math.round((save / c.market) * 100)}%)
                </p>
              )}
              {c.note && <p className="text-[15px] leading-snug text-ink-2">{c.note}</p>}
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
