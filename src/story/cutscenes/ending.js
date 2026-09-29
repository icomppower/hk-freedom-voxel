// 天光 End scene (after the ENDING scroll, before the TRIBUTE card) — ≈ 40 s, four shots of 10 s on the admiralty map at
// sunrise. The game's fiction: Hong Kong people have won their freedom (the chapter epilogues keep the real 2019 history).
// Set: Harcourt Road packed with the stand-in crowd (civil + blackbloc skins, cheering / hopping), open umbrellas in yellow
// and every colour, lantern strings across the road, fireworks over the city, falling confetti.
//  (a) crane down from high over the harbour toward the crowd · (b) low dolly along the open umbrellas
//  (c) 龍仔 and 小美 on the footbridge facing the sunrise — the player's pick leads (centre), the other beside: 2.0 s 龍仔
//      lifts off the hard hat (head swap at 3.0, hat in hand), 4.2 s pulls down the mask (bare head with the smile at
//      5.16, mask in the other hand), 5.8 s 小美 raises both umbrellas, 6.4 s they snap OPEN, 7.2 s both cheer
//  (d) pull back and up over the harbour to the skyline; fireworks peak; the title card at 5.5 s (player: S.title)
import { umbrella, bx } from '../../world/maps/hkkit/props.js';
import { hash01 } from '../../core/rng.js';
import { CUT as LJ } from '../../chars/lungjai/cutclips.js';
import { CUT as SM } from '../../chars/siumei/cutclips.js';

export const map = 'admiralty';
export const title = { shot: 3, at: 5.5 };
const ease = (u) => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a.map((v, k) => v + (b[k] - v) * u);
const BZ = -58, DECK = 6.62;                                 // the footbridge they stand on (deck top)
const UMB = [0xffd700, 0xffd700, 0xffd700, 0xf48fb1, 0x4fc3f7, 0xff7043, 0x9ccc65, 0xffffff, 0xba68c8, 0xe53935];
let lj, sm;

export function build(K) {
  K.sky({ bg: 0xf0bf94, fog: 0xe8b890, near: 80, far: 520, hemi: [0xffe0c0, 0x6a5040, 2.2], key: [0xffc890, 3.2, [-40, 30, 140]] });
  K.light('point', 0xffd8a8, 60, [0, 14, -40], { dist: 90 });
  K.box([bx([2000, 0.4, 900], [0, -3.4, 560], 0x6a90b0)]);                           // the harbour catching the dawn
  K.glow([bx([80, 30, 1], [0, 18, 470], 0xffe0a0)], { color: [2.4, 1.9, 1.2] });      // the sun's glow on the horizon
  // the crowd on Harcourt Road (the mobile tier caps it at 150)
  K.crowdSkin('civil', 'blackbloc');
  K.people(600, [-17.5, -146, 17.5, -66], 0, { spread: 1.2 });            // facing the sunrise (+Z)
  K.cheer(true, 0.2);
  // open umbrellas held up over the crowd: every colour, yellow most of all
  const U = [];
  for (let k = 0; k < (K.mobile ? 50 : 150); k++) {
    const x = (hash01(k, 21) - 0.5) * 34, z = -144 + hash01(k, 22) * 76, h = 2.1 + hash01(k, 23) * 0.4;
    for (const q of umbrella(UMB[k % UMB.length], h, (hash01(k, 24) - 0.5) * 0.3)) U.push({ ...q, s: q.s.map((v, i) => (i === 1 ? v : v * 1.25)), p: [q.p[0] + x, q.p[1] + K.g(x, z), q.p[2] + z] });
  }
  K.box(U);
  // lantern strings across the road between the lamp posts
  const L = [];
  for (const z of [-140, -125, -110, -95, -80]) for (let k = 0; k < 28; k++) { const u = (k + 0.5) / 28, x = -20 + u * 40, y = 7.2 - Math.sin(u * Math.PI) * 1.2;
    L.push(bx([0.34, 0.44, 0.34], [x, y, z], [0xff6a3a, 0xffd700, 0xff8fb1][k % 3]), bx([0.2, 0.05, 0.2], [x, y + 0.25, z], 0x2a2018)); }
  K.glow(L, { color: [2.2, 1.9, 1.6] });
  // fireworks over the city (the fireworks clock starts with the scene; the peak rides shot d)
  const F = [], COL = [0xffd700, 0xff6a3a, 0xf48fb1, 0x80deea, 0xffffff, 0xb2ff59];
  for (let k = 0; k < 34; k++) { const t0 = k < 12 ? 2 + k * 2.2 : 30 + (k - 12) * 0.36; F.push([t0, (hash01(k, 31) - 0.5) * 160, 50 + hash01(k, 32) * 45, -200 - hash01(k, 33) * 60, COL[k % COL.length]]); }
  K.fireworks(F);
  K.confetti([-18, -140, 18, -66], 16, K.mobile ? 250 : 700);
  // the two on the footbridge: the lead in the middle, the other beside
  const lx = K.lead === 'lungjai' ? 0 : 1.3, sx = K.lead === 'lungjai' ? -1.3 : 0;
  lj = K.hero('lungjai').place(lx, BZ + 1.3, 0, DECK).pose(LJ.rest).weapons('hidden').head('hat');
  sm = K.hero('siumei').place(sx, BZ + 1.3, 0, DECK).pose(SM.rest).weapons('closed');
}

