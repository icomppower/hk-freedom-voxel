// 龍仔's cutscene head variants (render-only, the ending's hat lift and mask pull; same method as the Bear's mask-off):
// built from the SAME head box list as the shipped model (./model.js head()) — 'hat' = as shipped, 'nohat' = minus the
// hard-hat boxes (brim, dome, ridge, goggle strap round the hat; the short hair shows), 'bare' = minus the hat and the
// mask (face, pleat line, ear loops), with a small smile row painted where the mask was. looseHat() / looseMask() mesh
// those same removed boxes on their own, recentred, to hold in a hand. No new palette: every colour is the model's.
import { vox, HV } from '../../hero/model.js';
import { head, LC } from './model.js';
import { shade } from '../../core/voxel.js';

const HAT = new Set([LC.hat, LC.hatD]);
const isHat = (q) => q.a[1] >= 10 && (HAT.has(q.c) || q.c === LC.strap);
const isMask = (q) => q.a[1] < 10 && (q.c === LC.mask || q.c === shade(LC.mask, 1.8) || (q.paint && q.c === LC.strap && q.a[1] === 4));

/** Head box list for a variant. */
export function headVariant(v = 'hat') {
  const H = head();
  if (v === 'hat') return H;
  const out = H.filter((q) => !isHat(q) && (v !== 'bare' || !isMask(q)));
  if (v === 'bare') out.push(                                            // the smile: a short dark row, corners up (face layer z 3)
    { a: [-1, 2, 3], b: [2, 3, 4], c: shade(LC.skin, 0.45), paint: true },
    { a: [-2, 3, 3], b: [-1, 4, 4], c: shade(LC.skin, 0.55), paint: true }, { a: [2, 3, 3], b: [3, 4, 4], c: shade(LC.skin, 0.55), paint: true });
  return out;
}
/** Recentre boxes so their bounds sit around the origin (voxels) — a loose item held in a hand frame. */
function loose(boxes, lift) {
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const q of boxes) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], q.a[k]); hi[k] = Math.max(hi[k], q.b[k]); }
  const c = lo.map((v, k) => Math.round((v + hi[k]) / 2)); c[1] = lift ?? c[1];
  return boxes.map((q) => ({ ...q, a: q.a.map((v, k) => v - c[k]), b: q.b.map((v, k) => v - c[k]), paint: false }));
}
export const looseHat = () => vox(loose(head().filter(isHat), 10), HV, { off: [-0.5, 0, 0], jitter: 0.04 });
export const looseMask = () => vox(loose(head().filter((q) => isMask(q) && !q.paint)), HV, { off: [-0.5, 0, 0], jitter: 0.04 });
