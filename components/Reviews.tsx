"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { asset } from "@/lib/asset";
import CircularCarousel from "./CircularCarousel";
import { ReviewPlayer, type ReviewVideo } from "./ReviewPlayer";
import { Reveal, SectionHead } from "./ui";

// Videos compressed from the owner's originals (public/reviews). The first one is Andrey himself, it opens the row.
const VIDEOS: readonly ReviewVideo[] = [
  { id: "andrey", title: "Андрей, NJ Motors", sub: "Начинает Андрей", wide: false, dur: 98 },
  { id: "review-1", title: "Отзыв клиента", sub: "Видео от клиента", wide: false, dur: 82 },
  { id: "review-2", title: "Отзыв клиента", sub: "Видео от клиента", wide: false, dur: 102 },
  { id: "review-3", title: "Отзыв клиента", sub: "Видео от клиента", wide: true, dur: 30 },
];

// Photos of cars sent by the owner (public/gallery): a cropped card for the carousel and the whole frame for the big view.
const PHOTOS = [
  { n: 1, title: "Land Rover Discovery", alt: "Белый Land Rover Discovery, вид спереди" },
  { n: 2, title: "BMW", alt: "Чёрный BMW, вид спереди" },
  { n: 3, title: "Kia", alt: "Белая Kia под навесом, вид спереди" },
  { n: 4, title: "Volkswagen", alt: "Белый Volkswagen, вид спереди" },
  { n: 5, title: "Chevrolet", alt: "Белый Chevrolet на площадке" },
  { n: 6, title: "Kia", alt: "Белая Kia на площадке" },
  { n: 7, title: "SsangYong", alt: "Белый SsangYong на парковке" },
].map((p) => ({ ...p, src: asset(`/gallery/car-${p.n}.webp`), full: asset(`/gallery/car-${p.n}-full.webp`), subtitle: "Фото автомобиля" }));

const VIDEO_CARDS = VIDEOS.map((v) => ({ src: asset(`/reviews/${v.id}-card.webp`), title: v.title, alt: v.title, subtitle: v.sub }));
const PHOTO_CARDS = PHOTOS.map((p) => ({ src: p.src, title: p.title, alt: p.alt, subtitle: p.subtitle }));

type Open = { kind: "video" | "photo"; i: number } | null;

/**
 * Reviews in one compact block: two carousels side by side (video reviews and photos of cars).
 * Tapping a card opens it large: the photo in full, the video in the player with sound.
 */
export function Reviews() {
  const [open, setOpen] = useState<Open>(null);
  const photo = open?.kind === "photo" ? PHOTOS[open.i] : null;
  const wrapPhoto = (n: number) => setOpen({ kind: "photo", i: (n + PHOTOS.length) % PHOTOS.length });

  return (
    <section id="reviews" className="cut-top border-t border-line pb-10 lg:pb-14" style={{ ["--cut" as string]: "3.5rem" }}>
      <div className="mx-auto max-w-[var(--page)] px-5 sm:px-8 lg:px-12 xl:px-20">
        <SectionHead
          eyebrow="Отзывы" n="04" shift={3}
          title="Что говорят клиенты"
          lead="Видео клиентов и фото автомобилей. Листайте и нажимайте, чтобы открыть."
        />

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-2 lg:gap-8">
          <Reveal delay={0.05} className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p className="font-display text-[22px] tracking-wide uppercase">Видео</p>
              <p className="text-[14px] text-ink-3">{VIDEOS.length} видео, со звуком</p>
            </div>
            <div className="h-[270px] sm:h-[300px]">
              <CircularCarousel
                items={VIDEO_CARDS}
                preset="orbit"
                tilt={-9}
                cardWidth={132}
                aspectRatio={0.6}
                gap={22}
                cornerRadius={10}
                speed={9}
                depthFade={0.5}
                fadeColor="#040c14"
                intro="rise"
                label="Видео отзывы"
                onItemClick={(_, i) => setOpen({ kind: "video", i })}
              />
            </div>
          </Reveal>

          <Reveal delay={0.1} className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p className="font-display text-[22px] tracking-wide uppercase">Фото</p>
              <p className="text-[14px] text-ink-3">{PHOTOS.length} автомобилей</p>
            </div>
            <div className="h-[270px] sm:h-[300px]">
              <CircularCarousel
                items={PHOTO_CARDS}
                preset="cylinder"
                cardWidth={200}
                aspectRatio={4 / 3}
                gap={14}
                cornerRadius={8}
                speed={-8}
                depthFade={0.6}
                fadeColor="#040c14"
                intro="assemble"
                label="Фото автомобилей"
                onItemClick={(_, i) => setOpen({ kind: "photo", i })}
              />
            </div>
          </Reveal>
        </div>
      </div>

      <Dialog.Root open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-[rgba(4,12,20,0.88)] backdrop-blur-sm" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-[101] grid place-items-center p-3 outline-none sm:p-6"
            onClick={(e) => e.target === e.currentTarget && setOpen(null)}
          >
            <Dialog.Title className="sr-only">{open?.kind === "video" ? VIDEOS[open.i].title : photo?.title}</Dialog.Title>
            {open?.kind === "video" && <ReviewPlayer items={VIDEOS} index={open.i} onIndex={(i) => setOpen({ kind: "video", i })} />}
            {photo && open && (
              <figure className="relative flex max-h-full max-w-full flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.full} alt={photo.alt} className="max-h-[80svh] max-w-[94vw] rounded-[10px] object-contain shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]" />
                <figcaption className="flex items-center gap-4 text-white">
                  <button type="button" aria-label="Предыдущее фото" onClick={() => wrapPhoto(open.i - 1)} className="vp-btn">
                    <ChevronLeft className="size-6" strokeWidth={2} />
                  </button>
                  <span className="text-center">
                    <span className="font-display block text-[20px] tracking-wide uppercase">{photo.title}</span>
                    <span className="num text-[14px] opacity-75">
                      {open.i + 1} / {PHOTOS.length}
                    </span>
                  </span>
                  <button type="button" aria-label="Следующее фото" onClick={() => wrapPhoto(open.i + 1)} className="vp-btn">
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
