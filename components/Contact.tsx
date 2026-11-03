"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { WriteUs } from "./LeadBits";
import { Reveal, SectionHead } from "./ui";

// the greeting every ready-made message starts with
const HELLO = "Здравствуйте! Хочу подобрать машину из Кореи.";

/**
 * The end of the page: no form (the site collects no personal data), the visitor writes to NJ Motors in the messenger
 * they like. A car card ("Хочу такую") puts that car into a ready-made message.
 */
export function Contact() {
  const [car, setCar] = useState("");

  useEffect(() => {
    const h = (e: Event) => setCar((e as CustomEvent<string>).detail);
    window.addEventListener("lead-prefill", h);
    return () => window.removeEventListener("lead-prefill", h);
  }, []);

  const sec = useRef<HTMLElement>(null);
  const calm = useReducedMotion();
  // two red flaps close in from the sides as the section arrives, and stay shut
  const { scrollYProgress } = useScroll({ target: sec, offset: ["start end", "start 55%"] });
  const closed = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  const leftX = useTransform(closed, [0, 1], ["-101%", "0%"]);
  const rightX = useTransform(closed, [0, 1], ["101%", "0%"]);
  const rise = useTransform(closed, [0.4, 0.95], [0, 1]);
  // the two columns come in with the flaps: the text from the left, the form plate from the right
  const textX = useTransform(closed, [0, 1], ["-34%", "0%"]);
  const plateX = useTransform(closed, [0, 1], ["34%", "0%"]);

  return (
    <section ref={sec} id="contact" className="drench relative isolate overflow-hidden !bg-transparent py-12 lg:py-16">
      <motion.span aria-hidden style={calm ? undefined : { x: leftX }} className="halftone !absolute inset-y-0 left-0 -z-10 w-[51%] bg-accent-fill" />
      <motion.span aria-hidden style={calm ? undefined : { x: rightX }} className="halftone !absolute inset-y-0 right-0 -z-10 w-[51%] bg-accent-fill" />
      <motion.div style={calm ? undefined : { opacity: rise }} className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <motion.div style={calm ? undefined : { x: textX }}>
            <SectionHead
              stacked
              title="Подобрать автомобиль"
              lead="Опишите, какую примерно машину ищете, — пришлём подборку вариантов с расчётом «под ключ»."
            />
            <Reveal delay={0.1} className="mt-8">
              {/* the brand's muscle car poster, keyed out of its own red so it stands straight on the section's red */}
              <Image
                src={asset("/brand/car-poster.webp")}
                alt=""
                width={1400}
                height={470}
                sizes="(min-width:1024px) 46vw, 92vw"
                className="block h-auto w-full select-none lg:-ml-[6%] lg:w-[112%]"
              />
            </Reveal>
          </motion.div>

          <motion.div style={calm ? undefined : { x: plateX }}><Reveal delay={0.08}>
            <div id="lead-form" className="plate p-6 sm:p-9">
              <p className="font-display text-[clamp(24px,2.4vw,32px)] leading-tight tracking-wide text-ink uppercase">Напишите нам</p>
              <p className="mt-2 max-w-[46ch] text-[17px] leading-snug text-ink-2">
                {car ? (
                  <>
                    Вы выбрали: <b className="text-ink">{car.replace(/^Интересует: /, "")}</b>. Напишите, где удобно, — пришлём похожие варианты с расчётом.
                  </>
                ) : (
                  "Укажите свой бюджет, город назначения, тип кузова и желаемые параметры. Менеджер ответит на все вопросы и пришлёт подборку авто."
                )}
              </p>
              <WriteUs className="mt-6" text={car ? `${HELLO} ${car}` : undefined} />
            </div>
          </Reveal></motion.div>
        </div>
      </motion.div>
    </section>
  );
}

