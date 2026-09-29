// Crowd skins of 香港自由戰士 (src/crowd/view.js skin hook; Contracts ids): foe `riot` 防暴警 · foe `white` 白衫友 · ally
// `blackbloc` 手足 · ally `civil` 乘客. Palettes from the Character Sheets / the Phaser game's enemies.js. Head frame: soldier
// head space (neck at y 0, crown ≈ 0.32, face toward +Z), metres. No flags, badges, insignia, numbers or slogans: every
// bearer's pole carries a lamp or an umbrella, never cloth (flag: null).
import { shade } from '../../../core/voxel.js';

const box = (s, p, c) => ({ s, p, c });

// ---------------------------------------------------------------- 防暴警 riot: plain dark blue kit, black helmet with a
// raised clear visor, gas-mask snout, blank shoulder patch, round shield + short baton
const RIOT_PAL = {
  armor: 0x1a2a4a, hi: 0x2c4270, lace: 0x0f1a30, plate: 0x24385f, rivet: 0x31466e,
  cloth: 0x1a2a4a, pants: 0x16243e, wrap: 0x24385f, wrapD: 0x121e34, boot: 0x111111,
  skin: 0xd6a67e, skinD: 0xb48460, eye: 0x151515, brow: 0x201a18,
  helm: 0x141414, helmHi: 0x2a2a2a, band: 0x1a2a4a, tassel: 0x141414, belt: 0x111111, buckle: 0x3a3a3a, bracer: 0x24385f,
};
const RIOT_OFF = { ...RIOT_PAL, armor: 0x24385f, hi: 0x3a5488, plate: 0x2e4674, cloth: 0x24385f, pants: 0x1c2c4c, capeA: 0x1a2a4a, capeB: 0x24385f };
function riotHead(C, officer, b) {
  return [
    b([-0.1, 0.02, -0.09], [0.1, 0.25, 0.1], C.skin),
    b([-0.07, 0.12, 0.095], [-0.03, 0.15, 0.106], C.eye, true), b([0.03, 0.12, 0.095], [0.07, 0.15, 0.106], C.eye, true),
    b([-0.06, 0.02, 0.1], [0.06, 0.1, 0.17], 0x1e2226), b([-0.045, 0.03, 0.17], [0.045, 0.085, 0.2], 0x3a4046),     // gas-mask snout
    b([-0.1, 0.03, 0.08], [-0.06, 0.08, 0.13], 0x2a2e33), b([0.06, 0.03, 0.08], [0.1, 0.08, 0.13], 0x2a2e33),       // filters
    b([-0.125, 0.14, -0.13], [0.125, 0.32, 0.115], C.helm), b([-0.1, 0.32, -0.1], [0.1, 0.345, 0.08], C.helmHi),   // helmet
    b([-0.125, 0.04, -0.13], [0.125, 0.15, -0.07], C.helm),                             // neck guard
    b([-0.12, 0.26, 0.1], [0.12, 0.32, 0.145], officer ? 0x8fb4c8 : 0x9fc4d8),          // clear visor, raised
  ];
}
const RIOT_W = {
  spear: [box([0.04, 0.04, 1.1], [0, 0, 0.3], 0x151515), box([0.06, 0.06, 0.08], [0, 0, -0.2], 0x2a2a2a)],        // long baton
  sword: [box([0.04, 0.04, 0.62], [0, 0, 0.22], 0x151515), box([0.05, 0.05, 0.06], [0, 0, -0.08], 0x2a2a2a),
    box([0.03, 0.12, 0.03], [0, 0.05, 0.02], 0x2a2a2a)],                                                            // side-handle baton
  glaive: [box([0.08, 0.1, 0.55], [0, 0.02, 0.3], 0x22262c), box([0.09, 0.09, 0.09], [0, 0, 0.6], 0x30353c),      // launcher: stock, tube
    box([0.07, 0.07, 0.4], [0, 0.03, 0.8], 0x3a3f46), box([0.03, 0.1, 0.06], [0, -0.07, 0.15], 0x1a1a1a)],
  pole: [box([0.05, 0.05, 3.0], [0, 0, 0.7], 0x2a2a2a), box([0.3, 0.2, 0.2], [0, 0.05, 2.2], 0x30353c), box([0.26, 0.16, 0.02], [0, 0.05, 2.31], 0xfff4d0)],   // floodlight pole
  shield: { rim: 0x1c1f24, a: 0x7e96a8, b: 0x6e8698, boss: 0x2a2e33, ring: 0x1c1f24, far: 0x6e8698 },             // clear round shield
};
export const RIOT = { palette: RIOT_PAL, officerPalette: RIOT_OFF, head: riotHead, crest: (C, b) => [b([-0.13, 0.3, -0.13], [0.13, 0.33, 0.13], 0x2e3a52)], weapons: RIOT_W, flag: null };

