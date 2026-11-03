"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { BrandIcon } from "./BrandIcon";
import { lightLoad } from "@/lib/net";

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
      return;
    }
    const el = box.current;
    if (!el) return;
    // The usual way with heavy 3D: the page opens without waiting for it; once it is open and the browser is idle,
    // the 3D code and the screen pictures download in the background; the scene itself is built (WebGL, shaders)
    // only when the phone is about a screen and a half away. Until it is ready, a flat picture of the phone stands
    // in its place, and the 3D fades in over it. A slow connection skips the background download.
    const slow = lightLoad();
    let idleId = 0;
    const prefetch = () => {
      const idle = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 300));
      idleId = idle(
        () => {
          void loadScene();
          SCREENS.forEach((_, k) => {
            const im = new Image();
            im.src = asset(`/mockup/tg-${k + 1}.webp`);
          });
        },
        { timeout: 4000 },
      );
    };
    const intro = () => ["play", "glide"].includes(document.documentElement.dataset.intro ?? "");
    if (!slow) {
      if (intro()) window.addEventListener("intro-end", prefetch, { once: true });
      else prefetch();
    }
    const far = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        far.disconnect();
        void loadScene();
        setNear(true);
      },
      { rootMargin: "150% 0px" },
    );
    const vis = new IntersectionObserver(([e]) => setSeen(e.isIntersecting));
    far.observe(el);
    vis.observe(el);
    return () => {
      window.removeEventListener("intro-end", prefetch);
      window.cancelIdleCallback?.(idleId);
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
        {/* the flat phone: the picture where there is no WebGL, and the stand-in until the 3D is ready */}
        {(flat || !ready) && (
          <div
            aria-hidden={!flat}
            className={`absolute top-1/2 left-1/2 aspect-[1/2.08] w-[62%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[17%/8%] border-[5px] border-[#6a1c2a] bg-black transition-opacity duration-700 ${!flat && near ? "opacity-90" : ""}`}
          >
            {SCREENS.map((alt, k) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={alt}
                src={asset(`/mockup/tg-${k + 1}.webp`)}
                alt={flat && k === i ? `Скриншот Telegram-канала NJ Motors: ${alt}` : ""}
                width={864}
                height={1920}
                loading="lazy"
                className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${k === i ? "opacity-100" : "opacity-0"}`}
              />
            ))}
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
              onReady={() => setReady(true)}
            />
          </div>
        )}
      </div>

      <div className="-mt-12 flex w-full items-center justify-center gap-2 sm:-mt-8 lg:-mt-6">
        <div className="flex items-center" role="group" aria-label="Скриншоты канала">
          {SCREENS.map((alt, k) => (
            <button key={alt} type="button" aria-label={`Показать: ${alt}`} aria-current={k === i} onClick={() => setI(k)} className="grid h-11 w-4 cursor-pointer place-items-center lg:w-5">
              <span className={`block h-2 rounded-full transition-all duration-300 ${k === i ? "w-4 bg-accent" : "w-2 bg-line-strong hover:bg-ink-3"}`} />
            </button>
          ))}
        </div>
      </div>
      {/* the channel itself, in Telegram's own colour */}
      <a
        href={CHANNEL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex min-h-13 items-center gap-2.5 self-center rounded-full bg-[#26A5E4] px-6 py-3 text-[17px] font-bold text-white transition-transform duration-150 hover:-translate-y-0.5"
      >
        <BrandIcon brand="telegram" className="size-[22px] shrink-0" />
        Перейти в Telegram-канал
      </a>
    </div>
  );
}
