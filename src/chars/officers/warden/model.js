// 狼督 The Warden-Wolf — boss officer model (crowd view officer-model hook). Character Sheets: long wolf muzzle, tall
// ears, heavy dark brow, amber eyes (the only warm colour on him), teeth at the jaw; plain grey plate, a heavy fur mantle,
// a long dark cloak with a ragged hem, clawed boots, plain square buckle; ≈ 1.15× hero scale; 偃月大刀-style glaive:
// 2.4 m dark shaft, broad curved blade 0.55 m past a plain collar — cracks at the collar under 20 % HP, breaks in two there
// on the KO (haft stays in hand, the head lies by him). Beaten, not killed: he kneels and raises the retreat horn.
import { wolfHead, wolfBody, glaive, HORN } from '../wolfkit.js';

const hex = (s) => parseInt(s.slice(1), 16);
export const WARDEN_PAL = {
  fur: hex('#5A5C63'), furD: hex('#2E3035'), furL: hex('#8A8C92'), amber: hex('#E0A030'),
  steel: hex('#4A5058'), steelD: hex('#30353C'), mantle: hex('#6C6E74'), cloak: hex('#1E1F24'),
  blade: hex('#C8CED6'), edge: hex('#EEF3F8'), pole: hex('#2A1F1A'), teeth: hex('#E8E4DA'),
  under: 0x26282c, belt: 0x2a2b2e, buckle: 0x8a8f96, boot: 0x1e1f24,
};
const G = glaive(WARDEN_PAL, { butt: -0.6, collar: 1.8, len: 0.55, h: 0.17, heavy: 1.15 });

export const WARDEN = {
  parts: { ...wolfBody(WARDEN_PAL, { bulk: 1.12, mantle: true, cloak: true }), head: wolfHead(WARDEN_PAL, { muzzle: 0.26, ear: 0.2, mane: 0.12 }) },
  weapon: G.weapon, cracked: G.cracked, crackAt: 0.2, broken: G.broken,
  scale: 1.32, tip: 2.35, voxel: 0.026, kneel: true, horn: HORN,
};
