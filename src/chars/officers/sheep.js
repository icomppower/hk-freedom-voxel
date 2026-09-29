// 羊 sheep villager skin for the crowd's allies (src/crowd/view.js skin hook): the flock that fights beside 阿角 and 小咩 —
// fishing-village clothes, wool caps, dark faces, pitchforks, oars and lantern poles. No standards: lanterns.
const PALETTE = {
  armor: 0x6b5a45, hi: 0x8a765c, lace: 0x3e3226, plate: 0x7a6750, rivet: 0x8a765c,
  cloth: 0x3f6e8c, pants: 0x4a4036, wrap: 0xd8d0c0, wrapD: 0xa89e8c, boot: 0x3a2e24,
  skin: 0x2f2d2a, skinD: 0x1f1d1b, eye: 0xe8e2d0, brow: 0x1a1816,
  helm: 0xefe9dc, helmHi: 0xfffaf0, band: 0x3f6e8c, tassel: 0xefe9dc, belt: 0x5a4632, buckle: 0x8a765c, bracer: 0x6b5a45,
};

/** Sheep head: long dark face, light eyes, a wool cap, ears out to the sides, a wool ruff. */
function head(C, officer, b) {
  return [
    b([-0.075, 0.02, -0.06], [0.075, 0.22, 0.12], C.skin),                             // face
    b([-0.055, 0.03, 0.1], [0.055, 0.12, 0.19], C.skin),                               // muzzle
    b([-0.03, 0.08, 0.185], [0.03, 0.11, 0.196], C.skinD, true),                      // nose
    b([-0.07, 0.15, 0.1], [-0.035, 0.175, 0.126], C.eye, true), b([0.035, 0.15, 0.1], [0.07, 0.175, 0.126], C.eye, true),
    b([-0.11, 0.17, -0.11], [0.11, 0.31, 0.1], C.helm),                               // wool cap
    b([-0.07, 0.3, -0.07], [0.07, 0.35, 0.07], C.helmHi),                             // tuft
    b([-0.17, 0.14, -0.02], [-0.09, 0.18, 0.04], C.skin), b([0.09, 0.14, -0.02], [0.17, 0.18, 0.04], C.skin),   // ears
    b([-0.11, -0.01, -0.1], [0.11, 0.06, 0.08], C.wrap),                               // wool ruff
  ];
}

const box = (s, p, c) => ({ s, p, c });
const WOOD = 0x6b4a2b, IRON = 0x707478;
const weapons = {
  spear: [box([0.04, 0.04, 1.9], [0, 0, 0.35], WOOD), box([0.22, 0.03, 0.03], [0, 0, 1.3], IRON),     // pitchfork
    box([0.025, 0.025, 0.3], [-0.1, 0, 1.45], IRON), box([0.025, 0.025, 0.34], [0, 0, 1.47], IRON), box([0.025, 0.025, 0.3], [0.1, 0, 1.45], IRON)],
  sword: [box([0.04, 0.04, 0.55], [0, 0, 0.18], WOOD), box([0.035, 0.16, 0.4], [0, 0, 0.62], 0x8a6a42)],   // oar club
  glaive: [box([0.045, 0.045, 2.3], [0, 0, 0.45], WOOD), box([0.03, 0.03, 0.22], [0, 0.08, 1.6], IRON), box([0.03, 0.12, 0.03], [0, 0.04, 1.7], IRON)],   // boat hook
  // lantern pole: the flock's paper lantern
  pole: [box([0.05, 0.05, 3.2], [0, 0, 0.8], WOOD), box([0.55, 0.04, 0.04], [0.22, 0, 2.35], WOOD), box([0.015, 0.015, 0.12], [0.45, 0, 2.28], 0x2a2018),
    box([0.24, 0.24, 0.28], [0.45, 0, 2.08], 0xd8452a), box([0.18, 0.18, 0.04], [0.45, 0, 2.24], 0x2a2018), box([0.18, 0.18, 0.04], [0.45, 0, 1.93], 0x2a2018)],
  shield: { rim: 0x8a6a3c, a: 0xb89058, b: 0xa07c48, boss: 0x6b4a2b, ring: 0x8a6a3c, far: 0xa07c48 },   // woven basket lid
};

export const SHEEP = { palette: PALETTE, head, weapons, flag: null };
