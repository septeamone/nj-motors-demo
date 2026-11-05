"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MessageSquareText, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { clock, PHOTOS, splitTitle, VIDEOS } from "@/lib/reviews";
import { useNear, useVideoSrc } from "@/lib/video";
import { IconSwap } from "./IconSwap";
import { Reveal, SectionHead } from "./ui";

const N = VIDEOS.length;

// every page of the photo viewer: a client's photo, and their written review right after it when there is one
const SLIDES = PHOTOS.flatMap((p, k) => [
  { item: k, src: asset(`/clients/${p.id}-full.webp`), alt: p.alt },
  ...(p.text ? [{ item: k, src: asset(`/clients/${p.text.id}-full.webp`), alt: p.text.alt }] : []),
]);
const firstSlide = (item: number) => SLIDES.findIndex((s) => s.item === item);

const calmNow = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const saverNow = () => typeof navigator !== "undefined" && !!(navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;

/** A sideways swipe on touch screens: `on(+1)` for left (next), `on(-1)` for right (previous). */
function useSwipe(on: (dir: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      start.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.4) on(dx < 0 ? 1 : -1);
    },
    onPointerCancel: () => (start.current = null),
  };
}

/**
 * Client reviews, the way people watch them in Reels and TikTok: a row of upright covers (a strip to swipe on phones,
 * the whole set as a grid on desktops), the cover in view plays a silent preview, and a tap opens the full-screen feed
 * where the videos play with sound and the next one is a swipe up. Photos and written reviews follow.
 */
