import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { asset } from "@/lib/asset";
import { SectionHead, Reveal } from "./ui";

// Three ways to get a car from Korea, side by side (Andrey's own table, njrules.docx). Our column is the one the eye
// should land on: a raised kraft page with the red plate printed off-register beneath, a tick on every line.
const COLS = ["NJ Motors", "Компания-посредник в России", "Авито или автосалон"] as const;
const ROWS: { k: string; v: [string, string, string] }[] = [
  { k: "Цена", v: ["До 30% дешевле рынка РФ даже с учётом доставки и таможни", "Выше на комиссию посредника", "Рыночная цена в России"] },
  { k: "Комиссия", v: ["Нет комиссий и наценок", "От 100 тыс. ₽ + наценка 10–30%", "Наценка перекупщика или салона"] },
  { k: "Ответственность", v: ["От брони до получения несёт компания-экспортёр", "Всю работу и ответственность всё равно делает и несёт экспортёр", "Только до подписания договора"] },
  { k: "Диагностика авто", v: ["Бесплатный и честный детальный осмотр экспертом с фото- и видеоотчётом", "Те же самые осмотры от компании-экспортёра, но без гарантий честности", "Самостоятельно на месте или за дополнительную плату"] },
  { k: "Прозрачность сделки", v: ["Официальные платежи и документы сразу на покупателя, полное сопровождение до постановки на учёт в ГИБДД. Гарантия юридической чистоты", "Лишний договор и затраты на посредника", "На совести продавца, гарантий нет"] },
];
const LAST = ROWS.length + 1; // grid rows: the heads, then one per comparison

function Ours({ text }: { text: string }) {
  return (
    <span className="flex gap-3">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--accent-fill)] text-white">
        <Check className="size-4" strokeWidth={3.4} />
      </span>
      <span>{text}</span>
    </span>
  );
}

/** "Why us": NJ Motors against a Russian middleman and the Russian market, row by row. */
export function Compare() {
  return (
    <section id="compare" className="mx-auto max-w-[var(--page)] px-5 pt-10 pb-4 sm:px-8 lg:px-12 lg:pt-16 lg:pb-8 xl:px-20">
      <SectionHead title="Почему напрямую выгоднее" lead="Одна и та же машина из Кореи — три способа её купить." />
      <Reveal className="mt-7 lg:mt-12">
        {/* wide screens: a table; our column is one raised kraft page laid under its cells */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)_minmax(0,1.35fr)_minmax(0,1.35fr)]">
            <div aria-hidden className="adv-tile rounded-[12px] bg-[var(--paper)]" style={{ gridColumn: 2, gridRow: `1 / ${LAST + 1}` }} />
            <div className="relative flex items-center gap-3 px-7 pt-7 pb-5 text-[var(--paper-ink)]" style={{ gridColumn: 2, gridRow: 1 }}>
              <Image src={asset("/brand/nj-roundel-256.webp")} alt="" width={56} height={56} className="size-12 rounded-full" />
              <span className="font-display text-[clamp(24px,2vw,32px)] leading-none tracking-wide uppercase">{COLS[0]}</span>
            </div>
            {COLS.slice(1).map((c, i) => (
              <p key={c} className="flex items-end px-6 pt-7 pb-5 font-display text-[clamp(18px,1.4vw,23px)] leading-tight tracking-wide text-ink-3 uppercase" style={{ gridColumn: i + 3, gridRow: 1 }}>
                {c}
              </p>
            ))}
            {ROWS.map((r, ri) => (
              <div key={r.k} className="contents">
                <p className="border-t border-line py-5 pr-4 text-[16px] font-bold text-ink-2" style={{ gridColumn: 1, gridRow: ri + 2 }}>
                  {r.k}
                </p>
                <p
                  className={`relative mx-7 border-t border-[rgba(18,16,13,0.14)] py-5 text-[17px] leading-snug font-bold text-[var(--paper-ink)] ${ri === ROWS.length - 1 ? "pb-7" : ""}`}
                  style={{ gridColumn: 2, gridRow: ri + 2 }}
                >
                  <Ours text={r.v[0]} />
                </p>
                {r.v.slice(1).map((v, i) => (
                  <p key={i} className="border-t border-line px-6 py-5 text-[16px] leading-snug text-ink-3" style={{ gridColumn: i + 3, gridRow: ri + 2 }}>
                    {v}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* phones: one card per comparison, ours on kraft, the others quieter underneath */}
        <ul className="grid gap-3 lg:hidden">
          {ROWS.map((r) => (
            <li key={r.k} className="rounded-[10px] bg-surface p-4">
              <p className="text-[15px] font-bold text-ink-2">{r.k}</p>
              <div className="adv-tile mt-2.5 rounded-[8px] bg-[var(--paper)] px-4 py-3.5 text-[17px] leading-snug font-bold text-[var(--paper-ink)]">
                <p className="mb-1.5 font-display text-[15px] tracking-wide uppercase opacity-70">{COLS[0]}</p>
                <Ours text={r.v[0]} />
              </div>
              <dl className="mt-3 grid gap-1.5 px-1 text-[15px] leading-snug text-ink-3">
                {COLS.slice(1).map((c, i) => (
                  <div key={c}>
                    <dt className="inline font-bold text-ink-2">{c}: </dt>
                    <dd className="inline">{r.v[i + 1]}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex lg:mt-10 lg:justify-center">
          <a href="#lead-form" className="btn btn-primary max-lg:w-full">
            Подобрать машину напрямую
            <ArrowRight className="size-[18px]" strokeWidth={2} />
          </a>
        </div>
      </Reveal>
    </section>
  );
}
