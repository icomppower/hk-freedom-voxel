// 尾班車 The last train (after the hk2 win, before the hk3 scroll) — ≈ 20 s, three shots; the map is 元朗 (shot c).
//  (a) a train crosses the New Territories at night, lit windows past dark hills; side tracking shot (a set off the field)
//  (b) inside the carriage: tired passengers in black, hard hats on their laps, glowing phone screens (plain light, no app
//      UI); 龍仔 asleep sitting up, 小美 at the window. 「就快到元朗。」
//  (c) the doors open on the platform; white shirts in silhouette at the far end; the lights flicker once; hard cut
// Passengers are box figures in the shipped `blackbloc` / `white` skin palettes and heads (the crowd rig can't sit).
import { bx } from '../../world/maps/hkkit/props.js';
import { hash01 } from '../../core/rng.js';
import { CUT as LJ } from '../../chars/lungjai/cutclips.js';
import { CUT as SM } from '../../chars/siumei/cutclips.js';

export const map = 'yuenlong';
const AX = -320, AZ = 60;                                    // (a) the valley set
const CX = -320, CZ = 260;                                   // (b) the carriage set
const ease = (u) => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a.map((v, k) => v + (b[k] - v) * u);
let train, lj, sm, blink = null, flick = null;

/** One car: body, window band (lit when `lit`), doors, roof, bogies (+Z forward, 22 m). */
const car = (lit) => [bx([3.1, 3.3, 22], [0, 1.65, 0], 0xc8cac8), bx([3.12, 1.0, 19], [0, 2.2, 0], lit ? 0xfff0c8 : 0x2a3440),
  bx([3.14, 0.28, 22], [0, 0.66, 0], 0x5a8a6a), bx([3.0, 0.2, 21.8], [0, 3.38, 0], 0x9a9c9a), bx([2.6, 0.5, 3], [0, 0.1, -7], 0x2a2a2a), bx([2.6, 0.5, 3], [0, 0.1, 7], 0x2a2a2a)];

export function build(K) {
  K.sky({ bg: 0x0a1020, fog: 0x10182a, near: 60, far: 600, hemi: [0x4a5a88, 0x100c08, 0.6] });
  // (a) hills (dark stepped mounds), the viaduct, the train (4 cars, lit windows as self-lit boxes)
  const H = [];
  for (let k = 0; k < 40; k++) { const x = AX - 300 + k * 16, h = 30 + hash01(k, 1) * 60, z = AZ + 120 + hash01(k, 2) * 80;
    H.push(bx([26, h, 40], [x, h / 2 - 6, z], 0x080a10), bx([20, h * 0.55, 26], [x + 8, h * 0.27 - 6, z - 50], 0x0c1018)); }
  for (let k = 0; k < 60; k++) H.push(bx([0.5, 0.5, 0.5], [AX - 300 + hash01(k, 7) * 600, 20 + hash01(k, 8) * 30, AZ + 90 + hash01(k, 9) * 60], 0xffe8b0));   // village lights on the slopes
  for (let k = 0; k < 30; k++) H.push(bx([0.4, 5 + hash01(k, 3) * 3, 0.4], [AX - 240 + k * 17, 2, AZ + 18], 0x2a2e36));   // pylons
  H.push(bx([640, 1.2, 5], [AX, 3.2, AZ], 0x3a3e46), bx([640, 0.2, 0.2], [AX, 3.9, AZ - 0.8], 0x6a6a6a), bx([640, 0.2, 0.2], [AX, 3.9, AZ + 0.8], 0x6a6a6a));
  for (let k = 0; k < 20; k++) H.push(bx([2, 3.4, 3], [AX - 300 + k * 32, 1, AZ], 0x2e3238));   // viaduct piers
  K.box(H);
  const T = [];
  for (let c = 0; c < 4; c++) T.push(...car(false).map((q) => ({ ...q, p: [q.p[0], q.p[1], q.p[2] + c * 22.4] })));
  const W = [];
  for (let c = 0; c < 4; c++) for (let w = 0; w < 7; w++) for (const sx of [-1, 1]) W.push(bx([0.06, 0.9, 2], [sx * 1.57, 2.25, c * 22.4 - 9 + w * 3], 0xfff2c8));
  train = { body: K.box(T, { yaw: Math.PI / 2 }), win: K.glow(W, { yaw: Math.PI / 2, color: [1.5, 1.3, 0.9] }) };
  train.body.position.set(AX - 120, 4.2, AZ); train.win.position.copy(train.body.position);
  K.light('point', 0xffe8c0, 40, [AX, 6, AZ - 3], { dist: 30 });
  // (b) the carriage: floor, seats along both walls, dark windows, grab poles, ceiling light strips; passengers
  const C = [bx([3.0, 0.1, 20], [0, 0, 0], 0x6a6a70), bx([0.1, 2.4, 20], [-1.5, 1.2, 0], 0xc8cac8), bx([0.1, 2.4, 20], [1.5, 1.2, 0], 0xc8cac8),
    bx([3.0, 0.1, 20], [0, 2.4, 0], 0xd8d8d8)];
  for (const sx of [-1, 1]) {
    C.push(bx([0.5, 0.45, 18], [sx * 1.2, 0.225, 0], 0x3a4a6a), bx([0.1, 0.5, 18], [sx * 1.45, 0.7, 0], 0x3a4a6a));
    for (let w = 0; w < 6; w++) C.push(bx([0.04, 0.8, 2.2], [sx * 1.44, 1.5, -7.5 + w * 3], 0x0c1018));
  }
  for (let k = 0; k < 7; k++) C.push(bx([0.05, 2.3, 0.05], [0.4 * (k % 2 ? 1 : -1), 1.2, -7.5 + k * 2.5], 0xb8bcc2));
  K.box(C, { x: CX, z: CZ });
  K.glow([bx([0.3, 0.05, 18], [-0.6, 2.33, 0], 0xf0f4ff), bx([0.3, 0.05, 18], [0.6, 2.33, 0], 0xf0f4ff)], { x: CX, z: CZ, color: [1.8, 1.8, 1.9] });
  K.light('point', 0xe8f0ff, 16, [CX, 2.2, CZ - 3], { dist: 10 }); K.light('point', 0xe8f0ff, 14, [CX, 2.2, CZ + 4], { dist: 10 });
  const SEATS = [[-1.2, -6], [-1.2, -4.8], [-1.2, -2.2], [1.2, -5.4], [1.2, -3.6], [1.2, 0.8], [-1.2, 2.4], [1.2, 3.8]];
  const phones = [];
  SEATS.filter(([x, z]) => !(x > 0 && z > -2.8 && z < -1.4)).forEach(([x, z], k) => { K.fig('blackbloc', 'sit', CX + x, CZ + z, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0.05); if (k % 2 === 0) phones.push(bx([0.07, 0.12, 0.012], [x * 0.78, 0.9, z], 0xd0e8ff)); });
  K.glow(phones, { x: CX, z: CZ, color: [2.2, 2.4, 2.8] });
  lj = K.hero('lungjai').place(CX - 1.12, CZ - 0.6, Math.PI / 2, 0.05).pose(LJ.asleep, 4).weapons('hidden');
  sm = K.hero('siumei').place(CX + 0.9, CZ + 1.4, Math.PI / 2 + 0.3, 0.05).pose(SM.window, 3).weapons('closed');
  // (c) the platform: our own car at the platform edge, doors open; white shirts in silhouette far down the platform
  const P = [];
  for (let c = 0; c < 3; c++) P.push(...car(true).map((q) => ({ ...q, p: [q.p[0], q.p[1], q.p[2] + c * 22.4] })));
  const plat = K.g(0, 30);
  K.box(P, { x: 10.5, y: plat - 1.1, z: 6 });
  [[-2, 44], [-0.8, 46], [0.6, 43.5], [1.8, 45.5], [3, 44.4], [-3.2, 46.4], [0, 48], [2.4, 47.6], [-4.4, 47], [4.2, 46.6]].forEach(([x, z], k) => K.fig('white', 'shadow', x, z, Math.PI + (hash01(k, 4) - 0.5) * 0.4));
  flick = K.light('point', 0xf0f4ff, 0, [0, plat + 3.8, 40], { dist: 40 });
}

