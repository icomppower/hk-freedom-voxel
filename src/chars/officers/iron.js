// 鐵吻 Iron Muzzle — harbor warden (officer model): broad, heavy, the iron plate strapped over his muzzle, a heavy glaive
// for the sweeping blows on the breakwater. Beaten, not killed.
import { wolfHead, wolfBody, glaive, HORN } from './wolfkit.js';

export const IRON_PAL = {
  fur: 0x62646a, furD: 0x34363b, furL: 0x8a8c92, amber: 0xd89a38, steel: 0x646a72, steelD: 0x3c4047, mantle: 0x5e6066,
  cloak: 0x2a2c31, blade: 0xbcc2ca, edge: 0xe4eaf0, pole: 0x2e241e, teeth: 0xe2ded4, under: 0x2e3034, belt: 0x2a2826, buckle: 0x7a7e84, boot: 0x1f2024,
};
const G = glaive(IRON_PAL, { butt: -0.55, collar: 1.7, len: 0.6, h: 0.2, heavy: 1.3 });
export const IRON = {
  parts: { ...wolfBody(IRON_PAL, { bulk: 1.22, mantle: true }), head: wolfHead(IRON_PAL, { muzzle: 0.24, ear: 0.16, iron: true, mane: 0.1 }) },
  weapon: G.weapon, broken: G.broken, scale: 1.3, tip: 2.3, voxel: 0.03, kneel: true, horn: HORN,
};
