"use client";

import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { DUR, EASE } from "@/lib/motion";

/** Sticky call-to-action on phones: appears after the hero, hides at the form. */
export function MobileBar() {
  const [past, setPast] = useState(false);
  const [atForm, setAtForm] = useState(false);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const form = document.getElementById("contact");
    const io = new IntersectionObserver(([e]) => setAtForm(e.isIntersecting), { threshold: 0.15 });
    if (form) io.observe(form);
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <AnimatePresence>
      {past && !atForm && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ duration: DUR, ease: EASE }}
          className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-[480px] lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <a href="#contact" className="plate flex h-14 items-center justify-between rounded-full pr-1.5 pl-6 text-[16px] font-bold text-ink">
            Рассчитать стоимость
            <span className="grid size-11 place-items-center rounded-full bg-accent-fill text-on-accent">
              <ArrowUpRight className="size-5" strokeWidth={2} />
            </span>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
