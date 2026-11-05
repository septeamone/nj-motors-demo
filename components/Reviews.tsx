"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pause, Play, Pointer, Volume1, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { clock, PHOTOS, splitTitle, VIDEOS } from "@/lib/reviews";
import { useNear, useVideoSrc } from "@/lib/video";
import { IconSwap } from "./IconSwap";
import { Reveal, SectionHead } from "./ui";

const N = VIDEOS.length;

// every page of the photo viewer: a client's photo, and their written review right after it when there is one
const SLIDES = PHOTOS.flatMap((p, k) => {
  const pages = [{ src: asset(`/clients/${p.id}-full.webp`), alt: p.alt }, ...(p.text ? [{ src: asset(`/clients/${p.text.id}-full.webp`), alt: p.text.alt }] : [])];
  return pages.map((pg, page) => ({ ...pg, item: k, page, pages: pages.length }));
});
const firstSlide = (item: number) => SLIDES.findIndex((s) => s.item === item);

const calmNow = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const saverNow = () => typeof navigator !== "undefined" && !!(navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
const smooth = (): ScrollBehavior => (calmNow() ? "auto" : "smooth");

/** A sideways strip with arrow buttons: which way it can still go, and a step of most of its width. */
function useStrip<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [can, setCan] = useState({ prev: false, next: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setCan({ prev: el.scrollLeft > 4, next: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, []);
  const step = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: smooth() });
  return { ref, can, step };
}

function Arrows({ can, step, label }: { can: { prev: boolean; next: boolean }; step: (dir: 1 | -1) => void; label: string }) {
  if (!can.prev && !can.next) return null;
  const cls =
    "grid size-11 cursor-pointer place-items-center rounded-full border border-line-strong text-ink transition-[border-color,opacity,scale] duration-150 ease-out hover:border-accent active:scale-95 disabled:cursor-default disabled:opacity-30";
  return (
    <span className="flex gap-2">
      <button type="button" aria-label={`${label}: назад`} disabled={!can.prev} onClick={() => step(-1)} className={cls}>
        <ChevronLeft className="size-5" strokeWidth={2.5} nonScalingStroke />
      </button>
      <button type="button" aria-label={`${label}: дальше`} disabled={!can.next} onClick={() => step(1)} className={cls}>
        <ChevronRight className="size-5" strokeWidth={2.5} nonScalingStroke />
      </button>
    </span>
  );
}

/**
 * Client reviews, the way people watch them in Reels and TikTok: a row of upright covers (a strip with arrows on phones,
 * the whole set as a grid on desktops), the cover in view plays a silent preview, and a tap opens the full-screen feed
 * where the videos play with sound and the next one is a swipe up. Photos and written reviews follow.
 */
export function Reviews() {
  const [open, setOpen] = useState<number | null>(null);
  const [slide, setSlide] = useState<number | null>(null);
  const [live, setLive] = useState<number | null>(null);
  const [previews, setPreviews] = useState(false);
  const vids = useStrip<HTMLUListElement>();
  const pics = useStrip<HTMLUListElement>();
  const strip = vids.ref;
  const near = useNear(strip);
  const pick = useVideoSrc();
  const close = useCallback(() => setOpen(null), []);
  const closePhoto = useCallback(() => setSlide(null), []);

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
  }, [previews, strip]);

  return (
    <section id="reviews" className="bg-bg-2 pt-9 pb-10 lg:pt-14 lg:pb-16">
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <SectionHead title="Отзывы клиентов" lead="Видео от наших покупателей: как получили машину и как прошла сделка." />

        <div className="mt-6 mb-3 flex min-h-11 items-center justify-between gap-3 lg:mt-10">
          <p className="eyebrow">
            Видео
            <span className="num text-ink-3">{N}</span>
          </p>
          <span className="lg:hidden">
            <Arrows can={vids.can} step={vids.step} label="Видео" />
          </span>
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
                  className="group/v relative block aspect-[9/16] w-full cursor-pointer overflow-hidden rounded-[12px] bg-black text-left outline-none focus-visible:ring-2 focus-visible:ring-accent lg:aspect-[3/4]"
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
          <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
            <p className="eyebrow">
              Фото и отзывы от клиентов
              <span className="num text-ink-3">{PHOTOS.length}</span>
            </p>
            <span className="lg:hidden">
              <Arrows can={pics.can} step={pics.step} label="Фото" />
            </span>
          </div>
          <ul ref={pics.ref} data-lenis-prevent className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto overscroll-x-contain px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 xl:grid-cols-5">
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
      <PhotoViewer start={slide} onClose={closePhoto} />
    </section>
  );
}

/**
 * The photo viewer: every photo and written review on one sideways track. Native scroll snapping carries the swipe, so
 * it follows the finger and settles softly; a client with a photo and a written review shows both, «1 из 2».
 */
