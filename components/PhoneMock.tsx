"use client";

import { ArrowUpRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { finish } from "@/lib/loading";
import { slowNet } from "@/lib/net";

// three.js is heavy: it is fetched only when the phone is about to come on screen.
const loadScene = () => import("./PhoneScene");
const PhoneScene = dynamic(loadScene, { ssr: false });

const hasWebGL = () => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};

// Real screenshots of the owner's Telegram channel (taken 2026-10-18), in the order they are shown.
const SCREENS = [
  "Профиль канала NJ Motors",
  "Пост: Korando прибыл на экспортную базу",
  "Пост: Hyundai Sonata DN8 из Кореи",
  "Пост: Hyundai Avante из Кореи",
  "Пост: Toyota Prius из Кореи",
  "Обложка канала",
] as const;

const CHANNEL = "https://t.me/njmotorskorea2";

/** The real channel link with the date of the screenshots; on wide screens it stands in the text beside the phone. */
export function ChannelLink({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="mono !text-[16px] text-ink-3">Настоящий канал · скриншоты от 18.10.2026</p>
      <a href={CHANNEL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm mt-3">
        Открыть канал в Telegram
        <ArrowUpRight className="size-4" strokeWidth={2} />
      </a>
    </div>
  );
}

/**
 * A real 3D phone (three.js): thick bevelled titanium frame, glass screen with reflections, camera back with the emblem.
 * Drag to spin it round, drag up/down to tip it; it eases back to face you. Until the 3D is ready the space stays empty; if WebGL is
 * missing a flat picture of the first screen stands in. Reduced motion: no idle sway and no automatic screen change.
 */
export function PhoneMock() {
  const box = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [near, setNear] = useState(false);
  const [seen, setSeen] = useState(false);
  const [ready, setReady] = useState(false);
  const [calm, setCalm] = useState(false);
  const [flat, setFlat] = useState(false); // no WebGL: show a still picture instead

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (!hasWebGL()) {
      setFlat(true);
      (window as unknown as { __phoneReady?: boolean }).__phoneReady = true;
      finish("phone");
      return;
    }
    const el = box.current;
    if (!el) return;
    // build the 3D at once: the intro (SplitHero) keeps the pulsing emblem on screen until window.__phoneReady is true
    // on a slow connection the loader does not wait for the 3D phone: it is built when the visitor scrolls near it
    const slow = slowNet();
    if (slow) finish("phone");
    const idle: (f: () => void) => number = slow ? () => 0 : (window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 50)));
    const id = idle(() => {
      loadScene();
      SCREENS.forEach((_, k) => {
        const im = new Image();
        im.src = asset(`/mockup/tg-${k + 1}.webp`);
      });
      setNear(true);
    });
    const off = () => window.cancelIdleCallback?.(id as number);
    const far = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "1800px" }); // fallback if idle never fires
    const vis = new IntersectionObserver(([e]) => setSeen(e.isIntersecting));
    far.observe(el);
    vis.observe(el);
    return () => {
      off();
      far.disconnect();
      vis.disconnect();
    };
  }, []);

  // screens change by themselves while the phone is on screen
  useEffect(() => {
    if (calm || !seen) return;
    const id = setInterval(() => setI((v) => (v + 1) % SCREENS.length), 3800);
    return () => clearInterval(id);
  }, [calm, seen]);

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col items-start xl:mx-0">
      <div ref={box} className="relative aspect-[0.64] w-full">
        {flat && (
          <div className="absolute top-1/2 left-1/2 aspect-[1/2.08] w-[62%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[17%/8%] border-[5px] border-[#6a1c2a] bg-black">
            {SCREENS.map((alt, k) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={alt}
                src={asset(`/mockup/tg-${k + 1}.webp`)}
                alt={k === i ? `Скриншот Telegram-канала NJ Motors: ${alt}` : ""}
                width={864}
                height={1920}
                loading="lazy"
                className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${k === i ? "opacity-100" : "opacity-0"}`}
              />
            ))}
          </div>
        )}
        {!flat && (
          <div aria-hidden className={`phone-loader absolute top-1/2 left-1/2 w-[50%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}>
            <div className="relative aspect-[1/2.08] overflow-hidden rounded-[17%/8%] border border-line-strong bg-bg-2/40">
              <span className="phone-loader-bar absolute inset-x-0 bottom-0 h-[3px] bg-accent" />
            </div>
            <p className="mono mt-4 text-center !text-[16px] text-ink-3">Загружаю телефон</p>
          </div>
        )}
        {near && !flat && (
          <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
            <PhoneScene
              screens={SCREENS.map((_, k) => asset(`/mockup/tg-${k + 1}.webp`))}
              logo={asset("/brand/nj-logo-640.webp")}
              active={i}
              run={seen}
              calm={calm}
              onReady={() => {
                setReady(true);
                (window as unknown as { __phoneReady?: boolean }).__phoneReady = true;
                finish("phone"); // the opening loader counts the 3D phone
              }}
            />
          </div>
        )}
      </div>

      <div className="flex w-full items-center justify-between gap-2 lg:-mt-6 lg:justify-center">
        <div className="flex items-center" role="group" aria-label="Скриншоты канала">
          {SCREENS.map((alt, k) => (
            <button key={alt} type="button" aria-label={`Показать: ${alt}`} aria-current={k === i} onClick={() => setI(k)} className="grid h-11 w-4 cursor-pointer place-items-center lg:w-5">
              <span className={`block h-2 rounded-full transition-all duration-300 ${k === i ? "w-4 bg-accent" : "w-2 bg-line-strong hover:bg-ink-3"}`} />
            </button>
          ))}
        </div>
        {/* phones: the channel button in the same row as the dots (wide screens show it in the text column) */}
        <a href={CHANNEL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm lg:hidden">
          Канал в Telegram
          <ArrowUpRight className="size-4" strokeWidth={2} />
        </a>
      </div>
      <p className="mono mt-1 !text-[16px] text-ink-3 lg:hidden">Настоящий канал · скриншоты от 18.10.2026</p>
    </div>
  );
}
