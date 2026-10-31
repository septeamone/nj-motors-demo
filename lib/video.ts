"use client";

import { useEffect, useState } from "react";
import { slowNet } from "./net";

/**
 * Every video in public/reviews has a lighter copy (name-sd.mp4, about 1 Mbit/s instead of 2): it is used on a slow
 * or metered connection (lib/net). Until the page has checked (first render), there is no source at all, so nothing
 * is downloaded twice.
 */
export function useVideoSrc() {
  const [slow, setSlow] = useState<boolean | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlow(slowNet());
  }, []);
  return (path: string) => (slow === null ? undefined : slow ? path.replace(/\.mp4$/, "-sd.mp4") : path);
}

/** True once the element is within a couple of screens: video posters wait for it, so the first screen loads first. */
export function useNear(ref: React.RefObject<Element | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: "200% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return near;
}
