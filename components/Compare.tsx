import { SectionHead, Reveal } from "./ui";

// Three ways to get a car from Korea, side by side. Our column is the kraft page; the claims are only the ones
// NJ Motors has made itself (no markup, the exporter carries the deal, expert report, papers in the buyer's name).
const COLS = ["NJ Motors", "Посредник в России", "Авито или салон"] as const;
const ROWS: { k: string; v: [string, string, string] }[] = [
  { k: "Цена", v: ["До 30% ниже рынка в России", "Выше на комиссию посредника", "Рыночная цена в России"] },
  { k: "Наценка", v: ["Нет: комиссий и наценок не берём", "Комиссия и своя наценка", "Наценка перекупщика или салона"] },
  { k: "Кто отвечает", v: ["Мы сами — экспортёр, весь путь", "Работу всё равно делает экспортёр", "Продавец — до подписания"] },
  { k: "Проверка", v: ["Эксперт, толщиномер, фото и видео до выкупа", "Как договоритесь", "Сами, на месте"] },
  { k: "Документы", v: ["Сразу на ваше имя, платежи официальные", "Через посредника", "Договор с продавцом"] },
];

/** "Why us": NJ Motors against a Russian middleman and the Russian market, row by row. */
export function Compare() {
  return (
    <section id="compare" className="mx-auto max-w-[var(--page)] px-5 pt-14 pb-6 sm:px-8 lg:px-12 lg:pt-20 lg:pb-10 xl:px-20">
      <SectionHead title="Почему напрямую выгоднее" lead="Одна и та же машина из Кореи — три способа её купить." />
      <Reveal className="mt-8 lg:mt-12">
        {/* wide screens: a table with our column lifted as a kraft page; phones: one card per row */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,1.4fr)] items-stretch">
            <div />
            {COLS.map((c, i) => (
              <p
                key={c}
                className={`px-6 pt-6 pb-4 font-display text-[clamp(20px,1.6vw,26px)] tracking-wide uppercase ${
                  i === 0 ? "rounded-t-[8px] bg-[var(--paper)] text-[var(--paper-ink)]" : "text-ink-2"
                }`}
              >
                {c}
              </p>
            ))}
            {ROWS.map((r, ri) => (
              <div key={r.k} className="contents">
                <p className="border-t border-line py-4 pr-4 text-[16px] font-bold text-ink-2">{r.k}</p>
                {r.v.map((v, i) => (
                  <p
                    key={i}
                    className={`px-6 py-4 text-[16px] leading-snug ${
                      i === 0
                        ? `bg-[var(--paper)] font-bold text-[var(--paper-ink)] ${ri === ROWS.length - 1 ? "rounded-b-[8px] pb-6" : ""} border-t border-[rgba(18,16,13,0.14)]`
                        : "border-t border-line text-ink-2"
                    }`}
                  >
                    {v}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
        <ul className="grid gap-3 lg:hidden">
          {ROWS.map((r) => (
            <li key={r.k} className="rounded-[8px] bg-surface p-4">
              <p className="label">{r.k}</p>
              <p className="mt-2 rounded-[6px] bg-[var(--paper)] px-3 py-2 text-[16px] leading-snug font-bold text-[var(--paper-ink)]">
                <span className="mr-1.5 opacity-70">NJ Motors:</span>
                {r.v[0]}
              </p>
              <dl className="mt-2 grid gap-1 text-[15px] leading-snug text-ink-2">
                {COLS.slice(1).map((c, i) => (
                  <div key={c}>
                    <dt className="inline font-bold">{c}: </dt>
                    <dd className="inline">{r.v[i + 1]}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
