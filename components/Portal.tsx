"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { asset } from "@/lib/asset";
import { play } from "@/lib/sound";

type Kind = "container" | "porthole" | "emblem";

/** Steel end of a shipping container: one door leaf, drawn with its ribs, two locking bars and their handles. */
function Door({ side }: { side: "l" | "r" }) {
  return (
    <svg viewBox="0 0 120 256" className="block size-full" style={side === "r" ? { transform: "scaleX(-1)" } : undefined} aria-hidden>
      <rect x="0" y="0" width="120" height="256" fill="#c9ad90" />
      {Array.from({ length: 7 }, (_, k) => (
        <rect key={k} x={8 + k * 16} y="10" width="8" height="236" fill="#b89a7c" />
      ))}
      <rect x="0" y="0" width="120" height="256" fill="none" stroke="#040c14" strokeOpacity="0.55" strokeWidth="3" />
      {[30, 82].map((x) => (
        <g key={x}>
          <rect x={x} y="6" width="6" height="244" rx="3" fill="#040c14" fillOpacity="0.78" />
          <rect x={x - 6} y="120" width="18" height="12" rx="3" fill="#040c14" fillOpacity="0.85" />
          <rect x={x + 8} y="124" width="26" height="5" rx="2.5" fill="#040c14" fillOpacity="0.85" />
        </g>
      ))}
    </svg>
  );
}

/** The ring of a ship's porthole: a thick steel frame with its bolts and a glint on the glass. */
function PortholeRing() {
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 size-full overflow-visible" aria-hidden>
      <circle cx="100" cy="100" r="88" fill="none" stroke="#1a2c3c" strokeWidth="26" />
      <circle cx="100" cy="100" r="99" fill="none" stroke="#040c14" strokeWidth="3" />
      <circle cx="100" cy="100" r="75" fill="none" stroke="#040c14" strokeWidth="3" />
      {Array.from({ length: 10 }, (_, k) => {
        const a = (k / 10) * Math.PI * 2;
        return <circle key={k} cx={100 + Math.cos(a) * 88} cy={100 + Math.sin(a) * 88} r="4.2" fill="#dcc4ac" />;
      })}
      <path d="M 52 66 A 60 60 0 0 1 96 40" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/** What is seen through the opening: the next room, which the camera then flies into. */
function View({ kind, fade }: { kind: Kind; fade: MotionValue<number> }) {
  if (kind === "container")
    return (
      <motion.div style={{ opacity: fade }} className="absolute inset-0 bg-[#05090d]">
        {/* the light at the far end of the box and the floor the car stands on */}
        <span className="absolute inset-x-[18%] top-[16%] h-[3%] rounded-full bg-[#f3e8d6] opacity-70 blur-[6px]" />
        <span className="absolute inset-x-0 bottom-0 h-[30%] bg-[#0c1620]" />
        <Image src={asset("/cars/palisade.webp")} alt="" width={1400} height={775} className="absolute bottom-[16%] left-1/2 w-[86%] -translate-x-1/2" />
      </motion.div>
    );
  if (kind === "porthole")
    return (
      <motion.div style={{ opacity: fade }} className="absolute inset-0">
        <Image src={asset("/photos/hero-ship.webp")} alt="" fill sizes="70vw" className="object-cover object-[46%_64%]" />
      </motion.div>
    );
  return (
    <motion.div style={{ opacity: fade }} className="absolute inset-0 grid place-items-center">
      <Image src={asset("/brand/nj-car.webp")} alt="" width={1783} height={535} className="w-[74%]" />
    </motion.div>
  );
}

/**
 * A doorway between two sections: the visitor goes into the site instead of down it. The section pins, an object
 * from the journey (the container the car travels in, the porthole of the ship, the ring of the emblem) opens in
 * the middle of the screen, and the camera flies through it into the colour of the next section.
 */
export function Portal({ kind, from, to }: { kind: Kind; from: string; to: string }) {
  const box = useRef<HTMLDivElement>(null);
  const calm = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: box, offset: ["start start", "end end"] });
  // The track is the pinned screen plus 1.5 screens of scroll, and the next section is pulled up over its last screen
  // (margin -100svh), so it rises over the finished portal with no empty screen between. The flight takes the first
  // third (0.5 screen); the next section starts rising exactly when the camera is through.
  const scale = useTransform(p, [0, 0.12, 0.25, 0.33], [1, 1.2, 4.2, 22]);
  const doorL = useTransform(p, [0.01, 0.13], [0, -104]);
  const doorR = useTransform(p, [0.01, 0.13], [0, 104]);
  const fade = useTransform(p, [0.26, 0.32], [1, 0]);
  const frameFade = useTransform(p, [0.3, 0.33], [1, 0]);
  // the container doors groan as they start to open
  const groaned = useRef(false);
  useMotionValueEvent(p, "change", (v) => {
    if (kind !== "container") return;
    if (v > 0.02 && !groaned.current) {
      groaned.current = true;
      play("doors");
    } else if (v <= 0) groaned.current = false;
  });
  if (calm) return null;

  const shape = kind === "container" ? "aspect-[240/256] w-[min(58vw,52svh)]" : "aspect-square w-[min(64vw,58svh)]";
  return (
    <div ref={box} aria-hidden className="relative mb-[-100svh] h-[250svh]" style={{ background: from }}>
      <div className="sticky top-0 h-svh overflow-hidden [perspective:1400px]">
        <motion.div style={{ scale }} className="absolute inset-0 grid place-items-center will-change-transform">
          <div className={`relative ${shape}`}>
            {/* the opening: the next section's colour, and the view into it */}
            <div className={`absolute overflow-hidden ${kind === "container" ? "inset-0" : kind === "porthole" ? "inset-[13%] rounded-full" : "inset-[14%] rounded-full"}`} style={{ background: to }}>
              <View kind={kind} fade={fade} />
            </div>

            {kind === "container" && (
              <motion.div style={{ opacity: frameFade }} className="absolute inset-0 [transform-style:preserve-3d]">
                <motion.div style={{ rotateY: doorL }} className="absolute inset-y-0 left-0 w-1/2 origin-left">
                  <Door side="l" />
                </motion.div>
                <motion.div style={{ rotateY: doorR }} className="absolute inset-y-0 right-0 w-1/2 origin-right">
                  <Door side="r" />
                  <span className="font-display absolute top-[9%] left-[12%] text-[clamp(12px,1.6vw,22px)] leading-none tracking-[0.04em] text-[#040c14] opacity-80">NJ MOTORS</span>
                  <Image src={asset("/brand/nj-seal.webp")} alt="" width={576} height={480} className="absolute bottom-[12%] left-[16%] w-[44%] opacity-85 mix-blend-multiply" />
                </motion.div>
                {/* the steel frame around the doors */}
                <span className="pointer-events-none absolute -inset-[3%] rounded-[2px] border-[clamp(8px,1.6vw,18px)] border-[#2a2018]" />
              </motion.div>
            )}
            {kind === "porthole" && (
              <motion.div style={{ opacity: frameFade }} className="absolute inset-0">
                <PortholeRing />
              </motion.div>
            )}
            {kind === "emblem" && (
              <motion.div style={{ opacity: frameFade }} className="absolute inset-0">
                <Image
                  src={asset("/brand/nj-roundel-1024.webp")}
                  alt=""
                  fill
                  sizes="70vw"
                  className="object-contain [mask-image:radial-gradient(circle_closest-side,transparent_71%,#000_72%,#000_98.5%,transparent_99.5%)]"
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
