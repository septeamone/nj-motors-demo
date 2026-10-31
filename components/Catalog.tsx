"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, ArrowUpRight, X } from "lucide-react";
import { motion, useReducedMotion, useSpring } from "motion/react";
import Image from "next/image";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { asset } from "@/lib/asset";
import { CARS, FUEL_NAME, type Car } from "@/lib/data";
import { km, rub } from "@/lib/format";
import { PRICE_LABEL } from "@/lib/site";
import { NjIcon } from "./NjIcon";
import { Reveal, SectionHead } from "./ui";

export function Catalog() {
  const [open, setOpen] = useState<Car | null>(null);
  const calm = useReducedMotion();
  // the card's picture flows into the dialog (View Transitions), where the browser can do it
  // only the clicked card carries the transition name, and only for the moment of the switch
  const [morph, setMorph] = useState<string | null>(null);
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
      style={{ ["--cut" as string]: "5.5rem", background: "linear-gradient(180deg, transparent 0, transparent calc(30svh + 140px), var(--bg-2) calc(30svh + 380px))" }}
    >
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <div data-theme="dark" className="on-film">
          <SectionHead
            title="Примеры из Кореи"
            lead="Реальный автомобиль Андрей подбирает под вашу задачу, а цену считает до заказа."
          />
        </div>

        <ul className="-mx-5 mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:items-start lg:[&>li:nth-child(even)]:mt-12 lg:[&>li:nth-child(3)]:mt-6">
          {CARS.map((car, i) => (
            <Reveal as="li" key={car.slug} delay={i * 0.05} className="w-[80%] shrink-0 snap-start sm:w-auto">
              <CarCard car={car} morph={morph === car.slug} onOpen={() => show(car)} />
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.1} className="mt-10">
          <p className="text-[clamp(19px,1.6vw,22px)] leading-snug font-medium text-ink">
            Нужной модели нет? Подберём любую с корейского рынка.{" "}
            <a href="#contact" className="font-bold text-accent-ink underline decoration-2 underline-offset-[6px]">
              Описать задачу
            </a>
          </p>
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

/**
 * A car card with depth: under the mouse the card tilts towards the pointer and the car shifts against it, as if it
 * stood a little in front of the card. Touch screens and reduced motion get the flat card.
 */
function CarCard({ car, morph, onOpen }: { car: Car; morph: boolean; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const calm = useReducedMotion();
  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const rx = useSpring(0, spring);
  const ry = useSpring(0, spring);
  const px = useSpring(0, spring);
  const py = useSpring(0, spring);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (calm || e.pointerType !== "mouse" || !el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    rx.set(-y * 7);
    ry.set(x * 9);
    px.set(x * -16);
    py.set(y * -10);
  };
  const leave = () => [rx, ry, px, py].forEach((v) => v.set(0));
  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onOpen}
      onPointerMove={move}
      onPointerLeave={leave}
      aria-haspopup="dialog"
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className="plate group flex h-full w-full flex-col overflow-hidden text-left"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2" style={{ viewTransitionName: morph ? `car-${car.slug}` : undefined, viewTransitionClass: "car" } as React.CSSProperties}>
        <motion.div style={{ x: px, y: py }} className="absolute -inset-[4%]">
        <Image
          src={asset(`/cars/${car.slug}.webp`)}
          alt={`${car.brand} ${car.model}`}
          fill
          sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 92vw"
          className="car-ink object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
        />
        </motion.div>
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
            <p className="num mt-1 text-[24px] leading-none">{rub(car.price)}</p>
          </div>
          <ArrowUpRight className="size-6 text-ink-3 transition-colors group-hover:text-accent-ink" strokeWidth={1.75} />
        </div>
      </div>
    </motion.button>
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
          href="#contact"
          onClick={() => {
            window.dispatchEvent(new CustomEvent<string>("lead-prefill", { detail: `Интересует: ${name}, ${car.year}` }));
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
