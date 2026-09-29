// Dual-wield gate (stage 2b): with dual = 1 the left hand lands on the weaponL grip wherever that grip is in reach of the
// shoulder, the fist turns with the blade, dual = 0.5 lands halfway, and the right hand keeps the spear grip untouched.
//   node --import ./bench/harness/register.mjs bench/harness/dualprobe.mjs
import * as THREE from 'three';
import { createRig, P, POSE_SIZE, DIM } from '../../src/hero/rig.js';

const rig = createRig(), J = rig.joints, pos = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
const qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
let worst = 0, worstAng = 0, n = 0, rMoved = 0;
// sweep the left grip over a box in front / beside the chest, blade yaw / elev varied
for (const x of [0.05, 0.2, 0.35]) for (const y of [0.9, 1.1, 1.3]) for (const z of [0.1, 0.25, 0.4]) for (const yaw of [-40, 0, 40]) for (const elev of [-60, 0, 60]) {
  const pose = P({ spearL: [x, y, z, yaw, elev, 0], dual: 1 });
  rig.apply(pose, pos, 0);
  J.upperArmL.getWorldPosition(a); J.weaponL.getWorldPosition(b);
  if (a.distanceTo(b) > (DIM.upper + DIM.fore) * 0.97) continue;          // out of reach: IK clamps, not a failure
  J.handL.getWorldPosition(a);
  worst = Math.max(worst, a.distanceTo(b));
  J.handL.getWorldQuaternion(qa); J.weaponL.getWorldQuaternion(qb);
  worstAng = Math.max(worstAng, qa.angleTo(qb));
  n++;
}
// right hand unaffected by the left weapon
const base = P({}), dualP = P({ spearL: [0.2, 1.1, 0.3, 0, 0, 0], dual: 1 });
rig.apply(base, pos, 0); J.handR.getWorldPosition(a); rig.apply(dualP, pos, 0); J.handR.getWorldPosition(b); rMoved = a.distanceTo(b);
// half weight: halfway between the shaft grip and the blade grip
const half = P({ spearL: [0.2, 1.1, 0.3, 0, 0, 0], dual: 0.5 });
rig.apply(half, pos, 0); J.handL.getWorldPosition(a);
rig.apply(dualP, pos, 0); J.handL.getWorldPosition(b);
const c = new THREE.Vector3(); rig.apply(base, pos, 0); J.handL.getWorldPosition(c);
const mid = a.distanceTo(b.clone().add(c).multiplyScalar(0.5));
const pass = worst < 0.005 && worstAng < 0.01 && rMoved < 1e-9 && mid < 0.06 && n > 100;
console.log(`reachable grips ${n}: max hand→grip ${(worst * 1000).toFixed(2)} mm, max fist→blade ${(worstAng * 180 / Math.PI).toFixed(3)}°; right hand moved ${rMoved.toExponential(1)} m; dual 0.5 off midpoint ${(mid * 100).toFixed(1)} cm`);
console.log(pass ? 'DUAL PASS' : 'DUAL FAIL');
process.exit(pass ? 0 : 1);
