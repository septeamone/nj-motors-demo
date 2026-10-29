import credits from "@/lib/credits.json";
import { CARS } from "@/lib/data";
import { channels, SITE } from "@/lib/site";
import { Wordmark } from "./ui";

const NAV = [
  ["catalog", "Автомобили"],
  ["calc", "Расчёт"],
  ["process", "Как мы работаем"],
  ["reviews", "Отзывы"],
  ["faq", "Вопросы"],
  ["contact", "Контакты"],
];

const NAMES: Record<string, string> = {
  "city-kr": "Сеул (блок «Откуда привозим»)",
  "hero-ship": "Автомобилевоз (блок «Как проходит сделка»)",
  ...Object.fromEntries(CARS.map((c) => [c.slug, `${c.brand} ${c.model}`])),
};

type Credit = { file: string; lic: string; artist: string; page: string };

/** Footer: contacts are shown only when NJ Motors has confirmed them (non-null in site.json). */
export function Footer({ prefix = "" }: { prefix?: string }) {
  const contacts = channels();
  const rows = Object.entries(credits as Record<string, Credit>).filter(([slug]) => slug in NAMES);
  return (
    <footer className="border-t border-line bg-bg-2">
      <div className="mx-auto max-w-[var(--page)] px-5 py-16 sm:px-8 lg:px-12 xl:px-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,4fr)_minmax(0,3fr)_minmax(0,3fr)]">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-[34ch] text-[16px] leading-relaxed text-ink-2">
              Подбираем, проверяем и привозим автомобили из Южной Кореи. Работаем с {SITE.brand.since} года.
            </p>
          </div>
          <nav aria-label="Разделы сайта">
            <p className="label">Навигация</p>
            <ul className="mt-4 grid gap-3">
              {NAV.map(([id, label]) => (
                <li key={id}>
                  <a href={`${prefix}#${id}`} className="text-[16px] font-semibold text-ink transition-colors hover:text-accent-ink">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="label">Контакты</p>
            {contacts.length ? (
              <ul className="mt-4 grid gap-4 text-[16px]">
                {contacts.map((c) => (
                  <li key={c.key}>
                    <span className="block text-[16px] text-ink-3">{c.label}</span>
                    {c.href ? (
                      <a href={c.href} className="font-semibold text-ink hover:text-accent-ink">
                        {c.value}
                      </a>
                    ) : (
                      <span className="font-semibold text-ink">{c.value}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                {/* макет: контакты ещё не подтверждены владельцем, места под них показаны честно */}
                <ul className="mt-4 grid gap-4 text-[16px]">
                  {["Телефон", "Эл. почта"].map((k) => (
                    <li key={k}>
                      <span className="block text-ink-3">{k}</span>
                      <span className="font-semibold text-ink-2">Появится после подтверждения</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 max-w-[30ch] text-[16px] leading-snug text-ink-2">Пока можно оставить заявку в форме выше: Андрей свяжется сам.</p>
              </>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-7 text-[16px] text-ink-3 md:flex-row md:items-start md:justify-between">
          <p>© 2026 NJ Motors. Сайт находится в разработке: фото, цены и сроки на нём ориентировочные.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href={`${prefix === "" ? "/" : prefix}privacy/`} className="font-semibold hover:text-ink">
              Политика конфиденциальности
            </a>
            <a href={`${prefix === "" ? "/" : prefix}terms/`} className="font-semibold hover:text-ink">
              Пользовательское соглашение
            </a>
          </div>
        </div>

        {rows.length > 0 && (
          <details className="mt-6 text-[16px] text-ink-3">
            <summary className="cursor-pointer font-semibold hover:text-ink">Источники фото</summary>
            <ul className="mt-3 grid gap-1.5">
              {rows.map(([slug, c]) => (
                <li key={slug}>
                  <span className="font-semibold text-ink-2">{NAMES[slug]}</span>
                  {": "}
                  <a href={c.page} target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-4 hover:text-accent-ink">
                    {c.artist || "Автор не указан"} · {c.lic}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </footer>
  );
}
