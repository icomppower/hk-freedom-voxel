// 龍仔's Musou 龍拳 Dragon Fist (sim; interface of src/musou/musou.js createMusou).
// Timeline (musou frames t, 210 = control returns; hitstop pauses it):
//   0   activation: the world holds still, he raises the pole (cut-in, 24 f)
//   30 / 60 / 90  three widening pole spins (circle 2.6 → 3.0 → 3.4 m, spin reaction)
//   128–140 the pole swung behind him, he dashes 8 m forward, fist first (clamped to walkable ground); the line hit
//       resolves at 140 along the whole dash (blow)
//   180 FINISHER: the fist driven down-forward, a golden dragon ring blasts out to 7 m (launch tiers)
// Frame data: Notion "Box Moveset 動作樣本" (無雙 210 f · 30 · 60 · 90 spins · 140 dash · 180 burst).
import { emit } from '../../core/events.js';
import { setState, stickDir } from '../../hero/locomotion.js';
import { clampWalk } from '../../world/map.js';
import { offSun, smooth, endMusou, gauge } from '../../musou/musou.js';
import { MUSOU_FRAMES } from './anims.js';

export const LUNGJAI_MUSOU = {
  activation: 24, spins: [30, 60, 90], spinR: [2.6, 3.0, 3.4], dash: [128, 140], dashLen: 8, finisher: 180, end: MUSOU_FRAMES, cost: 1 / 3,
  spinHit: { shape: 'circle', dmg: 18, kb: 'spin', force: 6, lift: 3, hitstop: 2 },
  dashHit: { shape: 'line', len: 8, width: 2.2, dmg: 30, kb: 'blow', force: 12, lift: 4, hitstop: 6, heavy: true },
  waveR: 7, waveFrames: 14,
  waveHit: { shape: 'circle', range: 0, dmg: 42, kb: 'launch', force: 6, lift: 9, hitstop: 0, heavy: true, yMax: 5 },
};

