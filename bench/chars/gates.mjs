// Character gates (workflow steps 4–5) for a kit, headless in the Node sim:
//   moves    every kit move id present (n1–n6, c1–c6, dash, jatk, jc) with a clip (or an `anim` borrow)
//   onsets   hit onsets within ±2 f of the Box Moveset targets; the N-string's onsets measured in the live sim (mashed
//            attack on an empty field: attack:swing frames) spaced inside the kit's target band
//   ground   no weapon point below the ground on any sampled frame of any attack clip (weapon frame points: butt, tip, hook)
//   feet     no planted foot slides: a foot on the ground (y < 0.12) on two consecutive frames moves ≤ 1 cm in the world
//            (root carried by the move's lunge, turned by nothing: the feet are in the hero-facing frame when planted)
//   musou    Musou KOs ≥ 25 of a packed ring of 40 grunts (seeded), and the hero ends it standing, back in control
//   node --import ./bench/harness/register.mjs bench/chars/gates.mjs lungjai
import * as THREE from 'three';
import { createSim } from '../harness/sim.mjs';
import { CHARS } from '../../src/chars/index.js';
import { sampleClip, POSE_SIZE, weaponWorld, weaponLWorld, CH } from '../../src/hero/rig.js';
import { lungeAt, moveClip } from '../../src/hero/moveset.js';
import { ST } from '../../src/crowd/crowd.js';
import { on } from '../../src/core/events.js';

const TARGETS = {
  siumei: { onsets: { n1: [8], n2: [8], n3: [12], c1: [14, 24, 34, 43] }, band: [16, 20], points: [[0, 0, -0.15], [0, 0, 0.88]], dual: true },
  lungjai: { onsets: { n1: [11], n2: [12], n3: [12], c1: [22] }, band: [22, 26], points: [[0, 0, -0.6], [0, 0, 1.5]] },
  gok: { onsets: { n1: [13], n2: [16], n3: [14], c1: [18, 44] }, band: [26, 30], points: [[0, 0, -0.6], [0, 0, 1.46], [0, 0.18, 1.34]] },
  siume: { onsets: { n1: [8], n2: [8], n3: [12], c1: [14, 24, 34, 43] }, band: [16, 20], points: [[0, 0, -0.1], [0, 0, 0.45]], dual: true },
};
const id = process.argv[2] || 'lungjai', T = TARGETS[id], K = CHARS[id].kit;
const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${n}${x ? '  ' + x : ''}`); };

// ---- moves
const IDS = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'dash', 'jatk', 'jc'];
const missing = IDS.filter((m) => !K.moves[m] || !(K.clips[m] || K.moves[m].anim));
ok('every kit move id present with a clip', !missing.length, missing.join(' '));

// ---- onsets vs the Box Moveset frame data
const off = [];
for (const [m, fs] of Object.entries(T.onsets)) fs.forEach((f, k) => { const a = K.moves[m].hits[k]?.f[0]; if (a == null || Math.abs(a - f) > 2) off.push(`${m}#${k} ${a} vs ${f}`); });
ok('hit onsets within ±2 f of the Box Moveset targets', !off.length, off.join(', '));

// ---- live N-string spacing
{
  const sim = await createSim({ enemies: 30 }), G = sim.game, swings = [];
  on('attack:swing', (e) => { if (e.win === 0) swings.push([G.frame, e.move]); });
  sim.start({ char: id, mode: 'free', chapter: 'ch1' });
  for (let f = 0; f < 60; f++) sim.step({ mx: 0, my: 0, orbit: 0, tilt: 0, pressed: {}, held: {} });
  swings.length = 0;
  for (let f = 0; f < 240; f++) sim.step({ mx: 0, my: 0, orbit: 0, tilt: 0, pressed: { attack: f % 3 === 0 }, held: { attack: true } });
  const ns = swings.filter(([, m]) => /^n[1-6]$/.test(m)).slice(0, 6), gaps = ns.slice(1).map(([f], k) => f - ns[k][0]);
  ok(`N-string onsets ${T.band[0]}–${T.band[1]} sf apart (live)`, ns.length === 6 && gaps.every((g) => g >= T.band[0] && g <= T.band[1]),
    ns.map(([f, m]) => `${m}@${f}`).join(' ') + '  gaps ' + gaps.join(' '));
}

