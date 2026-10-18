import type { Metadata, Viewport } from "next";
import { Fira_Sans_Extra_Condensed, Onest, Russo_One } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

// Two faces only: a heavy poster face for headings and numbers, a Cyrillic-first text face for everything else.
const russo = Russo_One({
  variable: "--font-russo",
  subsets: ["latin", "cyrillic"],
  weight: "400",
});

// Headings: a tall, tight grotesque in the manner of road signs and press headlines. Russo One stays for numbers, stamps and buttons.
const head = Fira_Sans_Extra_Condensed({
  variable: "--font-head",
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800"],
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const TITLE = "NJ Motors — автомобили из Кореи под ключ";
const DESCRIPTION =
  "Подбираем, проверяем и привозим автомобили из Южной Кореи. Цену и каждый этап сделки вы видите до оплаты: договор, оплата по этапам, фото- и видеоотчёт.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "ru_RU",
    images: [{ url: "og.png", width: 1200, height: 630, alt: "NJ Motors — Cars from Korea" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["og.png"] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0e12" },
    { media: "(prefers-color-scheme: light)", color: "#efe5d3" },
  ],
};

// Sets the theme before first paint so the page never flashes the wrong colours.
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem('site-theme')==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      data-theme="dark"
      suppressHydrationWarning
      className={`${russo.variable} ${head.variable} ${onest.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