function PhotoViewer({ start, onClose }: { start: number | null; onClose: () => void }) {
  const open = start !== null;
  const [at, setAt] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (start === null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAt(start);
    const place = () => {
      const t = track.current;
      if (t) t.scrollLeft = start * t.clientWidth;
      else requestAnimationFrame(place);
    };
    requestAnimationFrame(place);
  }, [start]);

  const go = (k: number) => {
    const t = track.current;
    if (t && k >= 0 && k < SLIDES.length) t.scrollTo({ left: k * t.clientWidth, behavior: smooth() });
  };
  const s = SLIDES[at];
  const p = PHOTOS[s.item];

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dlg-fade fixed inset-0 z-[100] bg-[rgba(4,12,20,0.95)]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="dlg-fade fixed inset-0 z-[101] outline-none"
          onKeyDown={(e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            e.preventDefault();
            go(at + (e.key === "ArrowRight" ? 1 : -1));
          }}
        >
          <Dialog.Title className="sr-only">{p.title}</Dialog.Title>
          <div
            ref={track}
            data-lenis-prevent
            onScroll={(e) => {
              const t = e.currentTarget;
              const k = Math.round(t.scrollLeft / t.clientWidth);
              if (k !== at && k >= 0 && k < SLIDES.length) setAt(k);
            }}
            className="flex h-dvh snap-x snap-mandatory overflow-x-auto overscroll-contain [scrollbar-width:none]"
          >
            {SLIDES.map((sl, k) => (
              <div key={sl.src} className="grid h-full w-full shrink-0 snap-center snap-always place-items-center px-3 pt-16 pb-32 sm:px-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sl.src}
                  alt={sl.alt}
                  loading={Math.abs(k - at) <= 1 ? "eager" : "lazy"}
                  draggable={false}
                  className="max-h-full max-w-full rounded-[10px] object-contain outline outline-1 -outline-offset-1 outline-white/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] select-none"
                />
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pb-[max(20px,env(safe-area-inset-bottom))] text-center text-white">
            <p className="text-body-lg leading-tight font-bold">{p.title}</p>
            <p className="text-small text-white/75">
              {p.sub}
              {s.pages > 1 && ` · ${s.page === 0 ? "фото" : "отзыв"}`}
            </p>
            {s.pages > 1 ? (
              <span className="mt-1 flex items-center gap-2" aria-label={`${s.page + 1} из ${s.pages}`}>
                {Array.from({ length: s.pages }, (_, j) => (
                  <i key={j} className={`block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out ${j === s.page ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />
                ))}
              </span>
            ) : (
              <span className="num text-caption text-white/55">
                {p.title && `${PHOTOS.indexOf(p) + 1} / ${PHOTOS.length}`}
              </span>
            )}
          </div>

          {/* desktops: arrows at the sides; phones swipe */}
          <button type="button" aria-label="Назад" disabled={at === 0} onClick={() => go(at - 1)} className="absolute top-1/2 left-5 hidden size-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 disabled:cursor-default disabled:opacity-25 pointer-fine:grid">
            <ChevronLeft className="size-6" strokeWidth={2} nonScalingStroke />
          </button>
          <button type="button" aria-label="Дальше" disabled={at === SLIDES.length - 1} onClick={() => go(at + 1)} className="absolute top-1/2 right-5 hidden size-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 disabled:cursor-default disabled:opacity-25 pointer-fine:grid">
            <ChevronRight className="size-6" strokeWidth={2} nonScalingStroke />
          </button>
          <Dialog.Close aria-label="Закрыть" className="absolute top-3 right-3 grid size-11 cursor-pointer place-items-center rounded-full bg-white text-black transition-colors hover:bg-accent-fill hover:text-white sm:top-5 sm:right-5">
            <X className="size-5" strokeWidth={2.5} nonScalingStroke />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const VOL_KEY = "review-volume";

/**
 * The full-screen feed: one video per screen, swipe (or scroll, arrows, keys) up and down between them; native scroll
 * snapping does the motion. Only the video on screen plays; its neighbours fetch their first bytes.
 * Opened by a tap, so it starts with sound, at a moderate level the reader can change (remembered for next time).
 * Closes with the cross, Esc, or the browser's / phone's back. The first time, a hint shows how to move on.
 */
function Feed({ start, onClose }: { start: number | null; onClose: () => void }) {
  const open = start !== null;
  const [cur, setCur] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [canVolume, setCanVolume] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [hint, setHint] = useState(false);
  const feed = useRef<HTMLDivElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const bar = useRef<HTMLDivElement>(null);
  const userPaused = useRef(false);
  const pick = useVideoSrc();

  // the level the reader chose last time; iPhones only take the side buttons, so there the slider stays away
  useEffect(() => {
    const a = document.createElement("audio");
    a.volume = 0.5;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanVolume(a.volume === 0.5);
    const saved = Number(localStorage.getItem(VOL_KEY));
    if (saved > 0 && saved <= 1) setVolume(saved);
  }, []);

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

  // open on the chosen video, without scrolling through the others; the hint until the reader has moved on once
  useLayoutEffect(() => {
    if (start === null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCur(start);
    setHint(localStorage.getItem("feed-hint") !== "seen");
    userPaused.current = false;
    const place = () => {
      const f = feed.current;
      if (f) f.scrollTop = start * f.clientHeight;
      else requestAnimationFrame(place);
    };
    requestAnimationFrame(place);
  }, [start]);

  // the hint steps aside by itself after a few seconds
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(false), 4200);
    return () => clearTimeout(t);
  }, [hint]);

  const onScroll = () => {
    const f = feed.current;
    if (!f) return;
    const k = Math.round(f.scrollTop / f.clientHeight);
    if (k !== cur && k >= 0 && k < N) {
      userPaused.current = false;
      setCur(k);
      setHint(false);
      localStorage.setItem("feed-hint", "seen");
    }
  };

  const goTo = useCallback((k: number) => {
    const f = feed.current;
    if (!f || k < 0 || k >= N) return;
    f.scrollTo({ top: k * f.clientHeight, behavior: smooth() });
  }, []);

  // the video on screen plays, every other one stops and rewinds
  useEffect(() => {
    if (!open) return;
    vids.current.forEach((v, k) => {
      if (!v) return;
      if (k === cur) {
        v.volume = volume;
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
  }, [cur, open, muted, volume]);

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

  const setLevel = (x: number) => {
    setVolume(x);
    setMuted(x === 0);
    if (x > 0) localStorage.setItem(VOL_KEY, String(x));
  };
  const toggleMute = () => {
    if (muted && volume === 0) setVolume(0.6);
    setMuted((m) => !m);
  };

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
    if ((e.target as HTMLElement).tagName === "INPUT" && (k === "ArrowLeft" || k === "ArrowRight")) return;
    if (k === "ArrowDown" || k === "PageDown" || k === "j") goTo(cur + 1);
    else if (k === "ArrowUp" || k === "PageUp" || k === "k") goTo(cur - 1);
    else if (k === " ") toggle();
    else if (k === "m") toggleMute();
    else if (v && k === "ArrowRight") v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
    else if (v && k === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
    else return;
    e.preventDefault();
  };

  const it = VIDEOS[cur];
  const lvl = muted ? 0 : volume;
  const [volKey, VolIcon] = lvl === 0 ? (["off", VolumeX] as const) : lvl < 0.5 ? (["low", Volume1] as const) : (["high", Volume2] as const);

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
                    onLoadedMetadata={(e) => {
                      e.currentTarget.volume = volume;
                      e.currentTarget.muted = muted;
                    }}
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
            <span className="pointer-events-auto flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-black/55 pr-1 text-white">
                <button type="button" aria-label={lvl === 0 ? "Включить звук" : "Выключить звук"} onClick={toggleMute} className="grid size-11 cursor-pointer place-items-center rounded-full">
                  <IconSwap id={volKey}>
                    <VolIcon className="size-5" strokeWidth={2} nonScalingStroke />
                  </IconSwap>
                </button>
                {canVolume && (
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={lvl}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    aria-label="Громкость"
                    className="vp-range mr-3 w-20 sm:w-24"
                    style={{ ["--lvl" as string]: `${lvl * 100}%` }}
                  />
                )}
              </span>
              <Dialog.Close aria-label="Закрыть" className="grid size-11 cursor-pointer place-items-center rounded-full bg-white text-black transition-colors hover:bg-accent-fill hover:text-white">
                <X className="size-5" strokeWidth={2.5} nonScalingStroke />
              </Dialog.Close>
            </span>
          </div>

          {/* centre: paused or loading */}
          {!playing && !waiting && !hint && (
            <button type="button" aria-label="Смотреть" onClick={toggle} className="absolute top-1/2 left-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-accent-fill text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <Play className="ml-1 size-8" fill="currentColor" strokeWidth={0} />
            </button>
          )}
          {waiting && playing && <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />}

          {/* how to move on: a finger drawing the swipe on phones, the wheel and keys on desktops (shown until used once) */}
          {hint && N > 1 && (
            <button type="button" onClick={() => setHint(false)} className="feed-hint absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-3 rounded-[22px] border border-white/15 bg-black/45 px-7 py-6 text-white backdrop-blur-md">
              <span aria-hidden className="relative grid h-24 w-14 place-items-center">
                <span className="feed-hint-trail absolute inset-x-[22px] top-2 bottom-8 rounded-full bg-gradient-to-t from-white/0 via-white/35 to-white/0" />
                <Pointer className="feed-hint-finger size-10 pointer-fine:hidden" strokeWidth={1.75} nonScalingStroke />
                <ChevronUp className="feed-hint-finger size-10 pointer-coarse:hidden" strokeWidth={2} nonScalingStroke />
              </span>
              <span className="text-ui font-bold">
                <span className="pointer-fine:hidden">Листайте вверх</span>
                <span className="pointer-coarse:hidden">Колесо мыши или стрелки ↑ ↓</span>
              </span>
              <span className="text-small text-white/75">Ещё {N - 1} видео</span>
            </button>
          )}

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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
