"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { DUR, EASE } from "@/lib/motion";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { id: "catalog", label: "Автомобили" },
  { id: "calc", label: "Расчёт" },
  { id: "process", label: "Как мы работаем" },
  { id: "reviews", label: "Отзывы" },
  { id: "faq", label: "Вопросы" },
  { id: "contact", label: "Контакты" },
];

function NavList({ items, prefix, active }: { items: typeof NAV; prefix: string; active: string }) {
  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {items.map((n) => (
        <li key={n.id}>
          <a
            href={`${prefix}#${n.id}`}
            aria-current={active === n.id ? "true" : undefined}
            className="relative px-3 py-2 text-[16px] font-bold text-ink-2 transition-colors hover:text-ink aria-[current=true]:text-ink xl:px-4"
          >
            {n.label}
            {active === n.id && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-x-3 -bottom-[1px] h-[2px] bg-accent xl:inset-x-4"
                transition={{ duration: 0.45, ease: EASE }}
              />
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Header({ prefix = "" }: { prefix?: string }) {
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });

  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
          else setActive((cur) => (cur === e.target.id ? "" : cur));
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header className="header-in fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="Основная навигация"
        className="relative border-b border-line bg-[color-mix(in_srgb,var(--bg)_95%,transparent)]"
      >
        <div className="mx-auto grid h-[68px] max-w-[var(--page)] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:h-[76px] sm:px-8 lg:h-[100px] lg:px-12 xl:px-20">
          <div className="flex items-center">
            <a href={`${prefix}#top`} aria-label="NJ Motors — на главную" className="font-display text-[15px] tracking-[0.02em] whitespace-nowrap text-ink uppercase sm:text-[18px] lg:hidden">
              NJ Motors
            </a>
            <NavList items={NAV.slice(0, 3)} prefix={prefix} active={active} />
          </div>

          {/* the emblem, flown here from the hero by SplitHero, spins in this gap */}
          <div aria-hidden className="w-[60px] sm:w-[72px] lg:w-[96px]" />

          <div className="flex items-center justify-end gap-3">
            <NavList items={NAV.slice(3)} prefix={prefix} active={active} />
            <ThemeToggle />
            <a href={`${prefix}#contact`} className="btn btn-primary btn-sm hidden 2xl:inline-flex">
              Рассчитать стоимость
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </a>
            <button
              type="button"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="grid size-11 place-items-center rounded-[4px] border border-line-strong text-ink lg:hidden"
            >
              {open ? <X className="size-5" strokeWidth={1.75} /> : <Menu className="size-5" strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        <motion.span
          aria-hidden
          style={{ scaleX: progress }}
          className="absolute inset-x-0 bottom-[-1px] h-[2px] origin-left bg-accent"
        />
      </nav>

      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0, transition: { duration: DUR, ease: EASE } }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
          className="plate mx-3 mt-2 p-3 lg:hidden"
        >
          <ul className="flex flex-col">
            {NAV.map((n, i) => (
              <motion.li key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR, ease: EASE, delay: 0.05 + i * 0.04 }}>
                <a
                  href={`${prefix}#${n.id}`}
                  onClick={() => setOpen(false)}
                  className="font-display flex h-14 items-center justify-between border-b border-line px-3 text-[20px] tracking-wide text-ink uppercase last:border-0"
                >
                  {n.label}
                  <ArrowUpRight className="size-4 text-ink-3" strokeWidth={1.75} />
                </a>
              </motion.li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-end gap-3 p-3 pt-4">
            <a href={`${prefix}#contact`} onClick={() => setOpen(false)} className="btn btn-primary btn-sm">
              Рассчитать
            </a>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </header>
  );
}
