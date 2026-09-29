// 竹枝 Bamboo (after the hk3 win, before the hk4 scroll) — ≈ 20 s, three shots on the polyu map.
//  (a) morning over Kowloon from the PolyU rooftop, thin smoke, the harbour behind; slow crane
//  (b) students build a barricade of bricks and scaffold bamboo; 龍仔 pulls one pole from the pile and weighs it
//  (c) dusk: a water-cannon truck's headlights roll onto the far footbridge. 「今晚，一個都唔可以留低。」
// Students: box figures in the shipped `blackbloc` palette and head (carrying poses); props as box lists.
import { bx, BAMBOO } from '../../world/maps/hkkit/props.js';
import { hash01 } from '../../core/rng.js';
import { CUT as LJ } from '../../chars/lungjai/cutclips.js';
import { CUT as SM } from '../../chars/siumei/cutclips.js';

export const map = 'polyu';
const ease = (u) => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a.map((v, k) => v + (b[k] - v) * u);
let lj, sm, carriers = [], truck, beams = [], skyDome = null, K0 = null;

export function build(K) {
  K0 = K;
  K.sky({ bg: 0xd8b890, fog: 0xcaa888, near: 60, far: 520, hemi: [0xf0d8b0, 0x5a4a3a, 1.6], key: [0xffd8a8, 2.2, [-80, 40, 120]] });
  skyDome = K.dome;
  K.box([bx([1400, 0.4, 500], [0, -5.6, -520], 0x5a7890)]);                          // the harbour beyond Hung Hom
  K.haze([[-30, 10, -120, 30], [20, 14, -150, 36], [-8, 18, -180, 40], [40, 22, -200, 44]], 0xb0a8a0, 0.25);   // thin smoke
  // (b) the barricade site on the podium: brick pile, bamboo pile, a half-built wall of bricks and lashed poles
  const S = [];
  for (let k = 0; k < 90; k++) S.push(bx([0.22, 0.07, 0.11], [-6 + (k % 9) * 0.25 + hash01(k, 1) * 0.05, 1.05 + Math.floor(k / 18) * 0.075, -122 + (Math.floor(k / 9) % 2) * 0.13], 0x8a4a3a, [0, (hash01(k, 2) - 0.5) * 0.3, 0]));
  for (let k = 0; k < 14; k++) S.push(bx([0.07, 0.07, 3.6], [-2.4 + (k % 7) * 0.09, 1.04 + Math.floor(k / 7) * 0.08, -119], BAMBOO, [0, 0.05 * (hash01(k, 3) - 0.5), 0]));
  for (let k = 0; k < 40; k++) S.push(bx([0.22, 0.07, 0.11], [-4 + (k % 20) * 0.23, 1.05 + Math.floor(k / 20) * 0.075, -126], 0x7a3e30));
  for (let k = 0; k < 6; k++) S.push(bx([0.07, 1.6, 0.07], [-4 + k * 0.9, 1.8, -126], BAMBOO, [0, 0, (k - 2.5) * 0.12]));
  K.box(S);
  carriers = [[-7, -128, 0], [-3, -116, 2], [1, -124, 1], [4, -120, 3]].map(([x, z, k]) => ({ m: K.fig('blackbloc', k % 2 ? 'carry' : 'stand', x, z, 0), x, z, k }));
  [[-8, -121, 1.2], [2, -127, -0.6], [5, -129, -0.3]].forEach(([x, z, y]) => K.fig('blackbloc', 'stand', x, z, y));
  lj = K.hero('lungjai').place(-1.4, -120.6, 0.64).pose(LJ.weigh, 3.2).weapons('shown');
  sm = K.hero('siumei').place(0.6, -123, -2.6).pose(SM.rest).weapons('closed');
  // (c) the water-cannon truck: body, cab, cannon; two headlight beams + glowing lamps (rolls toward the camera)
  truck = K.box([bx([3, 3.2, 9], [0, 1.9, 0], 0xd8d8d0), bx([3.02, 1.2, 3], [0, 2.4, -3.2], 0x2a3440), bx([3.1, 0.5, 9.2], [0, 0.5, 0], 0x3a3a3a),
    bx([0.8, 0.8, 0.8], [0, 3.9, -2], 0x5a5e66), bx([0.3, 0.3, 1.6], [0, 4.1, -3], 0x3a3e46)], { yaw: Math.PI });
  const lamps = K.glow([bx([0.6, 0.4, 0.1], [-1.1, 1.2, 4.62], 0xffffff), bx([0.6, 0.4, 0.1], [1.1, 1.2, 4.62], 0xffffff), bx([2.6, 0.12, 0.1], [0, 3.55, 4.62], 0xffffff)], { yaw: Math.PI, color: [7, 6.6, 5.6] });
  beams = [-1.1, 1.1].map((dx) => K.light('spot', 0xfff0d8, 0, [dx, 3, -30], { dist: 70, angle: 0.3, target: [dx, 1, -80] }));
  truck.userData.lamps = lamps;
}
const truckAt = (z) => { truck.position.set(0, K0.g(0, z), z); truck.userData.lamps.position.copy(truck.position); beams.forEach((b, k) => { b.position.set(k ? 1.1 : -1.1, K0.g(0, z) + 1.3, z - 4.6); b.target.position.set(k ? 1.1 : -1.1, 1.2, z - 50); }); };

export const shots = [
  { dur: 6.5, // (a) morning from the rooftop, slow crane up
    set: () => { truckAt(-10); },
    cam: (u) => ({ pos: lerp([2, 13, 94], [3, 22, 98], ease(u)), look: lerp([-2, 6, 20], [-6, 3, -140], ease(u)), focus: [0, 4, -60], fov: 50 }) },
  { dur: 7, // (b) the barricade builders; 龍仔 weighs a pole
    update: (u, t) => { for (const c of carriers) { const z = c.z + Math.sin(t * 0.8 + c.k) * 1.2; c.m.position.set(c.x, K0.g(c.x, z), z); c.m.rotation.y = Math.cos(t * 0.8 + c.k) > 0 ? 0 : Math.PI; } },
    cam: (u) => ({ pos: lerp([3.5, 2.2, -114], [2.2, 1.9, -116.5], ease(u)), look: [-1.6, 1.8, -121], focus: [-1.4, 1.8, -120.6], fov: 40 }),
    events: [{ at: 0.6, do: (K, S) => S.cue('clack') }, { at: 2.4, do: (K, S) => S.cue('knock') }, { at: 3.6, do: (K, S) => S.cue('clack') }, { at: 4.8, do: (K, S) => S.cue('knock') }] },
  { dur: 7, // (c) dusk: the truck's headlights roll onto the far footbridge
    set: (K) => { skyDome.material.color.set(0x5a3a4a); K.root.parent.background.set(0x5a3a4a); if (K.root.parent.fog) K.root.parent.fog.color.set(0x4a3040);
      sm.place(0.2, -90.2, 0).pose(SM.rest); lj.place(-1.3, -90.8, 0.05).pose(LJ.rest).weapons('shown'); beams.forEach((b) => { b.intensity = 90; }); },
    update: (u) => truckAt(-26 - 22 * ease(u)),
    cam: (u) => ({ pos: lerp([2.6, 2.9, -100], [2.0, 2.7, -98], ease(u)), look: [-0.6, 3, -50], focus: [0, 2.5, -45], fov: 40 }),
    events: [{ at: 0.1, do: (K, S) => S.cue('engine') }],
    say: [{ at: 3.2, spk: 'siumei', zh: '今晚，一個都唔可以留低。', en: 'Tonight, nobody gets left behind.', dur: 3.4 }] },
];
