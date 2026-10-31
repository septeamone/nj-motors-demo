"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { asset } from "@/lib/asset";
import { CARS, FUEL_NAME, type Car } from "@/lib/data";
import { km, rub } from "@/lib/format";
import { PRICE_LABEL } from "@/lib/site";
import { NjIcon } from "./NjIcon";
import { Quiz } from "./Quiz";
import { Reveal, SectionHead } from "./ui";

export function Catalog() {
  const [open, setOpen] = useState<Car | null>(null);
  const calm = useReducedMotion();
  // the card's picture flows into the dialog (View Transitions), where the browser can do it
  // only the clicked card carries the transition name, and only for the moment of the switch
  const [morph, setMorph] = useState<string | null>(null);
  // the car pictures wait until the opening is over: under the intro they only took the line from the page's code
  const [pics, setPics] = useState(false);
  useEffect(() => {
    const go = () => setPics(true);
    if (["play", "glide"].includes(document.documentElement.dataset.intro ?? "")) {
      window.addEventListener("intro-end", go, { once: true });
      return () => window.removeEventListener("intro-end", go);
    }
    go();
  }, []);
  // the sideways row: arrows appear only when the cars do not all fit; the smooth page scroll leaves the row alone then
  const rail = useRef<HTMLUListElement>(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const check = () => {
      const over = el.scrollWidth > el.clientWidth + 2;
      setMore(over);
      if (over) el.setAttribute("data-lenis-prevent", "");
      else el.removeAttribute("data-lenis-prevent");
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const slide = (dir: number) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.9, behavior: "smooth" });
  const show = (car: Car) => {
    const d = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (calm || !d.startViewTransition) return setOpen(car);
    flushSync(() => setMorph(car.slug));
    d.startViewTransition(() =>
      flushSync(() => {
        setMorph(null);
        setOpen(car);
      }),
    );
  };
  return (
    // The top of the section is see-through: it rises over the last frame of the container film in the hero, so the
    // heading stands on the film (in the dark theme's light ink, whatever the theme), and the section's own ground
    // fades in under the cards (a scrim, not decoration).
    <section
      id="catalog"
      className="cut-bottom pt-[30svh]"
      style={{ ["--cut" as string]: "clamp(1.25rem, 4vw, 4rem)", background: "linear-gradient(180deg, transparent 0, transparent calc(30svh + 140px), var(--bg-2) calc(30svh + 380px))" }}
    >
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <div data-theme="dark" className="on-film">
          <SectionHead
            title="Примеры из Кореи"
            lead="Реальный автомобиль Андрей подбирает под вашу задачу, а цену считает до заказа."
          />
        </div>

        {/* any number of cars: one row that scrolls sideways (4 in view on a wide screen, 2 on a tablet), arrows when
            there are more than fit, so a long catalogue never makes the page longer */}
        <div className="mt-9 flex items-center justify-end gap-1.5 lg:mt-12">
          {more && (
            <>
              <button type="button" aria-label="Предыдущие машины" onClick={() => slide(-1)} className="grid size-11 cursor-pointer place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-accent">
                <ChevronLeft className="size-5" strokeWidth={2} />
              </button>
              <button type="button" aria-label="Следующие машины" onClick={() => slide(1)} className="grid size-11 cursor-pointer place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-accent">
                <ChevronRight className="size-5" strokeWidth={2} />
              </button>
            </>
          )}
        </div>
        <ul ref={rail} className="-mx-5 mt-3 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overscroll-x-contain px-5 pb-3 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0">
          {CARS.map((car, i) => (
            <Reveal as="li" key={car.slug} delay={Math.min(i, 4) * 0.05} className="w-[80%] shrink-0 snap-start sm:w-[calc((100%-16px)/2)] lg:w-[calc((100%-48px)/4)]">
              <CarCard car={car} morph={morph === car.slug} pics={pics} onOpen={() => show(car)} />
            </Reveal>
          ))}
        </ul>

        {/* no model to your taste here: four taps and a phone instead of a long message */}
        <Reveal delay={0.1} className="mt-10 grid items-center gap-6 lg:mt-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          <p className="font-display text-[clamp(26px,3vw,40px)] leading-[1.05] tracking-wide text-ink uppercase">
            Нужной модели нет? Подберём любую с&nbsp;корейского рынка.
          </p>
          <Quiz />
        </Reveal>
      </div>

      <Dialog.Root open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="dlg-fade fixed inset-0 z-[60] bg-[rgba(4,12,20,0.82)]" />
          <Dialog.Content
            data-lenis-prevent
            className="plate dlg-pop fixed top-1/2 left-1/2 z-[70] max-h-[92svh] w-[min(94vw,880px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto"
          >
            {open && <CarDetails car={open} onDone={() => setOpen(null)} />}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}

/** The car goes into the request form and the page goes to it. */
const want = (car: Car) =>
  window.dispatchEvent(new CustomEvent<string>("lead-prefill", { detail: `Интересует: ${car.brand} ${car.model}, ${car.year}` }));

/**
 * A car card: the picture grows a little under the mouse; a click opens the details (the picture flows into them).
 * Under it, the plain action: "I want one like this" puts the car into the request.
 */
function CarCard({ car, morph, pics, onOpen }: { car: Car; morph: boolean; pics: boolean; onOpen: () => void }) {
  return (
    <div className="plate flex h-full w-full flex-col overflow-hidden">
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`${car.brand} ${car.model}, ${car.year}: подробнее`}
      className="group flex w-full flex-1 cursor-pointer flex-col text-left"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2" style={{ viewTransitionName: morph ? `car-${car.slug}` : undefined, viewTransitionClass: "car" } as React.CSSProperties}>
        <div className="absolute inset-0">
        {pics && <Image
          src={asset(`/cars/${car.slug}.webp`)}
          alt={`${car.brand} ${car.model}`}
          fill
          sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 92vw"
          className="car-ink object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
        />}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="label">{car.brand}</p>
          <p className="font-display mt-1 text-[24px] leading-tight tracking-wide uppercase">{car.model}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[16px] text-ink-2">
          <div>
            <dt className="sr-only">Год</dt>
            <dd className="num">{car.year}</dd>
          </div>
          <div>
            <dt className="sr-only">Пробег</dt>
            <dd>{km(car.mileage)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="sr-only">Двигатель</dt>
            <dd className="flex items-center gap-1.5">
              <NjIcon name="fuel" className="size-5" />
              {FUEL_NAME[car.fuel]} · {car.engine}
            </dd>
          </div>
        </dl>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <p className="label">{PRICE_LABEL}</p>
            <p className="num mt-1.5 text-[28px] leading-none">{rub(car.price)}</p>
          </div>
          <ArrowUpRight className="size-6 text-ink-3 transition-colors group-hover:text-accent-ink" strokeWidth={1.75} />
        </div>
      </div>
    </button>
      <div className="px-5 pb-5">
        <a href="#lead-form" onClick={() => want(car)} className="btn btn-primary btn-sm w-full">
          Хочу такую
          <ArrowRight className="size-[16px]" strokeWidth={2} />
        </a>
      </div>
    </div>
  );
}

function CarDetails({ car, onDone }: { car: Car; onDone: () => void }) {
  const name = `${car.brand} ${car.model}`;
  const specs = [
    ["Год", String(car.year)],
    ["Пробег", km(car.mileage)],
    ["Двигатель", car.engine],
    ["Топливо", FUEL_NAME[car.fuel]],
    ["Коробка", car.trans],
    ["Кузов", car.body],
  ];
  return (
    <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative aspect-[4/3] bg-surface-2 md:aspect-auto md:min-h-[420px]" style={{ viewTransitionName: `car-${car.slug}`, viewTransitionClass: "car" } as React.CSSProperties}>
        <Image src={asset(`/cars/${car.slug}.webp`)} alt={name} fill sizes="(min-width:768px) 440px, 94vw" className="object-contain p-4" />
      </div>
      <div className="flex flex-col p-6 sm:p-8">
        <Dialog.Close aria-label="Закрыть" className="absolute top-3 right-3 grid size-10 place-items-center rounded-[4px] border border-line-strong text-ink">
          <X className="size-5" strokeWidth={1.75} />
        </Dialog.Close>
        <p className="label">{car.brand}</p>
        <Dialog.Title className="font-display mt-1 text-[32px] leading-tight tracking-wide uppercase">{car.model}</Dialog.Title>
        <Dialog.Description className="mt-3 text-[16px] leading-snug text-ink-2">
          Привезём именно такой автомобиль или подберём по вашим параметрам: проверим историю, до выкупа проведём независимый осмотр, условия зафиксируем в договоре.
        </Dialog.Description>
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line-strong pt-5">
          {specs.map(([k, v]) => (
            <div key={k}>
              <dt className="label">{k}</dt>
              <dd className="mt-1 text-[16px] font-bold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 border-t border-line pt-5">
          <p className="label">{PRICE_LABEL}</p>
          <p className="num mt-1 text-[30px] leading-none">{rub(car.price)}</p>
          <p className="mt-2 text-[16px] leading-snug text-ink-3">Примерная сумма под ключ. Точную Андрей считает по таможенным ставкам на дату сделки.</p>
        </div>
        <a
          href="#lead-form"
          onClick={() => {
            want(car);
            onDone();
          }}
          className="btn btn-primary mt-6 w-full sm:w-auto sm:self-start"
        >
          Получить расчёт
          <ArrowRight className="size-[18px]" strokeWidth={2} />
        </a>
      </div>
    </div>
  );
}