// ---------------------------------------------------------------- 白衫友 white shirts: white tee, grey trousers, bare heads,
// rattan canes
const WHITE_PAL = {
  armor: 0xeeeeee, hi: 0xffffff, lace: 0xcfcfcf, plate: 0xe4e4e4, rivet: 0xdadada,
  cloth: 0xeeeeee, pants: 0x9e9e9e, wrap: 0x9e9e9e, wrapD: 0x7e7e7e, boot: 0x2a2826,
  skin: 0xd2a07a, skinD: 0xae7e5c, eye: 0x151515, brow: 0x1a1512,
  helm: 0x1a1816, helmHi: 0x2a2624, band: 0xeeeeee, tassel: 0x1a1816, belt: 0x2a2826, buckle: 0x8a8a8a, bracer: 0xd2a07a,
};
const WHITE_OFF = { ...WHITE_PAL, pants: 0x6e6e6e, capeA: 0xe0e0e0, capeB: 0xeeeeee };
function whiteHead(C, officer, b) {
  return [
    b([-0.1, 0.02, -0.09], [0.1, 0.25, 0.1], C.skin),
    b([-0.07, 0.12, 0.095], [-0.03, 0.15, 0.106], C.eye, true), b([0.03, 0.12, 0.095], [0.07, 0.15, 0.106], C.eye, true),
    b([-0.08, 0.16, 0.095], [-0.02, 0.18, 0.11], C.brow, true), b([0.02, 0.16, 0.095], [0.08, 0.18, 0.11], C.brow, true),
    b([-0.015, 0.08, 0.1], [0.02, 0.13, 0.125], C.skinD),
    b([-0.105, 0.2, -0.105], [0.105, 0.27, 0.09], C.helm), b([-0.105, 0.08, -0.105], [0.105, 0.21, -0.05], C.helm),   // cropped hair
  ];
}
const CANE = 0xb08850;
const WHITE_W = {
  spear: [box([0.035, 0.035, 1.4], [0, 0, 0.45], CANE), box([0.045, 0.045, 0.04], [0, 0, 0.6], shade(CANE, 0.7))],
  sword: [box([0.032, 0.032, 0.95], [0, 0, 0.32], CANE), box([0.042, 0.042, 0.04], [0, 0, 0.3], shade(CANE, 0.7))],
  glaive: [box([0.04, 0.04, 1.8], [0, 0, 0.6], CANE), box([0.05, 0.05, 0.04], [0, 0, 0.9], shade(CANE, 0.7))],
  pole: [box([0.04, 0.04, 2.2], [0, 0, 0.5], CANE)],
  shield: { rim: 0x6a6a6a, a: 0x9a9a9a, b: 0x8a8a8a, boss: 0x5a5a5a, ring: 0x6a6a6a, far: 0x8a8a8a },             // bin lid
};
export const WHITE = { palette: WHITE_PAL, officerPalette: WHITE_OFF, head: whiteHead, weapons: WHITE_W, flag: null };

