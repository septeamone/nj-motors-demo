"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, ArrowUpRight, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { asset } from "@/lib/asset";
import { CARS, FUEL_NAME, type Car } from "@/lib/data";
import { km, rub } from "@/lib/format";
import { PRICE_LABEL } from "@/lib/site";
import { NjIcon } from "./NjIcon";
import { Bolt, Reveal, SectionHead } from "./ui";

export function Catalog() {
  const [open, setOpen] = useState<Car | null>(null);
  return (
    <section id="catalog" className="cut-bottom halftone border-t border-line bg-bg-2 pt-12 lg:pt-20" style={{ ["--cut" as string]: "5.5rem", ["--ht-dir" as string]: "280deg" }}>
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <SectionHead
          eyebrow="Автомобили" n="01" shift={0}
          title="Примеры из Кореи"
          lead="Примеры. Реальный автомобиль подбираем под вашу задачу, цену считаем до заказа."
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {CARS.map((car, i) => (
            <Reveal as="li" key={car.slug} delay={i * 0.05}>
              <button
                type="button"
                onClick={() => setOpen(car)}
                aria-haspopup="dialog"
                className="plate group flex h-full w-full flex-col overflow-hidden text-left transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
                  <Image
                    src={asset(`/cars/${car.slug}.webp`)}
                    alt={`${car.brand} ${car.model}`}
                    fill
                    sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 92vw"
                    className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
                  />
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
                  <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
                    <div>
                      <p className="label">{PRICE_LABEL}</p>
                      <p className="num mt-1 text-[24px] leading-none">{rub(car.price)}</p>
                    </div>
                    <ArrowUpRight className="size-5 text-ink-3 transition-colors group-hover:text-accent-ink" strokeWidth={1.75} />
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.1} className="mt-10">
          <p className="flex items-start gap-3 text-[16px] leading-snug text-ink-3">
            <Bolt size={12} className="mt-[3px] shrink-0 text-accent-ink" />
            Нужной модели нет? Подберём любую с корейского рынка.
          </p>
        </Reveal>
      </div>

      <Dialog.Root open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" />
          <Dialog.Content
            data-lenis-prevent
            className="plate fixed top-1/2 left-1/2 z-[70] max-h-[92svh] w-[min(94vw,880px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto"
          >
            {open && <CarDetails car={open} onDone={() => setOpen(null)} />}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
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
      <div className="relative aspect-[4/3] bg-surface-2 md:aspect-auto md:min-h-[420px]">
        <Image src={asset(`/cars/${car.slug}.webp`)} alt={name} fill sizes="(min-width:768px) 440px, 94vw" className="object-contain p-4" />
      </div>
      <div className="flex flex-col p-6 sm:p-8">
        <Dialog.Close aria-label="Закрыть" className="absolute top-3 right-3 grid size-10 place-items-center rounded-[4px] border border-line-strong text-ink">
          <X className="size-5" strokeWidth={1.75} />
        </Dialog.Close>
        <p className="label">{car.brand}</p>
        <Dialog.Title className="font-display mt-1 text-[32px] leading-tight tracking-wide uppercase">{car.model}</Dialog.Title>
        <Dialog.Description className="mt-3 text-[16px] leading-snug text-ink-2">
          Привезём именно такой автомобиль или подберём по вашим параметрам: проверим историю, пришлём фото и видео до оплаты, зафиксируем условия в договоре.
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
          <p className="mt-2 text-[16px] leading-snug text-ink-3">Сумма примерная, без таможенных платежей. Точный расчёт делает менеджер.</p>
        </div>
        <a href="#contact" onClick={onDone} className="btn btn-primary mt-6 w-full sm:w-auto sm:self-start">
          Получить расчёт
          <ArrowRight className="size-[18px]" strokeWidth={2} />
        </a>
      </div>
    </div>
  );
}
