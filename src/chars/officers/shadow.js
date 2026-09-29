// 影爪 Shadow Claw — night-watch captain (officer model): near-black fur and cloak, a hood of fur over the ears, a long
// knife in the right hand, the bow in the left (his flare arrows are the chapter's: story/sheep2). Beaten, not killed.
import { wolfHead, wolfBody, box, b, HORN } from './wolfkit.js';

export const SHADOW_PAL = {
  fur: 0x3a3c42, furD: 0x1e1f23, furL: 0x5c5e64, amber: 0xd8a040, steel: 0x3a3e44, steelD: 0x24272c, mantle: 0x2c2e33,
  cloak: 0x17181c, blade: 0xb0b6be, edge: 0xdce2e8, pole: 0x2a1f1a, teeth: 0xdcd8ce, under: 0x222326, belt: 0x1e1e20, buckle: 0x5a5c60, boot: 0x17181c,
};
const C = SHADOW_PAL;
const bow = [];
for (let k = -7; k <= 7; k++) {                                     // limbs along the hand frame's y, curving back at the tips
  const y = k * 0.09, z = 0.08 - 0.0035 * k * k;
  bow.push(box([0.035, 0.1, 0.04], [0, y, z], Math.abs(k) < 2 ? C.pole : 0x2a2220));
}
bow.push(box([0.006, 1.24, 0.006], [0, 0, 0.08 - 0.0035 * 49 - 0.01], 0xd8d4c8));   // string
export const SHADOW = {
  parts: { ...wolfBody(C, { bulk: 0.98, cape: true }), head: [...wolfHead(C, { muzzle: 0.22, ear: 0.2, mane: 0.1 }),
    b([-0.12, 0.2, -0.13], [0.12, 0.3, 0.08], C.mantle)] },                          // fur hood band over the brow
  weapon: [box([0.04, 0.04, 0.18], [0, 0, -0.02], C.pole), box([0.04, 0.1, 0.04], [0, 0, 0.09], C.steelD),
    box([0.02, 0.07, 0.55], [0, 0.01, 0.38], C.blade), box([0.02, 0.02, 0.5], [0, 0.045, 0.36], C.edge)],
  offhand: bow, scale: 1.18, tip: 0.66, voxel: 0.03, kneel: true, horn: HORN,
};
