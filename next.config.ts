import type { NextConfig } from "next";

// On GitHub Pages the site lives under /<repository>, so the workflow sets this variable.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Fully static site: plain HTML/JS goes to ./out
  output: "export",
  images: { unoptimized: true },
  basePath,
  // /privacy/ and /terms/ become folders with index.html, so the links work on any static host
  trailingSlash: true,
};

export default nextConfig;
