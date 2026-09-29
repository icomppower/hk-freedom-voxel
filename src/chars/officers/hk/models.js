// Officer + boss models of 香港自由戰士 (crowd view officer-model hook; Contracts ids): officers `raptor` 速龍 · `plain` 便衣,
// bosses `stamp` 777 · `shocker` 比卡超 · `fixer` 強哥 · `bear` 維尼熊 (+ `bear_unmasked`, his phase-4 swap) · `clone` 分身.
// Character Sheets 角色設定 (Notion). Scale: the crowd officer is 1.22 (grey-kit sergeant in sheep-village) ≈ 1.06 × hero,
// so hero × k ≈ 1.15 k. Every boss is an original archetype: no real person's likeness. 比卡超 has no yellow body, red
// cheeks, pointed black-tipped ears or lightning tail; 維尼熊 has no yellow-gold fur, red shirt, honey pot or round
// cartoon bear face. No badge, flag, crest, emblem, number or slogan on anything. Beaten, not killed: they kneel.
import { shade } from '../../../core/voxel.js';
import { humanHead, humanBody, roundShield, stick, box, b } from './hkkit.js';

const hex = (s) => parseInt(s.slice(1), 16);
const SKIN = { skin: 0xd6a67e, skinD: 0xb48460, eye: 0x151515, brow: 0x241c18 };

// ---------------------------------------------------------------- 速龍 raptor: all black, helmet, long baton + round shield
const RAP = { ...SKIN, shirt: hex('#111122'), pants: hex('#111122'), boot: 0x0a0a0a, glove: 0x0e0e0e, belt: 0x080808 };
export const RAPTOR = {
  parts: { ...humanBody(RAP, { bulk: 1.05, vest: 0x1a1a2e, patch: true, pads: 0x1a1a2e }), head: humanHead(RAP, { helmet: { c: 0x0c0c12, visor: 0x7a94a8, snout: true } }) },
  weapon: [...stick(0x151515, { butt: -0.25, tip: 0.95, w: 0.045 }), box([0.06, 0.06, 0.1], [0, 0, -0.15], 0x2a2a2a)],
  offhand: roundShield(0x6e8698, 0x14161a),
  scale: 1.22, tip: 0.95, voxel: 0.03, kneel: true,
};

// ---------------------------------------------------------------- 便衣 plainclothes: grey jacket, cap, pepper-ball launcher
const PLN = { ...SKIN, shirt: 0x3a3a44, pants: 0x2e2e36, boot: 0x1a1a1a, belt: 0x1a1a1a };
export const PLAIN = {
  parts: { ...humanBody(PLN, { jacket: hex('#555566') }), head: humanHead(PLN, { cap: 0x2a2a30, hair: 0x141414 }) },
  // launcher on the bow joint: stock, body, hopper, barrel (held like a bow: along the hand frame)
  weapon: [box([0.06, 0.1, 0.3], [0, 0, 0.05], 0x22262c), box([0.08, 0.12, 0.2], [0, 0.02, 0.28], 0x30353c),
    box([0.09, 0.12, 0.1], [0, 0.12, 0.3], 0x5a6a2a), box([0.045, 0.045, 0.45], [0, 0.03, 0.58], 0x1e2226)],
  scale: 1.18, tip: 0.8, voxel: 0.03, kneel: true,
};

// ---------------------------------------------------------------- 777 The Rubber Stamp: 1.1×, grey suit, silver hair, gold
// tie-chain; giant rubber-stamp hammer 1.8 m — the stamp head cracks under 25 % and splits on the KO
const STP = { ...SKIN, shirt: 0xe8e8e8, pants: hex('#455A64'), boot: 0x1a1a1a, belt: 0x1a1a1a };
const STAMP_HANDLE = [box([0.06, 0.06, 1.35], [0, 0, 0.4], 0x5a3a24), box([0.1, 0.1, 0.16], [0, 0, -0.3], 0x3a2416), box([0.08, 0.08, 0.05], [0, 0, 1.05], 0xc8a040)];
const stampHead = (z) => [box([0.36, 0.3, 0.3], [0, 0, z], 0x6a4a30), box([0.38, 0.06, 0.32], [0, 0.18, z], 0xb3261e),   // block + red pad (striking face)
  box([0.38, 0.03, 0.32], [0, -0.165, z], 0x4a3220)];
export const STAMP = {
  parts: { ...humanBody(STP, { bulk: 1.15, jacket: hex('#455A64'), tie: 0x3a2a2e, chain: true }), head: humanHead(STP, { silver: 0xc8ccd0, brows: true }) },
  weapon: [...STAMP_HANDLE, ...stampHead(1.28)],
  cracked: [...STAMP_HANDLE, ...stampHead(1.28), box([0.39, 0.012, 0.012], [0, 0.04, 1.28], 0x0a0a0a), box([0.012, 0.2, 0.012], [0.05, 0, 1.28], 0x0a0a0a),
    box([0.16, 0.04, 0.33], [0, 0.22, 1.28], 0xff3a2a)],                               // cracks + the pad glowing red on rage
  crackAt: 0.25,
  broken: { haft: [...STAMP_HANDLE], head: [box([0.18, 0.3, 0.3], [-0.1, 0, 0.15], 0x6a4a30), box([0.17, 0.3, 0.3], [0.12, -0.02, 0.1], 0x5e422a),
    box([0.2, 0.06, 0.3], [-0.1, 0.18, 0.15], 0xb3261e)] },                            // the stamp split in two
  scale: 1.26, tip: 1.45, voxel: 0.028, kneel: true,
};

