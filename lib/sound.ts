/**
 * The site's sounds, made in the browser with Web Audio (no files, nothing loaded from outside). Off until the
 * visitor turns them on with the button in the header; the choice is remembered on this device.
 */
type Cue = "engine" | "stamp" | "page";

const KEY = "nj-sound";
let ctx: AudioContext | null = null;
let on = false;

export const soundOn = () => on;

export function loadSound() {
  try {
    on = localStorage.getItem(KEY) === "1";
  } catch {}
  return on;
}

export function setSound(v: boolean) {
  on = v;
  try {
    localStorage.setItem(KEY, v ? "1" : "0");
  } catch {}
  if (v) play("engine");
}

function audio() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(a: AudioContext, seconds: number) {
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * seconds), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  return src;
}

function env(a: AudioContext, peak: number, attack: number, release: number, at = a.currentTime) {
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + release);
  return g;
}

export function play(cue: Cue) {
  if (!on || typeof window === "undefined") return;
  const a = audio();
  const t = a.currentTime;
  if (cue === "stamp") {
    // a rubber stamp hitting paper on a desk: a low thump and a short slap
    const o = a.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    o.connect(env(a, 0.55, 0.004, 0.16)).connect(a.destination);
    o.start(t);
    o.stop(t + 0.2);
    const n = noise(a, 0.08);
    const f = a.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 1800;
    n.connect(f).connect(env(a, 0.25, 0.002, 0.05)).connect(a.destination);
    n.start(t);
  } else if (cue === "page") {
    // a sheet of paper turning: a soft band of noise sweeping up
    const n = noise(a, 0.35);
    const f = a.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 0.8;
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(4200, t + 0.28);
    n.connect(f).connect(env(a, 0.12, 0.06, 0.24)).connect(a.destination);
    n.start(t);
  } else {
    // the engine starting: the starter, then the idle settling down
    const o = a.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(38, t);
    o.frequency.linearRampToValueAtTime(92, t + 0.35);
    o.frequency.exponentialRampToValueAtTime(46, t + 1.3);
    const f = a.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(380, t);
    f.frequency.linearRampToValueAtTime(900, t + 0.35);
    f.frequency.exponentialRampToValueAtTime(260, t + 1.4);
    const lfo = a.createOscillator();
    const depth = a.createGain();
    lfo.frequency.value = 13;
    depth.gain.value = 9;
    lfo.connect(depth).connect(o.frequency);
    o.connect(f).connect(env(a, 0.32, 0.12, 1.4)).connect(a.destination);
    o.start(t);
    lfo.start(t);
    o.stop(t + 1.6);
    lfo.stop(t + 1.6);
  }
}
