"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { COUNTRIES } from "@/lib/data";
import { Bolt } from "./ui";

const KR = COUNTRIES[0];
/** Brands running endlessly, ending with "any other brand": the choice is wider than the list. */
function BrandRow({ brands }: { brands: string[] }) {
  const set = [...brands, ...brands, ...brands];
  const row = (k: string) => (
    <div key={k} className="flex shrink-0 items-center gap-[0.55em] pr-[0.55em]" aria-hidden>
      {set.map((b, i) => (
        <span key={`${b}-${i}`} className="flex items-center gap-[0.55em]">
          <span className="text-white/90">{b}</span>
          <Bolt size={22} className="text-[#ff5a4d]" />
        </span>
      ))}
      <span className="text-[#ff5a4d]">и любой другой бренд</span>
      <Bolt size={22} className="text-[#ff5a4d]" />
    </div>
  );
  return (
    <div role="img" aria-label={`Бренды: ${brands.join(", ")} и любой другой`} className="overflow-hidden whitespace-nowrap [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="display flex w-max text-[clamp(30px,4.2vw,64px)] !leading-[1.1]" style={{ fontFamily: "var(--font-russo)", fontWeight: 400, animation: "marquee 60s linear infinite" }}>
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}

/**
 * What the opening halves of the hero reveal: Korea, seen for a moment and gone. Only the picture,
 * the outlined word and the running brand line. Lives inside the hero stage, behind the two halves.
 */
export function Markets() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const photoY = useTransform(scrollY, [0, 700], ["-4%", "6%"]);
  const photoS = useTransform(scrollY, [0, 700], [1.14, 1.04]);
  const wordX = useTransform(scrollY, [0, 700], ["12vw", "-20vw"]);
  // seen while the halves part (scroll 0-600), gone right after, so it never sits on top of the next block
  const fade = useTransform(scrollY, [300, 500], [1, 0]);

  // with reduced motion nothing fades it out, so the stylesheet hides it (.korea-reveal in globals.css)
  return (
    <motion.div aria-hidden style={reduce ? undefined : { opacity: fade }} className="korea-reveal pointer-events-none absolute inset-0 overflow-hidden bg-[#05090d] text-white">
      <motion.div style={reduce ? undefined : { y: photoY, scale: photoS }} className="absolute -inset-y-[8%] inset-x-0">
        <Image fetchPriority="low" src={asset(KR.photo)} alt="" fill sizes="100vw" className="duotone object-cover" />
        <div className="duotone-tint absolute inset-0" />
      </motion.div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,9,13,0.5),transparent_35%,rgba(5,9,13,0.85))]" />
      <motion.span
        style={reduce ? undefined : { x: wordX }}
        className="display ![font-family:var(--font-russo)] !font-normal absolute top-[16%] right-0 !leading-none whitespace-nowrap text-[clamp(200px,34vw,560px)] !text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,0.45)]"
      >
        Korea
      </motion.span>
      <div className="absolute inset-x-0 bottom-[8svh]">
        <BrandRow brands={KR.brands} />
      </div>
    </motion.div>
  );
}
