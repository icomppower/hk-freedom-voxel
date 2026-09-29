// 狼 wolf garrison skin for the crowd (src/crowd/view.js skin hook): grunts, captains and generic officers of the 羊村
// chapters. Plain grey kit only — no flags, insignia, stars or symbols anywhere; the standard-bearer carries a lamp pole.
// Head frame: soldier head space (neck at y 0, crown ≈ 0.32, face toward +Z), metres.
const F = { fur: 0x6c6e74, furL: 0x9a9ca2, furD: 0x3a3c41, nose: 0x121212, amber: 0xc8923a };

const PALETTE = {
  armor: 0x4a4d52, hi: 0x6e7278, lace: 0x25272b, plate: 0x5a5e64, rivet: 0x7a7e84,
  cloth: 0x3a3c40, pants: 0x2e3034, wrap: 0x5c5f64, wrapD: 0x3a3c40, boot: 0x222326,
  skin: F.fur, skinD: F.furD, eye: 0x151515, brow: 0x2a2b2e,
  helm: 0x55585e, helmHi: 0x7c8086, band: 0x3c3e42, belt: 0x33302c, buckle: 0x6a6c70, bracer: 0x2e3034, tassel: 0x55585e,
  ...F,
};
const OFFICER = {
  ...PALETTE, armor: 0x3c4148, hi: 0x6a7078, lace: 0x1c1e22, plate: 0x4a5058, rivet: 0x8a9098, cloth: 0x26282c,
  pants: 0x222428, helm: 0x3c4148, helmHi: 0x8a9098, capeA: 0x2a2b2f, capeB: 0x34363b, fur: 0x55575e, furD: 0x2e3035,
  eye: F.amber,
};

/** Wolf head: skull, long muzzle, pointed ears, a plain grey skull cap (grunts) or a heavy mane (officers). */
function head(C, officer, b) {
  const h = [
    b([-0.1, 0.02, -0.1], [0.1, 0.24, 0.1], C.fur),                                   // skull
    b([-0.055, 0.03, 0.08], [0.055, 0.12, 0.25], C.furL),                             // muzzle
    b([-0.045, 0.12, 0.08], [0.045, 0.155, 0.21], C.fur),                             // muzzle ridge
    b([-0.028, 0.09, 0.245], [0.028, 0.13, 0.27], C.nose, true),                     // nose
    b([-0.05, 0.05, 0.2], [0.05, 0.065, 0.255], C.furD, true),                        // mouth line
    b([-0.07, 0.15, 0.095], [-0.035, 0.18, 0.106], C.eye, true), b([0.035, 0.15, 0.095], [0.07, 0.18, 0.106], C.eye, true),
    b([-0.085, 0.18, 0.09], [-0.02, 0.205, 0.106], C.furD, true), b([0.02, 0.18, 0.09], [0.085, 0.205, 0.106], C.furD, true),
    b([-0.105, 0.23, -0.045], [-0.045, 0.39, 0.02], C.furD), b([0.045, 0.23, -0.045], [0.105, 0.39, 0.02], C.furD),   // ears
    b([-0.125, -0.02, -0.12], [0.125, 0.07, 0.07], C.furD),                            // neck ruff
  ];
  if (officer) h.push(b([-0.14, 0.04, -0.15], [0.14, 0.2, -0.06], C.furD), b([-0.12, 0.2, -0.13], [0.12, 0.27, -0.03], C.furD));   // mane
  else h.push(b([-0.112, 0.2, -0.112], [0.112, 0.255, 0.09], C.helm), b([-0.03, 0.255, -0.03], [0.03, 0.28, 0.03], C.helmHi));   // plain cap
  return h;
}
/** Captain: a darker cap and a short dark mane crest (no plume colour, no badge). */
const crest = (C, b) => [b([-0.15, 0.175, -0.15], [0.15, 0.235, 0.15], 0x3a3d42), b([-0.035, 0.24, -0.25], [0.035, 0.36, 0.02], 0x2a2c30)];

const box = (s, p, c) => ({ s, p, c });
const SHAFT = 0x3d342c, STEEL = 0x8a8e94, DARK = 0x2e3034;
const weapons = {
  spear: [box([0.042, 0.042, 2.0], [0, 0, 0.38], SHAFT), box([0.065, 0.065, 0.06], [0, 0, -0.62], DARK), box([0.07, 0.07, 0.05], [0, 0, 1.4], DARK),
    box([0.085, 0.028, 0.16], [0, 0, 1.5], STEEL), box([0.05, 0.028, 0.12], [0, 0, 1.63], STEEL), box([0.025, 0.028, 0.06], [0, 0, 1.71], STEEL)],
  sword: [box([0.045, 0.045, 0.2], [0, 0, -0.02], DARK), box([0.05, 0.12, 0.04], [0, 0, 0.1], DARK),
    box([0.022, 0.085, 0.66], [0, 0.005, 0.45], STEEL), box([0.022, 0.1, 0.12], [0, 0.02, 0.76], STEEL), box([0.022, 0.05, 0.06], [0, 0.05, 0.84], STEEL)],
  glaive: [box([0.05, 0.05, 2.3], [0, 0, 0.45], SHAFT), box([0.08, 0.08, 0.06], [0, 0, 1.6], DARK),
    box([0.028, 0.16, 0.5], [0, 0.05, 1.9], STEEL), box([0.028, 0.1, 0.14], [0, 0.11, 2.2], STEEL)],
  // lamp pole (no cloth): a tall pole, a crossbar and a hooded lamp hanging from it
  pole: [box([0.055, 0.055, 3.3], [0, 0, 0.8], SHAFT), box([0.6, 0.045, 0.045], [0.25, 0, 2.4], SHAFT), box([0.02, 0.02, 0.2], [0.5, 0, 2.3], DARK),
    box([0.2, 0.2, 0.22], [0.5, 0, 2.1], 0xd8c890), box([0.24, 0.24, 0.05], [0.5, 0, 2.23], DARK), box([0.24, 0.24, 0.04], [0.5, 0, 1.98], DARK)],
  shield: { rim: 0x5a5e64, a: 0x46494e, b: 0x3e4146, boss: 0x7a7e84, ring: 0x5a5e64, far: 0x42454a },
};

export const WOLF = { palette: PALETTE, officerPalette: OFFICER, head, crest, weapons, flag: null };
