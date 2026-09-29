// Wolf officer builder (content for the crowd view's officer-model hook, src/crowd/view.js header): part box lists in the
// crowd's soldier space (metres, feet at 0, facing +Z; pelvis 0.86 · neck +0.5 over the waist · shoulders ±0.235 @ +0.43
// · hand −0.5 below the shoulder · knee −0.42) and weapon / off-hand box lists (weapon space: grip at the origin, +Z along
// the weapon; off-hand: the left hand frame). Plain grey kit only: no flags, badges, insignia or symbols.
import { shade } from '../../core/voxel.js';
import { hash01 } from '../../core/rng.js';

export const b = (a, bb, c, paint) => ({ a, b: bb, c, paint });
export const box = (s, p, c, r) => ({ s, p, c, r });

/** Plate rows: dark lacing line every third voxel row, a lit top edge, alternate plates a touch darker. */
const plate = (C) => (x, y, z, i, j) => (j % 3 === 0 ? C.steelD : j % 3 === 2 ? shade(C.steel, 1.12) : (i + ((j / 3) | 0)) % 2 ? shade(C.steel, 0.9) : C.steel);
const fur = (C) => (x, y, z, i, j, k) => (hash01(i * 3, j, k) < 0.2 ? C.furD : hash01(k, i, j * 7) < 0.14 ? C.furL : C.fur);

/** Wolf head: skull, long muzzle, amber eyes under a heavy brow, tall ears, teeth at the jaw line, neck ruff. */
export function wolfHead(C, { muzzle = 0.24, ear = 0.2, iron = false, mane = 0.1 } = {}) {
  const z1 = 0.08 + muzzle;
  const h = [
    b([-0.105, 0.02, -0.11], [0.105, 0.25, 0.1], fur(C)),                              // skull
    b([-0.06, 0.03, 0.08], [0.06, 0.13, z1], C.furL),                                  // muzzle
    b([-0.048, 0.13, 0.08], [0.048, 0.16, z1 - 0.04], C.fur),                           // muzzle ridge
    b([-0.03, 0.09, z1 - 0.01], [0.03, 0.135, z1 + 0.02], 0x121212, true),             // nose
    b([-0.062, 0.045, 0.1], [0.062, 0.062, z1 - 0.02], (x, y, z, i, j, k) => (k % 2 ? C.teeth : C.furD), true),   // teeth row
    b([-0.075, 0.15, 0.09], [-0.03, 0.18, 0.106], C.amber, true), b([0.03, 0.15, 0.09], [0.075, 0.18, 0.106], C.amber, true),
    b([-0.095, 0.18, 0.07], [0.095, 0.215, 0.12], C.furD),                              // heavy brow
    b([-0.105, 0.22, -0.05], [-0.04, 0.22 + ear, 0.02], C.furD), b([0.04, 0.22, -0.05], [0.105, 0.22 + ear, 0.02], C.furD),
    b([-0.09, 0.22 + ear * 0.55, -0.045], [-0.055, 0.22 + ear, 0.015], C.fur), b([0.055, 0.22 + ear * 0.55, -0.045], [0.09, 0.22 + ear, 0.015], C.fur),
    b([-0.13, -0.02, -0.13], [0.13, 0.08, 0.07], C.furD),                               // neck ruff
  ];
  if (mane) h.push(b([-0.14, 0.04, -0.16], [0.14, 0.2 + mane, -0.07], fur({ ...C, fur: C.furD, furD: shade(C.furD, 0.8), furL: C.fur })));
  if (iron) h.push(b([-0.07, 0.07, 0.09], [0.07, 0.15, z1 - 0.02], C.steel),          // 鐵吻: the iron muzzle plate and straps
    b([-0.11, 0.1, -0.02], [0.11, 0.125, 0.1], C.steelD));
  return h;
}

