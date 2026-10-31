"use client";

import { useRef } from "react";
import { useNear, useVideoSrc } from "@/lib/video";

/** Andrey's video: the full or the light copy, depending on the connection; the poster loads when the block is near. */
export function OwnerVideo({ src, poster }: { src: string; poster?: string }) {
  const pick = useVideoSrc();
  const ref = useRef<HTMLVideoElement>(null);
  const near = useNear(ref);
  return (
    <video
      ref={ref}
      controls
      aria-label="Видео: Андрей, владелец NJ Motors, о своей работе"
      preload="none"
      playsInline
      poster={near ? poster : undefined}
      src={pick(src)}
      className="block aspect-[9/16] w-full rounded-[6px] bg-black object-cover"
    />
  );
}
