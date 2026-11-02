import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const path = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/privacy/", "/terms/"];
  return pages.map((p) => ({ url: `${base}${path}${p || "/"}` }));
}
