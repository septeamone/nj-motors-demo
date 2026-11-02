import { ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/site";
import { BRAND, BrandIcon, type Brand } from "./BrandIcon";
import { Reveal } from "./ui";

const LINKS: { brand: Brand; href: string | null; label: string }[] = [
  { brand: "tiktok", href: SITE.social.tiktok, label: "TikTok" },
  { brand: "vk", href: SITE.social.vk, label: "ВКонтакте" },
  { brand: "telegram", href: SITE.social.telegram, label: "Telegram" },
];

/**
 * A slim horizontal strip after the reviews: where to see more cars, clients and the process. Each button wears its
 * network's own colours; TikTok is black with its cyan and pink plates printed off-register, like its own mark.
 */
export function Socials() {
  const links = LINKS.filter((l) => l.href);
  if (!links.length) return null;
  return (
    <section aria-label="NJ Motors в соцсетях" className="bg-bg-2 pb-12 lg:pb-16">
      <Reveal className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <div className="flex flex-col gap-5 rounded-[8px] bg-surface p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-10">
          <div>
            <p className="font-display text-[clamp(22px,2.2vw,30px)] leading-tight tracking-wide text-ink uppercase">Мы в соцсетях</p>
            <p className="mt-1.5 max-w-[46ch] text-[16px] leading-snug text-ink-2">Новые машины, отзывы клиентов и как проходит каждый этап.</p>
          </div>
          <ul className="flex flex-wrap gap-2.5 sm:gap-3">
            {links.map((l) => (
              <li key={l.brand}>
                <a
                  href={l.href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: BRAND[l.brand].fill }}
                  className={`group inline-flex min-h-12 items-center gap-2.5 rounded-full px-5 text-[16px] font-bold text-white transition-transform duration-150 hover:-translate-y-0.5 ${
                    l.brand === "tiktok" ? "shadow-[-2px_-2px_0_#25F4EE,2px_2px_0_#FE2C55]" : ""
                  }`}
                >
                  <BrandIcon brand={l.brand} tone={l.brand === "tiktok" ? "brand" : "current"} className="size-[22px]" />
                  {l.label}
                  <ArrowUpRight className="size-4 opacity-70 transition-opacity group-hover:opacity-100" strokeWidth={2.2} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
