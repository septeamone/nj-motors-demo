"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { Reveal, SectionHead } from "./ui";

// Videos compressed from the owner's originals (public/reviews). Andrey's own video lives in the block above (Owner).
const ITEMS = [
  { id: "review-1", title: "Отзыв клиента", sub: "Имя, машина и город — после согласия клиента", wide: false, dur: 82 },
  { id: "review-2", title: "Отзыв клиента", sub: "Имя, машина и город — после согласия клиента", wide: false, dur: 102 },
  { id: "review-3", title: "Отзыв клиента", sub: "Имя, машина и город — после согласия клиента", wide: true, dur: 30 },
] as const;

// Photos of cars sent by the owner (public/gallery): a cropped tile for the wall and the whole frame for the big view.
const PHOTOS = [
  { n: 1, title: "Land Rover Discovery", alt: "Белый Land Rover Discovery, вид спереди" },
  { n: 2, title: "BMW", alt: "Чёрный BMW, вид спереди" },
  { n: 3, title: "Kia", alt: "Белая Kia под навесом, вид спереди" },
  { n: 4, title: "Volkswagen", alt: "Белый Volkswagen, вид спереди" },
  { n: 5, title: "Chevrolet", alt: "Белый Chevrolet на площадке" },
  { n: 6, title: "Kia", alt: "Белая Kia на площадке" },
  { n: 7, title: "SsangYong", alt: "Белый SsangYong на парковке" },
].map((p) => ({ ...p, tile: asset(`/gallery/car-${p.n}.webp`), full: asset(`/gallery/car-${p.n}-full.webp`) }));

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

type Shelf = { rows: number; cols: number; show?: number };
// how many rows and columns each shelf shows at a given screen width (show: columns' worth of width, a little more than cols peeks the next page)
const VIDEO_SHELF = (w: number): Shelf => (w < 640 ? { rows: 1, cols: 1, show: 1.22 } : { rows: w < 1024 ? 1 : 2, cols: 2 });
const PHOTO_SHELF = (w: number): Shelf => (w < 640 ? { rows: 2, cols: 2, show: 2.25 } : w < 1024 ? { rows: 2, cols: 3 } : { rows: 2, cols: 5 });

/**
 * A compact shelf: a fixed number of rows that scrolls sideways, so ten or fifty items take the same room.
 * Items read in rows (1 2 3 / 4 5 6), page by page; arrows appear only when there is more than fits.
 */