export const shots = [
  { dur: 6.5, // (a) the train across the valley, side tracking
    update: (u, t) => { const x = AX - 120 + t * 32; train.body.position.x = x; train.win.position.x = x; },
    cam: (u, t) => { const x = AX - 120 + t * 32 + 34 - t * 2.5; return { pos: [x, 8, AZ - 70], look: [x + 4, 8, AZ + 40], focus: [x, 4, AZ], fov: 42 }; } },
  { dur: 7, // (b) inside the carriage
    cam: (u) => ({ pos: lerp([CX + 0.9, 1.35, CZ - 3.2], [CX + 0.8, 1.3, CZ - 2.4], ease(u)), look: [CX - 0.6, 1.05, CZ + 0.4], focus: [CX - 1.0, 1.0, CZ - 0.5], fov: 42 }),
    say: [{ at: 2.2, spk: 'siumei', zh: '就快到元朗。', en: 'Almost at Yuen Long.', dur: 3 }] },
  { dur: 6, // (c) doors open on the platform; white shirts; the lights flicker once; hard cut
    set: (K) => { lj.place(5.4, 18, -0.2).pose(LJ.rest).weapons('shown'); sm.place(3.8, 17, -0.1).pose(SM.rest).weapons('closed'); },
    update: (u, t) => { const on = !(t > 3.6 && t < 3.72) && !(t > 3.85 && t < 3.93); flick.intensity = on ? 30 : 0; if (blink) blink(!on); },
    cam: (u) => ({ pos: lerp([8.4, 5.1, 12.5], [7.6, 5.0, 13.2], ease(u)), look: [1.5, 4.4, 46], focus: [4.6, 4.4, 20], fov: 42 }),
    events: [{ at: 0.2, do: (K, S) => { S.cue('chime'); S.cue('rumbleOff'); } }, { at: 0.9, do: (K, S) => S.cue('doors') }, { at: 2.0, do: (K, S) => S.cue('drone') }, { at: 3.6, do: (K, S) => S.cue('buzz') }] },
];
/** the player's DOM flash for the flicker (set by the player) */
export const onBlink = (fn) => { blink = fn; };
