// Crowd skin gate: hash every crowd InstancedMesh's geometry (position + color attributes) and its material's map canvas
// in the live page, per mesh in scene order, after a story battle start of the given chapter.
//   node bench/harness/crowdprobe.mjs [chapter] [--save name]  → compares with / saves to crowd-refs.json[name]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { openGame } from './browser.mjs';
const chapter = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ch1';
const si = process.argv.indexOf('--save'), name = si > 0 ? process.argv[si + 1] : chapter;
const RJ = resolve(import.meta.dirname, 'crowd-refs.json'), refs = existsSync(RJ) ? JSON.parse(readFileSync(RJ, 'utf8')) : {};
const g = await openGame({ query: `?go=story&char=zhaoyun&ch=${chapter}` });
await g.page.waitForTimeout(3000);
const out = await g.page.evaluate(() => {
  const res = [];
  const fnv = (arr) => { let h = 0x811c9dc5; const u = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength); for (let i = 0; i < u.length; i++) { h ^= u[i]; h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); };
  __vm.scene.traverse((o) => {
    if (!o.isInstancedMesh || !o.geometry.attributes.color && !o.material.map) return;
    const a = o.geometry.attributes;
    let tex = '';
    if (o.material.map && o.material.map.image && o.material.map.image.getContext) { const c = o.material.map.image; tex = fnv(c.getContext('2d').getImageData(0, 0, c.width, c.height).data); }
    res.push([a.position ? a.position.count : 0, a.position ? fnv(a.position.array) : '', a.color ? fnv(a.color.array) : '', tex].join(':'));
  });
  return res;
});
await g.close();
if (si > 0) { refs[name] = out; writeFileSync(RJ, JSON.stringify(refs, null, 1)); console.log(`saved ${out.length} crowd meshes as ${name}`); process.exit(0); }
const ref = refs[name] || [], same = out.filter((h, k) => h === ref[k]).length;
console.log(`${same === ref.length && out.length === ref.length ? 'ok  ' : 'FAIL'} ${name}: ${same}/${ref.length} crowd meshes identical (${out.length} now)`, g.errors.slice(0, 2));
process.exit(same === ref.length && out.length === ref.length ? 0 : 1);
