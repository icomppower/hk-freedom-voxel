// Stage-2c gate (render): a throwaway chapter with skin { foe: 'riot', ally: 'blackbloc' } and an officer spawned with a test
// model key renders — riot grunts, 手足 allies, the keyed officer model (not the generic one), its broken weapon once KO'd —
// and the next plain ch1 battle in the same page goes back to the Wei / Shu skins. Screenshots → bench/out/skin/.
import { mkdirSync } from 'node:fs';
import { openGame } from './browser.mjs';
const out = new URL('../out/skin/', import.meta.url).pathname; mkdirSync(out, { recursive: true });
const g = await openGame({}), P = g.page, wait = (ms) => P.waitForTimeout(ms);
const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${n}${x ? '  ' + x : ''}`); };
await wait(2500);
await P.evaluate(async () => {
  const { CHAPTERS } = await import('/src/story/chapters.js');
  const { OFFICER_MODELS } = await import('/src/chars/officers/index.js');
  const bx = (a, b, c) => ({ a, b, c });
  OFFICER_MODELS.testoff = {                               // a deliberately odd officer: blue blocks, a long yellow weapon
    parts: { hips: [bx([-0.17, -0.1, -0.1], [0.17, 0.06, 0.1], 0x2040c0)], torso: [bx([-0.2, -0.04, -0.12], [0.2, 0.5, 0.12], 0x2040c0)],
      head: [bx([-0.12, 0.0, -0.12], [0.12, 0.3, 0.12], 0x80a0ff), bx([-0.05, 0.3, -0.05], [0.05, 0.5, 0.05], 0xffe040)],
      arm: [bx([-0.06, -0.56, -0.06], [0.06, 0.03, 0.06], 0x2040c0)], thigh: [bx([-0.07, -0.43, -0.07], [0.07, 0.02, 0.07], 0x203080)],
      shin: [bx([-0.065, -0.42, -0.07], [0.065, 0.02, 0.1], 0x203080)] },
    weapon: [{ s: [0.06, 0.06, 2.6], p: [0, 0, 0.6], c: 0xffe040 }, { s: [0.04, 0.3, 0.6], p: [0, 0.08, 2.0], c: 0xffffff }],
    broken: { haft: [{ s: [0.06, 0.06, 1.3], p: [0, 0, 0.0], c: 0xffe040 }], head: [{ s: [0.06, 0.06, 1.2], p: [0, 0, 0], c: 0xffe040 }, { s: [0.04, 0.3, 0.6], p: [0, 0.08, 0.5], c: 0xffffff }] },
    scale: 1.3, tip: 2.3,
  };
  const C1 = CHAPTERS.ch1;
  CHAPTERS.zzz = { ...C1, id: 'zzz', skin: { foe: 'riot', ally: 'blackbloc' }, OFF: { ...C1.OFF, shang: { ...C1.OFF.shang, model: 'testoff' } },
    BEATS: [{ when: { wait: 5 }, squads: [{ at: ['ford', -0.1, -0.85], n: 22 }, { at: ['ford', 0.15, -0.8], n: 18 }],
      officers: { shang: { at: ['ford', 0, -0.95] } } }] };
  __vm.flow.go('battle', { mode: 'story', char: 'zhaoyun', chapter: 'zzz' });
});
await wait(3500);
const info = await P.evaluate(() => {
  const c = __vm.game.crowd, st = __vm.game.story; let off = -1;
  for (let i = c.grunts; i < c.N; i++) if (c.st[i] && st.modelOf(i) === 'testoff') off = i;
  return { off, flagMap: null };
});
ok('keyed officer spawned with its model', info.off >= 0, `slot ${info.off}`);
// the test model's meshes are drawn (instance count > 0): find meshes whose geometry has the model's yellow weapon colour
const drawn = async () => P.evaluate(() => { let n = 0; __vm.scene.traverse((o) => { if (o.isInstancedMesh && o.count > 0 && o.geometry.attributes.color) { const a = o.geometry.attributes.color.array; for (let k = 0; k < Math.min(a.length, 300); k += 3) if (a[k] > 0.9 && a[k + 1] > 0.7 && a[k + 2] < 0.1) { n++; break; } } }); return n; });
ok('test officer weapon drawn', (await drawn()) >= 1);
await P.screenshot({ path: out + 'riot-blackbloc.png' });
await P.evaluate((i) => { const c = __vm.game.crowd; c.st[i] = 10; c.stT[i] = 0; c.hp[i] = 0; }, info.off);   // KO (render test only)
await wait(300);
ok('KO: haft + head pieces drawn', (await drawn()) >= 2);
await P.screenshot({ path: out + 'riot-ko.png' });
// the next ch1 battle in the same page: the Wei skin again (the 魏 flag texture back on the bearer cloth)
await P.evaluate(() => __vm.flow.go('battle', { mode: 'story', char: 'zhaoyun', chapter: 'ch1' }));
await wait(5000);
await P.screenshot({ path: out + 'ch1-after.png' });
const wei = await P.evaluate(() => { let lamp = 0; __vm.scene.traverse((o) => { if (o.isInstancedMesh && o.count > 0 && o.geometry.attributes.color) { const a = o.geometry.attributes.color.array; for (let k = 0; k < a.length; k += 3) if (Math.abs(a[k] - 0.209) < 0.01 && Math.abs(a[k + 1] - 0.305) < 0.02 && Math.abs(a[k + 2] - 0.392) < 0.02) { lamp++; break; } } }); return lamp; });
ok('back on ch1: no riot-shield colour on the field', wei === 0, `${wei}`);
console.log(g.errors.length ? 'page errors: ' + g.errors.join(' | ') : 'no page errors');
await g.close();
const pass = res.every(Boolean) && !g.errors.length;
console.log(pass ? `SKIN PASS ${res.length}/${res.length}` : 'SKIN FAIL');
process.exit(pass ? 0 : 1);
