"use client";

import { Maximize, Minimize, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";

export type ReviewVideo = { id: string; title: string; sub: string; wide: boolean; dur: number };

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

type FsVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };
type FsBox = HTMLDivElement & { webkitRequestFullscreen?: () => void };

/**
 * The review video player, opened large: starts with sound (the visitor just tapped it), scrub bar, a real volume slider,
 * previous / next, fullscreen, keyboard (space, M, F, arrows).
 */
export function ReviewPlayer({ items, index, onIndex }: { items: readonly ReviewVideo[]; index: number; onIndex: (i: number) => void }) {
  const cur = items[index];
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [dur, setDur] = useState(cur.dur);
  const [fs, setFs] = useState(false);

  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLSpanElement>(null);

  const paint = useCallback((time: number, d: number) => {
    if (bar.current) bar.current.style.transform = `scaleX(${d ? Math.min(1, time / d) : 0})`;
    if (clock.current) clock.current.textContent = `${mmss(time)} / ${mmss(d)}`;
  }, []);

  // the element follows the sound state (volume and mute are properties of the element, not attributes)
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted || volume === 0;
  }, [volume, muted, index]);

  // a new video: load and play; if the browser refuses sound, play it muted
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    setDur(cur.dur);
    paint(0, cur.dur);
    v.load();
    v.play().catch(() => {
      setMuted(true);
      v.muted = true;
      v.play().catch(() => {});
    });
  }, [index, cur.dur, paint]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const v = video.current;
      if (v) paint(v.currentTime, v.duration || cur.dur);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, paint, cur.dur]);

  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const go = (n: number) => onIndex((n + items.length) % items.length);

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
    v.currentTime = Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * v.duration;
    paint(v.currentTime, v.duration);
  };

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

  const level = muted ? 0 : volume;
  const VolIcon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={box}
      tabIndex={0}
      role="group"
      aria-label={`Видеоплеер: ${cur.title}. Пробел: пауза, M: звук, F: во весь экран, стрелки влево и вправо: перемотка, вверх и вниз: громкость`}
      onKeyDown={onKey}
      className={`relative overflow-hidden rounded-[16px] bg-black shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        cur.wide ? "aspect-video w-[min(92vw,960px)]" : "aspect-[9/16] h-[min(84svh,780px)] max-w-[92vw]"
      } ${fs ? "!h-full !w-full !max-w-none !rounded-none" : ""}`}
    >
      <video
        ref={video}
        key={cur.id}
        poster={asset(`/reviews/${cur.id}-poster.webp`)}
        playsInline
        preload="auto"
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
        onEnded={() => go(index + 1)}
        className="size-full cursor-pointer object-contain"
      >
        <source src={asset(`/reviews/${cur.id}.mp4`)} type="video/mp4" />
      </video>

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
      {waiting && <span aria-hidden className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />}

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-3 pt-12 pb-3 [background:linear-gradient(0deg,rgba(0,0,0,0.8),transparent)]">
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
          <button type="button" aria-label="Предыдущее видео" onClick={() => go(index - 1)} className="vp-btn">
            <SkipBack className="size-5" strokeWidth={2} />
          </button>
          <button type="button" aria-label={playing ? "Пауза" : "Играть"} onClick={toggle} className="vp-btn">
            {playing ? <Pause className="size-5" strokeWidth={2} /> : <Play className="size-5" strokeWidth={2} />}
          </button>
          <button type="button" aria-label="Следующее видео" onClick={() => go(index + 1)} className="vp-btn">
            <SkipForward className="size-5" strokeWidth={2} />
          </button>
          <span ref={clock} className="num ml-1 text-[14px] opacity-85">
            0:00 / {mmss(dur)}
          </span>
          <span className="flex-1" />
          <div className="flex items-center gap-1">
            <button type="button" aria-label={level === 0 ? "Включить звук" : "Выключить звук"} onClick={toggleMute} className="vp-btn">
              <VolIcon className="size-5" strokeWidth={2} />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              aria-label="Громкость"
              className="vp-range w-[72px] sm:w-[96px]"
              style={{ ["--lvl" as string]: `${level * 100}%` }}
            />
          </div>
          <button type="button" aria-label={fs ? "Выйти из полноэкранного режима" : "Во весь экран"} onClick={fullscreen} className="vp-btn">
            {fs ? <Minimize className="size-5" strokeWidth={2} /> : <Maximize className="size-5" strokeWidth={2} />}
          </button>
        </div>
      </div>
    </div>
  );
}
