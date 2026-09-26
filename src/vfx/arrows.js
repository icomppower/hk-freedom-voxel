// Arrow VFX (render-only; reads the projectile pool src/combat/projectiles.js, its events and the hero's move state,
// never writes sim state). Built on the Huang Zhong fx primitives (src/chars/huangzhong/fx.js). Layers per stage:
//  · draw / charge (the frames before every shot, and aim mode): light gathers on the arrowhead (motes converging, a
//    small gold point core capped in screen pixels — never a disc at the aim lens), contracting charge rings on the charge
//    shots, a full-draw ping in aim mode
//  · release (arrow:fire): muzzle flash (hot core + warm halo), a tracer down the flight line, a forward spark cone,
//    muzzle smoke, forward star rays, string glint, an air-burst ring on the
//    arrow line (two on heavy shots), a spray line per arrow of a fan, dust kicked back from his feet + camera thump +
//    light flash on heavy shots, a flare column on the skyward rain volley
//  · flight: the voxel arrow + a bright core streak + a soft glow trail + fading afterimages; heavy arrows cut air rings
//    along their line; fire arrows burn (flickering head, flame trail, smoke); rain falls as long streaks; the Musou
//    giant carries a sun core, a double spiral aura, a flame shell, torn-up dust under its path and a light trail that
//    lingers after it explodes
//  · impact (arrow:hit): hit flash, spark burst along the flight, dust puff, a pierce streak out of the body, and the
//    spent arrow stays pinned in the soldier for ≈ 1.5 s; a ground bite = dust + chips + a small ring, the arrow stands
//    in the ground at its flight angle and sinks away
//  · rain (arrow:rain): a red-gold marker circle where it will fall, pulsing rings until it lands, a sky flare over it
//  · bursts (arrow:burst): small = flash, ring, dust (+ mini fireball and scorch when fire); big (C6) = explode(): 2-4
//    frame white core, red-orange fireball + flame tongues, fire-lit billows, a delayed dark stem + mushroom cap, ground
//    shock ring + shock front, dust skirt, sparks, embers, thrown earth, scorch decal, light, thump; the Musou giant's is
//    the same ×1.9 with a thin hot light pillar
//  · headshot: gold star burst, rings and flash over the officer's head
// Positions stay in sim space (y = height above ground); ground(x, z) is added when composing.
import * as THREE from 'three';
import { on } from '../core/events.js';
import { vrng } from '../core/rng.js';
import { vox } from '../hero/model.js';
import { heroPose } from '../hero/hero.js';
import { POSE_SIZE, spearWorld } from '../hero/rig.js';
import { AS, ARROW } from '../combat/projectiles.js';
import { ground } from '../world/map.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _d = new THREE.Vector3();
const FWD = new THREE.Vector3(0, 0, 1), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const B = (a, b, c) => ({ a, b, c });
// palette (linear HDR): Huang Zhong's gold / fire, off Zhao Yun's teal
// fire stays under the grade's per-channel shoulder (R ≈ 2.4, G ≤ 1): hotter values bleached to a pale yellow line
const CORE = [3.4, 2.7, 1.6], CORE_HEAVY = [3.8, 2.9, 1.5], CORE_FIRE = [2.4, 0.95, 0.18], GLOW = [0.55, 0.36, 0.15], GLOW_FIRE = [0.85, 0.28, 0.04];
const GOLD = [2.4, 1.6, 0.55], SPARK = [3.2, 2.1, 0.8], EARTH = [[0.2, 0.13, 0.09], [0.26, 0.18, 0.12], [0.16, 0.1, 0.07], [0.32, 0.23, 0.15]];
const DUSTC = [0.52, 0.4, 0.3], EARTH_DUST = [0.3, 0.22, 0.16];
const FB_HOT = [2.8, 1.6, 0.45], FB_BODY = [2.1, 0.66, 0.1], FB_EDGE = [1.0, 0.26, 0.05];   // fireball lumps (linear HDR)
const NPIN = 64, PIN_T = 1.5;                                  // pinned arrows stay 1.5 s (sink over the last 0.25)

