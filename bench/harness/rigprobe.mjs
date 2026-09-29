// Rig gate: pose every clip of the given characters at 9 sample times through the real rig (src/hero/rig.js) and hash
// every joint's world matrix (rounded to 1e-6). --save stores the hashes in rig-refs.json; without it, compares.
//   node --import ./bench/harness/register.mjs bench/harness/rigprobe.mjs [--save] [chars…]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as THREE from 'three';
import { createRig, sampleClip, POSE_SIZE } from '../../src/hero/rig.js';
import { CHARS } from '../../src/chars/index.js';

const save = process.argv.includes('--save'), ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const RJ = resolve(import.meta.dirname, 'rig-refs.json'), refs = existsSync(RJ) ? JSON.parse(readFileSync(RJ, 'utf8')) : {};
const rig = createRig(), pose = new Float32Array(POSE_SIZE), pos = new THREE.Vector3(0, 0, 0);
let bad = 0, n = 0;
for (const id of ids.length ? ids : ['zhaoyun', 'huangzhong']) {
  const K = CHARS[id].kit, out = {};
  for (const [cid, c] of Object.entries(K.clips)) {
    let h = 0x811c9dc5;
    for (let s = 0; s <= 8; s++) {
      sampleClip(c, s / 8, pose);
      rig.apply(pose, pos, 0.3);
      for (const name of Object.keys(rig.joints).sort()) {
        if (name === 'weaponL') continue;                       // the dual-wield joint (new): not part of the old rig's output
        for (const v of rig.joints[name].matrixWorld.elements) {
          const r = Math.round(v * 1e6) | 0;
          h ^= r & 255; h = Math.imul(h, 0x01000193); h ^= (r >>> 8) & 255; h = Math.imul(h, 0x01000193); h ^= (r >>> 16) & 255; h = Math.imul(h, 0x01000193);
        }
      }
    }
    out[cid] = (h >>> 0).toString(16);
    n++;
    if (!save && refs[id] && refs[id][cid] !== out[cid]) { bad++; console.log(`FAIL ${id}.${cid} ${refs[id][cid]} → ${out[cid]}`); }
  }
  if (save) refs[id] = out;
}
if (save) { writeFileSync(RJ, JSON.stringify(refs, null, 1)); console.log(`saved ${n} clip hashes`); }
else console.log(bad ? `RIG FAIL ${bad}/${n}` : `RIG PASS ${n}/${n} clips identical`);
process.exit(bad ? 1 : 0);
