import { asset } from "@/lib/asset";
import { channels, SITE } from "@/lib/site";
import { BRAND, BrandIcon, type Brand } from "./BrandIcon";
import { Wordmark } from "./ui";

// contacts that have a network of their own show its mark in its own colours, like the buttons by the form
const MARK: Partial<Record<string, Brand>> = { phone: "call", telegram: "telegram", vk: "vk", max: "max", tiktok: "tiktok" };


/**
 * A compact footer: the mark, the contacts (only those NJ Motors has confirmed, non-null in site.json), one line of
 * legal links.
 */
export function Footer() {
  const contacts = channels();
  return (
    <footer className="bg-bg-2">
      <div className="mx-auto max-w-[var(--page)] px-5 py-7 sm:px-8 lg:px-12 xl:px-20">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <Wordmark />
          {contacts.length ? (
            <ul className="flex flex-wrap items-center gap-3 text-body">
              {contacts.map((c) => {
                const b = MARK[c.key];
                if (b && c.href)
                  return (
                    <li key={c.key}>
                      <a
                        href={c.href}
                        target={c.key === "phone" ? undefined : "_blank"}
                        rel="noopener noreferrer"
                        aria-label={c.key === "telegram" ? `Telegram ${c.value}` : c.label}
                        title={c.key === "telegram" ? `Telegram ${c.value}` : c.label}
                        style={{ background: BRAND[b].fill }}
                        className="grid size-12 place-items-center rounded-full text-white transition-transform duration-150 hover:-translate-y-0.5"
                      >
                        <BrandIcon brand={b} tone={b === "tiktok" ? "brand" : "current"} className="size-6" />
                      </a>
                    </li>
                  );
                return (
                  <li key={c.key}>
                    {c.href ? (
                      <a href={c.href} className="relative font-semibold text-ink before:absolute before:-inset-x-1 before:-inset-y-[11px] hover:text-accent-ink">
                        {c.value}
                      </a>
                    ) : (
                      <span className="font-semibold text-ink">{c.value}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            // макет: контакты ещё не подтверждены владельцем
            <p className="text-body leading-snug text-ink-2">Напишите нам в соцсетях — ссылки выше.</p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 text-ui text-ink-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid gap-1">
            <p>© 2026 NJ Motors. Сайт в разработке: фото, цены и сроки ориентировочные.</p>
            <p>Сайт носит информационный характер и не является публичной офертой.</p>
            {SITE.legal.entity && (
              // the exporter behind NJ Motors, as on its invoices
              <p>
                NJ Motors — {SITE.legal.entity}
                {SITE.legal.regNo ? `, рег. номер ${SITE.legal.regNo}` : ""}
                {SITE.legal.address ? `. ${SITE.legal.address}` : ""}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
            <a href={asset("/privacy/")} className="relative font-semibold before:absolute before:-inset-x-1 before:-inset-y-[11px] hover:text-ink">
              Политика конфиденциальности
            </a>
            <a href={asset("/terms/")} className="relative font-semibold before:absolute before:-inset-x-1 before:-inset-y-[11px] hover:text-ink">
              Пользовательское соглашение
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
