// 雨後 The night after (after the hk1 win, before the hk2 scroll) — ≈ 20 s, three shots on the admiralty map at night.
//  (a) rain on an empty Harcourt Road, hundreds of broken umbrellas on the asphalt, the last tear-gas haze under the
//      streetlights; slow low dolly
//  (b) the first-aid station under the footbridge: 小美 wraps 龍仔's forearm. 「聽日仲去唔去？」 · 「去。」
//  (c) a pedestrian tunnel covered in coloured sticky notes (連儂牆); push in; 小美 sticks a pink note 「一齊嚟，一齊走」
// Actors: the shipped 龍仔 / 小美 models (umbrellas hidden while her hands work). Props: box lists (hkkit/props umbrellas).
import * as THREE from 'three';
import { umbrella, bx } from '../../world/maps/hkkit/props.js';
import { hash01 } from '../../core/rng.js';
import { CUT as LJ } from '../../chars/lungjai/cutclips.js';
import { CUT as SM } from '../../chars/siumei/cutclips.js';

export const map = 'admiralty';
const TX = 170, TZ = -40;                                     // the tunnel set, off the playfield
const UMB = [0xffd700, 0x2a2a2a, 0x3a6ab0, 0xe8e8e8, 0xd0402a, 0x6a3a8a, 0x2a8a5a, 0xf48fb1];
const ease = (u) => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a.map((v, k) => v + (b[k] - v) * u);
let lj, sm, note;

export function build(K) {
  // (a) broken umbrellas: collapsed canopies (a flat, creased panel or two), snapped shafts, flat on the wet road
  const B = [];
  for (let k = 0; k < 280; k++) {
    const x = (hash01(k, 1) - 0.5) * 34, z = -146 + hash01(k, 2) * 70, yaw = hash01(k, 3) * 6.28, col = UMB[k % UMB.length], y = K.g(x, z);
    if (Math.abs(x) < 1.2 && hash01(k, 4) < 0.7) continue;
    const w = 0.7 + hash01(k, 5) * 0.4, tilt = (hash01(k, 6) - 0.5) * 0.5;
    B.push(bx([w, 0.03, w * 0.6], [x, y + 0.06, z], col, [tilt, yaw, 0.2 * (hash01(k, 7) - 0.5)]));
    if (hash01(k, 8) < 0.6) B.push(bx([w * 0.6, 0.03, w * 0.45], [x + Math.sin(yaw) * 0.3, y + 0.14, z + Math.cos(yaw) * 0.3], col, [0.5 + tilt, yaw + 0.4, 0.3]));
    B.push(bx([0.03, 0.03, 0.8], [x - Math.cos(yaw) * 0.2, y + 0.05, z + Math.sin(yaw) * 0.2], 0x2a2a2a, [0, yaw + 0.9 * (hash01(k, 9) - 0.5), 0]));
  }
  K.box(B);
  K.haze([...Array(10)].map((_, k) => [(k % 2 ? 1 : -1) * (6 + hash01(k, 9) * 10), 1.6, -140 + k * 7, 7 + hash01(k, 8) * 4]), 0xb8c4b0, 0.22);
  // (b) the first-aid station under the footbridge: a folding table, kits, a work lamp
  K.box([bx([1.6, 0.06, 0.8], [0, 0.78, 0], 0xd8d8d0), bx([0.05, 0.76, 0.05], [-0.72, 0.38, -0.34], 0x6a6a6a), bx([0.05, 0.76, 0.05], [0.72, 0.38, 0.34], 0x6a6a6a),
    bx([0.05, 0.76, 0.05], [-0.72, 0.38, 0.34], 0x6a6a6a), bx([0.05, 0.76, 0.05], [0.72, 0.38, -0.34], 0x6a6a6a),
    bx([0.4, 0.22, 0.28], [-0.4, 0.92, 0.1], 0xe53935), bx([0.12, 0.04, 0.3], [-0.4, 1.04, 0.1], 0xffffff), bx([0.3, 0.04, 0.12], [-0.4, 1.04, 0.1], 0xffffff),
    bx([0.24, 0.1, 0.1], [0.3, 0.86, -0.1], 0xdde6ea), bx([0.1, 0.18, 0.1], [0.5, 0.9, 0.2], 0xe8f0f8)], { x: -2.6, y: K.g(-2.6, -55.4), z: -55.4 });
  K.light('point', 0xfff0d8, 22, [-1.2, 3.2, -55], { dist: 9 });
  lj = K.hero('lungjai').place(1.1, -56, -Math.PI / 2).pose(LJ.forearm, 2).weapons('hidden');
  sm = K.hero('siumei').place(0.2, -56, Math.PI / 2).pose(SM.wrap, 1.2).weapons('hidden');
  // (c) the tunnel: floor, curved-ish walls and ceiling of boxes, both walls papered in sticky notes
  const T = [bx([4, 0.2, 26], [0, -0.1, 0], 0x5a5650), bx([0.3, 3, 26], [-2, 1.5, 0], 0x7a766e), bx([0.3, 3, 26], [2, 1.5, 0], 0x7a766e), bx([4.3, 0.3, 26], [0, 3.1, 0], 0x8a867e)];
  const NOTES = [0xfff176, 0xf48fb1, 0x80deea, 0xa5d6a7, 0xffcc80, 0xce93d8, 0xffffff, 0xffab91];
  for (let k = 0; k < 2600; k++) {
    const side = k % 2 ? 1 : -1, z = -12.5 + hash01(k, 11) * 25, y = 0.3 + hash01(k, 12) * 2.5;
    T.push(bx([0.012, 0.075, 0.075], [side * 1.84, y, z], NOTES[(k * 7) % NOTES.length], [0, 0, (hash01(k, 13) - 0.5) * 0.3]));
  }
  K.box(T, { x: TX, z: TZ });
  K.light('point', 0xfff4e0, 18, [TX, 2.8, TZ + 4], { dist: 16 }); K.light('point', 0xfff4e0, 14, [TX, 2.8, TZ - 6], { dist: 16 });
  // her note: a pink square with the words, stuck when her hand reaches the wall (hidden until then)
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d'); g.fillStyle = '#f48fb1'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#3a1020';
  g.font = '700 28px "Kaiti SC", "HudBrush", serif'; g.textAlign = 'center'; g.fillText('一齊嚟，', 64, 54); g.fillText('一齊走', 64, 92);
  note = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv), roughness: 0.9 }));
  note.position.set(TX + 1.82, 1.55, TZ + 0.5); note.rotation.y = -Math.PI / 2; note.visible = false; K.root.add(note);
  K.rain(() => [0, K.g(0, -110), -110]);
}