const lead = () => (lj.x === 0 ? lj : sm);
export const shots = [
  { dur: 10, // (a) crane down from high over the harbour toward the crowd
    cam: (u) => { const e = ease(u), a = Math.min(1, e / 0.55), b = Math.max(0, (e - 0.55) / 0.45);   // over the HQ roof first, then down
      return { pos: b ? lerp([1, 62, 6], [2, 14, -50], b) : lerp([0, 95, 150], [1, 62, 6], a), look: lerp([0, 20, -120], [0, 1.5, -104], e), focus: lerp([0, 2, -90], [0, 1.5, -100], u), fov: 46 }; },
    events: [{ at: 0, do: (K, S) => S.cue('dawn') }] },
  { dur: 10, // (b) low dolly along the open umbrellas
    cam: (u) => ({ pos: lerp([-16, 2.2, -84], [15, 2.3, -86], u), look: lerp([-11, 2.4, -100], [18, 2.4, -102], u), focus: lerp([-13, 2, -92], [16, 2, -94], u), fov: 44 }),
    events: [{ at: 0, do: (K, S) => S.cue('roar') }] },
  { dur: 10, // (c) on the footbridge, facing the sunrise
    set: () => { lj.pose(LJ.rest); sm.pose(SM.rest); },
    cam: (u) => { const L = lead(); return { pos: lerp([L.x + 0.5, DECK + 2.45, BZ + 5.6], [L.x + 0.3, DECK + 2.4, BZ + 4.6], ease(u)), look: [L.x - 0.3, DECK + 1.7, BZ + 1.3], focus: [L.x, DECK + 1.6, BZ + 1.3], fov: 42 }; },
    events: [
      { at: 0, do: (K, S) => S.cue('hush') },
      { at: 2.0, do: () => lj.pose(LJ.hatLift, 2) },
      { at: 3.0, do: (K, S) => { lj.head('nohat').hold('hat', 'R'); S.cue('tock'); } },
      { at: 4.2, do: () => lj.pose(LJ.maskPull, 1.6) },
      { at: 5.16, do: (K, S) => { lj.head('bare').hold('mask', 'L'); S.cue('softTock'); } },
      { at: 5.8, do: (K, S) => { sm.pose(SM.raise, 0.6); S.cue('whoosh'); } },
      { at: 6.4, do: (K, S) => { sm.weapons('open'); S.cue('whoosh'); } },
      { at: 7.2, do: (K, S) => { lj.hold(null).pose(LJ.cheer, 1); sm.pose(SM.cheer, 1); S.cue('cheer'); } },
    ] },
  { dur: 10, // (d) pull back and up over the harbour to the skyline; fireworks peak; the title card
    cam: (u) => ({ pos: lerp([0, DECK + 2, BZ + 8], [0, 62, 90], ease(u)), look: lerp([0, DECK + 1.5, BZ], [0, 55, -220], ease(u)), focus: [0, 60, -220], fov: 50 }),
    events: [{ at: 0, do: (K, S) => S.cue('theme') }, ...[0.4, 1.2, 2.0, 2.6, 3.3, 4.0, 4.6, 5.2, 6.0, 6.8, 7.5, 8.3].map((at) => ({ at, do: (K, S) => S.cue('boom') })),
      { at: 5.5, do: (K, S) => S.cue('titleChord') }] },
];
