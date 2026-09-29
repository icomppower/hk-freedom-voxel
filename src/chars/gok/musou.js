// 阿角's Musou 牧羊歸欄 Shepherd's Round-Up (sim; interface of src/musou/musou.js createMusou) + his crook's hook pull.
// Timeline (musou frames t, 210 = control returns; hitstop pauses it):
//   0   activation: the world holds still, he raises the crook (cut-in, 40 f)
//   44  THE ROUND-UP: the hook sweeps out in a wide arc and every soldier within 6.5 m is reeled in toward him (grouping
//       pull: in to 1.3 m + a quarter of the distance, over 14 f)
//   76 / 104 / 132  three spinning sweeps, each wider (3.0 → 3.6 → 4.2 m)
//   178 FINISHER: he plants the crook; a cream shockwave ring blasts out to 7 m (tiers of launched bodies)
// Hook pull (C1 勾拉・頓杖): combat has no pull reaction, so the soldiers C1's hook window caught (`pull` hits, a flinch)
// are reeled in to the crook, 1.4 m in front of him, over the drag frames. Both pulls are kit-owned sim writes on crowd
// positions (like the Musou aura shove), deterministic.
import { emit, on } from '../../core/events.js';
import { setState, stickDir } from '../../hero/locomotion.js';
import { ST } from '../../crowd/crowd.js';
import { clampWalk } from '../../world/map.js';
import { offSun, easeOut, smooth, endMusou, gauge } from '../../musou/musou.js';
import { MUSOU_FRAMES } from './anims.js';

export const GOK_MUSOU = {
  activation: 40, pull: 44, spins: [76, 104, 132], finisher: 178, end: MUSOU_FRAMES, cost: 1 / 3,
  pullR: 6.5, pullIn: [1.3, 0.25], pullFrames: 14,
  pullHit: { shape: 'circle', range: 6.5, dmg: 6, kb: 'flinch', force: 0, hitstop: 4 },
  spinHit: { shape: 'circle', dmg: 10, kb: 'spin', force: 6, lift: 3, hitstop: 2 },
  spinR: [3.0, 3.6, 4.2],
  waveR: 7, waveFrames: 14,
  waveHit: { shape: 'circle', range: 0, dmg: 40, kb: 'launch', force: 6, lift: 9, hitstop: 0, heavy: true, yMax: 5 },
};
const HOOK = { from: 21, to: 32, reach: 1.4 };            // C1: reel the hooked in over these move frames, to 1.4 m ahead

