"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor, RoundedBox, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Units: the phone is 1 wide. Proportions of a modern slab phone: thickness ≈ 11% of the width.
const W = 1;
const D = 0.115;
const BEV = 0.036; // bevel of the frame edge
const R = 0.17; // corner radius
const SCREEN_W = 0.9;
const SCREEN_H = SCREEN_W / (864 / 1920); // the screenshots are 864×1920, so no crop
const H = SCREEN_H + 0.1;
const FRONT = D / 2;
const MAX_TURN = 62; // degrees either way; past ~65 the back would show

// Anodised deep red, close to the NJ Motors red but darker and satin.
const FRAME = "#6a1c2a";
const PLATE = "#74212f";
const PANEL = "#7d2a36";
const RING = "#8a3140";

/** A rounded rectangle whose top and bottom corners have their own radii. */
function capRect(w: number, h: number, rt: number, rb: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + rb, y);
  s.lineTo(x + w - rb, y);
  s.absarc(x + w - rb, y + rb, rb, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - rt);
  s.absarc(x + w - rt, y + h - rt, rt, 0, Math.PI / 2, false);
  s.lineTo(x + rt, y + h);
  s.absarc(x + rt, y + h - rt, rt, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + rb);
  s.absarc(x + rb, y + rb, rb, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** A flat rounded rectangle with 0–1 UVs, so a texture fills it exactly. */
function plane(w: number, h: number, r: number) {
  const g = new THREE.ShapeGeometry(capRect(w, h, r, r), 48);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  return g;
}

function extrude(w: number, h: number, rt: number, rb: number, depth: number, bevel: number, segments: number) {
  const g = new THREE.ExtrudeGeometry(capRect(w - 2 * bevel, h - 2 * bevel, Math.max(0.001, rt - bevel), Math.max(0.001, rb - bevel)), {
    depth: depth - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: segments,
    curveSegments: 56,
  });
  g.center();
  return toCreasedNormals(g, 0.7); // smooth bevel, hard where the angle is sharp
}

/** Fine sand-blasted grain, used as a bump map so metal and glass read as matte instead of plastic. */
function grain(size: number, base: number, amp: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = base + (Math.random() - 0.5) * amp;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Soft dark gradient for contact shadows: radial or a one-sided linear fade. */
function shade(kind: "radial" | "edge") {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = kind === "radial" ? ctx.createRadialGradient(64, 64, 18, 64, 64, 64) : ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, "rgba(0,0,0,0.62)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

/** The back panel's relief and tone: grain, a soft light falloff, the NJ Motors emblem pressed in tone on tone. */
function panelMaps(logo: HTMLImageElement, pw: number, ph: number) {
  const w = 900;
  const h = Math.round((900 * ph) / pw);
  const e = w * 0.46;
  const ex = (w - e) / 2;
  const ey = (h - e) / 2;

  const bump = document.createElement("canvas");
  bump.width = w;
  bump.height = h;
  const bc = bump.getContext("2d")!;
  const img = bc.createImageData(w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 122 + Math.random() * 16;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  bc.putImageData(img, 0, 0);
  bc.save();
  bc.filter = "grayscale(1) contrast(1.1) blur(1.2px)";
  bc.globalAlpha = 0.7;
  bc.drawImage(logo, ex, ey, e, e);
  bc.restore();

  const tone = document.createElement("canvas");
  tone.width = w;
  tone.height = h;
  const tc = tone.getContext("2d")!;
  const fall = tc.createLinearGradient(0, 0, w * 0.5, h);
  fall.addColorStop(0, "#ffffff");
  fall.addColorStop(0.55, "#e9dede");
  fall.addColorStop(1, "#c9b5b8");
  tc.fillStyle = fall;
  tc.fillRect(0, 0, w, h);
  tc.save();
  tc.globalCompositeOperation = "multiply";
  tc.globalAlpha = 0.26;
  tc.filter = "grayscale(0.7) blur(0.8px)";
  tc.drawImage(logo, ex, ey, e, e);
  tc.restore();

  const bumpTex = new THREE.CanvasTexture(bump);
  bumpTex.anisotropy = 8;
  const mapTex = new THREE.CanvasTexture(tone);
  mapTex.colorSpace = THREE.SRGBColorSpace;
  mapTex.anisotropy = 8;
  return { bumpTex, mapTex };
}

type Props = {
  screens: string[];
  logo: string;
  active: number;
  run: boolean;
  calm: boolean;
  onReady: () => void;
};

const satin = { color: FRAME, metalness: 0.88, roughness: 0.38, clearcoat: 0.12, clearcoatRoughness: 0.5 } as const;

// back layout (viewer's side, +x to the viewer's right): a camera plateau flush with the top and sides, a frosted panel below
const FLAT_W = W - 2 * BEV; // the flat back, inside the bevel
const FLAT_H = H - 2 * BEV;
const PLATEAU_H = 0.68;
const PLATEAU_Y = FLAT_H / 2 - PLATEAU_H / 2;
const PLATEAU_TOP = 0.052; // how far the plateau stands off the back
const PANEL_W = 0.9;
const PANEL_TOP = PLATEAU_Y - PLATEAU_H / 2 - 0.04;
const PANEL_BOTTOM = -H / 2 + 0.05;
const PANEL_H = PANEL_TOP - PANEL_BOTTOM;
const PANEL_Y = (PANEL_TOP + PANEL_BOTTOM) / 2;

/** A camera lens: a chamfered metal ring around deep black coated glass with an inner barrel. */
function Lens({ x, y, ring, glow }: { x: number; y: number; ring: THREE.BufferGeometry; glow: THREE.Texture }) {
  return (
    <group position={[x, y, 0]}>
      {/* soft contact shadow on the plateau around the ring */}
      <mesh position={[0, 0, 0.0008]} renderOrder={3}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshBasicMaterial map={glow} transparent depthWrite={false} toneMapped={false} opacity={0.75} />
      </mesh>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh geometry={ring}>
          <meshPhysicalMaterial color={RING} metalness={0.92} roughness={0.26} clearcoat={0.4} clearcoatRoughness={0.25} envMapIntensity={1.6} />
        </mesh>
        <mesh position={[0, 0.026, 0]}>
          <cylinderGeometry args={[0.087, 0.087, 0.006, 72]} />
          <meshPhysicalMaterial color="#010103" roughness={0.05} metalness={0.1} clearcoat={1} envMapIntensity={0.18} />
        </mesh>
        <mesh position={[0, 0.0295, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.058, 0.0035, 14, 72]} />
          <meshPhysicalMaterial color="#2c3042" metalness={1} roughness={0.22} envMapIntensity={1.4} />
        </mesh>
        <mesh position={[0, 0.031, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.003, 56]} />
          <meshPhysicalMaterial color="#020206" roughness={0.03} clearcoat={1} envMapIntensity={0.15} />
        </mesh>
      </group>
    </group>
  );
}

function Phone({ screens, logo, active, calm, onReady }: Pick<Props, "screens" | "logo" | "active" | "calm" | "onReady">) {
  const group = useRef<THREE.Group>(null);
  const { gl } = useThree();
  const textures = useTexture([...screens, logo]);
  const shots = textures.slice(0, screens.length);
  const logoTex = textures[screens.length];
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const geo = useMemo(() => {
    // lens ring: lathe of a chamfered profile (radius, height)
    const prof = [
      [0.086, 0],
      [0.126, 0],
      [0.126, 0.024],
      [0.119, 0.035],
      [0.1, 0.035],
      [0.09, 0.028],
      [0.086, 0.022],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return {
      body: extrude(W, H, R, R, D, BEV, 16),
      bezel: plane(W - 0.07, H - 0.07, R - 0.035),
      screen: plane(SCREEN_W, SCREEN_H, 0.13),
      glass: plane(SCREEN_W, SCREEN_H, 0.13),
      backFace: plane(W - 0.07, H - 0.07, R - 0.035),
      island: plane(0.25, 0.062, 0.031),
      plateau: extrude(FLAT_W, PLATEAU_H, R - BEV, 0.13, PLATEAU_TOP + 0.01, 0.016, 12),
      panel: plane(PANEL_W, PANEL_H, 0.1),
      ring: new THREE.LatheGeometry(prof, 72),
      edgeShade: new THREE.PlaneGeometry(PANEL_W, 0.1),
    };
  }, []);

  const frameBump = useMemo(() => {
    const t = grain(512, 128, 50);
    t.repeat.set(2, 2);
    return t;
  }, []);
  const panel = useMemo(() => panelMaps(logoTex.image as HTMLImageElement, PANEL_W, PANEL_H), [logoTex]);
  const glow = useMemo(() => shade("radial"), []);
  const edge = useMemo(() => shade("edge"), []);

  // Phone only mounts once every texture has loaded (useTexture suspends), so after two painted frames the whole phone is on screen
  useEffect(() => {
    let a = requestAnimationFrame(() => {
      a = requestAnimationFrame(onReady);
    });
    return () => cancelAnimationFrame(a);
  }, [onReady]);

  // set up the textures ONCE: marking them dirty again re-uploads every 864×1920 image to the GPU (a 100-400 ms stall)
  const texKey = textures.map((t) => t.uuid).join();
  useEffect(() => {
    const max = gl.capabilities.getMaxAnisotropy();
    shots.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(16, max);
      t.needsUpdate = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, texKey]);

  // all the physics lives here: drag to spin (unbounded, with inertia), tip up/down, ease back to face the viewer
  const s = useRef({ drag: false, lastX: 0, lastY: 0, angY: -40, vel: 0, angX: 0, sway: 1, tx: 0, ty: 0, mx: 0, my: 0 });
  // the canvas element is ours to style (cursor) and the drag handlers write to it
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => {
    const el = gl.domElement;
    const st = s.current;
    const end = () => {
      st.drag = false;
      el.style.cursor = "grab";
    };
    const down = (e: PointerEvent) => {
      st.drag = true;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      st.vel = 0;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      st.tx = Math.max(-1, Math.min(1, (e.clientX / innerWidth - 0.5) * 2));
      st.ty = Math.max(-1, Math.min(1, (e.clientY / innerHeight - 0.5) * 2));
      if (!st.drag) return;
      if (e.buttons === 0) return end(); // the button was let go somewhere we did not hear about
      const dx = e.clientX - st.lastX;
      const dy = e.clientY - st.lastY;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      // the further it is turned the harder it pulls back, so the back panel never comes into view
      const pull = dx * st.angY > 0 ? Math.max(0, 1 - Math.abs(st.angY) / MAX_TURN) : 1;
      st.angY = Math.max(-MAX_TURN, Math.min(MAX_TURN, st.angY + dx * 0.7 * pull));
      st.vel = 0;
      st.angX = Math.max(-35, Math.min(35, st.angX + dy * 0.3));
    };
    // eslint-disable-next-line react-hooks/immutability
    el.style.cursor = "grab";
    el.addEventListener("pointerdown", down);
    el.addEventListener("lostpointercapture", end);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("blur", end);
    document.addEventListener("visibilitychange", end);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("lostpointercapture", end);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("blur", end);
      document.removeEventListener("visibilitychange", end);
    };
  }, [gl]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const st = s.current;
    const dt = Math.min(delta, 0.05) * 60;
    const t = state.clock.elapsedTime;

    if (!st.drag) {
      st.angY += (0 - st.angY) * (1 - Math.pow(1 - 0.05, dt)); // ease back to face the viewer
      st.angX += (0 - st.angX) * (1 - Math.pow(0.94, dt));
    }
    const idle = !st.drag && Math.abs(st.angY) < 3 && !calm ? 1 : 0;
    st.sway += (idle - st.sway) * (1 - Math.pow(0.96, dt));
    st.mx += (st.tx - st.mx) * 0.05;
    st.my += (st.ty - st.my) * 0.05;

    const ry = st.angY + st.sway * Math.sin(t * 0.7) * 12 + st.mx * 7;
    const rx = -3 + st.angX + st.sway * Math.sin(t * 0.5) * 3 - st.my * 5;
    g.rotation.set((rx * Math.PI) / 180, (ry * Math.PI) / 180, 0, "YXZ");
    g.position.y = calm ? 0 : Math.sin(t * 1.1) * 0.025;

    const k = 1 - Math.exp(-delta * 5);
    mats.current.forEach((m, i) => {
      if (m) m.opacity += ((i === active ? 1 : 0) - m.opacity) * k;
    });
  });

  const lensZ = PLATEAU_TOP;

  return (
    <group ref={group}>
      {/* frame: a satin anodised slab, bevelled and smooth-shaded so the light runs along its edge */}
      <mesh geometry={geo.body}>
        <meshPhysicalMaterial {...satin} bumpMap={frameBump} bumpScale={0.25} envMapIntensity={1.25} />
      </mesh>

      {/* front: black bezel, the screens (crossfading), glass with reflections, the island */}
      <mesh geometry={geo.bezel} position={[0, 0, FRONT + 0.0006]}>
        <meshPhysicalMaterial color="#030304" roughness={0.18} clearcoat={1} />
      </mesh>
      {shots.map((tex, k) => (
        <mesh key={k} geometry={geo.screen} position={[0, 0, FRONT + 0.0012 + k * 0.00002]}>
          <meshBasicMaterial
            ref={(m) => {
              mats.current[k] = m;
            }}
            map={tex}
            transparent
            opacity={k === 0 ? 1 : 0}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      ))}
      <mesh geometry={geo.glass} position={[0, 0, FRONT + 0.002]} renderOrder={5}>
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.05} roughness={0.04} metalness={0} clearcoat={1} depthWrite={false} envMapIntensity={1.8} />
      </mesh>
      <mesh geometry={geo.island} position={[0, SCREEN_H / 2 - 0.08, FRONT + 0.0025]}>
        <meshBasicMaterial color="#020203" toneMapped={false} />
      </mesh>

      {/* back (modelled as seen from behind, then turned round): matte plate under a camera plateau */}
      <group position={[0, 0, -FRONT - 0.0006]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={geo.backFace}>
          <meshPhysicalMaterial {...satin} bumpMap={frameBump} bumpScale={0.25} envMapIntensity={1.1} />
        </mesh>

        {/* frosted panel with the emblem pressed in, tone on tone */}
        <mesh geometry={geo.panel} position={[0, PANEL_Y, 0.004]}>
          <meshPhysicalMaterial
            color={PANEL}
            map={panel.mapTex}
            bumpMap={panel.bumpTex}
            bumpScale={1.3}
            metalness={0.12}
            roughness={0.66}
            clearcoat={0.08}
            clearcoatRoughness={0.6}
            sheen={0.35}
            sheenRoughness={0.6}
            sheenColor="#cf9aa2"
            envMapIntensity={0.5}
          />
        </mesh>
        {/* the plateau drops a soft shadow on the panel */}
        <mesh geometry={geo.edgeShade} position={[0, PLATEAU_Y - PLATEAU_H / 2 - 0.05, 0.0065]} rotation={[0, 0, Math.PI]} renderOrder={3}>
          <meshBasicMaterial map={edge} transparent depthWrite={false} toneMapped={false} opacity={0.55} />
        </mesh>

        {/* camera plateau: flush with the top and sides, big soft fillets */}
        <mesh geometry={geo.plateau} position={[0, PLATEAU_Y, (PLATEAU_TOP + 0.01) / 2 - 0.005]}>
          <meshPhysicalMaterial {...satin} color={PLATE} bumpMap={frameBump} bumpScale={0.2} envMapIntensity={1.3} />
        </mesh>
        <group position={[0, PLATEAU_Y, lensZ]}>
          <Lens x={-0.27} y={0.165} ring={geo.ring} glow={glow} />
          <Lens x={-0.27} y={-0.165} ring={geo.ring} glow={glow} />
          <Lens x={-0.005} y={0.0} ring={geo.ring} glow={glow} />

          {/* flash, microphone, lidar */}
          <group position={[0.33, 0.2, 0]}>
            <mesh position={[0, 0, 0.0008]} renderOrder={3}>
              <planeGeometry args={[0.24, 0.24]} />
              <meshBasicMaterial map={glow} transparent depthWrite={false} toneMapped={false} opacity={0.6} />
            </mesh>
            <group rotation={[Math.PI / 2, 0, 0]}>
              <mesh position={[0, 0.008, 0]}>
                <cylinderGeometry args={[0.056, 0.058, 0.016, 48]} />
                <meshPhysicalMaterial color={RING} metalness={0.92} roughness={0.26} envMapIntensity={1.5} />
              </mesh>
              <mesh position={[0, 0.0165, 0]}>
                <cylinderGeometry args={[0.044, 0.044, 0.003, 48]} />
                <meshStandardMaterial color="#f4ead9" emissive="#f4ead9" emissiveIntensity={0.28} roughness={0.55} />
              </mesh>
            </group>
          </group>
          <mesh position={[0.31, 0.045, 0.001]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.007, 0.007, 0.004, 16]} />
            <meshBasicMaterial color="#050507" />
          </mesh>
          <group position={[0.33, -0.12, 0]}>
            <mesh position={[0, 0, 0.0008]} renderOrder={3}>
              <planeGeometry args={[0.22, 0.22]} />
              <meshBasicMaterial map={glow} transparent depthWrite={false} toneMapped={false} opacity={0.55} />
            </mesh>
            <group rotation={[Math.PI / 2, 0, 0]}>
              <mesh position={[0, 0.005, 0]}>
                <cylinderGeometry args={[0.045, 0.047, 0.01, 48]} />
                <meshPhysicalMaterial color={RING} metalness={0.92} roughness={0.28} />
              </mesh>
              <mesh position={[0, 0.0105, 0]}>
                <cylinderGeometry args={[0.037, 0.037, 0.002, 48]} />
                <meshPhysicalMaterial color="#020203" roughness={0.1} clearcoat={1} envMapIntensity={0.6} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* side buttons */}
      {(
        [
          [-1, 0.62, 0.06],
          [-1, 0.42, 0.13],
          [-1, 0.2, 0.13],
          [1, 0.38, 0.2],
        ] as const
      ).map(([side, y, len], k) => (
        <RoundedBox key={k} args={[0.016, len, 0.036]} radius={0.006} smoothness={4} position={[side * (W / 2 + 0.001), y, 0]}>
          <meshPhysicalMaterial {...satin} roughness={0.34} />
        </RoundedBox>
      ))}
    </group>
  );
}

