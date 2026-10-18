// next/image does not add the basePath to local files when images are unoptimized,
// and on GitHub Pages the site lives under /<repository>, so every public file goes through here.
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
