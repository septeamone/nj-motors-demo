"use client";

import { Maximize, Minimize, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { Reveal, SectionHead } from "./ui";

// Videos compressed from the owner's originals (public/reviews). The first one is Andrey himself, it opens the row.
const ITEMS = [
  { id: "andrey", title: "Андрей, NJ Motors", sub: "Начинает Андрей", wide: false, dur: 98 },
  { id: "review-1", title: "Отзыв клиента", sub: "Видео от клиента", wide: false, dur: 82 },
  { id: "review-2", title: "Отзыв клиента", sub: "Видео от клиента", wide: false, dur: 102 },
  { id: "review-3", title: "Отзыв клиента", sub: "Видео от клиента", wide: true, dur: 30 },
] as const;

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

type FsVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };
type FsBox = HTMLDivElement & { webkitRequestFullscreen?: () => void };

function Bars({ on }: { on: boolean }) {
  return (
    <span aria-hidden className="flex h-4 items-end gap-[3px]">
      {[0, 1, 2].map((i) => (
        <i key={i} className="w-[3px] origin-bottom rounded-[1px] bg-accent" style={{ height: "100%", animation: on ? `eq 0.9s ease-in-out ${i * 0.18}s infinite alternate` : undefined, transform: on ? undefined : "scaleY(0.35)" }} />
      ))}
    </span>
  );
}

/**
 * Client reviews with an own video player: starts by itself (muted) when it scrolls into view, runs through all videos,
 * one tap turns the sound on, scrub bar, story-style segments, fullscreen, keyboard. Reduced motion / data saver: no autoplay.
 */