/** Body parts. opts: bulk (width ×), mantle (fur over the shoulders), cloak (to the ankles, ragged hem), cape (short). */
export function wolfBody(C, { bulk = 1, mantle = false, cloak = false, cape = false } = {}) {
  const w = (v) => v * bulk, P = plate(C);
  const p = {};
  p.hips = [
    b([-w(0.16), -0.1, -0.1], [w(0.16), 0.06, 0.1], C.under),
    b([-w(0.175), -0.01, -0.115], [w(0.175), 0.07, 0.115], C.belt),
    b([-0.04, 0.0, 0.11], [0.04, 0.07, 0.14], C.buckle),                               // plain square buckle
    b([-w(0.16), -0.36, 0.095], [w(0.16), 0.0, 0.14], P), b([-w(0.16), -0.36, -0.14], [w(0.16), 0.0, -0.095], P),   // tassets
    b([-w(0.2), -0.3, -0.09], [-w(0.15), 0.0, 0.09], P), b([w(0.15), -0.3, -0.09], [w(0.2), 0.0, 0.09], P),
  ];
  p.torso = [
    b([-w(0.155), -0.04, -0.105], [w(0.155), 0.2, 0.105], P),
    b([-w(0.185), 0.18, -0.125], [w(0.185), 0.46, 0.125], P),
    b([-w(0.13), 0.24, 0.12], [w(0.13), 0.42, 0.15], shade(C.steel, 1.08)),            // breastplate (plain)
    b([-w(0.31), 0.29, -0.14], [-w(0.14), 0.47, 0.14], P), b([w(0.14), 0.29, -0.14], [w(0.31), 0.47, 0.14], P),   // shoulder plates
    b([-0.12, 0.44, -0.11], [0.12, 0.5, 0.11], C.under),
  ];
  if (mantle) p.torso.push(b([-w(0.34), 0.38, -0.17], [w(0.34), 0.56, 0.16], fur({ ...C, fur: C.mantle })),
    b([-w(0.28), 0.5, -0.15], [w(0.28), 0.6, 0.12], fur({ ...C, fur: C.mantle })));
  if (cloak) p.torso.push(b([-w(0.25), -0.92, -0.2], [w(0.25), 0.48, -0.145], (x, y, z, i, j) =>
    (y < -0.84 && hash01(i, 11, 3) < 0.45 ? null : i === 0 || x > w(0.24) ? shade(C.cloak, 1.3) : C.cloak)));
  if (cape) p.torso.push(b([-w(0.21), -0.4, -0.2], [w(0.21), 0.46, -0.145], (x, y, z, i, j) => (j % 5 === 0 ? shade(C.cloak, 1.25) : C.cloak)));
  p.arm = [
    b([-0.06, -0.24, -0.065], [0.06, 0.03, 0.065], C.under),
    b([-0.066, -0.46, -0.07], [0.066, -0.22, 0.07], P),                                // vambrace
    b([-0.05, -0.56, -0.055], [0.05, -0.46, 0.055], C.furD),                           // clawed hand
    b([-0.05, -0.58, 0.03], [0.05, -0.54, 0.06], C.teeth, true),
  ];
  p.thigh = [b([-0.075, -0.43, -0.078], [0.075, 0.02, 0.078], C.under)];
  p.shin = [
    b([-0.068, -0.3, -0.072], [0.068, 0.02, 0.072], P),                                // greave
    b([-0.075, -0.42, -0.08], [0.075, -0.29, 0.14], C.boot),
    b([-0.06, -0.42, 0.13], [0.06, -0.38, 0.16], C.teeth),                             // claws
  ];
  return p;
}

/** A glaive along +Z: shaft from `butt` to the collar at `collar`, a curved blade of length `len` beyond it. Returns the
 *  whole weapon plus its broken halves (haft in hand; head with its own origin at the collar) and a cracked variant. */
export function glaive(C, { butt = -0.6, collar = 1.8, len = 0.55, h = 0.16, heavy = 1 } = {}) {
  const shaft = [box([0.05 * heavy, 0.05 * heavy, collar - butt], [0, 0, (collar + butt) / 2], C.pole),
    box([0.07, 0.07, 0.05], [0, 0, butt], C.steelD), box([0.065, 0.065, 0.04], [0, 0, butt + 1.0], C.steelD)];
  const collarB = box([0.09 * heavy, 0.09 * heavy, 0.08], [0, 0, collar + 0.04], C.steelD);
  const blade = (z0) => {
    const out = [];
    const n = 6;
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1), z = z0 + 0.08 + u * (len - 0.08), hh = h * heavy * (0.55 + 0.6 * Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.12))), cy = 0.02 + 0.1 * u * u;
      out.push(box([0.026, hh, len / n + 0.01], [0, cy + hh / 2 - 0.02, z], C.blade), box([0.028, 0.025, len / n + 0.01], [0, cy + hh - 0.02, z], C.edge));
    }
    return out;
  };
  const crack = [box([0.1, 0.012, 0.012], [0, 0.03, collar + 0.02], 0x0a0a0a), box([0.012, 0.06, 0.012], [0.02, 0.0, collar + 0.05], 0x0a0a0a)];
  return {
    weapon: [...shaft, collarB, ...blade(collar)],
    cracked: [...shaft, collarB, ...crack, ...blade(collar)],
    broken: { haft: [...shaft], head: [{ ...collarB, p: [0, 0, 0.04] }, ...blade(0)] },
  };
}

/** The retreat horn, raised in the left hand while kneeling (hand frame: forearm axis −Y, palm toward +Z). */
export const HORN = [box([0.07, 0.07, 0.18], [0, -0.02, 0.1], 0xd8cdb0), box([0.09, 0.09, 0.08], [0, 0.02, 0.22], 0xc2b690), box([0.11, 0.11, 0.04], [0, 0.05, 0.28], 0x8a7c5c)];
