import Image from "next/image";
import { asset } from "@/lib/asset";
import { SITE } from "@/lib/site";
import { nb } from "@/lib/typo";
import { OwnerVideo } from "./OwnerVideo";
import { PhoneMock } from "./PhoneMock";
import { Reveal, SectionHead } from "./ui";

export function Owner() {
  const { owner, legal } = SITE;
  const rows = [
    ["Компания", legal.entity],
    ["ИНН", legal.inn],
    ["ОГРН", legal.ogrn],
  ].filter((r): r is [string, string] => !!r[1]);

  return (
    <section id="about" className="bg-bg-2 pt-12 pb-6 lg:pt-20 lg:pb-8">
      <div className="mx-auto grid max-w-[var(--page)] gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:px-12 xl:grid-cols-[minmax(0,3.6fr)_minmax(0,4.5fr)_minmax(0,4.9fr)] xl:gap-12 xl:px-20">
        <Reveal>
          {owner.video ? (
            // Andrey's own video takes the place of his photo: the face once, and in his own words
            // phones: the video and the name side by side, under the heading (a full-width video took a screen)
            <figure className="flex w-full items-end gap-5 lg:block lg:max-w-[340px]">
              <div className="w-[46%] max-w-[220px] shrink-0 lg:w-full lg:max-w-none">
                <OwnerVideo src={asset(owner.video)} poster={owner.poster ? asset(owner.poster) : undefined} />
              </div>
              <figcaption className="pb-1 lg:mt-4 lg:pb-0">
                {owner.name && <p className="font-display text-[26px] leading-none tracking-wide text-ink uppercase">{owner.name}</p>}
                <p className="mt-1.5 text-[16px] text-ink-2">{owner.role}</p>
              </figcaption>
            </figure>
          ) : (
          <figure className="plate relative mx-auto w-full max-w-[400px] overflow-hidden lg:mx-0 lg:-mr-10 lg:-rotate-[1.4deg]">
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
                <p className="mt-2 text-[16px] text-white/85">{owner.role}</p>
              </figcaption>
            </div>
          </figure>
          )}
        </Reveal>

        <div className="flex flex-col justify-center max-lg:order-first">
          <SectionHead
            stacked
            title="С кем вы будете работать"
            lead="От заявки до ключей вашу сделку ведёт Андрей сам, без посредников."
          />

          {/* the first screen already says this on phones, where every line costs a scroll */}
          <p className="mt-8 max-w-[44ch] text-[clamp(19px,1.7vw,23px)] leading-snug font-medium text-ink max-lg:hidden">
            {nb("До выкупа автомобиль проходит независимый осмотр, а цена, вознаграждение и этапы оплаты записаны в договоре до первого платежа.")}
          </p>

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

        </div>

        <Reveal delay={0.1} className="flex items-center justify-center lg:col-span-2 xl:col-span-1">
          <PhoneMock />
        </Reveal>
      </div>
    </section>
  );
}