export function createMusou(game) {
  const M = LUNGJAI_MUSOU;
  const mu = { active: false, t: 0, wasReady: false, seq: 0, ax: 0, az: 0, yaw0: 0, waveR: 0, dx0: 0, dz0: 0 };
  const shot = { id: 0, yaw: 0, dist: 0, pitch: 0, fov: 50, height: 1.2, side: 0, shake: 1 };
  let startMusou = 0;

  mu.reset = () => { mu.active = false; mu.t = 0; mu.wasReady = false; mu.waveR = 0; };

  mu.start = (inp) => {
    const h = game.hero;
    const [sx, sz, smag] = stickDir(inp, game.cam.yaw);
    if (smag) h.yaw = Math.atan2(sx, sz);
    mu.active = true; mu.t = 0; mu.waveR = 0; mu.seq++;
    mu.yaw0 = h.yaw; mu.ax = h.x; mu.az = h.z;
    startMusou = h.musou;
    h.move = null; h.vx = h.vz = 0;
    setState(h, 'musou');
    h.musouClip = 'mu_lungjai'; h.musouT = 0;
    h.iframes = M.end + 30;
    game.freeze = 2;
    emit('musou:start', { x: h.x, z: h.z, activation: M.activation, burstAt: M.finisher, contact: M.spins[0] });
  };

  const hitAt = (hit, x, z, yaw, key, rehit) => game.combat.strike(hit, x, z, yaw, key - (mu.seq % 1000) * 100000, rehit, 'musou');

  mu.stepHero = () => {
    const h = game.hero, t = ++mu.t;
    h.iframes = Math.max(h.iframes, 2);
    h.vx = h.vz = 0;
    h.musouClip = 'mu_lungjai'; h.musouT = t / M.end;
    h.musou = Math.max(0, startMusou - h.musouMax * M.cost * Math.min(1, t / M.spins[0]));
    if (t < M.activation) { game.freeze = Math.max(game.freeze, 2); return; }
    M.spins.forEach((f, j) => {                                      // three pole spins, each wider
      if (t !== f) return;
      const n = hitAt({ ...M.spinHit, range: M.spinR[j] }, h.x, h.z, h.yaw, -2100 - j, false);
      emit('musou:hit', { x: h.x, y: 1.0, z: h.z, stage: 'rush', yaw: h.yaw, n: j });
    });
    const [d0, d1] = M.dash;                                         // the dash punch: 8 m forward, fist first
    if (t === d0) { mu.dx0 = h.x; mu.dz0 = h.z; }
    if (t > d0 && t <= d1) {
      const u = smooth((t - d0) / (d1 - d0)), fx = Math.sin(h.yaw), fz = Math.cos(h.yaw);
      [h.x, h.z] = clampWalk(mu.dx0 + fx * M.dashLen * u, mu.dz0 + fz * M.dashLen * u, 0.3);
      if (t === d1) {
        const n = hitAt(M.dashHit, mu.dx0, mu.dz0, h.yaw, -2500, false);
        emit('musou:hit', { x: h.x, y: 1.0, z: h.z, stage: 'contact', yaw: h.yaw, n });
      }
    }
    const w = t - M.finisher;
    if (w >= 0 && w <= M.waveFrames) {                               // the golden dragon ring from the fist
      const u = w / M.waveFrames;
      mu.waveR = M.waveR * (1 - (1 - u) * (1 - u) * (1 - u)) + 0.8;
      const n = hitAt({ ...M.waveHit, range: mu.waveR, lift: M.waveHit.lift - 3 * u, hitstop: w === 0 ? 5 : 0, heavy: w < 2 }, h.x, h.z, h.yaw, -3000, false);
      if (w === 0) emit('musou:burst', { count: n, x: h.x, z: h.z });
      else if (n) { const a = w * 2.4, R = mu.waveR * 0.9; emit('musou:hit', { x: h.x + Math.sin(a) * R, y: 0.4, z: h.z + Math.cos(a) * R, stage: 'wave', yaw: a, n: w }); }
    }
    if (t >= M.end) endMusou(mu, h, startMusou, M.cost);
  };

  mu.shot = () => {
    if (!mu.active) return null;
    const t = mu.t, o = shot;
    o.shake = 0.4; o.side = 0;
    if (t < M.activation) {                                          // front three-quarter, above head height, slow push-in
      const u = t / M.activation;
      Object.assign(o, { id: 1, yaw: offSun(mu.yaw0 + Math.PI * 0.8), dist: 4.4 - 0.7 * u, pitch: 0.3, fov: 44, height: 1.1, side: 0.1 });
    } else if (t < M.dash[0] - 6) {                                  // wide, high over his shoulder: the spins
      const u = smooth(Math.min(1, (t - M.activation) / 20));
      Object.assign(o, { id: 2, yaw: offSun(mu.yaw0 + 0.35), dist: 5 + 3 * u, pitch: 0.22 + 0.1 * u, fov: 56, height: 1.5 + 0.6 * u, shake: 0.5 });
    } else if (t < M.finisher - 4) {                                 // the dash: side-on tracking shot
      Object.assign(o, { id: 3, yaw: offSun(mu.yaw0 + Math.PI * 0.5), dist: 7, pitch: 0.12, fov: 58, height: 1.3, shake: 0.6 });
    } else {                                                          // the finisher: low wide shot, the ring bursting out
      const u = smooth((t - M.finisher + 4) / (M.end - M.finisher + 4));
      Object.assign(o, { id: 4, yaw: offSun(mu.yaw0 - 0.5), dist: 8.5 + 1.5 * u, pitch: 0.08 + 0.05 * u, fov: 58, height: 1.6 + 0.3 * u, shake: 0.7 });
    }
    return o;
  };

  gauge(mu, game, M.cost);
  return mu;
}