// ---------------------------------------------------------------- 手足 blackbloc (ally): black tees, yellow hard hats,
// goggles and black masks, closed umbrellas; the bearer holds a big open yellow umbrella up on a pole
const BB_PAL = {
  armor: 0x1a1a1a, hi: 0x2c2c2c, lace: 0x0e0e0e, plate: 0x222222, rivet: 0x303030,
  cloth: 0x181818, pants: 0x1c1c1c, wrap: 0x262626, wrapD: 0x141414, boot: 0x222222,
  skin: 0xf1c27d, skinD: 0xcf9f60, eye: 0x151515, brow: 0x141414,
  helm: 0xffd700, helmHi: 0xc9a800, band: 0x2a2a2a, tassel: 0xffd700, belt: 0x111111, buckle: 0x3a3a3a, bracer: 0x262626,
};
function bbHead(C, officer, b) {
  return [
    b([-0.1, 0.02, -0.09], [0.1, 0.25, 0.1], C.skin),
    b([-0.1, 0.0, 0.03], [0.1, 0.13, 0.115], 0x111111),                                // black mask
    b([-0.1, 0.12, 0.09], [0.1, 0.18, 0.12], 0x2a2a2a), b([-0.08, 0.13, 0.11], [-0.01, 0.17, 0.125], 0x9ed8f0, true),   // goggles
    b([0.01, 0.13, 0.11], [0.08, 0.17, 0.125], 0x9ed8f0, true),
    b([-0.13, 0.2, -0.13], [0.13, 0.22, 0.14], C.helmHi),                               // hard-hat brim
    b([-0.11, 0.22, -0.11], [0.11, 0.33, 0.11], C.helm), b([-0.015, 0.3, -0.12], [0.015, 0.36, 0.12], C.helmHi),   // dome, ridge
  ];
}
const UMB = 0x1a1a1a;
const BB_W = {
  spear: [box([0.03, 0.03, 0.95], [0, 0, 0.3], 0x2a2a2a), box([0.09, 0.09, 0.6], [0, 0, 0.45], UMB), box([0.03, 0.12, 0.03], [0, -0.05, -0.18], 0x2a2a2a)],   // closed umbrella
  sword: [box([0.03, 0.03, 0.8], [0, 0, 0.25], 0x2a2a2a), box([0.08, 0.08, 0.5], [0, 0, 0.38], 0x2a3a6a), box([0.03, 0.1, 0.03], [0, -0.05, -0.15], 0x2a2a2a)],
  glaive: [box([0.045, 0.045, 2.1], [0, 0, 0.45], 0xc9b36a), box([0.055, 0.055, 0.02], [0, 0, 0.8], 0x8d7a3e), box([0.055, 0.055, 0.02], [0, 0, 1.15], 0x8d7a3e)],   // bamboo pole
  pole: [box([0.04, 0.04, 2.6], [0, 0, 0.6], 0x2a2a2a), box([1.1, 0.06, 1.1], [0, 0, 1.95], 0xffd700), box([0.8, 0.08, 0.8], [0, 0, 1.97], 0xffe34d),
    box([0.2, 0.2, 0.08], [0, 0, 2.0], 0xc9a800)],                                     // a big open yellow umbrella held up
  shield: { rim: 0xc9a800, a: 0xffd700, b: 0xf0c400, boss: 0x2a2a2a, ring: 0xc9a800, far: 0xf0c400 },             // open umbrella
};
export const BLACKBLOC = { palette: BB_PAL, head: bbHead, weapons: BB_W, flag: null };

// ---------------------------------------------------------------- 乘客 civil (ally, Ch. III): muted office colours, bags,
// unarmed (a bag or a phone where the crowd rig puts a weapon)
const CIVIL_PAL = {
  armor: 0x5a6470, hi: 0x6e7884, lace: 0x3a4048, plate: 0x626c78, rivet: 0x707a86,
  cloth: 0x7a7266, pants: 0x3a3e46, wrap: 0x3a3e46, wrapD: 0x2e3238, boot: 0x2a2624,
  skin: 0xe0b28a, skinD: 0xbc8e68, eye: 0x151515, brow: 0x1e1814,
  helm: 0x1c1814, helmHi: 0x3a322a, band: 0x5a6470, tassel: 0x1c1814, belt: 0x2a2624, buckle: 0x8a8a8a, bracer: 0x6e7884,
};
function civilHead(C, officer, b) {
  return [
    b([-0.1, 0.02, -0.09], [0.1, 0.25, 0.1], C.skin),
    b([-0.07, 0.12, 0.095], [-0.03, 0.15, 0.106], C.eye, true), b([0.03, 0.12, 0.095], [0.07, 0.15, 0.106], C.eye, true),
    b([-0.015, 0.08, 0.1], [0.02, 0.13, 0.125], C.skinD),
    b([-0.105, 0.19, -0.105], [0.105, 0.28, 0.09], C.helm), b([-0.105, 0.06, -0.105], [0.105, 0.2, -0.04], C.helm),   // hair
  ];
}
const CIVIL_W = {
  spear: [box([0.25, 0.3, 0.1], [0, -0.12, 0.05], 0x6a4a32), box([0.02, 0.2, 0.02], [0, 0.05, 0.05], 0x3a2a1c)],   // shoulder bag
  sword: [box([0.07, 0.14, 0.012], [0, 0.02, 0.06], 0x1a1a1a), box([0.06, 0.12, 0.005], [0, 0.02, 0.068], 0x8ab4d8)],   // phone
  glaive: [box([0.3, 0.22, 0.08], [0, -0.1, 0.05], 0x2a2a30)],                          // briefcase
  pole: [box([0.03, 0.03, 0.9], [0, 0, 0.3], 0x2a2a2a), box([0.08, 0.08, 0.55], [0, 0, 0.42], 0x3a5a7a)],          // umbrella
  shield: { rim: 0x3a2a1c, a: 0x6a4a32, b: 0x5a3e2a, boss: 0x3a2a1c, ring: 0x3a2a1c, far: 0x5a3e2a },             // a bag held up
};
export const CIVIL = { palette: CIVIL_PAL, head: civilHead, weapons: CIVIL_W, flag: null };
