import { useId } from "react";

/**
 * Contact brands: their own colour and glyph. The VK and Telegram glyphs are from Simple Icons (CC0; VK checked against
 * vk.com: the blue #0077FF square with the white letters). The MAX glyph
 * and its gradient are the official ones from max.ru (favicon.svg: the ring-shaped bubble, cyan #00EAFF through blue
 * #3C22FE to violet #8419FF). TikTok: the note from Simple Icons drawn as on tiktok.com's favicon (white, with a cyan #25F4EE
 * plate up-left and a pink #FE2C55 plate down-right, on black). The call is the usual green.
 */
export type Brand = "call" | "vk" | "telegram" | "max" | "tiktok";

export const BRAND: Record<Brand, { label: string; color: string; fill: string }> = {
  call: { label: "Звонок", color: "#1fae54", fill: "#1fae54" },
  vk: { label: "ВКонтакте", color: "#0077FF", fill: "#0077FF" },
  telegram: { label: "Telegram", color: "#26A5E4", fill: "#26A5E4" },
  max: { label: "MAX", color: "#3C22FE", fill: "linear-gradient(45deg, #00EAFF 0%, #3C22FE 55%, #8419FF 100%)" },
  tiktok: { label: "TikTok", color: "#FE2C55", fill: "#000000" },
};

const PATHS: Record<Exclude<Brand, "call" | "max">, string> = {
  tiktok: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  vk: "m9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009ZM6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z",
  telegram: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
};

/** The official MAX mark (max.ru), 100 × 100: the bubble with its round opening. */
const MAX_PATH = "M50.7571 0.261719C78.2929 0.261719 99.8857 22.5974 99.8857 50.1474C99.8857 77.6974 77.6071 99.4903 51.0214 99.4903C41.5857 99.4903 37.0143 98.1617 29.65 92.9474C29.1429 92.5903 28.45 92.6831 28.0214 93.1403C22.3571 99.1831 7.85 103.426 7.18571 95.176C7.18571 80.7903 0 71.4474 0 49.876C0 21.5546 23.2214 0.261719 50.7571 0.261719ZM51.5286 24.8117C38.4643 24.126 28.2643 33.1974 26.0143 47.3831C24.15 59.1332 27.45 73.4546 30.2786 74.176C31.4786 74.4832 34.3571 72.276 36.4571 70.2974C36.85 69.926 37.45 69.8617 37.9071 70.1474C41.1786 72.1474 44.8786 73.6474 48.9571 73.8617C62.3714 74.5617 74.2571 64.0617 74.9643 50.6474C75.6643 37.2331 64.9429 25.5046 51.5286 24.8046V24.8117Z";

/**
 * The glyph in currentColor (24 × 24). `tone="brand"` paints the MAX mark in its own gradient (the others take their
 * colour from currentColor anyway).
 */
export function BrandIcon({ brand, className = "size-5", tone = "current" }: { brand: Brand; className?: string; tone?: "current" | "brand" }) {
  const gid = useId();
  if (brand === "call")
    return (
      <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z" />
      </svg>
    );
  if (brand === "max")
    return (
      <svg aria-hidden viewBox="0 0 100 100" className={className}>
        {tone === "brand" && (
          <defs>
            <linearGradient id={gid} x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#00EAFF" />
              <stop offset="0.55" stopColor="#3C22FE" />
              <stop offset="1" stopColor="#8419FF" />
            </linearGradient>
          </defs>
        )}
        <path d={MAX_PATH} fillRule="evenodd" fill={tone === "brand" ? `url(#${gid})` : "currentColor"} />
      </svg>
    );
  if (brand === "tiktok" && tone === "brand")
    return (
      <svg aria-hidden viewBox="-1 -1 26 26" className={className}>
        <path d={PATHS.tiktok} fill="#25F4EE" transform="translate(-0.9 -0.9)" />
        <path d={PATHS.tiktok} fill="#FE2C55" transform="translate(0.9 0.9)" />
        <path d={PATHS.tiktok} fill="#ffffff" />
      </svg>
    );
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d={PATHS[brand]} />
    </svg>
  );
}
