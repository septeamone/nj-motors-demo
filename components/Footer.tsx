import credits from "@/lib/credits.json";
import { asset } from "@/lib/asset";
import { CARS } from "@/lib/data";
import { channels } from "@/lib/site";
import { Wordmark } from "./ui";

const NAMES: Record<string, string> = {
  ...Object.fromEntries(CARS.map((c) => [c.slug, `${c.brand} ${c.model}`])),
};

type Credit = { file: string; lic: string; artist: string; page: string };

/**
 * A compact footer: the mark, the contacts (only those NJ Motors has confirmed, non-null in site.json), one line of
 * legal links, and the photo credits folded away.
 */
export function Footer() {
  const contacts = channels();
  const rows = Object.entries(credits as Record<string, Credit>).filter(([slug]) => slug in NAMES);
  return (
    <footer className="bg-bg-2">
      <div className="mx-auto max-w-[var(--page)] px-5 py-7 sm:px-8 lg:px-12 xl:px-20">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <Wordmark />
          {contacts.length ? (
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[16px]">
              {contacts.map((c) => (
                <li key={c.key}>
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
            // макет: контакты ещё не подтверждены владельцем
            <p className="text-[16px] leading-snug text-ink-2">Телефон и почта появятся после подтверждения. Пока: заявка в форме выше.</p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 text-[15px] text-ink-3 lg:flex-row lg:items-start lg:justify-between">
          <p>© 2026 NJ Motors. Сайт в разработке: фото, цены и сроки ориентировочные.</p>
          <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
            <a href={asset("/privacy/")} className="font-semibold hover:text-ink">
              Политика конфиденциальности
            </a>
            <a href={asset("/terms/")} className="font-semibold hover:text-ink">
              Пользовательское соглашение
            </a>
            {rows.length > 0 && (
              <details className="basis-full lg:basis-auto">
                <summary className="cursor-pointer font-semibold hover:text-ink">Источники фото</summary>
                <ul className="mt-2 grid gap-1">
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
        </div>
      </div>
    </footer>
  );
}