export const shots = [
  { dur: 7, // (a) the empty road
    set: (K) => { lj.place(1.1, -56); },
    cam: (u) => ({ pos: lerp([-5, 0.55, -138], [-2.5, 0.75, -122], ease(u)), look: lerp([2, 0.4, -108], [3, 0.5, -96], ease(u)), fov: 42 }),
    events: [] },
  { dur: 7, // (b) first aid
    cam: (u) => ({ pos: lerp([0.9, 1.55, -52.4], [0.8, 1.5, -53.2], ease(u)), look: [0.6, 1.25, -56], focus: [0.6, 1.3, -56], fov: 34 }),
    events: [{ at: 1.8, do: (K, S) => S.cue('tape') }, { at: 3.4, do: (K, S) => S.cue('tape') }],
    say: [{ at: 1.0, spk: 'siumei', zh: '聽日仲去唔去？', en: 'Going again tomorrow?', dur: 2.6 }, { at: 4.2, spk: 'lungjai', zh: '去。', en: 'Yes.', dur: 2.2 }] },
  { dur: 7, // (c) the note wall
    set: (K) => { sm.place(TX + 1.0, TZ + 0.4, Math.PI / 2).pose(SM.note, 2).weapons('hidden'); lj.place(TX - 0.9, TZ + 3.2, Math.PI - 0.5).pose(LJ.rest).weapons('hidden'); },
    cam: (u) => ({ pos: lerp([TX - 1.2, 1.6, TZ - 7], [TX - 0.2, 1.6, TZ - 2.2], ease(u)), look: lerp([TX + 1.6, 1.4, TZ + 2], [TX + 1.8, 1.5, TZ + 0.6], ease(u)), focus: [TX + 1.8, 1.5, TZ + 0.5], fov: 40 }),
    events: [{ at: 1.1, do: (K, S) => { note.visible = true; S.cue('paper'); } }] },
];