export default function PhoneScene({ screens, logo, active, run, calm, onReady }: Props) {
  // sharp on phone screens (DPR 2-3) as well; if frames drop, step down to 1.5, never to a blurry 1
  const [top] = useState(() => Math.min(typeof window === "undefined" ? 1.5 : window.devicePixelRatio || 1, 2));
  const [dpr, setDpr] = useState(top);
  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0, 6.6], fov: 22 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={run ? "always" : "demand"}
      style={{ touchAction: "pan-y" }}
      aria-label="3D-модель телефона с Telegram-каналом NJ Motors. Потяните, чтобы повернуть."
    >
      <PerformanceMonitor onDecline={() => setDpr(Math.min(top, 1.5))} onIncline={() => setDpr(top)} flipflops={3} />
      <ambientLight intensity={0.22} />
      <Suspense fallback={null}>
        <Phone screens={screens} logo={logo} active={active} calm={calm} onReady={onReady} />
        {/* a soft studio built from big light panels, so no environment file is downloaded */}
        <Environment resolution={512} frames={1}>
          <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[0, 6, 4]} scale={[14, 6, 1]} rotation-x={Math.PI / 2.4} />
          <Lightformer form="rect" intensity={2.2} color="#ffeedd" position={[-6, 1, 3]} scale={[3, 10, 1]} rotation-y={Math.PI / 2.5} />
          <Lightformer form="rect" intensity={2.2} color="#e3ecff" position={[6, 1, 3]} scale={[3, 10, 1]} rotation-y={-Math.PI / 2.5} />
          <Lightformer form="rect" intensity={0.9} color="#ffffff" position={[0, 0, 7]} scale={[14, 9, 1]} />
          <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[0, -5, -2]} scale={[12, 3, 1]} rotation-x={-Math.PI / 2.5} />
          <Lightformer form="rect" intensity={1.8} color="#ffffff" position={[0, 2, -7]} scale={[14, 7, 1]} />
          <Lightformer form="circle" intensity={2.4} color="#fff1e2" position={[3, 3, -5]} scale={4} />
        </Environment>
      </Suspense>
    </Canvas>
  );
}
