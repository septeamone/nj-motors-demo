"use client";

import { useEffect, useState } from "react";
import { DotField } from "./DotField";

/** The page's dot-field backdrop, inked from the site palette: kraft dots with a red glow under the cursor, ink dots on the light theme. */
export function Backdrop() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setLight(root.dataset.theme === "light");
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  return (
    <DotField
      pattern="hex"
      dotRadius={1.25}
      dotSpacing={15}
      gradientFrom={light ? "#040c14" : "#dcc4ac"}
      gradientTo={light ? "#5c5448" : "#a99480"}
      gradientAngle={160}
      glowColor={light ? "#c70407" : "#d40404"}
      glowRadius={140}
      glowIntensity={0.75}
      cursorRadius={210}
      bulgeStrength={0.5}
      baseOpacity={light ? 0.2 : 0.3}
      lightMode={light}
      intro={false}
      maxDevicePixelRatio={1.5}
    />
  );
}
