"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Maximize, MessageSquareText, Minimize, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

type FsVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };
type FsBox = HTMLDivElement & { webkitRequestFullscreen?: () => void };
type Turnable = ScreenOrientation & { lock?: (o: string) => Promise<void> };

function Bars({ on }: { on: boolean }) {
  return (
    <span aria-hidden className="flex h-4 items-end gap-[3px]">
      {[0, 1, 2].map((i) => (
        <i key={i} className="w-[3px] origin-bottom rounded-[1px] bg-accent" style={{ height: "100%", animation: on ? `eq 0.9s ease-in-out ${i * 0.18}s infinite alternate` : undefined, transform: on ? undefined : "scaleY(0.35)" }} />
      ))}
    </span>
  );
}

/** A sideways swipe on touch screens: `on(+1)` for left (next), `on(-1)` for right (previous); a plain tap calls `tap`. */
function useSwipe(on: (dir: 1 | -1) => void, tap?: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  return {
    handlers: {
      // a tap that ends a swipe is not a click
      onClick: () => {
        if (swiped.current) swiped.current = false;
        else tap?.();
      },
      onPointerDown: (e: React.PointerEvent) => {
        swiped.current = false;
        start.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY };
      },
      onPointerUp: (e: React.PointerEvent) => {
        const s = start.current;
        start.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          swiped.current = true;
          on(dx < 0 ? 1 : -1);
        }
      },
      onPointerCancel: () => (start.current = null),
    },
  };
}

/**
 * Client reviews with an own video player: starts by itself (muted) when it scrolls into view, runs through all videos,
 * one tap turns the sound on, scrub bar, swipe to the next video, fullscreen, keyboard. Reduced motion / data saver: no autoplay.
 * The list beside it shows every video at once: a strip of covers on phones, a scrolling column as tall as the player on desktops.
 */