export function Reviews() {
  const [open, setOpen] = useState<number | null>(null);
  const [slide, setSlide] = useState<number | null>(null);
  const [live, setLive] = useState<number | null>(null);
  const [previews, setPreviews] = useState(false);
  const strip = useRef<HTMLUListElement>(null);
  const near = useNear(strip);
  const pick = useVideoSrc();
  const close = useCallback(() => setOpen(null), []);

  // silent previews only where they cost nothing to the reader: not with reduced motion or data saver
  useEffect(() => {
    setPreviews(!calmNow() && !saverNow());
  }, []);

  // phones and tablets: the cover most in view inside the strip is the one that plays its preview
  useEffect(() => {
    const ul = strip.current;
    if (!ul || !previews || !window.matchMedia("(hover: none)").matches) return;
    const seen = new Map<Element, number>();
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => seen.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
        let best = -1;
        let top = 0.6;
        [...ul.children].forEach((li, k) => {
          const r = seen.get(li) ?? 0;
          if (r > top) [best, top] = [k, r];
        });
        setLive(best < 0 ? null : best);
      },
      { threshold: [0, 0.6, 0.8, 1] },
    );
    [...ul.children].forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, [previews]);

  const shown = slide !== null ? SLIDES[slide] : null;
  const turn = (d: number) => setSlide((s) => (s === null ? s : (s + d + SLIDES.length) % SLIDES.length));
  const photoSwipe = useSwipe((dir) => turn(dir));

  return (
    <section id="reviews" className="bg-bg-2 pt-9 pb-10 lg:pt-14 lg:pb-16">
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <SectionHead title="Отзывы клиентов" lead="Видео от наших покупателей: как получили машину и как прошла сделка." />

        <div className="mt-6 mb-3 flex items-baseline justify-between gap-3 lg:mt-10">
          <p className="eyebrow">
            Видео
            <span className="num text-ink-3">{N}</span>
          </p>
          <p className="text-small text-ink-3 lg:hidden">Листайте вбок</p>
        </div>

        {/* lifted over the page's paper grain, so covers and previews stay clean */}
        <ul
          ref={strip}
          data-lenis-prevent
          aria-label="Видеоотзывы"
          className="no-grain reel -mx-5 grid snap-x snap-mandatory auto-cols-[42%] grid-flow-col scroll-px-5 gap-2.5 overflow-x-auto overscroll-x-contain px-5 pb-1 sm:-mx-8 sm:auto-cols-[27%] sm:scroll-px-8 sm:px-8 lg:mx-0 lg:grid-flow-row lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0"
        >
          {VIDEOS.map((it, n) => {
            const [name, place] = splitTitle(it.title);
            const playing = previews && near && live === n;
            return (
              <li key={it.id} className="snap-start">
                <button
                  type="button"
                  onClick={() => setOpen(n)}
                  onPointerEnter={(e) => e.pointerType === "mouse" && previews && setLive(n)}
                  onPointerLeave={(e) => e.pointerType === "mouse" && setLive((v) => (v === n ? null : v))}
                  aria-label={`Смотреть отзыв: ${it.title}${it.sub ? `, ${it.sub}` : ""}, ${clock(it.dur)}`}
                  className="group/v relative block aspect-[9/16] w-full cursor-pointer lg:aspect-[3/4] overflow-hidden rounded-[12px] bg-black text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset(`/reviews/${it.id}-thumb.webp`)} alt="" loading="lazy" decoding="async" width={360} height={640} className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover/v:scale-[1.03]" />
                  {playing && <video src={pick(asset(`/reviews/${it.id}-sd.mp4`))} muted playsInline autoPlay loop preload="auto" aria-hidden className="absolute inset-0 size-full object-cover" />}
                  <span className="num absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-caption text-white">{clock(it.dur)}</span>
                  <span aria-hidden className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent-fill/90 text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-[scale] duration-200 ease-out group-hover/v:scale-110 lg:size-14">
                    <Play className="ml-0.5 size-5 lg:size-6" fill="currentColor" strokeWidth={0} />
                  </span>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2.5 pt-12 pb-2.5 text-white lg:px-3 lg:pb-3">
                    <span className="block text-small leading-tight font-bold lg:text-ui">{name}</span>
                    <span className="mt-0.5 block truncate text-caption text-white/80">{place}</span>
                    {it.sub && <span className="mt-0.5 block truncate text-caption text-white/80 max-sm:hidden">{it.sub}</span>}
                  </span>
                  <span aria-hidden className="img-edge pointer-events-none absolute inset-0 rounded-[inherit]" />
                </button>
              </li>
            );
          })}
        </ul>

        {/* photos and written reviews of the clients */}
        <Reveal delay={0.08} className="mt-8 lg:mt-12">
          <p className="eyebrow mb-3">
            Фото и отзывы от клиентов
            <span className="num text-ink-3">{PHOTOS.length}</span>
          </p>
          <ul data-lenis-prevent className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto overscroll-x-contain px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 xl:grid-cols-5">
            {PHOTOS.map((p, n) => (
              <li key={p.id} className="w-[64%] max-w-[260px] shrink-0 snap-start sm:w-[38%] lg:w-auto lg:max-w-none">
                <button
                  type="button"
                  onClick={() => setSlide(firstSlide(n))}
                  aria-label={`Открыть: ${p.title}${p.text ? ", фото и отзыв" : ""}`}
                  className="group/p relative block aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-[10px] bg-bg text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset(`/clients/${p.id}.webp`)} alt={p.alt} loading="lazy" decoding="async" style={{ objectPosition: p.focus }} className="size-full object-cover transition-transform duration-500 ease-out group-hover/p:scale-[1.04]" />
                  {p.text && (
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-caption font-bold text-white">
                      <MessageSquareText className="size-3.5" strokeWidth={2.5} nonScalingStroke />
                      Отзыв
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-10 pb-2.5 text-white">
                    <span className="block text-ui leading-tight font-bold">{p.title}</span>
                    {p.sub && <span className="mt-0.5 block text-caption text-white/80">{p.sub}</span>}
                  </span>
                  <span aria-hidden className="img-edge pointer-events-none absolute inset-0 rounded-[inherit]" />
                </button>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <Feed start={open} onClose={close} />

      <Dialog.Root open={slide !== null} onOpenChange={(v) => !v && setSlide(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="dlg-fade fixed inset-0 z-[100] bg-[rgba(4,12,20,0.94)]" />
          <Dialog.Content
            aria-describedby={undefined}
            className="dlg-pop fixed inset-0 z-[101] grid place-items-center p-3 outline-none sm:p-6"
            onClick={(e) => e.target === e.currentTarget && setSlide(null)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              e.preventDefault();
              turn(e.key === "ArrowRight" ? 1 : -1);
            }}
          >
            <Dialog.Title className="sr-only">{shown ? PHOTOS[shown.item].title : ""}</Dialog.Title>
            {shown && slide !== null && (
              <figure className="relative flex max-h-full max-w-full flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={shown.src}
                  src={shown.src}
                  alt={shown.alt}
                  {...photoSwipe}
                  className="max-h-[78svh] max-w-[94vw] touch-pan-y rounded-[10px] object-contain outline outline-1 -outline-offset-1 outline-white/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] select-none"
                  draggable={false}
                />
                <figcaption className="flex items-center gap-4 text-white">
                  <button type="button" aria-label="Назад" onClick={() => turn(-1)} className="vp-btn">
                    <ChevronLeft className="size-6" strokeWidth={2} nonScalingStroke />
                  </button>
                  <span className="min-w-0 text-center">
                    <span className="block text-body leading-tight font-bold">{PHOTOS[shown.item].title}</span>
                    <span className="block text-small text-white/75">
                      {PHOTOS[shown.item].sub}
                      <span className="num"> · {slide + 1} / {SLIDES.length}</span>
                    </span>
                  </span>
                  <button type="button" aria-label="Дальше" onClick={() => turn(1)} className="vp-btn">
                    <ChevronRight className="size-6" strokeWidth={2} nonScalingStroke />
                  </button>
                </figcaption>
              </figure>
            )}
            <Dialog.Close aria-label="Закрыть" className="absolute top-3 right-3 z-[102] grid size-11 cursor-pointer place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-accent-fill sm:top-5 sm:right-5">
              <X className="size-5" strokeWidth={2} nonScalingStroke />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}

/**
 * The full-screen feed: one video per screen, swipe (or scroll, arrows, keys) up and down between them; native scroll
 * snapping does the motion. Only the video on screen plays; its neighbours fetch their first bytes.
 * Opened by a tap, so it starts with sound. Closes with the cross, Esc, or the browser's / phone's back.
 */
function Feed({ start, onClose }: { start: number | null; onClose: () => void }) {
  const open = start !== null;
  const [cur, setCur] = useState(0);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const feed = useRef<HTMLDivElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const bar = useRef<HTMLDivElement>(null);
  const userPaused = useRef(false);
  const pick = useVideoSrc();

  // the phone's back button closes the feed instead of leaving the page
  useEffect(() => {
    if (!open) return;
    history.pushState({ reviewFeed: true }, "");
    const back = () => onClose();
    window.addEventListener("popstate", back);
    return () => {
      window.removeEventListener("popstate", back);
      if (history.state?.reviewFeed) history.back();
    };
  }, [open, onClose]);

  // open on the chosen video, without scrolling through the others
  useLayoutEffect(() => {
    if (start === null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCur(start);
    userPaused.current = false;
    const place = () => {
      const f = feed.current;
      if (f) f.scrollTop = start * f.clientHeight;
      else requestAnimationFrame(place);
    };
    requestAnimationFrame(place);
  }, [start]);

  const onScroll = () => {
    const f = feed.current;
    if (!f) return;
    const k = Math.round(f.scrollTop / f.clientHeight);
    if (k !== cur && k >= 0 && k < N) {
      userPaused.current = false;
      setCur(k);
    }
  };

  const goTo = useCallback((k: number) => {
    const f = feed.current;
    if (!f || k < 0 || k >= N) return;
    f.scrollTo({ top: k * f.clientHeight, behavior: calmNow() ? "auto" : "smooth" });
  }, []);

  // the video on screen plays, every other one stops and rewinds
  useEffect(() => {
    if (!open) return;
    vids.current.forEach((v, k) => {
      if (!v) return;
      if (k === cur) {
        v.muted = muted;
        if (!userPaused.current && v.paused)
          v.play().catch(() => {
            // a browser that refuses sound without a fresh tap still plays, silently, and offers the sound button
            v.muted = true;
            setMuted(true);
            v.play().catch(() => {});
          });
      } else if (!v.paused || v.currentTime) {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [cur, open, muted]);

  // the progress line of the video on screen
  useEffect(() => {
    if (!open || !playing) return;
    let raf = 0;
    const tick = () => {
      const v = vids.current[cur];
      if (v && bar.current) bar.current.style.transform = `scaleX(${v.duration ? v.currentTime / v.duration : 0})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, playing, cur]);

  const toggle = () => {
    const v = vids.current[cur];
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  const seek = (clientX: number, el: HTMLElement) => {
    const v = vids.current[cur];
    if (!v || !isFinite(v.duration)) return;
    const r = el.getBoundingClientRect();
    v.currentTime = Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * v.duration;
    if (bar.current) bar.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
  };

  const onKey = (e: React.KeyboardEvent) => {
    const v = vids.current[cur];
    const k = e.key;
    if (k === "ArrowDown" || k === "PageDown" || k === "j") goTo(cur + 1);
    else if (k === "ArrowUp" || k === "PageUp" || k === "k") goTo(cur - 1);
    else if (k === " ") toggle();
    else if (k === "m") setMuted((m) => !m);
    else if (v && k === "ArrowRight") v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
    else if (v && k === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
    else return;
    e.preventDefault();
  };

  const it = VIDEOS[cur];

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dlg-fade fixed inset-0 z-[110] bg-black" />
        <Dialog.Content aria-describedby={undefined} onKeyDown={onKey} className="dlg-fade fixed inset-0 z-[111] outline-none">
          <Dialog.Title className="sr-only">Видеоотзывы клиентов</Dialog.Title>
          <div ref={feed} onScroll={onScroll} data-lenis-prevent className="h-dvh snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none]">
            {VIDEOS.map((v, k) => (
              <div key={v.id} className="relative h-dvh snap-start snap-always overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(`/reviews/${v.id}-poster.webp`)} alt="" aria-hidden loading="lazy" className="absolute inset-0 size-full object-contain" />
                {Math.abs(k - cur) <= 1 && (
                  <video
                    ref={(el) => {
                      vids.current[k] = el;
                    }}
                    src={pick(asset(`/reviews/${v.id}.mp4`))}
                    poster={asset(`/reviews/${v.id}-poster.webp`)}
                    playsInline
                    // the dialog draws its content a beat after it opens: the chosen video starts by itself once it is there
                    autoPlay={k === cur}
                    preload={k === cur ? "auto" : "metadata"}
                    aria-label={`Видеоотзыв: ${v.title}`}
                    onClick={toggle}
                    onPlay={() => k === cur && setPlaying(true)}
                    onPause={() => k === cur && setPlaying(false)}
                    onWaiting={() => k === cur && setWaiting(true)}
                    onPlaying={() => k === cur && setWaiting(false)}
                    onEnded={() => (k < N - 1 ? goTo(k + 1) : setPlaying(false))}
                    className="absolute inset-0 size-full cursor-pointer object-contain"
                  />
                )}
              </div>
            ))}
          </div>

          {/* top: where we are, sound, close */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-3 pt-[max(12px,env(safe-area-inset-top))] [background:linear-gradient(180deg,rgba(0,0,0,0.6),transparent)] sm:p-5">
            <span className="num rounded-full bg-black/55 px-3 py-1.5 text-small text-white">
              {cur + 1} / {N}
            </span>
            <span className="pointer-events-auto flex gap-2">
              <button type="button" aria-label={muted ? "Включить звук" : "Выключить звук"} onClick={() => setMuted((m) => !m)} className="grid size-11 cursor-pointer place-items-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75">
                <IconSwap id={muted ? "off" : "on"}>{muted ? <VolumeX className="size-5" strokeWidth={2} nonScalingStroke /> : <Volume2 className="size-5" strokeWidth={2} nonScalingStroke />}</IconSwap>
              </button>
              <Dialog.Close aria-label="Закрыть" className="grid size-11 cursor-pointer place-items-center rounded-full bg-white text-black transition-colors hover:bg-accent-fill hover:text-white">
                <X className="size-5" strokeWidth={2.5} nonScalingStroke />
              </Dialog.Close>
            </span>
          </div>

          {/* centre: paused or loading */}
          {!playing && !waiting && (
            <button type="button" aria-label="Смотреть" onClick={toggle} className="absolute top-1/2 left-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-accent-fill text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <Play className="ml-1 size-8" fill="currentColor" strokeWidth={0} />
            </button>
          )}
          {waiting && playing && <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />}

          {/* bottom: who, what car, the scrub line */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pt-16 pb-[max(16px,env(safe-area-inset-bottom))] [background:linear-gradient(0deg,rgba(0,0,0,0.75),transparent)] sm:px-6 sm:pb-6">
            <div className="mx-auto max-w-[640px]">
              <p className="text-body-lg leading-tight font-bold text-white">{it.title}</p>
              {it.sub && <p className="mt-0.5 text-small text-white/80">{it.sub}</p>}
              <div className="mt-3 flex items-center gap-3">
                <button type="button" aria-label={playing ? "Пауза" : "Играть"} onClick={toggle} className="vp-btn pointer-events-auto text-white">
                  <IconSwap id={playing ? "pause" : "play"}>{playing ? <Pause className="size-5" strokeWidth={2} nonScalingStroke /> : <Play className="size-5 translate-x-px" strokeWidth={2} nonScalingStroke />}</IconSwap>
                </button>
                <div
                  role="slider"
                  tabIndex={-1}
                  aria-label="Перемотка"
                  aria-valuemin={0}
                  aria-valuemax={it.dur}
                  aria-valuenow={0}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    seek(e.clientX, e.currentTarget);
                  }}
                  onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && seek(e.clientX, e.currentTarget)}
                  className="pointer-events-auto flex-1 cursor-pointer touch-none py-3"
                >
                  <div className="h-[4px] overflow-hidden rounded-full bg-white/30">
                    <div key={cur} ref={bar} className="h-full origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
                  </div>
                </div>
                <span className="num text-small text-white/80">{clock(it.dur)}</span>
              </div>
            </div>
          </div>

          {/* desktops: up and down beside the video; phones swipe */}
          <div className="absolute top-1/2 right-5 hidden -translate-y-1/2 flex-col gap-3 pointer-fine:flex">
            <button type="button" aria-label="Предыдущее видео" disabled={cur === 0} onClick={() => goTo(cur - 1)} className="grid size-12 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 disabled:cursor-default disabled:opacity-30">
              <ChevronUp className="size-6" strokeWidth={2} nonScalingStroke />
            </button>
            <button type="button" aria-label="Следующее видео" disabled={cur === N - 1} onClick={() => goTo(cur + 1)} className="grid size-12 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 disabled:cursor-default disabled:opacity-30">
              <ChevronDown className="size-6" strokeWidth={2} nonScalingStroke />
            </button>
          </div>

          {/* on the first video: the rest are a swipe away */}
          {cur === 0 && N > 1 && (
            <p className="pointer-events-none absolute bottom-36 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/55 px-3.5 py-2 text-small font-bold whitespace-nowrap text-white pointer-fine:hidden">
              <ChevronUp className="size-4" strokeWidth={2.5} nonScalingStroke />
              Листайте вверх: ещё {N - 1}
            </p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
