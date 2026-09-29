// Plain modern clothes on the shared rig (content helper for the 香港自由戰士 playables): replaces the body boxes of
// src/hero/model.js bodyParts (lamellar armour, scale mantle, tassets, greaves) with a jacket, trousers / leggings,
// trainers — same joints, same extents (voxels, V), so the rig, IK and secondary chains fit unchanged.
// outfit(o) → parts { hips, spine, chest, neck, upperArmR/L, foreArmR/L, handR/L, thighR/L, shinR/L, footR/L }.
//   o: jacket, jacketD (seams / zip), fold (fabric fold lines, default jacketD), sleeve, trou, trouD, shoe, sole, skin, glove, hem (jacket hangs below the belt, voxels),
//      slim (X scale of torso + arms), cuff (colour: sleeve cuff band), laces
const B = (a, b, c, paint) => ({ a, b, c, paint });
const P = (a, b, c) => ({ a, b, c, paint: true });

export function outfit(o) {
  const J = o.jacket, JD = o.jacketD ?? J, S = o.sleeve ?? J, T = o.trou, TD = o.trouD ?? T, k = o.slim ?? 1, hem = o.hem ?? 3;
  const sx = (q) => ({ ...q, a: [Math.round(q.a[0] * k), q.a[1], q.a[2]], b: [Math.round(q.b[0] * k), q.b[1], q.b[2]] });
  const FD = o.fold ?? JD, fold = (y) => (y % 4 === 0 ? FD : J);                       // soft fabric folds, not plate rows
  const p = {
    hips: [B([-6, -5, -4], [6, 3, 4], T), B([-7, -1 - hem, -5], [7, 3, 5], (x, y) => (y === -1 - hem ? JD : J)), P([-1, -1 - hem, 4], [1, 3, 5], JD)],
    spine: [B([-5, -3, -4], [5, 8, 4], (x, y) => fold(y + 2)), P([-1, -3, 3], [1, 8, 4], JD)],
    chest: [B([-7, -2, -5], [7, 9, 5], (x, y) => fold(y)), P([-1, -2, 4], [1, 9, 5], JD), B([-4, 8, -4], [4, 11, 4], JD), B([-3, 8, -3], [3, 12, 3], -1)],
    neck: [B([-2, -1, -2], [2, 3, 2], o.skin)],
  };
  for (const s of ['R', 'L']) {
    p['upperArm' + s] = [B([-2, -12, -2], [2, 1, 2], (x, y) => (y % 5 === 0 ? FD : S))];
    p['foreArm' + s] = [B([-2, -11, -2], [3, 0, 3], S), B([-2, -2, -3], [3, 0, 3], o.cuff ?? JD)];
    p['hand' + s] = [B([-2, -2, -2], [2, 2, 2], o.glove ?? o.skin)];
    p['thigh' + s] = [B([-3, -18, -3], [4, 1, 4], (x, y) => (y % 6 === 0 ? TD : T))];
    p['shin' + s] = [B([-2, -17, -2], [3, 0, 3], T), B([-3, -3, -3], [4, 0, 4], TD)];
    p['foot' + s] = [B([-3, -3, -2], [3, 1, 6], o.shoe), B([-3, -3, -2], [3, -2, 7], o.sole ?? o.shoe), P([-1, 0, 2], [1, 1, 5], o.laces ?? o.sole ?? o.shoe)];
  }
  for (const j of ['chest', 'spine', 'upperArmR', 'upperArmL', 'foreArmR', 'foreArmL']) p[j] = p[j].map(sx);
  return p;
}
