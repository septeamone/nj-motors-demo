"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { EASE } from "@/lib/motion";
import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";
import { SITE, telHref, vkChat } from "@/lib/site";
import { BRAND, BrandIcon, type Brand } from "./BrandIcon";
import { ThemeToggle } from "./ThemeToggle";

const SOCIAL: { brand: Brand; href: string | null; label: string }[] = [
  { brand: "telegram", href: SITE.contacts.telegram ? `https://t.me/${SITE.contacts.telegram.replace(/^@/, "")}` : null, label: "Telegram" },
  { brand: "vk", href: SITE.contacts.vk ? vkChat(SITE.contacts.vk) : null, label: "ВКонтакте" },
  { brand: "max", href: SITE.contacts.max, label: "MAX" },
  { brand: "tiktok", href: SITE.social.tiktok, label: "TikTok" },
];

const NAV = [
  { id: "catalog", label: "Автомобили" },
  { id: "reviews", label: "Отзывы" },
  { id: "process", label: "Процесс" },
  { id: "faq", label: "Вопросы" },
  { id: "contact", label: "Контакты" },
  { id: "about", label: "О нас" },
];

function NavList({ items, prefix, active, className = "" }: { items: typeof NAV; prefix: string; active: string; className?: string }) {
  return (
    <ul className={`hidden items-center gap-1 lg:flex ${className}`}>
      {items.map((n) => (
        <li key={n.id}>
          <a
            href={`${prefix}#${n.id}`}
            aria-current={active === n.id ? "true" : undefined}
            className="relative px-2.5 py-2 text-[16px] font-bold whitespace-nowrap text-ink-2 transition-colors hover:text-ink aria-[current=true]:text-ink min-[1600px]:px-4"
          >
            {n.label}
            {active === n.id && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-x-2.5 -bottom-[1px] h-[2px] bg-accent min-[1600px]:inset-x-4"
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
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    // the emblem (fixed, above the header) steps aside while the phone menu is open
    if (open) document.documentElement.dataset.menu = "open";
    else delete document.documentElement.dataset.menu;
  }, [open]);

  return (
    <header data-menu-open={open || undefined} className="header-in fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="Основная навигация"
        className="menu-bar relative z-10 border-b border-line bg-[color-mix(in_srgb,var(--bg)_95%,transparent)]"
      >
        <div className="mx-auto grid h-[68px] max-w-[var(--page)] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:h-[76px] sm:px-8 lg:h-[100px] lg:px-12 xl:px-20">
          <div className="flex items-center">
            <a href={`${prefix}#top`} aria-label="NJ Motors — на главную" className="block shrink-0 lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("/brand/nj-wordmark-header.webp")} alt="NJ Motors — автомобили из Кореи" width={480} height={146} className="block h-[38px] w-auto sm:h-[46px]" />
            </a>
            <NavList items={NAV.slice(0, 3)} prefix={prefix} active={active} className="ml-auto" />
          </div>

          {/* the emblem, flown here from the hero by SplitHero, spins in this gap */}
          <div aria-hidden className="w-[60px] sm:w-[72px] lg:w-[96px]" />

          <div className="flex items-center gap-3">
            <NavList items={NAV.slice(3)} prefix={prefix} active={active} />
            <span className="ml-auto" />
            {SITE.contacts.phone && (
              // the number in full on wide screens, a round call button on phones and tablets
              <a
                href={telHref(SITE.contacts.phone)}
                aria-label={`Позвонить: ${SITE.contacts.phone}`}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-[#1fae54] text-white min-[1400px]:flex min-[1400px]:size-auto min-[1400px]:gap-2 min-[1400px]:bg-transparent min-[1400px]:px-2 min-[1400px]:text-[17px] min-[1400px]:font-bold min-[1400px]:whitespace-nowrap min-[1400px]:text-ink min-[1400px]:hover:text-accent-ink"
              >
                <BrandIcon brand="call" className="size-5 min-[1400px]:size-[18px] min-[1400px]:text-[#1fae54]" />
                <span className="hidden min-[1400px]:inline">{SITE.contacts.phone}</span>
              </a>
            )}
            {/* phones keep the theme switch inside the menu, so the bar has room */}
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
            <button
              type="button"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className="menu-btn flex min-h-11 items-center gap-2.5 rounded-full border border-line-strong py-2 pr-3.5 pl-4 text-[13px] font-bold tracking-[0.08em] text-ink uppercase lg:hidden"
            >
              <span aria-hidden className="menu-word">
                <i>Меню</i>
                <i>Закрыть</i>
              </span>
              <span aria-hidden className="menu-ico">
                <b />
                <b />
              </span>
            </button>
          </div>
        </div>

        <motion.span
          aria-hidden
          style={{ scaleX: progress }}
          className="absolute inset-x-0 bottom-[-1px] h-[2px] origin-left bg-accent"
        />
      </nav>

      {/* phones: the menu as a full-screen ink sheet under the bar; outlined words rise in one by one */}
      <div id="mobile-menu" data-theme="dark" data-open={open || undefined} inert={!open} className="menu-sheet lg:hidden">
        <ul className="menu-list">
          {NAV.map((n, i) => (
            <li key={n.id}>
              <a
                href={`${prefix}#${n.id}`}
                onClick={() => {
                  // the page is locked while the sheet is open: unlock it at once, so the jump to the section can happen
                  document.documentElement.style.overflow = "";
                  setOpen(false);
                }}
                aria-current={active === n.id ? "true" : undefined}
                style={{ "--i": i } as React.CSSProperties}
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="menu-foot">
          {SITE.contacts.phone && (
            <a href={telHref(SITE.contacts.phone)} className="menu-call">
              <BrandIcon brand="call" className="size-5" />
              {SITE.contacts.phone}
            </a>
          )}
          <div className="flex items-center justify-between gap-3">
            <ul className="flex gap-2.5">
              {SOCIAL.filter((x) => x.href).map((x) => (
                <li key={x.brand}>
                  <a
                    href={x.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={x.label}
                    style={{ background: BRAND[x.brand].fill }}
                    className="grid size-11 place-items-center rounded-full text-white"
                  >
                    <BrandIcon brand={x.brand} tone={x.brand === "tiktok" ? "brand" : "current"} className="size-[22px]" />
                  </a>
                </li>
              ))}
            </ul>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