// ---------------------------------------------------------------- 比卡超 The Shocker: 1.1×, grey riot kit, lime hi-vis bands,
// helmet with a black visor down, electric-blue arcs on the stun pole + electrified shield
const SHK = { ...SKIN, shirt: 0x5a5e66, pants: 0x4a4e56, boot: 0x141414, glove: 0x1a1a1a };
const ARC = 0x5ad8ff;
export const SHOCKER = {
  parts: { ...humanBody(SHK, { bulk: 1.12, vest: 0x464a52, bands: 0xb8f040, patch: true, pads: 0x3a3e46 }),
    head: humanHead(SHK, { helmet: { c: 0x2a2e34, visor: false, shade: 0x0c0c10 } }) },
  weapon: [...stick(0x22262c, { butt: -0.35, tip: 1.35, w: 0.05 }), box([0.1, 0.1, 0.12], [0, 0, 1.4], 0x3a3f46),
    box([0.03, 0.18, 0.03], [0.03, 0.05, 1.5], ARC), box([0.18, 0.03, 0.03], [0, -0.04, 1.47], ARC), box([0.03, 0.03, 0.14], [-0.05, 0.06, 1.55], ARC)],
  offhand: [...roundShield(0x3a4250, 0x1a1e24, 0.4), box([0.6, 0.02, 0.02], [0, 0.2, 0.16], ARC), box([0.02, 0.5, 0.02], [0.15, 0.0, 0.16], ARC),
    box([0.4, 0.02, 0.02], [-0.05, -0.15, 0.16], ARC)],                                 // arcs crawling over the shield
  scale: 1.26, tip: 1.5, voxel: 0.028, kneel: true,
};

// ---------------------------------------------------------------- 強哥 The Fixer: 1.15×, heavy, white shirt open over a vest,
// gold chain, long rattan pole
const FIX = { ...SKIN, shirt: 0x3a3a3a, pants: 0x2a2a2a, boot: 0x1a1a1a, belt: 0x1a1a1a };
export const FIXER = {
  parts: { ...humanBody(FIX, { bulk: 1.3, jacket: 0xeeeeee, chain: true, bare: true }), head: humanHead(FIX, { hair: 0x141414, brows: true }) },
  weapon: stick(0xb08850, { butt: -0.5, tip: 1.6, w: 0.05, node: 0.4, nodeC: 0x8a6a3a }),
  scale: 1.32, tip: 1.6, voxel: 0.03, kneel: true,
};

// ---------------------------------------------------------------- 維尼熊 The Bear: 1.2×, dark high-collared court robe, black
// bear-pelt mantle, pale lacquered mask with narrow eyes, gold trim; sceptre-blade 1.8 m. P4: mask off (bear_unmasked: an
// original stern face with heavy brows). KO: the sceptre breaks, the mask lies shattered by him.
const BEAR_C = { ...SKIN, skin: 0xd8b090, shirt: hex('#1B1B22'), pants: hex('#1B1B22'), boot: 0x0e0e12, glove: 0x14141a };
const SCEPTRE_HAFT = [box([0.05, 0.05, 1.5], [0, 0, 0.4], 0x1a1a20), box([0.07, 0.07, 0.05], [0, 0, -0.35], 0xc8a040),
  box([0.07, 0.07, 0.04], [0, 0, 0.5], 0xc8a040), box([0.09, 0.09, 0.08], [0, 0, 1.17], 0xc8a040)];
const sceptreBlade = (z) => [box([0.025, 0.1, 0.5], [0, 0, z + 0.25], 0xc8ced6), box([0.028, 0.04, 0.46], [0, 0.06, z + 0.25], 0xeef3f8), box([0.025, 0.05, 0.08], [0, 0, z + 0.54], 0xeef3f8)];
const bearBody = humanBody(BEAR_C, { bulk: 1.15, robe: BEAR_C.shirt, mantle: hex('#2A2320'), trim: 0xc8a040 });
export const BEAR = {
  parts: { ...bearBody, head: humanHead(BEAR_C, { hair: 0x0e0e10, mask: 0xd8d0c0, maskTrim: 0xc8a040 }) },
  weapon: [...SCEPTRE_HAFT, ...sceptreBlade(1.2)],
  broken: { haft: [...SCEPTRE_HAFT], head: [box([0.1, 0.03, 0.12], [-0.08, 0, 0], 0xe8e0d0), box([0.09, 0.03, 0.11], [0.09, 0, 0.05], 0xe0d8c6),
    box([0.04, 0.012, 0.04], [-0.07, 0.016, 0.02], 0x0a0a0c)] },                        // the mask, split in two
  scale: 1.38, tip: 1.75, voxel: 0.026, kneel: true,
};
export const BEAR_UNMASKED = { ...BEAR, parts: { ...bearBody, head: humanHead({ ...BEAR_C, brow: 0x141014 }, { hair: 0x0e0e10, brows: true }) } };

// ---------------------------------------------------------------- 分身 clone: 0.9×, dark translucent-looking copy of the Bear
const CLONE_C = { ...BEAR_C, skin: 0x3a3848, skinD: 0x2a2838, shirt: 0x2a2838, pants: 0x2a2838, glove: 0x2a2838 };
export const CLONE = {
  parts: { ...humanBody(CLONE_C, { robe: 0x2e2c3c, mantle: 0x201e2a, trim: 0x5a5470 }), head: humanHead(CLONE_C, { hair: 0x16141e, mask: 0x4a4658, maskTrim: 0x5a5470 }) },
  weapon: [box([0.05, 0.05, 1.5], [0, 0, 0.4], 0x201e2a), ...sceptreBlade(1.2).map((q) => ({ ...q, c: shade(0x6a6488, 1) }))],
  scale: 1.04, tip: 1.75, voxel: 0.03, kneel: false,
};