// ---- weapon above the ground, feet planted
{
  const pose = new Float32Array(POSE_SIZE), pos = new THREE.Vector3(), out = new THREE.Vector3();
  let lowest = 1e9, lowAt = '', slide = 0, slideAt = '';
  for (const m of IDS) {
    const mv = K.moves[m], F = mv.frames;
    let prev = null;
    for (let f = 0; f <= F; f++) {
      const [cid, ct] = moveClip(mv, f), c = K.clips[cid];
      if (!c) continue;
      sampleClip(c, ct, pose);
      if (K.feet[m]) K.feet[m](f / F, pose);
      pos.set(0, mv.air ? 1.5 : 0, 0);                               // air moves: sampled at a hover height
      for (const [x, y, z] of T.points) {
        for (const fn of T.dual && pose[CH.dual] > 0.5 ? [weaponWorld, weaponLWorld] : [weaponWorld]) {
          fn(pose, pos, 0, x, y, z, out);
          if (out.y - pos.y + (mv.air ? 1.5 : 0) < lowest) { lowest = out.y - pos.y + (mv.air ? 1.5 : 0); lowAt = `${m}@${f}`; }
        }
      }
      if (mv.air || !pose[CH.plant]) { prev = null; continue; }
      const root = lungeAt(mv, f), feet = [[pose[CH.footL], pose[CH.footL + 1], pose[CH.footL + 2] + root], [pose[CH.footR], pose[CH.footR + 1], pose[CH.footR + 2] + root]];
      if (prev) for (let j = 0; j < 2; j++) if (feet[j][1] < 0.12 && prev[j][1] < 0.12) {
        const d = Math.hypot(feet[j][0] - prev[j][0], feet[j][2] - prev[j][2]);
        if (d > slide) { slide = d; slideAt = `${m}@${f} ${j ? 'R' : 'L'}`; }
      }
      prev = feet;
    }
  }
  ok('no weapon point below the ground', lowest >= -0.02, `lowest ${lowest.toFixed(3)} m at ${lowAt}`);
  ok('planted feet never slide (≤ 1 cm / frame)', slide <= 0.01, `max ${(slide * 100).toFixed(2)} cm at ${slideAt}`);
}

// ---- Musou vs a packed ring of 40
{
  const sim = await createSim({ enemies: 300 }), G = sim.game, c = G.crowd;
  sim.start({ char: id, mode: 'story', chapter: 'ch1' });
  const idle = { mx: 0, my: 0, orbit: 0, tilt: 0, pressed: {}, held: {} };
  for (let f = 0; f < 2; f++) sim.step(idle);
  const h = G.hero;
  // clear the field, then 40 grunts on three rings 1.9 / 2.9 / 3.9 m round him (placed directly: a test fixture)
  for (let i = 0; i < c.T; i++) c.st[i] = ST.OFF;
  c.spawnSquad({ x: h.x, z: h.z + 8, n: 40, cols: 8 });
  const ring = [];
  for (let i = 0; i < c.grunts && ring.length < 40; i++) if (c.st[i] !== ST.OFF) ring.push(i);
  ring.forEach((i, k) => { const r = k < 14 ? 1.9 : k < 28 ? 2.9 : 3.9, a = (k % 14) / 14 * Math.PI * 2 + r; c.x[i] = h.x + Math.sin(a) * r; c.z[i] = h.z + Math.cos(a) * r; c.st[i] = ST.GUARD; c.vx[i] = c.vz[i] = 0; });
  h.musou = h.musouMax;
  const kos0 = h.kos;
  sim.step({ ...idle, pressed: { musou: true }, held: { musou: true } });
  let f = 0;
  while (f++ < 400 && (G.musou.active || f < 5)) sim.step(idle);
  const dead = ring.filter((i) => c.st[i] === ST.DEAD || c.kod[i]).length;
  ok('Musou KOs ≥ 25 of a packed 40-soldier ring', dead >= 25, `${dead}/40 (hero KOs +${h.kos - kos0}), ${f} f, control back: ${h.state !== 'musou'}`);
}

const pass = res.every(Boolean);
console.log(pass ? `${id.toUpperCase()} GATES PASS ${res.length}/${res.length}` : `${id.toUpperCase()} GATES FAIL ${res.filter(Boolean).length}/${res.length}`);
process.exit(pass ? 0 : 1);