function Rail({ label, hint, shelf, listRef, children }: { label: string; hint: string; shelf: (width: number) => Shelf; listRef?: React.RefObject<HTMLUListElement | null>; children: React.ReactNode[] }) {
  const own = useRef<HTMLUListElement>(null);
  const box = listRef ?? own;
  const [more, setMore] = useState(false);
  const [lay, setLay] = useState<Shelf>(() => shelf(0));

  // the shelf layout follows the screen; Lenis (smooth page scroll) is told to leave the shelf alone only while it scrolls
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const check = () => {
      setLay(shelf(window.innerWidth));
      const over = el.scrollWidth > el.clientWidth + 2;
      setMore(over);
      if (over) el.setAttribute("data-lenis-prevent", "");
      else el.removeAttribute("data-lenis-prevent");
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [box, shelf]);

  const slide = (dir: number) => box.current?.scrollBy({ left: dir * box.current.clientWidth * 0.9, behavior: "smooth" });
  const show = lay.show ?? lay.cols;
  const page = lay.rows * lay.cols;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="eyebrow">
          {label}
          <span className="num text-ink-3">{hint}</span>
        </p>
        {more && (
          <span className="flex gap-1.5">
            <button type="button" aria-label="Назад" onClick={() => slide(-1)} className="grid size-8 cursor-pointer place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-accent">
              <ChevronLeft className="size-4" strokeWidth={2} />
            </button>
            <button type="button" aria-label="Вперёд" onClick={() => slide(1)} className="grid size-8 cursor-pointer place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-accent">
              <ChevronRight className="size-4" strokeWidth={2} />
            </button>
          </span>
        )}
      </div>
      <ul
        ref={box}
        className="grid snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none]"
        style={{ gridAutoFlow: "column", gridAutoColumns: `calc((100% - ${(show - 1) * 12}px) / ${show})` }}
      >
        {children.map((child, k) => {
          const inPage = k % page;
          const col = Math.floor(k / page) * lay.cols + (inPage % lay.cols) + 1;
          return (
            <li key={k} className={`min-w-0 ${inPage % lay.cols === 0 && inPage < lay.cols ? "snap-start" : ""}`} style={{ gridRow: Math.floor(inPage / lay.cols) + 1, gridColumn: col }}>
              {child}
            </li>
          );
        })}
      </ul>
    </div>
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
  const [volume, setVolume] = useState(1);
  const [photo, setPhoto] = useState<number | null>(null);

  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const segs = useRef<(HTMLSpanElement | null)[]>([]);
  const userPaused = useRef(false);
  const wantPlay = useRef(false);
  const cur = ITEMS[i];
  const idxRef = useRef(0);

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
    const seg = segs.current[idxRef.current];
    if (seg) seg.style.transform = `scaleX(${k})`;
    if (clock.current) clock.current.textContent = `${mmss(time)} / ${mmss(d)}`;
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
    if (!v || (e.target as HTMLElement).tagName === "INPUT") return;
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      toggle();
    } else if (e.key === "m") toggleMute();
    else if (e.key === "f") fullscreen();
    else if (e.key === "ArrowRight") v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
    else if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
    else if (e.key === "ArrowUp") setLevel(Math.min(1, volume + 0.1));
    else if (e.key === "ArrowDown") setLevel(Math.max(0, volume - 0.1));
  };

  const next = ITEMS[(i + 1) % ITEMS.length];

  return (
    // the second half of one block with Owner above it: same ground, no cut between them
    <section id="reviews" className="bg-bg-2 pt-10 pb-14 lg:pt-14 lg:pb-20">
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <SectionHead
          title="Что говорят клиенты"
          lead="Видео от клиентов Андрея. Имена, машины и города добавим с их согласия."
        />

        <div ref={wrap} className="mt-12 grid items-start gap-10 lg:mt-16 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-10 xl:gap-14">
          <Reveal delay={0.08} className="min-w-0">
            <div className="mx-auto flex min-h-[480px] items-center justify-center lg:min-h-[600px]">
              <div
                ref={box}
                tabIndex={0}
                role="group"
                aria-label={`Видеоплеер: ${cur.title}. Пробел: пауза, M: звук, F: во весь экран, стрелки влево и вправо: перемотка, вверх и вниз: громкость`}
                onKeyDown={onKey}
                className={`group relative overflow-hidden rounded-[6px] bg-black outline-none transition-[width,max-width] duration-500 focus-visible:ring-2 focus-visible:ring-accent ${
                  cur.wide ? "aspect-video w-full max-w-[600px]" : "aspect-[9/16] h-[min(70svh,600px)] max-w-full"
                } ${fs ? "!h-full !w-full !max-w-none !rounded-none" : ""}`}
              >
                <video
                  ref={video}
                  key={cur.id}
                  poster={asset(`/reviews/${cur.id}-poster.webp`)}
                  playsInline
                  preload="metadata"
                  onClick={toggle}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onWaiting={() => setWaiting(true)}
                  onPlaying={() => setWaiting(false)}
                  onCanPlay={() => setWaiting(false)}
                  onLoadedMetadata={(e) => {
                    setDur(e.currentTarget.duration);
                    e.currentTarget.volume = volume;
                    e.currentTarget.muted = muted || volume === 0;
                  }}
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
                    onClick={() => setLevel(volume || 1)}
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
                    <span ref={clock} className="num ml-1 text-[14px] whitespace-nowrap opacity-85">
                      0:00 / {mmss(dur)}
                    </span>
                    <span className="flex-1" />
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label={muted || volume === 0 ? "Включить звук" : "Выключить звук"} onClick={toggleMute} className="vp-btn">
                        {(() => {
                          const lvl = muted ? 0 : volume;
                          const Icon = lvl === 0 ? VolumeX : lvl < 0.5 ? Volume1 : Volume2;
                          return <Icon className="size-5" strokeWidth={2} />;
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
                        className="vp-range w-[52px] sm:w-[60px]"
                        style={{ ["--lvl" as string]: `${(muted ? 0 : volume) * 100}%` }}
                      />
                    </div>
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
            <Rail label="Видео" hint={`${ITEMS.length}`} shelf={VIDEO_SHELF} listRef={list}>
              {ITEMS.map((it, n) => {
                const on = n === i;
                return (
                  <div key={it.id} className="h-full">
                    <button
                      type="button"
                      onClick={() => go(n)}
                      aria-current={on}
                      className={`flex size-full cursor-pointer items-center gap-3 rounded-[10px] border p-2.5 text-left transition-colors ${
                        on ? "border-accent bg-accent-soft" : "border-line-strong hover:border-ink-3"
                      }`}
                    >
                      <span className={`relative shrink-0 overflow-hidden rounded-[6px] bg-black ${it.wide ? "aspect-video w-[100px]" : "aspect-[9/16] w-[56px]"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset(`/reviews/${it.id}-poster.webp`)} alt="" loading="lazy" className="size-full object-cover" />
                        <span aria-hidden className="absolute inset-0 grid place-items-center bg-black/25">
                          {on ? <Bars on={playing} /> : <Play className="size-5 text-white" fill="currentColor" strokeWidth={0} />}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="num block text-[13px] text-accent-ink">{String(n + 1).padStart(2, "0")}</span>
                        <span className="block text-[16px] leading-tight font-bold text-ink">{it.title}</span>
                        <span className="mt-0.5 block text-[14px] text-ink-2">{it.sub}</span>
                      </span>
                      <span className="num shrink-0 text-[15px] text-ink-3">{mmss(it.dur)}</span>
                    </button>
                  </div>
                );
              })}
            </Rail>

            <div className="mt-6 lg:mt-8">
              <Rail label="Фото с площадок в Корее, от Андрея" hint={`${PHOTOS.length}`} shelf={PHOTO_SHELF}>
                {PHOTOS.map((p, n) => (
                  <div key={p.n}>
                    <button
                      type="button"
                      onClick={() => setPhoto(n)}
                      aria-label={`Открыть фото: ${p.title}`}
                      className="group relative block aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-[8px] border border-line-strong bg-bg-2 outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.tile} alt={p.alt} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pt-6 pb-1.5 text-[13px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{p.title}</span>
                    </button>
                  </div>
                ))}
              </Rail>
            </div>
          </Reveal>
        </div>
      </div>

      <Dialog.Root open={photo !== null} onOpenChange={(v) => !v && setPhoto(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="dlg-fade fixed inset-0 z-[100] bg-[rgba(4,12,20,0.92)]" />
          <Dialog.Content aria-describedby={undefined} className="dlg-pop fixed inset-0 z-[101] grid place-items-center p-3 outline-none sm:p-6" onClick={(e) => e.target === e.currentTarget && setPhoto(null)}>
            <Dialog.Title className="sr-only">{photo !== null ? PHOTOS[photo].title : ""}</Dialog.Title>
            {photo !== null && (
              <figure className="relative flex max-h-full max-w-full flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PHOTOS[photo].full} alt={PHOTOS[photo].alt} className="max-h-[80svh] max-w-[94vw] rounded-[10px] object-contain shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]" />
                <figcaption className="flex items-center gap-4 text-white">
                  <button type="button" aria-label="Предыдущее фото" onClick={() => setPhoto((photo + PHOTOS.length - 1) % PHOTOS.length)} className="vp-btn">
                    <ChevronLeft className="size-6" strokeWidth={2} />
                  </button>
                  <span className="text-center">
                    <span className="font-display block text-[20px] tracking-wide uppercase">{PHOTOS[photo].title}</span>
                    <span className="num text-[14px] opacity-75">
                      {photo + 1} / {PHOTOS.length}
                    </span>
                  </span>
                  <button type="button" aria-label="Следующее фото" onClick={() => setPhoto((photo + 1) % PHOTOS.length)} className="vp-btn">
                    <ChevronRight className="size-6" strokeWidth={2} />
                  </button>
                </figcaption>
              </figure>
            )}
            <Dialog.Close aria-label="Закрыть" className="absolute top-3 right-3 z-[102] grid size-11 cursor-pointer place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-accent-fill sm:top-5 sm:right-5">
              <X className="size-5" strokeWidth={2} />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
