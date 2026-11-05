// Turns any client video or photo into the files the site serves, and prints what to put in lib/reviews.ts.
//   node scripts/media.mjs video <input> <id>   -> public/reviews/<id>.mp4, <id>-sd.mp4, <id>-poster.webp, <id>-thumb.webp
//   node scripts/media.mjs photo <input> <id>   -> public/clients/<id>.webp (tile), <id>-full.webp (big view)
// Any format ffmpeg/sharp can read (MOV, MP4, HEVC, HDR from iPhones, JPG, PNG, HEIC, WebP). Nothing is ever scaled up,
// so a small original stays sharp; all metadata (GPS location, camera, dates) is stripped. Needs ffmpeg on PATH.
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const [kind, input, id] = process.argv.slice(2);
if (!["video", "photo"].includes(kind) || !input || !/^[a-z0-9-]+$/.test(id ?? "")) {
  console.error("usage: node scripts/media.mjs video|photo <input file> <id: latin letters, digits, dashes>");
  process.exit(1);
}

const run = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
const probe = (file) => JSON.parse(execFileSync("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file]).toString());
const kb = (f) => `${Math.round(statSync(f).size / 1024)} KB`;

if (kind === "video") {
  const out = "public/reviews";
  mkdirSync(out, { recursive: true });
  const info = probe(input);
  const v = info.streams.find((s) => s.codec_type === "video");
  const hasAudio = info.streams.some((s) => s.codec_type === "audio");
  const hdr = /smpte2084|arib-std-b67/.test(v.color_transfer ?? "");
  // ffmpeg turns rotated phone videos upright by itself; the box follows the upright shape
  const rot = Math.abs(Number(v.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? 0)) % 180 === 90;
  const [w0, h0] = rot ? [v.height, v.width] : [v.width, v.height];
  const upright = h0 >= w0;
  const tone = hdr ? "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv," : "";
  const fit = (long, short) => {
    const [bw, bh] = upright ? [short, long] : [long, short];
    return `${tone}scale='min(iw,${bw})':'min(ih,${bh})':force_original_aspect_ratio=decrease:force_divisible_by=2,format=yuv420p`;
  };
  // the same loudness for every client video, so the sound button never blasts or whispers
  const audio = (rate) => (hasAudio ? ["-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", rate, "-ar", "48000"] : ["-an"]);
  const common = ["-map_metadata", "-1", "-map_chapters", "-1", "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-fpsmax", "30", "-movflags", "+faststart"];

  run(["-i", input, "-vf", fit(1280, 720), ...common, "-crf", "23", "-maxrate", "2000k", "-bufsize", "4000k", ...audio("128k"), join(out, `${id}.mp4`)]);
  // the light copy is for slow mobile lines only: small enough to start fast there, still clean on a phone screen
  run(["-i", input, "-vf", fit(854, 480), ...common, "-crf", "27", "-maxrate", "550k", "-bufsize", "1100k", ...audio("64k"), join(out, `${id}-sd.mp4`)]);

  const done = probe(join(out, `${id}.mp4`));
  const dv = done.streams.find((s) => s.codec_type === "video");
  const dur = Number(done.format.duration);
  // poster: a frame a little in, past fades and black starts
  const at = Math.min(1.5, dur / 3).toFixed(2);
  const frame = execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-ss", at, "-i", join(out, `${id}.mp4`), "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"], { maxBuffer: 64 << 20 });
  await sharp(frame).webp({ quality: 78 }).toFile(join(out, `${id}-poster.webp`));
  // the cover in the reel of reviews: upright 9:16 (wide videos are cropped to their middle)
  await sharp(frame).resize({ width: 360, height: 640, fit: "cover" }).webp({ quality: 74 }).toFile(join(out, `${id}-thumb.webp`));

  for (const f of [`${id}.mp4`, `${id}-sd.mp4`, `${id}-poster.webp`, `${id}-thumb.webp`]) console.log(`  ${f}  ${kb(join(out, f))}`);
  console.log(JSON.stringify({ id, w: dv.width, h: dv.height, dur: Math.round(dur) }));
} else {
  const out = "public/clients";
  mkdirSync(out, { recursive: true });
  // .rotate() follows the camera's orientation flag; sharp drops all metadata unless asked to keep it
  const img = sharp(input, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  await img.clone().resize({ width: 720, withoutEnlargement: true }).webp({ quality: 80 }).toFile(join(out, `${id}.webp`));
  const full = await img.clone().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toFile(join(out, `${id}-full.webp`));
  for (const f of [`${id}.webp`, `${id}-full.webp`]) console.log(`  ${f}  ${kb(join(out, f))}`);
  console.log(JSON.stringify({ id, w: full.width, h: full.height, src: meta.format }));
}
