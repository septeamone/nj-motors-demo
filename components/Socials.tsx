import { SITE } from "@/lib/site";
import { BRAND, BrandIcon, type Brand } from "./BrandIcon";
import { PhoneMock } from "./PhoneMock";
import { Reveal } from "./ui";

const LINKS: { brand: Brand; href: string | null; label: string }[] = [
  { brand: "telegram", href: SITE.social.telegram, label: "Telegram" },
  { brand: "vk", href: SITE.social.vk, label: "ВКонтакте" },
  { brand: "youtube", href: SITE.social.youtube, label: "YouTube" },
  { brand: "tiktok", href: SITE.social.tiktok, label: "TikTok" },
  { brand: "max", href: SITE.social.max, label: "MAX" },
];

/**
 * After the reviews: where to see more cars, clients and the process, beside the 3D phone showing the real Telegram channel.
 * Each button wears its network's own colours; TikTok is black with its cyan and pink plates printed off-register, like its own mark.
 */
export function Socials() {
  const links = LINKS.filter((l) => l.href);
  if (!links.length) return null;
  return (
    <section aria-label="NJ Motors в соцсетях" className="bg-bg-2 pb-10 lg:pt-20 lg:pb-24">
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        {/* wide screens: one panel, the phone rising out of it above and below, so the height is the phone's, not empty space */}
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,330px)] lg:gap-12 lg:rounded-[18px] lg:bg-surface lg:py-12 lg:pr-12 lg:pl-14 xl:grid-cols-[minmax(0,1fr)_minmax(0,350px)] xl:gap-16 xl:pl-16">
          <Reveal>
            <div className="flex flex-col gap-5 rounded-[8px] bg-surface p-5 sm:p-7 lg:gap-8 lg:rounded-none lg:bg-transparent lg:p-0">
              <div>
                <p className="font-display text-[clamp(22px,3vw,48px)] leading-[1.02] tracking-wide text-ink uppercase">Мы в соцсетях</p>
                <p className="mt-1.5 max-w-[46ch] text-[16px] leading-snug text-ink-2 lg:mt-3 lg:text-[19px]">Ещё больше вариантов с ценами, этапы и процессы работы.</p>
              </div>
              <ul className="grid grid-cols-3 gap-2.5 sm:gap-3 xl:grid-cols-5">
                {links.map((l) => (
                  <li key={l.brand}>
                    <a
                      href={l.href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: BRAND[l.brand].fill }}
                      className={`flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-[14px] px-2 py-3 text-[15px] font-bold text-white transition-transform duration-150 hover:-translate-y-0.5 lg:min-h-[112px] lg:gap-2.5 lg:rounded-[16px] lg:text-[17px] ${
                        l.brand === "tiktok" ? "shadow-[-2px_-2px_0_#25F4EE,2px_2px_0_#FE2C55]" : ""
                      }`}
                    >
                      <BrandIcon brand={l.brand} tone={l.brand === "tiktok" ? "brand" : "current"} className="size-[26px] lg:size-[34px]" />
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="-mt-12 sm:mt-0 lg:-my-32">
            <PhoneMock />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
