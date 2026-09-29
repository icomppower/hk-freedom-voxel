// Frame-time gate (step 5): the real page with ?enemies=600, vsync and the frame-rate cap off, the hero's Musou fired
// (gauge filled through the step hook) twice; reports p50 / p95 / max frame time (rAF deltas) over the whole run and
// over the Musou windows. Budget = upstream's own cost at the same load on the same machine: the kit's Musou-window p95
// ≤ 1.2 × Zhao Yun's (run second; its Musou already exceeds a flat 16.7 ms at 600 enemies here).
//   node bench/chars/perf.mjs gok [zhaoyun]
import { openGame } from '../harness/browser.mjs';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['gok'];
const out = {};
for (const id of ids) {
  const g = await openGame({ query: `?go=free&char=${id}&enemies=600`, args: ['--disable-gpu-vsync'],
    init: () => {
      window.__ft = []; window.__mu = [];
      let last = 0;
      const loop = (t) => { if (last) { window.__ft.push(t - last); window.__mu.push(window.__vm?.game.hero.state === 'musou' ? 1 : 0); } last = t; requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
      window.__onStep = (inp) => {
        const G = window.__vm.game, f = G.frame;
        inp.my = f % 400 < 200 ? 1 : 0; if (f % 13 === 0) inp.pressed.attack = true;       // run into the army, fight
        if (f === 300 || f === 900) { G.hero.musou = G.hero.musouMax; }
        if ((f === 302 || f === 902)) inp.pressed.musou = true;
      };
    } });
  await g.page.waitForTimeout(24000);
  const r = await g.page.evaluate(() => {
    const ft = window.__ft.slice(60), mu = window.__mu.slice(60), q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
    const m = ft.filter((_, i) => mu[i]);
    return { frames: ft.length, p50: q(ft, 0.5), p95: q(ft, 0.95), max: Math.max(...ft), muN: m.length, muP95: m.length ? q(m, 0.95) : null, muMax: m.length ? Math.max(...m) : null, alive: window.__vm.game.crowd.N };
  });
  out[id] = r;
  console.log(`${id.padEnd(10)} ${r.frames} frames · p50 ${r.p50.toFixed(1)} · p95 ${r.p95.toFixed(1)} · max ${r.max.toFixed(1)} ms · Musou ${r.muN} frames p95 ${r.muP95?.toFixed(1)} max ${r.muMax?.toFixed(1)} ms`, g.errors.slice(0, 2));
  await g.close();
}
const a = out[ids[0]], b = out[ids[1]];
const pass = a.muN > 100 && a.muP95 <= 17 && (!b || a.muP95 <= b.muP95 * 1.2);   // 60 fps held through the Musou
console.log(pass ? 'PERF PASS' : 'PERF FAIL');
process.exit(pass ? 0 : 1);
