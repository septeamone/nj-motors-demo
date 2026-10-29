import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const path = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function robots(): MetadataRoute.Robots {
  // mockup: closed to search engines (open with allow: "/" when the site goes live)
  return { rules: { userAgent: "*", disallow: "/" }, sitemap: `${base}${path}/sitemap.xml` };
}