export function createMusou(game) {
  const M = GOK_MUSOU;
  const mu = { active: false, t: 0, wasReady: false, seq: 0, ax: 0, az: 0, yaw0: 0, waveR: 0 };
  const shot = { id: 0, yaw: 0, dist: 0, pitch: 0, fov: 50, height: 1.2, side: 0, shake: 1 };
  const pulled = [];                                        // [i, fromX, fromZ, toX, toZ] (Musou round-up)
  const hooked = new Map();                                 // i → [fromX, fromZ] (C1 hook), filled on the hook frames
  let startMusou = 0, hookSeq = -1;

  mu.reset = () => { mu.active = false; mu.t = 0; mu.wasReady = false; mu.waveR = 0; pulled.length = 0; hooked.clear(); hookSeq = -1; };

  // sim-side: soldiers caught by C1's pull window (hero hits fire inside step(): deterministic)
  on('hit', (e) => {
    const h = game.hero;
    if (game.musou !== mu || e.move !== 'c1' || h.state !== 'attack' || h.move !== 'c1' || h.moveT > HOOK.from) return;
    if (hookSeq !== h.moveSeq) { hooked.clear(); hookSeq = h.moveSeq; }
    const c = game.crowd;
    hooked.set(e.i, [c.x[e.i], c.z[e.i]]);
  });

  mu.start = (inp) => {
    const h = game.hero;
    const [sx, sz, smag] = stickDir(inp, game.cam.yaw);
    if (smag) h.yaw = Math.atan2(sx, sz);
    mu.active = true; mu.t = 0; mu.waveR = 0; mu.seq++;
    mu.yaw0 = h.yaw; mu.ax = h.x; mu.az = h.z;
    startMusou = h.musou;
    h.move = null; h.vx = h.vz = 0;
    setState(h, 'musou');
    h.musouClip = 'mu_gok'; h.musouT = 0;
    h.iframes = M.end + 30;
    game.freeze = 2;
    emit('musou:start', { x: h.x, z: h.z, activation: M.activation, burstAt: M.finisher, contact: M.pull });
  };

  const hitAt = (hit, x, z, yaw, key, rehit) => game.combat.strike(hit, x, z, yaw, key - (mu.seq % 1000) * 100000, rehit, 'musou');

  mu.stepHero = () => {
    const h = game.hero, c = game.crowd, t = ++mu.t;
    h.iframes = Math.max(h.iframes, 2);
    h.vx = h.vz = 0;
    h.musouClip = 'mu_gok'; h.musouT = t / M.end;
    h.musou = Math.max(0, startMusou - h.musouMax * M.cost * Math.min(1, t / M.pull));
    if (t < M.activation) { game.freeze = Math.max(game.freeze, 2); return; }
    if (t === M.pull) {                                              // the round-up: catch everyone in reach, then hit them
      pulled.length = 0;
      for (let i = 0; i < c.N; i++) {
        const s = c.st[i];
        if (s === ST.OFF || s === ST.DEAD || c.y[i] > 0.4) continue;
        const dx = c.x[i] - h.x, dz = c.z[i] - h.z, d = Math.hypot(dx, dz);
        if (d > M.pullR || d < 1e-3) continue;
        const r = Math.min(d, M.pullIn[0] + d * M.pullIn[1]), f = r / d;
        pulled.push([i, c.x[i], c.z[i], h.x + dx * f, h.z + dz * f]);
      }
      const n = hitAt(M.pullHit, h.x, h.z, h.yaw, -2000, false);
      emit('musou:hit', { x: h.x, y: 1.0, z: h.z, stage: 'contact', yaw: h.yaw, n });
    }
    const k = t - M.pull;
    if (k > 0 && k <= M.pullFrames) {                               // reel them in (bodies thrown meanwhile are left alone)
      const u = easeOut(k / M.pullFrames);
      for (const [i, fx, fz, tx, tz] of pulled) {
        const s = c.st[i];
        if (s !== ST.HURT && s !== ST.KNOCK && s !== ST.IDLE && s !== ST.GUARD && s !== ST.ADVANCE) continue;
        [c.x[i], c.z[i]] = clampWalk(fx + (tx - fx) * u, fz + (tz - fz) * u, -0.5); c.vx[i] = c.vz[i] = 0;
      }
    }
    M.spins.forEach((f, j) => {                                      // three spins, each wider
      if (t !== f) return;
      const n = hitAt({ ...M.spinHit, range: M.spinR[j] }, h.x, h.z, h.yaw, -2100 - j, false);
      emit('musou:hit', { x: h.x, y: 1.0, z: h.z, stage: 'rush', yaw: h.yaw, n: j });
    });
    const w = t - M.finisher;
    if (w >= 0 && w <= M.waveFrames) {                               // the planted crook's shockwave ring
      const u = w / M.waveFrames;
      mu.waveR = M.waveR * (1 - (1 - u) * (1 - u) * (1 - u)) + 0.8;
      const n = hitAt({ ...M.waveHit, range: mu.waveR, lift: M.waveHit.lift - 3 * u, hitstop: w === 0 ? 5 : 0, heavy: w < 2 }, h.x, h.z, h.yaw, -3000, false);
      if (w === 0) emit('musou:burst', { count: n, x: h.x, z: h.z });
      else if (n) { const a = w * 2.4, R = mu.waveR * 0.9; emit('musou:hit', { x: h.x + Math.sin(a) * R, y: 0.4, z: h.z + Math.cos(a) * R, stage: 'wave', yaw: a, n: w }); }
    }
    if (t >= M.end) endMusou(mu, h, startMusou, M.cost);
  };

  // C1's hook drag, every step (kit sim)
  const hookStep = () => {
    const h = game.hero, c = game.crowd;
    if (h.state !== 'attack' || h.move !== 'c1' || h.moveSeq !== hookSeq) { if (hooked.size && h.move !== 'c1') hooked.clear(); return; }
    const t = h.moveT;
    if (t <= HOOK.from || t > HOOK.to) return;
    const u = easeOut((t - HOOK.from) / (HOOK.to - HOOK.from)), fx = Math.sin(h.yaw), fz = Math.cos(h.yaw);
    let k = 0;
    for (const [i, [x0, z0]] of hooked) {
      const s = c.st[i];
      if (s === ST.OFF || s === ST.DEAD || s === ST.AIR || s === ST.DOWN) continue;
      const lat = ((k++ % 5) - 2) * 0.45;                           // gathered side by side in front of the crook
      const tx = h.x + fx * HOOK.reach + fz * lat, tz = h.z + fz * HOOK.reach - fx * lat;
      [c.x[i], c.z[i]] = clampWalk(x0 + (tx - x0) * u, z0 + (tz - z0) * u, -0.5); c.vx[i] = c.vz[i] = 0;
    }
  };

  mu.shot = () => {
    if (!mu.active) return null;
    const t = mu.t, h = game.hero, o = shot;
    o.shake = 0.4; o.side = 0;
    if (t < M.activation) {                                          // front three-quarter, above head height, slow push-in
      const u = t / M.activation;
      Object.assign(o, { id: 1, yaw: offSun(mu.yaw0 + Math.PI * 0.8), dist: 4.4 - 0.7 * u, pitch: 0.3, fov: 44, height: 1.1, side: 0.1 });
    } else if (t < M.finisher - 4) {                                 // wide, high over his shoulder: the ring pulled in, the spins
      const u = smooth(Math.min(1, (t - M.activation) / 20));
      Object.assign(o, { id: 2, yaw: offSun(mu.yaw0 + 0.35), dist: 5 + 3.5 * u, pitch: 0.22 + 0.12 * u, fov: 56, height: 1.5 + 0.8 * u, shake: 0.5 });
    } else {                                                          // the plant: low wide shot, the ring bursting out
      const u = smooth((t - M.finisher + 4) / (M.end - M.finisher + 4));
      Object.assign(o, { id: 3, yaw: offSun(mu.yaw0 - 0.5), dist: 8.5 + 1.5 * u, pitch: 0.08 + 0.05 * u, fov: 58, height: 1.6 + 0.3 * u, shake: 0.7 });
    }
    return o;
  };

  gauge(mu, game, M.cost, hookStep);
  return mu;
}
