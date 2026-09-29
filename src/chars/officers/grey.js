// 灰牙 Grey Fang — garrison sergeant (officer model): plain grey plate, tower shield on the left arm, spear. Holds
// chokepoints (Story Bible). Beaten, not killed: kneels.
import { wolfHead, wolfBody, box, HORN } from './wolfkit.js';

export const GREY_PAL = {
  fur: 0x86888e, furD: 0x4c4e53, furL: 0xb0b2b8, amber: 0xc89a48, steel: 0x6c7076, steelD: 0x44474c, mantle: 0x6c6e74,
  cloak: 0x34363b, blade: 0xb8bec6, edge: 0xe0e6ec, pole: 0x3d342c, teeth: 0xe6e2d8, under: 0x3a3c40, belt: 0x33302c, buckle: 0x6a6c70, boot: 0x222326,
};
const C = GREY_PAL;
export const GREY = {
  parts: { ...wolfBody(C, { bulk: 1.05, cape: true }), head: wolfHead(C, { muzzle: 0.22, ear: 0.18, mane: 0.06 }) },
  weapon: [box([0.045, 0.045, 2.2], [0, 0, 0.45], C.pole), box([0.06, 0.06, 0.05], [0, 0, -0.64], C.steelD), box([0.07, 0.07, 0.05], [0, 0, 1.55], C.steelD),
    box([0.09, 0.028, 0.2], [0, 0, 1.68], C.blade), box([0.05, 0.028, 0.12], [0, 0, 1.82], C.blade), box([0.024, 0.028, 0.06], [0, 0, 1.9], C.edge)],
  // tower shield in the left hand frame: tall plain slab, darker rim, a plain square boss — no device on it
  offhand: [box([0.52, 0.92, 0.06], [0, 0.04, 0.12], C.steel), box([0.56, 0.05, 0.07], [0, 0.5, 0.12], C.steelD), box([0.56, 0.05, 0.07], [0, -0.42, 0.12], C.steelD),
    box([0.04, 0.92, 0.07], [-0.27, 0.04, 0.12], C.steelD), box([0.04, 0.92, 0.07], [0.27, 0.04, 0.12], C.steelD), box([0.12, 0.12, 0.04], [0, 0.06, 0.16], C.steelD)],
  scale: 1.22, tip: 1.9, voxel: 0.03, kneel: true, horn: HORN,
};