export function Reviews() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [dur, setDur] = useState<number>(VIDEOS[0].dur);
  const [waiting, setWaiting] = useState(false);
  const [fs, setFs] = useState(false);
  const [auto, setAuto] = useState(true);
  const [volume, setVolume] = useState(1);
  const [slide, setSlide] = useState<number | null>(null);
  const [playerH, setPlayerH] = useState(0);

  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const userPaused = useRef(false);
  const wantPlay = useRef(false);
  const cur = VIDEOS[i];
  const idxRef = useRef(0);
  const pick = useVideoSrc();
  // width / height of the current video: from the list first, then the video's own size once it has loaded
  const [ratio, setRatio] = useState<number>(VIDEOS[0].w / VIDEOS[0].h);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRatio(VIDEOS[i].w / VIDEOS[i].h);
  }, [i]);
  const near = useNear(box);

  // volume and mute are properties of the video element, not attributes: the element follows the state
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted || volume === 0;
  }, [volume, muted, i]);

  const setLevel = (value: number) => {
    setVolume(value);
    setMuted(value === 0);
  };
  const toggleMute = () => {
    if (muted || volume === 0) {
      if (volume === 0) setVolume(0.6);
      setMuted(false);
    } else setMuted(true);
  };

  const paint = useCallback((time: number, d: number) => {
    const k = d ? Math.min(1, time / d) : 0;
    if (bar.current) bar.current.style.transform = `scaleX(${k})`;
  }, []);

  const go = useCallback((n: number, play = true) => {
    const k = (n + N) % N;
    wantPlay.current = play;
    idxRef.current = k;
    paint(0, VIDEOS[k].dur);
    setDur(VIDEOS[k].dur);
    setI(k);
  }, [paint]);

  const toggle = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  }, []);

  const swipe = useSwipe((dir) => go(i + dir), toggle);

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saver = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (calm || saver) setAuto(false);
  }, []);

  // load a new video and play it if we were playing
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.load();
    if (wantPlay.current && auto) v.play().catch(() => setPlaying(false));
  }, [i, auto]);

  // the chosen video's cover slides into view inside the list (the list scrolls, never the page)
  useEffect(() => {
    const ul = list.current;
    const li = ul?.children[i] as HTMLElement | undefined;
    if (!ul || !li) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ul.scrollTo({
      left: li.offsetLeft - ul.offsetLeft - (ul.clientWidth - li.offsetWidth) / 2,
      top: li.offsetTop - ul.offsetTop - (ul.clientHeight - li.offsetHeight) / 2,
      behavior: calm ? "auto" : "smooth",
    });
  }, [i]);

  // on desktops the list is exactly as tall as the player next to it
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPlayerH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // start when the player is mostly on screen, stop when it leaves
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const v = video.current;
        if (!v) return;
        if (e.isIntersecting) {
          if (auto && !userPaused.current && v.paused) {
            wantPlay.current = true;
            v.play().catch(() => {});
          }
        } else if (!v.paused && !document.fullscreenElement) v.pause();
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [auto]);

  // smooth progress while playing
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const v = video.current;
      if (v) paint(v.currentTime, v.duration || VIDEOS[idxRef.current].dur);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, paint]);

  useEffect(() => {
    const on = () => {
      const now = !!document.fullscreenElement;
      setFs(now);
      if (!now) screen.orientation?.unlock?.();
    };
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const fullscreen = () => {
    const b = box.current as FsBox | null;
    const v = video.current as FsVideo | null;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (b?.requestFullscreen)
      b.requestFullscreen()
        // a wide video turns the phone sideways while it fills the screen (Android; elsewhere nothing happens)
        .then(() => {
          if (ratio > 1) void (screen.orientation as Turnable | undefined)?.lock?.("landscape").catch(() => {});
        })
        .catch(() => {});
    else if (b?.webkitRequestFullscreen) b.webkitRequestFullscreen();
    else v?.webkitEnterFullscreen?.(); // iPhone: the system player, closed with its own «Готово»
  };

  const seek = (clientX: number, el: HTMLElement) => {
    const v = video.current;
    if (!v || !isFinite(v.duration)) return;
    const r = el.getBoundingClientRect();
    const k = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    v.currentTime = k * v.duration;
    paint(v.currentTime, v.duration);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const v = video.current;
    if (!v || (e.target as HTMLElement).tagName === "INPUT") return;
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      toggle();
    } else if (e.key === "m") toggleMute();
    else if (e.key === "f") fullscreen();
    else if (e.key === "n" || e.key === "PageDown") go(i + 1);
    else if (e.key === "p" || e.key === "PageUp") go(i - 1);
    else if (e.key === "ArrowRight") v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
    else if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
    else if (e.key === "ArrowUp") setLevel(Math.min(1, volume + 0.1));
    else if (e.key === "ArrowDown") setLevel(Math.max(0, volume - 0.1));
  };

  const next = VIDEOS[(i + 1) % N];
  const shown = slide !== null ? SLIDES[slide] : null;
  const turn = (d: number) => setSlide((s) => (s === null ? s : (s + d + SLIDES.length) % SLIDES.length));
  const photoSwipe = useSwipe((dir) => turn(dir));

  return (
    <section id="reviews" className="bg-bg-2 pt-9 pb-10 lg:pt-14 lg:pb-16">
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <SectionHead
          title="Отзывы клиентов"
          lead="Видео от наших покупателей: как получили машину и как прошла сделка."
        />

        <div ref={wrap} className="mt-6 grid items-start gap-5 lg:mt-12 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)] lg:gap-10 xl:gap-14">
          <Reveal delay={0.08} className="min-w-0">
            <div className="-mx-5 flex items-center justify-center sm:mx-auto lg:min-h-[600px]">
              <div
                ref={box}
                id="review-player"
                tabIndex={0}
                role="group"
                aria-label={`Видеоплеер: ${cur.title}, видео ${i + 1} из ${N}. Пробел: пауза, M: звук, F: во весь экран, N и P: следующее и предыдущее видео, стрелки влево и вправо: перемотка, вверх и вниз: громкость`}
                onKeyDown={onKey}
                style={fs ? undefined : { aspectRatio: String(ratio) }}
                className={`group relative overflow-hidden rounded-[6px] bg-black outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  ratio >= 1 ? "w-full lg:max-w-[600px]" : "w-full max-h-[86svh] sm:w-auto sm:h-[min(70svh,600px)] sm:max-w-full"
                } max-sm:rounded-none ${fs ? "!h-full !max-h-none !w-full !max-w-none !rounded-none" : ""}`}
              >
                <video
                  ref={video}
                  key={cur.id}
                  aria-label={`Видеоотзыв: ${cur.title}`}
                  src={pick(asset(`/reviews/${cur.id}.mp4`))}
                  poster={near ? asset(`/reviews/${cur.id}-poster.webp`) : undefined}
                  playsInline
                  preload="metadata"
                  {...swipe.handlers}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onWaiting={() => setWaiting(true)}
                  onPlaying={() => setWaiting(false)}
                  onCanPlay={() => setWaiting(false)}
                  onLoadedMetadata={(e) => {
                    setDur(e.currentTarget.duration);
                    const v = e.currentTarget;
                    if (v.videoWidth && v.videoHeight) setRatio(v.videoWidth / v.videoHeight);
                    e.currentTarget.volume = volume;
                    e.currentTarget.muted = muted || volume === 0;
                  }}
                  onEnded={() => go(i + 1)}
                  className="size-full cursor-pointer touch-pan-y object-contain"
                />

                {/* which video of how many: the list shows the rest */}
                <span className="num pointer-events-none absolute top-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-small text-white">
                  {i + 1} / {N}
                </span>

                {/* sound prompt */}
                {muted && playing && (
                  <button
                    type="button"
                    onClick={() => setLevel(volume || 1)}
                    className="absolute top-3 left-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent-fill px-4 py-2.5 text-ui font-bold text-white shadow-lg"
                  >
                    <VolumeX className="size-[18px]" strokeWidth={2.5} nonScalingStroke />
                    Включить звук
                  </button>
                )}

                {/* centre: play when paused, spinner when waiting */}
                {!playing && !waiting && (
                  <button
                    type="button"
                    aria-label="Смотреть"
                    onClick={toggle}
                    className="absolute top-1/2 left-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-accent-fill text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-transform hover:scale-105"
                  >
                    <Play className="ml-1 size-8" strokeWidth={2} nonScalingStroke fill="currentColor" />
                  </button>
                )}
                {waiting && playing && <span aria-hidden className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />}

                {/* controls */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-3 pt-10 pb-3 [background:linear-gradient(0deg,rgba(0,0,0,0.75),transparent)]">
                  <p className="px-1 text-body leading-tight font-bold text-white">
                    {cur.title}
                    {cur.sub && <span className="block text-small leading-tight font-medium text-white/75">{cur.sub}</span>}
                  </p>
                  <div
                    role="slider"
                    tabIndex={-1}
                    aria-label="Перемотка"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(dur)}
                    aria-valuenow={0}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      seek(e.clientX, e.currentTarget);
                    }}
                    onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && seek(e.clientX, e.currentTarget)}
                    className="group/bar cursor-pointer touch-none py-2 pointer-coarse:py-3.5"
                  >
                    <div className="h-[5px] overflow-hidden rounded-full bg-white/30 transition-[scale] duration-150 ease-out group-hover/bar:scale-y-[1.4]">
                      <div ref={bar} className="h-full origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <button type="button" aria-label="Предыдущее видео" onClick={() => go(i - 1)} className="vp-btn">
                      <SkipBack className="size-5" strokeWidth={2} nonScalingStroke />
                    </button>
                    <button type="button" aria-label={playing ? "Пауза" : "Играть"} onClick={toggle} className="vp-btn">
                      <IconSwap id={playing ? "pause" : "play"}>{playing ? <Pause className="size-5" strokeWidth={2} nonScalingStroke /> : <Play className="size-5 translate-x-px" strokeWidth={2} nonScalingStroke />}</IconSwap>
                    </button>
                    <button type="button" aria-label="Следующее видео" onClick={() => go(i + 1)} className="vp-btn">
                      <SkipForward className="size-5" strokeWidth={2} nonScalingStroke />
                    </button>
                    <span className="flex-1" />
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label={muted || volume === 0 ? "Включить звук" : "Выключить звук"} onClick={toggleMute} className="vp-btn">
                        {(() => {
                          const lvl = muted ? 0 : volume;
                          const [key, Icon] = lvl === 0 ? ["off", VolumeX] as const : lvl < 0.5 ? ["low", Volume1] as const : ["high", Volume2] as const;
                          return (
                            <IconSwap id={key}>
                              <Icon className="size-5" strokeWidth={2} nonScalingStroke />
                            </IconSwap>
                          );
                        })()}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.02}
                        value={muted ? 0 : volume}
                        onChange={(e) => setLevel(Number(e.target.value))}
                        aria-label="Громкость"
                        className="vp-range w-[60px] pointer-coarse:hidden"
                        style={{ ["--lvl" as string]: `${(muted ? 0 : volume) * 100}%` }}
                      />
                    </div>
                    <button type="button" aria-label={fs ? "Выйти из полноэкранного режима" : "Во весь экран"} onClick={fullscreen} className="vp-btn">
                      {fs ? <Minimize className="size-5" strokeWidth={2} nonScalingStroke /> : <Maximize className="size-5" strokeWidth={2} nonScalingStroke />}
                    </button>
                  </div>
                </div>

                {/* a big, plain way out of fullscreen at the top, where the eye looks for it */}
                {fs && (
                  <button
                    type="button"
                    aria-label="Выйти из полноэкранного режима"
                    onClick={fullscreen}
                    className="absolute top-3 left-1/2 grid size-11 -translate-x-1/2 cursor-pointer place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-accent-fill"
                  >
                    <X className="size-5" strokeWidth={2} nonScalingStroke />
                  </button>
                )}

                {/* the next video is fetched in advance (metadata only) */}
                {near && <video src={pick(asset(`/reviews/${next.id}.mp4`))} preload="metadata" muted hidden aria-hidden />}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p className="eyebrow">
                Видео
                <span className="num text-ink-3">{N}</span>
              </p>
              <p className="num text-small text-ink-3 lg:hidden">
                {i + 1} из {N}
              </p>
            </div>
            {/* phones and tablets: a strip of covers, four or five in view; desktops: a column as tall as the player */}
            <ul
              ref={list}
              data-lenis-prevent
              aria-label="Все видеоотзывы"
              style={{ ["--player-h" as string]: playerH ? `${playerH - 34}px` : "560px" }}
              className="reel -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-2.5 overflow-x-auto overscroll-x-contain px-5 pb-1 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:max-h-[var(--player-h)] lg:snap-y lg:scroll-p-0 lg:flex-col lg:gap-2 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-y-contain lg:px-0 lg:pr-2 lg:pb-0"
            >
              {VIDEOS.map((it, n) => {
                const on = n === i;
                const [name, place] = splitTitle(it.title);
                return (
                  <li key={it.id} className="w-[104px] shrink-0 snap-start sm:w-[124px] lg:w-auto">
                    <button
                      type="button"
                      onClick={() => go(n)}
                      aria-current={on}
                      aria-label={`${it.title}${it.sub ? `, ${it.sub}` : ""}, ${clock(it.dur)}`}
                      className={`group/v flex w-full cursor-pointer flex-col gap-1.5 rounded-[10px] text-left transition-colors lg:flex-row lg:items-center lg:gap-3 lg:border lg:p-2 ${
                        on ? "lg:border-accent lg:bg-accent-soft" : "lg:border-line-strong lg:hover:border-ink-3"
                      }`}
                    >
                      <span
                        className={`relative block aspect-[3/4] w-full shrink-0 overflow-hidden rounded-[8px] bg-black lg:w-[54px] lg:rounded-[4px] ${
                          on ? "outline-2 outline-offset-2 outline-accent lg:outline-0" : ""
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset(`/reviews/${it.id}-thumb.webp`)} alt="" loading="lazy" decoding="async" width={240} height={320} className="size-full object-cover transition-transform duration-300 ease-out group-hover/v:scale-[1.04]" />
                        <span aria-hidden className="absolute inset-0 grid place-items-center bg-black/20">
                          {on ? <Bars on={playing} /> : <Play className="size-5 text-white drop-shadow lg:size-4" fill="currentColor" strokeWidth={0} />}
                        </span>
                        <span className="num absolute right-1 bottom-1 rounded-[3px] bg-black/65 px-1 text-[0.6875rem] leading-[1.35] text-white lg:hidden">{clock(it.dur)}</span>
                        <span aria-hidden className="img-edge pointer-events-none absolute inset-0 rounded-[inherit]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-caption leading-tight font-bold sm:text-small lg:text-body ${on ? "text-accent lg:text-ink" : "text-ink"}`}>
                          <span className="lg:hidden">{name}</span>
                          <span className="max-lg:hidden">{it.title}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-[0.75rem] leading-tight text-ink-2 sm:text-caption lg:text-small">
                          <span className="lg:hidden">{place}</span>
                          <span className="max-lg:hidden">{it.sub}</span>
                        </span>
                      </span>
                      <span className="num hidden text-small text-ink-3 lg:block">{clock(it.dur)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>

        {/* photos and written reviews of the clients, under the videos */}
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
                  {...photoSwipe.handlers}
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
