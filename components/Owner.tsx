import Image from "next/image";
import { asset } from "@/lib/asset";
import { SITE } from "@/lib/site";
import { PhoneMock } from "./PhoneMock";
import { NjIcon, type IconName } from "./NjIcon";
import { Reveal, SectionHead } from "./ui";

const POINTS: [string, string, IconName][] = [
  ["Один контакт на всю сделку", "От заявки до ключей вы общаетесь с одним человеком.", "person"],
  ["Видите то же, что и мы", "Фото, видео и документы приходят до выкупа.", "camera"],
  ["Условия в договоре", "Цена и этапы оплаты прописаны до первого платежа.", "contract"],
];

export function Owner() {
  const { owner, legal } = SITE;
  const rows = [
    ["Компания", legal.entity],
    ["ИНН", legal.inn],
    ["ОГРН", legal.ogrn],
  ].filter((r): r is [string, string] => !!r[1]);

  return (
    <section id="about" className="border-t border-line bg-bg-2 py-10 lg:py-16">
      <div className="mx-auto grid max-w-[var(--page)] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:px-12 xl:grid-cols-[minmax(0,3.6fr)_minmax(0,4.5fr)_minmax(0,4.9fr)] xl:gap-12 xl:px-20">
        <Reveal>
          <figure className="plate relative mx-auto w-full max-w-[400px] overflow-hidden lg:mx-0">
            <div className="relative aspect-[1/1]">
              <Image
                src={asset("/brand/owner-andrey.webp")}
                alt={owner.name ? `${owner.name}, ${owner.role}` : owner.role}
                fill
                sizes="(min-width:1024px) 460px, 90vw"
                className="object-cover object-[50%_40%]"
              />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgba(6,11,17,0.7))]" />
              <figcaption className="absolute inset-x-0 bottom-0 p-6 text-white">
                {owner.name && <p className="font-display text-[28px] leading-none tracking-wide uppercase">{owner.name}</p>}
                <p className="mono mt-2 !text-[16px] text-white/85">{owner.role}</p>
              </figcaption>
            </div>
          </figure>
        </Reveal>

        <div className="flex flex-col justify-center">
          <SectionHead
            stacked
            eyebrow="С кем вы работаете" n="05"
            title="С кем вы будете работать"
            lead={`С ${SITE.brand.since} года. Вашу сделку ведёт один человек.`}
          />

          <ul className="mt-10 grid gap-6 border-t border-line pt-8">
            {POINTS.map(([t, d, icon]) => (
              <li key={t} className="flex gap-4">
                <NjIcon name={icon} className="size-9" />
                <span>
                  <span className="block text-[16px] font-bold text-ink">{t}</span>
                  <span className="mt-1 block max-w-[52ch] text-[16px] leading-snug text-ink-2">{d}</span>
                </span>
              </li>
            ))}
          </ul>

          {rows.length > 0 && (
            <dl className="mt-10 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 border-t border-line pt-6">
              {rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="label self-center">{k}</dt>
                  <dd className="text-[16px] font-bold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {owner.video && (
            <video
              controls
              preload="none"
              playsInline
              poster={owner.poster ? asset(owner.poster) : undefined}
              src={asset(owner.video)}
              className="mt-10 aspect-video w-full rounded-[6px] border border-line bg-black"
            />
          )}
        </div>

        <Reveal delay={0.1} className="flex items-center justify-center lg:col-span-2 xl:col-span-1">
          <PhoneMock />
        </Reveal>
      </div>
    </section>
  );
}