export function Reviews() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [dur, setDur] = useState<number>(ITEMS[0].dur);
  const [waiting, setWaiting] = useState(false);
  const [fs, setFs] = useState(false);
  const [auto, setAuto] = useState(true);

  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const segs = useRef<(HTMLSpanElement | null)[]>([]);
  const userPaused = useRef(false);
  const wantPlay = useRef(false);
  const cur = ITEMS[i];
  const idxRef = useRef(0);

  const paint = useCallback((time: number, d: number) => {
    const k = d ? Math.min(1, time / d) : 0;
    if (bar.current) bar.current.style.transform = `scaleX(${k})`;
    const seg = segs.current[idxRef.current];
    if (seg) seg.style.transform = `scaleX(${k})`;
    if (clock.current) clock.current.textContent = `${mmss(time)} / ${mmss(d)}`;
  }, []);

  // Lenis (smooth page scroll) is told to leave the list alone only while the list actually scrolls;
  // otherwise the wheel over it would stop moving the page and the page would judder
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const mark = () => {
      if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) el.setAttribute("data-lenis-prevent", "");
      else el.removeAttribute("data-lenis-prevent");
    };
    mark();
    const ro = new ResizeObserver(mark);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback((n: number, play = true) => {
    wantPlay.current = play;
    idxRef.current = (n + ITEMS.length) % ITEMS.length;
    paint(0, ITEMS[idxRef.current].dur);
    setDur(ITEMS[(n + ITEMS.length) % ITEMS.length].dur);
    setI((n + ITEMS.length) % ITEMS.length);
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
        } else if (!v.paused) v.pause();
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
      if (v) paint(v.currentTime, v.duration || ITEMS[idxRef.current].dur);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, paint]);

  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const fullscreen = () => {
    const b = box.current as FsBox | null;
    const v = video.current as FsVideo | null;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (b?.requestFullscreen) void b.requestFullscreen();
    else if (b?.webkitRequestFullscreen) b.webkitRequestFullscreen();
    else v?.webkitEnterFullscreen?.(); // iPhone
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
    if (!v) return;
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      toggle();
    } else if (e.key === "m") setMuted((m) => !m);
    else if (e.key === "f") fullscreen();
    else if (e.key === "ArrowRight") v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
    else if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "ArrowDown") go(i + 1);
  };

  const next = ITEMS[(i + 1) % ITEMS.length];

  return (
    <section id="reviews" className="cut-top border-t border-line pb-14 lg:pb-20" style={{ ["--cut" as string]: "3.5rem" }}>
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <SectionHead
          eyebrow="Отзывы" n="04" shift={3}
          title="Что говорят клиенты"
          lead="Видео клиентов. Начинает Андрей."
        />

        <div ref={wrap} className="mt-12 grid items-start gap-10 lg:mt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
          <Reveal delay={0.08} className="min-w-0 lg:order-2">
            <div className="mx-auto flex min-h-[480px] items-center justify-center lg:min-h-[600px]">
              <div
                ref={box}
                tabIndex={0}
                role="group"
                aria-label={`Видеоплеер: ${cur.title}. Пробел: пауза, M: звук, F: во весь экран, стрелки: перемотка и смена видео`}
                onKeyDown={onKey}
                className={`group relative overflow-hidden rounded-[20px] border border-line-strong bg-black shadow-[0_40px_80px_-36px_var(--shadow)] outline-none transition-[width,max-width] duration-500 focus-visible:ring-2 focus-visible:ring-accent ${
                  cur.wide ? "aspect-video w-full max-w-[600px]" : "aspect-[9/16] h-[min(70svh,600px)] max-w-full"
                } ${fs ? "!h-full !w-full !max-w-none !rounded-none" : ""}`}
              >
                <video
                  ref={video}
                  key={cur.id}
                  poster={asset(`/reviews/${cur.id}-poster.webp`)}
                  playsInline
                  muted={muted}
                  preload="metadata"
                  onClick={toggle}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onWaiting={() => setWaiting(true)}
                  onPlaying={() => setWaiting(false)}
                  onCanPlay={() => setWaiting(false)}
                  onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
                  onEnded={() => go(i + 1)}
                  className="size-full cursor-pointer object-contain"
                >
                  <source src={asset(`/reviews/${cur.id}.mp4`)} type="video/mp4" />
                </video>

                {/* story segments */}
                <div className="pointer-events-none absolute inset-x-0 top-0 flex gap-1.5 p-3 pb-6 [background:linear-gradient(180deg,rgba(0,0,0,0.55),transparent)]">
                  {ITEMS.map((it, n) => (
                    <button
                      key={it.id}
                      type="button"
                      aria-label={`Видео ${n + 1}: ${it.title}`}
                      onClick={() => go(n)}
                      className="pointer-events-auto h-5 flex-1 cursor-pointer py-2"
                    >
                      <span className="block h-[3px] overflow-hidden rounded-full bg-white/30">
                        <span ref={(el) => { segs.current[n] = el; }} className="block h-full origin-left bg-white" style={{ transform: `scaleX(${n < i ? 1 : 0})` }} />
                      </span>
                    </button>
                  ))}
                </div>

                {/* sound prompt */}
                {muted && playing && (
                  <button
                    type="button"
                    onClick={() => setMuted(false)}
                    className="absolute top-12 left-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent-fill px-4 py-2.5 text-[15px] font-bold text-white shadow-lg"
                  >
                    <VolumeX className="size-[18px]" strokeWidth={2} />
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
                    <Play className="ml-1 size-8" strokeWidth={2} fill="currentColor" />
                  </button>
                )}
                {waiting && playing && <span aria-hidden className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />}

                {/* controls */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-3 pt-10 pb-3 [background:linear-gradient(0deg,rgba(0,0,0,0.75),transparent)]">
                  <p className="px-1 text-[16px] leading-tight font-bold text-white">
                    {cur.title}
                    <span className="block text-[14px] font-medium text-white/75">{cur.sub}</span>
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
                    onPointerMove={(e) => e.buttons && seek(e.clientX, e.currentTarget)}
                    className="group/bar cursor-pointer py-2"
                  >
                    <div className="h-[5px] overflow-hidden rounded-full bg-white/30 transition-[height] group-hover/bar:h-[7px]">
                      <div ref={bar} className="h-full origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <button type="button" aria-label="Предыдущее видео" onClick={() => go(i - 1)} className="vp-btn">
                      <SkipBack className="size-5" strokeWidth={2} />
                    </button>
                    <button type="button" aria-label={playing ? "Пауза" : "Играть"} onClick={toggle} className="vp-btn">
                      {playing ? <Pause className="size-5" strokeWidth={2} /> : <Play className="size-5" strokeWidth={2} />}
                    </button>
                    <button type="button" aria-label="Следующее видео" onClick={() => go(i + 1)} className="vp-btn">
                      <SkipForward className="size-5" strokeWidth={2} />
                    </button>
                    <span ref={clock} className="num ml-1 text-[15px] opacity-85">
                      0:00 / {mmss(dur)}
                    </span>
                    <span className="flex-1" />
                    <button type="button" aria-label={muted ? "Включить звук" : "Выключить звук"} onClick={() => setMuted((m) => !m)} className="vp-btn">
                      {muted ? <VolumeX className="size-5" strokeWidth={2} /> : <Volume2 className="size-5" strokeWidth={2} />}
                    </button>
                    <button type="button" aria-label={fs ? "Выйти из полноэкранного режима" : "Во весь экран"} onClick={fullscreen} className="vp-btn">
                      {fs ? <Minimize className="size-5" strokeWidth={2} /> : <Maximize className="size-5" strokeWidth={2} />}
                    </button>
                  </div>
                </div>

                {/* the next video is fetched in advance (metadata only) */}
                <video src={asset(`/reviews/${next.id}.mp4`)} preload="metadata" muted hidden aria-hidden />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="min-w-0">
            <p className="eyebrow mb-5">Все видео</p>
            <ol ref={list} className="flex gap-3 overflow-x-auto overscroll-contain pb-2 lg:grid lg:max-h-[min(70svh,600px)] lg:auto-rows-min lg:overflow-x-hidden lg:overflow-y-auto lg:pr-2">
              {ITEMS.map((it, n) => {
                const on = n === i;
                return (
                  <li key={it.id} className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-auto">
                    <button
                      type="button"
                      onClick={() => go(n)}
                      aria-current={on}
                      className={`flex w-full cursor-pointer items-center gap-4 rounded-[10px] border p-3 text-left transition-colors ${
                        on ? "border-accent bg-accent-soft" : "border-line-strong hover:border-ink-3"
                      }`}
                    >
                      <span className={`relative shrink-0 overflow-hidden rounded-[6px] bg-black ${it.wide ? "aspect-video w-[120px]" : "aspect-[9/16] w-[68px]"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset(`/reviews/${it.id}-poster.webp`)} alt="" loading="lazy" className="size-full object-cover" />
                        <span aria-hidden className="absolute inset-0 grid place-items-center bg-black/25">
                          {on ? <Bars on={playing} /> : <Play className="size-5 text-white" fill="currentColor" strokeWidth={0} />}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="num block text-[14px] text-accent-ink">{String(n + 1).padStart(2, "0")}</span>
                        <span className="block text-[18px] leading-tight font-bold text-ink">{it.title}</span>
                        <span className="mt-1 block text-[15px] text-ink-2">{it.sub}</span>
                      </span>
                      <span className="num shrink-0 text-[16px] text-ink-3">{mmss(it.dur)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