export function createArrowView(scene, game, proj, fx) {
  const root = new THREE.Group();
  scene.add(root);
  const N = proj.N, c = game.crowd, hero = game.hero;
  // arrow: tip at the origin, shaft back along −Z (0.95 m): steel head, dark shaft, white-red fletching
  const geo = vox([B([0, 0, -43], [1, 1, 0], (x, y, z) => (z > -4 ? 0xd8dee6 : z < -38 ? 0xf2efe8 : 0x4a2c22)),
    B([-1, 0, -3], [2, 1, -1], 0xc0c8d2), B([-1, 0, -42], [2, 1, -37], 0xf2efe8), B([0, -1, -42], [1, 2, -37], 0xb3261e)], 0.022,
  { off: [-0.5, -0.5, 0], jitter: 0, ao: 0.1 });
  const arrows = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, flatShading: true }), N + NPIN);
  arrows.instanceMatrix.setUsage(THREE.DynamicDrawUsage); arrows.frustumCulled = false; arrows.castShadow = true;
  for (let i = 0; i < N + NPIN; i++) arrows.setMatrixAt(i, ZERO);
  root.add(arrows);

  const prev = new Int32Array(N), ringAcc = new Float32Array(N);
  // comet tail per arrow: a point that chases the head (≈ 70 ms lag), so the streak is as long as the flight is fast and
  // collapses onto the arrow when it stops; when an arrow vanishes into a body the tail finishes as a fading streak
  const tx = new Float32Array(N), ty = new Float32Array(N), tz = new Float32Array(N);
  // pinned arrows (spent in a soldier): soldier, offset from his feet, flight dir, age
  const pin = { e: new Int32Array(NPIN), ox: new Float32Array(NPIN), oy: new Float32Array(NPIN), oz: new Float32Array(NPIN),
    dx: new Float32Array(NPIN), dy: new Float32Array(NPIN), dz: new Float32Array(NPIN), t: new Float32Array(NPIN).fill(9), s: new Float32Array(NPIN), next: 0 };
  // the Musou giant: release point, last head, trail fade
  const giant = { on: false, x0: 0, y0: 0, z0: 0, x: 0, y: 0, z: 0, fade: 0, t: 0 };

  // ---------------------------------------------------------------- effect recipes
  function flash(x, y, z, s, k, life = 0.08) {
    fx.glow(x, y, z, s * 0.3, s * 0.8, life, 3.2 * k, 2.5 * k, 1.5 * k);
    fx.glow(x, y, z, s * 0.5, s * 1.2, life * 1.5, 0.4 * k, 0.24 * k, 0.08 * k);
  }
  function sparks(x, y, z, n, dx, dy, dz, cone, spd, len, col = SPARK, life = 0.2) {
    for (let k = 0; k < n; k++) {
      const vx = dx + vrng.range(-cone, cone), vy = dy + vrng.range(-cone, cone) + 0.25, vz = dz + vrng.range(-cone, cone), l = Math.hypot(vx, vy, vz) || 1, s = spd * vrng.range(0.5, 1);
      fx.spark(x, y, z, vx / l * s, vy / l * s, vz / l * s, len, vrng.range(0.025, 0.045), life * vrng.range(0.6, 1.2), col[0], col[1], col[2], 3, -12);
    }
  }
  function dust(x, y, z, n, spd, s0, s1, life, a0 = 0.5, col = DUSTC) {
    for (let k = 0; k < n; k++) {
      const a = vrng.range(0, 6.283), v = spd * vrng.range(0.4, 1);
      fx.smoke(x + Math.cos(a) * 0.2, y, z + Math.sin(a) * 0.2, s0, s1 * vrng.range(0.8, 1.2), life * vrng.range(0.8, 1.2),
        col[0] * vrng.range(0.9, 1.1), col[1], col[2], a0, Math.cos(a) * v, vrng.range(0.3, 1.2), Math.sin(a) * v, 3, 0.4);
    }
  }
  function embers(x, y, z, n, spd, up, life = 1) {
    for (let k = 0; k < n; k++) {
      const a = vrng.range(0, 6.283), s = spd * vrng.range(0.2, 1), w = vrng.range(0.7, 1.2);
      fx.glow(x, y, z, vrng.range(0.06, 0.12), 0.02, life * vrng.range(0.5, 1.2), 3 * w, 1.2 * w, 0.25 * w,
        Math.cos(a) * s, up * vrng.range(0.4, 1), Math.sin(a) * s, 1.2, -6, 0.5);
    }
  }
  /** Billowing fireball: n separate flame puffs (size ≤ ≈ 1.6 m whatever the radius, so it keeps its structure instead
   *  of stacking into a flat dome), white-yellow at the heart, deep orange-red outside, rising and slowing. */
  function fireball(x, y, z, r, n, life) {
    const R = Math.min(r, 5);
    for (let k = 0; k < n; k++) {
      // fx r1: flame lumps are "over"-blended HDR puffs in the smoke pool (lit from above like the dust), not additive
      // glows: additive fire on sunlit sand summed to a cream-white blob. Yellow-hot heart lumps, orange body, deep red
      // outer ones (R:G >= 2.5, so the grade keeps them orange instead of bleaching them to pale yellow)
      const a = vrng.range(0, 6.283), rr = R * 0.3 * Math.sqrt(vrng.next()), up = vrng.range(0.1, 1), q = vrng.next();
      const sp = R * vrng.range(0.9, 2.2), s = vrng.range(0.2, 0.34) * R;
      const c = q < 0.2 ? FB_HOT : q < 0.7 ? FB_BODY : FB_EDGE;
      fx.smoke(x + Math.cos(a) * rr, y + up * R * 0.25, z + Math.sin(a) * rr, s * 0.45, s * 1.1, life * vrng.range(0.55, 1.1),
        c[0], c[1], c[2], 0.95, Math.cos(a) * sp, up * sp * 0.8 + 1.5, Math.sin(a) * sp, 4, 3);
    }
    fx.glow(x, y + 0.5, z, R * 0.12, R * 0.3, Math.min(0.07, life * 0.2), 3.4, 3.0, 2.4);   // the white-hot heart: 2-4 frames
    fx.glow(x, y + 0.5, z, R * 0.3, R * 0.8, life * 0.5, 0.7, 0.22, 0.03);                  // orange bloom round the ball
  }
  /** Explosion (C6 fire arrow S = 1, the Musou giant S = 1.9): white core flash (2-4 frames) -> red-orange voxel fireball
   *  with flame tongues licking up -> fire-lit brown billows rolling out -> a dark smoke stem and a mushroom cap rolling in
   *  behind it (delayed, so the fire never sits in a muddy disc); bright ground shock ring + dust skirt racing out, a
   *  camera-facing shock front, thrown earth, sparks, embers, a scorch decal with cooling ember cracks, light, thump. */
  function explode(x, z, r, S) {
    fx.glow(x, 0.9 * S, z, 1.4 * S, 5 * S, 0.07, 3.2, 3.0, 2.6);                         // core flash
    fx.glow(x, 0.9 * S, z, 2 * S, 4.5 * S, 0.18, 0.9, 0.34, 0.05);                       // orange halo (brief: no wash)
    fireball(x, 0.5 * S, z, r * (S > 1 ? 0.75 : 0.9), Math.round(26 * S), 0.62 * Math.sqrt(S));
    for (let k = 0; k < 12 * S; k++) {                                                    // flame tongues
      const a = vrng.range(0, 6.283), d = vrng.range(0.2, 1.3) * S;
      fx.spark(x + Math.cos(a) * d, 0.4, z + Math.sin(a) * d, Math.cos(a) * 2, vrng.range(7, 13) * Math.sqrt(S), Math.sin(a) * 2,
        1.6 * S, 0.14 * S, vrng.range(0.28, 0.42), 2.2, 0.75, 0.1, 2.5, -6, 0.6);
    }
    for (let k = 0; k < 12 * S; k++) {                                                    // fire-lit billows rolling out
      const a = vrng.range(0, 6.283), v = vrng.range(2, 5) * S;
      fx.smoke(x + Math.cos(a) * 0.6 * S, vrng.range(0.3, 1.2) * S, z + Math.sin(a) * 0.6 * S, 0.8 * S, vrng.range(1.6, 2.4) * S, vrng.range(0.9, 1.3),
        0.36, 0.17, 0.07, 0.66, Math.cos(a) * v, vrng.range(0.4, 1.5), Math.sin(a) * v, 2.2, 0.3, vrng.range(0.05, 0.12));
    }
    // dark smoke stays in the gameplay frame (the camera looks down: a tall column rose out of the top of the screen
    // within 0.5 s): a low lumpy stem and a cap rolling out at ≈ 2.4 S m, dark grey-brown, lit from above by the shader
    for (let k = 0; k < 12 * S; k++) {                                                    // dark stem
      const a = vrng.range(0, 6.283), rr = vrng.range(0, 1.1) * S, g = vrng.range(0.07, 0.11);
      fx.smoke(x + Math.cos(a) * rr, vrng.range(0.4, 2.2) * S, z + Math.sin(a) * rr, 1.1 * S, vrng.range(2.0, 2.6) * S, vrng.range(2.4, 3.4),
        g * 1.2, g, g * 0.82, 0.86, Math.cos(a) * 0.8, vrng.range(0.5, 1.4) * S, Math.sin(a) * 0.8, 1.4, 0.4, vrng.range(0.12, 0.35));
    }
    for (let k = 0; k < 12 * S; k++) {                                                    // cap: rolls out over the stem
      const a = vrng.range(0, 6.283), v = vrng.range(1.2, 2.6) * S, g = vrng.range(0.08, 0.12);
      fx.smoke(x + Math.cos(a) * 0.8 * S, 2.4 * S + vrng.range(-0.3, 0.5) * S, z + Math.sin(a) * 0.8 * S, 1.3 * S, vrng.range(2.4, 3.2) * S, vrng.range(2.6, 3.6),
        g * 1.2, g, g * 0.82, 0.82, Math.cos(a) * v, vrng.range(0.3, 0.9) * Math.sqrt(S), Math.sin(a) * v, 1.3, 0.3, vrng.range(0.22, 0.45));
    }
    fx.groundRing(x, z, 0.5, r * 1.6, 0.03, 0.34, 2.6, 1.4, 0.4);                           // shock ring: fast, bright
    fx.groundRing(x, z, 0.3, r * 1.05, 0.06, 0.8, 1.0, 0.42, 0.1, 0.05);                    // slower hot inner ring
    fx.ring(x, 1.2 * S, z, 0, 0, 0, 0.6 * S, r * 0.9, 0.03, 0.18, 1.6, 1.2, 0.7, 0, 1);      // shock front (camera-facing)
    dust(x, 0.3, z, Math.round(12 * S), 7 * S, 0.6 * S, 1.6 * S, 1.0, 0.45, EARTH_DUST);      // dust skirt (dark earth, low)
    sparks(x, 0.8, z, Math.round(28 * S), 0, 0.6, 0, 1.1, 20 * Math.sqrt(S), 0.9, CORE_FIRE, 0.4);
    embers(x, 0.6, z, Math.round(40 * S), 6 * S, 11 * Math.sqrt(S), 1.6);
    thrown(x, z, Math.round(16 * S), 6 * S, 10 * Math.sqrt(S), 0.12, 0.28 * Math.sqrt(S));
    fx.scorch(x, z, r * 0.9, 9 * S, 1.4);
    fx.light(x, 1.8 * S, z, 6 * S, 0xff7020, 3.5);
    fx.kick(3.2 * Math.sqrt(S), 0.32 * Math.sqrt(S), 0.25, 1);
  }
  function smokeColumn(x, z, r, n, life) {
    for (let k = 0; k < n; k++) {
      const a = vrng.range(0, 6.283), rr = r * 0.4 * vrng.next(), g = vrng.range(0.07, 0.13);
      fx.smoke(x + Math.cos(a) * rr, vrng.range(0.3, 1.2) * r * 0.3, z + Math.sin(a) * rr, r * 0.3, r * vrng.range(0.7, 1.0), life * vrng.range(0.7, 1.2),
        g, g * 0.85, g * 0.75, 0.85, Math.cos(a) * r * 0.5, vrng.range(1.5, 3.5), Math.sin(a) * r * 0.5, 1.2, 1.5);
    }
  }
  function thrown(x, z, n, spd, up, s0, s1) {
    for (let k = 0; k < n; k++) {
      const a = vrng.range(0, 6.283), v = spd * vrng.range(0.4, 1), col = EARTH[k % EARTH.length];
      fx.debris(x + Math.cos(a) * 0.4, 0.3, z + Math.sin(a) * 0.4, Math.cos(a) * v, up * vrng.range(0.6, 1.1), Math.sin(a) * v, vrng.range(s0, s1), vrng.range(1.4, 2.4), col[0], col[1], col[2]);
    }
  }

  // ---------------------------------------------------------------- release
  on('arrow:fire', (e) => {
    const cp = Math.cos(e.pitch || 0), dx = Math.sin(e.yaw) * cp, dy = Math.sin(e.pitch || 0), dz = Math.cos(e.yaw) * cp;
    const k = e.big > 1 ? 2.6 : e.heavy || e.big ? 1.5 : 1, mu = e.move === 'musou' && e.big < 2;
    const x = e.x + dx * 0.25, y = e.y + dy * 0.25, z = e.z + dz * 0.25;
    flash(x, y, z, (mu ? 0.75 : 0.9) * k, e.fire ? 0.9 : 1, 0.1 + 0.02 * k);
    // fx r1: a tracer ripping down the flight line (reads the shot at gameplay speed), a forward spark cone, muzzle smoke
    const tl = (mu ? 4 : 6) * Math.min(k, 1.6), tc = e.fire ? CORE_FIRE : CORE;
    fx.streak(x + dx * tl, y + dy * tl, z + dz * tl, dx, dy, dz, tl, 0.14 * Math.min(k, 1.6), 0.15, tc[0] * 0.8, tc[1] * 0.8, tc[2] * 0.8, 0.5, dx * 30, dy * 30, dz * 30);
    sparks(x, y, z, mu ? 2 : Math.round(5 * k), dx, dy, dz, 0.3, 16, 0.45, e.fire ? CORE_FIRE : SPARK, 0.16);
    fx.smoke(x, y, z, 0.2, (mu ? 0.5 : 0.95) * Math.min(k, 1.6), 0.6, 0.5, 0.42, 0.34, mu ? 0.2 : 0.42, dx * 2.5, 0.4, dz * 2.5, 3, 0.4);
    // forward star rays
    const rays = mu ? 3 : Math.round(4 + 3 * k);
    for (let r = 0; r < rays; r++) {
      const ox = dx + vrng.range(-0.35, 0.35), oy = dy + vrng.range(-0.3, 0.3), oz = dz + vrng.range(-0.35, 0.35), l = Math.hypot(ox, oy, oz);
      const len = vrng.range(0.6, 1.4) * k;
      fx.streak(x + ox / l * len, y + oy / l * len, z + oz / l * len, ox / l, oy / l, oz / l, len, 0.05 * k, 0.07, 3, 2.3, 1.2, 0.8);
    }
    // string glint: a vertical flick of light at the bow
    if (!mu) fx.streak(e.x, e.y + 0.62, e.z, 0, 1, 0, 1.24, 0.035, 0.07, 2.6, 2.6, 2.2, 0.2);
    // air-burst ring on the arrow line (two on heavy shots)
    fx.ring(x + dx * 1.2, y + dy * 1.2, z + dz * 1.2, dx, dy, dz, 0.1, Math.min(0.9, 0.45 * k), 0.05, 0.14, 1.5, 1.25, 0.85);
    if (k > 1) fx.ring(x + dx * 3.2, y + dy * 3.2, z + dz * 3.2, dx, dy, dz, 0.15, Math.min(1.2, 0.7 * k), 0.045, 0.2, 1.3, 1.05, 0.7, 0.03);
    // fan: a spray line along each arrow so the spread reads at a glance
    if (e.n > 1 && e.spread > 0) {
      for (let a = 0; a < e.n; a++) {
        const yaw = e.yaw + (a / (e.n - 1) - 0.5) * e.spread, fx2 = Math.sin(yaw) * cp, fz2 = Math.cos(yaw) * cp;
        fx.streak(x + fx2 * 3.4, y + dy * 3.4, z + fz2 * 3.4, fx2, dy, fz2, 3.2, 0.07, 0.12, e.fire ? 3 : 2.4, e.fire ? 1.3 : 1.9, e.fire ? 0.3 : 1.0, 0.7);
      }
    }
    if (e.fire) for (let f = 0; f < 6 * k; f++) fx.glow(x, y, z, 0.2, 0.5, vrng.range(0.12, 0.25), 3, 1.2, 0.25, dx * vrng.range(2, 6) + vrng.range(-1, 1), vrng.range(0, 2), dz * vrng.range(2, 6) + vrng.range(-1, 1), 4, 2, 0.4);
    if (e.sky) {                                              // rain volley: a flare column climbs off the bow
      fx.streak(x + dx * 5, y + dy * 5, z + dz * 5, dx, dy, dz, 5, 0.18, 0.25, 2.6, 1.6, 0.6, 0.6);
      fx.ring(x, y, z, dx, dy, dz, 0.2, 1.4, 0.08, 0.3, 1.8, 1.2, 0.5);
    }
    if ((e.heavy || e.big) && !mu) {                          // weight: dust kicked back off his feet, thump, light
      const hx = hero.x - dx * 0.3, hz = hero.z - dz * 0.3;
      for (let d = 0; d < 5 * k; d++) {
        const a = e.yaw + Math.PI + vrng.range(-1.1, 1.1), v = vrng.range(1.5, 4) * k;
        fx.smoke(hx, 0.15, hz, 0.25, vrng.range(0.6, 0.9) * k, vrng.range(0.45, 0.7), DUSTC[0], DUSTC[1], DUSTC[2], 0.3, Math.sin(a) * v, vrng.range(0.2, 0.8), Math.cos(a) * v, 3, 0.3);
      }
      fx.groundRing(hero.x, hero.z, 0.3, 1.6 * k, 0.045, 0.3, 0.9, 0.6, 0.3);
      fx.kick(e.big > 1 ? 4 : 2.2, e.big > 1 ? 0.3 : 0.16, 0.15, 1);
      fx.light(x, y + 0.2, z, e.big > 1 ? 3 : 1.4, e.fire ? 0xff8a30 : 0xfff0d0, 9);
    }
  });

  // ---------------------------------------------------------------- impact
  let hitFrame = -1, hitN = 0;
  on('arrow:hit', (e) => {
    if (game.frame !== hitFrame) { hitFrame = game.frame; hitN = 0; }
    const full = ++hitN <= 6, k = e.big > 1 ? 1.8 : e.big ? 1.4 : 1;
    fx.glow(e.x, e.y, e.z, 0.25, (full ? 1.2 : 0.6) * k, 0.09, 3.2, 2.4, 1.3);
    if (full) fx.glow(e.x, e.y, e.z, 0.6 * k, 1.8 * k, 0.16, 0.9, 0.45, 0.12);   // warm halo round the contact
    if (full) {
      sparks(e.x, e.y, e.z, Math.round(7 * k), e.dx, e.dy, e.dz, 0.8, 12 * k, 0.5, e.fire ? CORE_FIRE : SPARK);
      sparks(e.x, e.y, e.z, 3, -e.dx, 0.4, -e.dz, 0.9, 5, 0.3);                     // a few kicked back at the shooter
      fx.smoke(e.x, e.y - 0.3, e.z, 0.25, 0.9 * k, 0.45, DUSTC[0], DUSTC[1], DUSTC[2], 0.35, e.dx * 1.5, 0.5, e.dz * 1.5, 3, 0.5);
      if (e.fire) embers(e.x, e.y, e.z, 5, 2.5, 3, 0.6);
    }
    if (!e.spent) fx.streak(e.x + e.dx * 1.3, e.y + e.dy * 1.3, e.z + e.dz * 1.3, e.dx, e.dy, e.dz, 1.2, 0.06 * k, 0.08, 2.8, 2.2, 1.2, 0.7);   // pierce
    else if (e.big < 2) {                                                          // pinned in the body
      const j = pin.next; pin.next = (pin.next + 1) % NPIN;
      pin.e[j] = e.e; pin.ox[j] = e.x - c.x[e.e] + e.dx * 0.3; pin.oy[j] = e.y - c.y[e.e] + e.dy * 0.3; pin.oz[j] = e.z - c.z[e.e] + e.dz * 0.3;
      pin.dx[j] = e.dx; pin.dy[j] = e.dy; pin.dz[j] = e.dz; pin.t[j] = 0; pin.s[j] = e.big ? 1.7 : 1.25;
    }
  });

  // ---------------------------------------------------------------- rain marker
  on('arrow:rain', (e) => {
    const life = e.delay + e.over + 0.25;
    fx.groundRing(e.x, e.z, e.r * 0.5, e.r, 0.035, life, 1.6, 0.55, 0.12);
    fx.groundRing(e.x, e.z, e.r * 0.2, e.r * 0.45, 0.06, life, 1.0, 0.35, 0.08);
    fx.groundRing(e.x, e.z, e.r * 1.4, e.r * 0.9, 0.05, e.delay + 0.1, 1.4, 0.8, 0.3);       // closing in: "here it comes"
    for (let k = 0; k < 6; k++) fx.groundRing(e.x, e.z, e.r * 1.15, e.r * 0.25, 0.09, 0.22, 2.2, 0.9, 0.2, k * 0.12);   // pulses through the crowd
    fx.glow(e.x, 6.5, e.z, 1.2, 4, 0.5, 2.6, 1.5, 0.45);                                     // sky flare at the apex
    fx.glow(e.x, 6.5, e.z, 3, 7, 0.9, 0.6, 0.3, 0.08);
  });

  // ---------------------------------------------------------------- bursts
  on('arrow:burst', (e) => {
    const x = e.x, z = e.z, r = e.r;
    if (e.big > 1) {                                          // the Musou giant: the explosion x1.9 + a thin hot light pillar
      explode(x, z, r, 1.9);
      fx.streak(x, 16, z, 0, 1, 0, 16, 0.9, 0.35, 3.0, 2.0, 0.8, 0.35);
      fx.streak(x, 14, z, 0, 1, 0, 14, 2.6, 0.5, 0.5, 0.24, 0.05, 0.3);
      return;
    }
    if (r > 3) { explode(x, z, r, 1); return; }               // C6 fire arrow
    // small bursts: jump attack (dust), jump-charge fan and Musou volley (fire)
    fx.glow(x, 0.5, z, 0.3, r * 0.7, 0.08, 2.8, e.fire ? 1.4 : 2, e.fire ? 0.4 : 1.1);
    fx.groundRing(x, z, 0.2, r * 1.15, 0.05, 0.26, e.fire ? 1.8 : 1.2, e.fire ? 0.9 : 0.95, e.fire ? 0.3 : 0.7);
    if (e.fire) {
      fireball(x, 0.3, z, r * 0.9, 9, 0.42);
      smokeColumn(x, z, r * 0.7, 3, 1.4);
      embers(x, 0.4, z, 8, 3, 6, 0.9);
      fx.scorch(x, z, r * 0.55, 3.5, 0.7, 0.7);
      fx.light(x, 1, z, 1.5, 0xff8a38, 8);
    } else sparks(x, 0.3, z, 8, 0, 1, 0, 1, 8, 0.4);
    dust(x, 0.2, z, e.fire ? 3 : 6, 3 + r, 0.4, 1.2, 0.6, 0.45);
  });

  on('arrow:headshot', (e) => {
    fx.glow(e.x, e.y, e.z, 0.5, 2.2, 0.16, 3.6, 2.8, 1);
    sparks(e.x, e.y, e.z, 26, 0, 0.3, 0, 1.5, 14, 0.7, [3.4, 2.6, 0.7], 0.3);
    fx.ring(e.x, e.y, e.z, 0, 0, 0, 0.2, 1.6, 0.07, 0.3, 3, 2.2, 0.6, 0, 1);
    fx.ring(e.x, e.y, e.z, 0, 0, 0, 0.1, 0.9, 0.12, 0.22, 2.4, 1.8, 0.5, 0.05, 1);
  });

  on('scenario', () => {
    fx.clear(); prev.fill(0); pin.t.fill(9); giant.on = false; giant.fade = 0;
    for (let i = 0; i < N + NPIN; i++) arrows.setMatrixAt(i, ZERO);
    arrows.instanceMatrix.needsUpdate = true;
  });

  // ---------------------------------------------------------------- draw / charge on the arrowhead
  const pose = new Float32Array(POSE_SIZE), tip = new THREE.Vector3(), nock = new THREE.Vector3(), hpos = new THREE.Vector3();
  let fullPing = false, moteAcc = 0, chargeAcc = 0;
  /** Frames to the next shot of the current move (or -1) and whether it is a charge shot. */
  function nextShot() {
    if (hero.state !== 'attack' || !hero.move) return -1;
    const m = hero.kit.moves[hero.move];
    if (!m || !m.shots) return -1;
    const t = hero.moveT;
    let best = 1e9;
    for (const s of m.shots) {
      if (Array.isArray(s.f)) { for (let f = s.f[0]; f <= s.f[1]; f += s.every) if (f >= t) { best = Math.min(best, f); break; } }
      else if (s.f >= t) best = Math.min(best, s.f);
    }
    return best < 1e9 ? best - t : -1;
  }
  function updateDraw(dt) {
    const aim = game.musou.aim, aiming = aim && aim.active;
    let u = 0, charge = false;
    if (aiming) { u = aim.phase === 'draw' ? aim.d : 0; charge = true; }
    else {
      const d = nextShot(), m = d >= 0 && hero.kit.moves[hero.move], W = m && m.armor ? 16 : 7;
      if (d >= 0 && d <= W) { u = 1 - d / W; charge = !!m.armor; }
    }
    if (u <= 0) { fullPing = false; return; }
    hpos.set(hero.x, hero.y, hero.z);
    heroPose(hero, pose);
    spearWorld(pose, hpos, hero.yaw, -0.55, 0.22, nock, tip);                  // bow line: nock ← grip → arrowhead
    const ty = tip.y, dx = tip.x - nock.x, dy = tip.y - nock.y, dz = tip.z - nock.z, dl = Math.hypot(dx, dy, dz) || 1;
    const k = charge ? 1 : 0.6;
    // fx r1: a small intense point with a soft halo, capped in screen pixels — sized in metres, the over-the-shoulder aim
    // camera (≈ 3 m away) blew it up into a hard-edged yellow disc over his head and the target; the draw strength reads
    // from the string glow, the converging motes and the contracting rings instead
    const px = fx.px(tip.x, ty, tip.z), ak = aiming ? 0.6 : 1;
    fx.dot(tip.x, ty, tip.z, Math.min((0.1 + 0.2 * u * u) * k, (5 + 6 * u) * px), 2.4 * u * ak, 1.6 * u * ak, 0.5 * u * ak);
    fx.dot(tip.x, ty, tip.z, Math.min((0.3 + 0.4 * u) * k, (14 + 12 * u) * px), 0.22 * u * ak, 0.13 * u * ak, 0.04 * u * ak);
    // motes converge on the head
    moteAcc += dt * (charge ? 70 : 30) * u;
    while (moteAcc >= 1) {
      moteAcc--;
      const a = vrng.range(0, 6.283), b = vrng.range(-1, 1), R = vrng.range(0.7, 1.4) * k, sb = Math.sqrt(1 - b * b), life = 0.18;
      const ox = Math.cos(a) * sb * R, oy = b * R, oz = Math.sin(a) * sb * R;
      fx.spark(tip.x + ox, ty + oy, tip.z + oz, -ox / life, -oy / life, -oz / life, 0.35, 0.025, life, 2.6, 1.8, 0.7, 0, 0, 1);
    }
    if (charge) {                                                               // contracting charge rings on the aim line
      chargeAcc += dt;
      if (chargeAcc > 0.09) {
        chargeAcc = 0;
        fx.ring(tip.x + dx / dl * 0.2, ty + dy / dl * 0.2, tip.z + dz / dl * 0.2, dx, dy, dz, Math.min(0.9 * k, 60 * px), 0.12, 0.09, 0.14, 1.8 * u, 1.3 * u, 0.5 * u);
      }
      // the string glows as it comes to full draw
      if (u > 0.5) fx.line(nock.x, nock.y + 0.55, nock.z, 0, 1, 0, 1.1, 0.025, 1.6 * u, 1.5 * u, 1.2 * u, 0.3);
    }
    if (aiming && u >= 1 && !fullPing) {                                        // full draw: a ping you can read mid-fight
      fullPing = true;
      fx.glow(tip.x, ty, tip.z, 8 * px, Math.min(1.4, 40 * px), 0.12, 3.4, 2.6, 1);
      fx.ring(tip.x, ty, tip.z, 0, 0, 0, 0.1, Math.min(0.8, 70 * px), 0.1, 0.2, 2.8, 2, 0.6, 0, 1);
    }
  }

  // ---------------------------------------------------------------- per-frame arrows
  let shed = 0;
  function update(dt) {
    const P = proj;
    shed += dt;
    const emit = shed >= 1 / 60;                               // trail particles at ≤ 60 Hz whatever the frame rate
    if (emit) shed = 0;
    for (let i = 0; i < N; i++) {
      const st = P.st[i];
      if (!st) {
        if (prev[i]) {
          arrows.setMatrixAt(i, ZERO);
          if (prev[i] === AS.FLY && P.big[i] < 2 && P.kind[i] !== 3) {
            const ex = P.x[i] - tx[i], ey = P.y[i] - ty[i], ez = P.z[i] - tz[i], L = Math.hypot(ex, ey, ez);
            if (L > 0.3) fx.streak(P.x[i], P.y[i], P.z[i], ex / L, ey / L, ez / L, Math.min(L, 8), P.big[i] ? 0.12 : 0.08, 0.12,
              P.fire[i] ? 2.2 : 1.8, P.fire[i] ? 0.9 : 1.4, P.fire[i] ? 0.25 : 0.7, 0.6);
          }
        }
        prev[i] = 0; continue;
      }
      const bigK = P.big[i] === 2 ? 5 : P.big[i] ? 1.6 : 1, kind = P.kind[i];
      _d.set(P.vx[i], P.vy[i], P.vz[i]);
      const v = _d.length();
      if (v > 1e-4) _d.divideScalar(v); else _d.set(0, -1, 0);
      _q.setFromUnitVectors(FWD, _d);
      const x = P.x[i], z = P.z[i], dx = _d.x, dy = _d.y, dz = _d.z;
      let y = P.y[i];
      if (st === AS.STUCK) {
        if (prev[i] === AS.FLY) {                              // ground bite
          dust(x, 0.1, z, 2, 1.8, 0.2, kind === 4 ? 0.9 : 0.7, 0.5, 0.5);
          fx.glow(x, 0.25, z, 0.15, 0.6, 0.08, 2.4, 1.6, 0.6);
          sparks(x, 0.1, z, 3, -dx * 0.3, 0.9, -dz * 0.3, 0.8, 4, 0.2, [1.2, 0.9, 0.6], 0.25);
          fx.groundRing(x, z, 0.1, 0.6 * bigK, 0.1, 0.2, 0.9, 0.7, 0.4);
          if (P.fire[i]) embers(x, 0.1, z, 4, 1, 2, 0.6);
        }
        y -= 0.14 * bigK + Math.max(0, P.t[i] - (ARROW.stuck - 40)) / 40 * 0.9 * bigK;
      } else if (P.big[i] === 2) flyGiant(i, x, y, z, dx, dy, dz, v, emit, dt);
      else {
        const fire = P.fire[i], heavy = P.big[i] === 1;
        const col = fire ? CORE_FIRE : heavy ? CORE_HEAVY : CORE, gc = fire ? GLOW_FIRE : GLOW;
        if (kind === 4) {                                       // falling rain: long bright streaks
          fx.line(x, y, z, dx, dy, dz, 4.5, 0.1, 2.6, 1.7, 0.7, 1.1);
          fx.line(x, y, z, dx, dy, dz, 6.5, 0.34, 0.7, 0.38, 0.1, 0.8);
          fx.dot(x, y, z, 0.16, 1.6, 1.0, 0.4);
        } else if (kind === 3) {                                // the skyward volley: a climbing flare
          fx.line(x, y, z, dx, dy, dz, 4, 0.1, 3, 2, 0.8, 1);
          fx.dot(x, y, z, 0.6, 2.6, 1.6, 0.5);
        } else {
          if (prev[i] !== AS.FLY) { tx[i] = x - dx * 0.5; ty[i] = y - dy * 0.5; tz[i] = z - dz * 0.5; }
          const kf = 1 - Math.exp(-dt * 14);
          tx[i] += (x - tx[i]) * kf; ty[i] += (y - ty[i]) * kf; tz[i] += (z - tz[i]) * kf;
          const ex = x - tx[i], ey = y - ty[i], ez = z - tz[i], tl = Math.min(9, Math.hypot(ex, ey, ez));
          const len = Math.min(3.2, Math.max(0.8, v * 0.045)) * (heavy ? 1.3 : 1);
          fx.line(x, y, z, dx, dy, dz, len, 0.07 * bigK * (fire ? 1.3 : 1), col[0], col[1], col[2], 1.5);          // hot core
          if (tl > 0.3) fx.line(x, y, z, ex / tl, ey / tl, ez / tl, tl, 0.28 * bigK, gc[0] * 1.6, gc[1] * 1.6, gc[2] * 1.6, 0.7);   // comet glow
          fx.dot(x, y, z, 0.2 * bigK, col[0] * 0.6, col[1] * 0.6, col[2] * 0.6);
          if (emit) fx.streak(x - dx * 0.6, y - dy * 0.6, z - dz * 0.6, dx, dy, dz, 1.1 * bigK, 0.06 * bigK, 0.16, gc[0] * 2.2, gc[1] * 2.2, gc[2] * 2.2, 1);   // afterimage
          if (heavy) {                                          // heavy shots cut air rings along their line
            ringAcc[i] += dt;
            if (ringAcc[i] > 0.04) { ringAcc[i] = 0; fx.ring(x - dx * 0.8, y - dy * 0.8, z - dz * 0.8, dx, dy, dz, 0.2, 0.8, 0.1, 0.18, 1.3, 1.05, 0.65); }
          }
          if (fire) {
            fx.dot(x, y, z, 0.32 + 0.14 * vrng.next(), 2.4, 0.95, 0.16);                  // hot orange head (under the shoulder: stays orange)
            fx.dot(x, y, z, 0.1, 2.6, 2.2, 1.4);
            if (emit) {
              for (let f = 0; f < 2; f++) fx.glow(x - dx * vrng.range(0, 0.8), y + vrng.range(-0.05, 0.1), z - dz * vrng.range(0, 0.8), 0.22, 0.05, vrng.range(0.18, 0.32),
                2.2, vrng.range(0.6, 0.95), 0.1, vrng.range(-0.6, 0.6), vrng.range(0.5, 1.6), vrng.range(-0.6, 0.6), 2, 1.5, 0.4);
              if (vrng.chance(0.5)) fx.smoke(x - dx, y, z - dz, 0.15, 0.7, 0.8, 0.12, 0.1, 0.09, 0.4, 0, 0.8, 0, 2, 0.8);
            }
          }
        }
      }
      _m.compose(_p.set(x, y + ground(x, z), z), _q, _s.setScalar(bigK));
      arrows.setMatrixAt(i, _m);
      prev[i] = st;
    }
    // pinned arrows ride the soldier they stopped in
    for (let j = 0; j < NPIN; j++) {
      if (pin.t[j] >= PIN_T) { if (pin.t[j] < 9) { pin.t[j] = 9; arrows.setMatrixAt(N + j, ZERO); } continue; }
      pin.t[j] += dt;
      const e = pin.e[j], sink = Math.min(1, (PIN_T - pin.t[j]) / 0.25);
      _d.set(pin.dx[j], pin.dy[j], pin.dz[j]);
      _q.setFromUnitVectors(FWD, _d);
      const px = c.x[e] + pin.ox[j], pz = c.z[e] + pin.oz[j];
      _m.compose(_p.set(px, c.y[e] + pin.oy[j] + ground(px, pz), pz), _q, _s.setScalar(pin.s[j] * sink));
      arrows.setMatrixAt(N + j, _m);
    }
    arrows.instanceMatrix.needsUpdate = true;
    updateGiantTrail(dt);
    updateDraw(dt);
  }

  // ---------------------------------------------------------------- the Musou giant in flight + its lingering trail
  function flyGiant(i, x, y, z, dx, dy, dz, v, emit, dt) {
    if (!giant.on) { giant.on = true; giant.x0 = x - dx * 1.5; giant.y0 = y; giant.z0 = z - dz * 1.5; giant.t = 0; }
    giant.x = x; giant.y = y; giant.z = z; giant.fade = 1; giant.t += dt;
    const t = giant.t, sx = -dz, sz = dx;                      // side axis (flat flight)
    fx.light(x, y + 0.8, z, 1.6, 0xff8a30, 10, 1);             // the blaze rides it
    // sun core + beam
    // (sizes kept modest: the first frames of the flight pass the over-the-shoulder lens and washed the frame out)
    const px = fx.px(x, y, z);
    fx.dot(x, y, z, Math.min(1.0, 45 * px), 3.4, 2.6, 1.4);
    fx.dot(x, y, z, Math.min(2.4, 110 * px), 0.6, 0.3, 0.06);
    fx.line(x + dx * 1.5, y, z + dz * 1.5, dx, dy, dz, 8, 0.4, 3.4, 2.5, 1.1, 1.4);
    fx.line(x + dx * 1.5, y, z + dz * 1.5, dx, dy, dz, 12, 1.0, 0.7, 0.36, 0.1, 0.7);
    // double spiral aura wound round the flight line
    for (let s = 0; s < 2; s++) for (let k = 0; k < 14; k++) {
      const back = k * 0.55, a = t * 22 - k * 0.7 + s * Math.PI, rr = 0.9 + 0.05 * k, f = 1 - k / 14;
      fx.dot(x - dx * back + sx * Math.cos(a) * rr, y + Math.sin(a) * rr, z - dz * back + sz * Math.cos(a) * rr, 0.28 * f + 0.08, 2.6 * f, 1.8 * f, 0.6 * f);
    }
    if (emit) {
      for (let f = 0; f < 5; f++) {                            // flame shell + embers peeling off
        const a = vrng.range(0, 6.283), rr = vrng.range(0.2, 0.9);
        fx.glow(x - dx * vrng.range(0, 2) + sx * Math.cos(a) * rr, y + Math.sin(a) * rr, z - dz * vrng.range(0, 2) + sz * Math.cos(a) * rr, 0.9, 0.2, vrng.range(0.25, 0.45),
          3, vrng.range(0.9, 1.5), 0.25, sx * Math.cos(a) * 2, Math.sin(a) * 2 + 1, sz * Math.cos(a) * 2, 2, 2, 0.3);
      }
      embers(x - dx * 2, y, z - dz * 2, 3, 3, 4, 0.9);
      fx.smoke(x - dx * 3, y, z - dz * 3, 0.6, 2.4, 1.6, 0.14, 0.11, 0.09, 0.45, 0, 1, 0, 1.5, 1);
      for (const side of [-1, 1]) {                            // the ground torn up under its path
        const v2 = vrng.range(3, 6);
        fx.smoke(x + sx * side * 0.6, 0.15, z + sz * side * 0.6, 0.5, 1.8, 0.9, DUSTC[0], DUSTC[1], DUSTC[2], 0.5, sx * side * v2, vrng.range(0.5, 2), sz * side * v2, 2.5, 0.5);
      }
      fx.ring(x - dx * 2.5, y, z - dz * 2.5, dx, dy, dz, 0.6, 1.2, 0.06, 0.22, 2, 1.5, 0.7);
    }
  }
  function updateGiantTrail(dt) {
    if (!giant.on) return;
    const g = game.musou.giantI, alive = g >= 0 && proj.st[g] === AS.FLY && proj.big[g] === 2;
    if (!alive) giant.fade -= dt / 1.4;
    if (giant.fade <= 0) { giant.on = false; return; }
    const dx = giant.x - giant.x0, dy = giant.y - giant.y0, dz = giant.z - giant.z0, L = Math.hypot(dx, dy, dz);
    if (L < 0.5) return;
    const f = giant.fade * giant.fade;
    fx.line(giant.x, giant.y, giant.z, dx / L, dy / L, dz / L, L, 0.3 * f + 0.05, 2.6 * f, 1.8 * f, 0.7 * f, 0.15);
    fx.line(giant.x, giant.y, giant.z, dx / L, dy / L, dz / L, L, 0.9 * f, 0.4 * f, 0.22 * f, 0.06 * f, 0.1);
  }

  return {
    update,
    dispose() {
      scene.remove(root);
      root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    },
  };
}
