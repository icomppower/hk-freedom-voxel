// Huang Zhong's per-battle sim: 真・無雙「百步穿楊」, plus the kit's arrows (src/combat/projectiles.js) and aim mode
// (aim.js), which live here because this is the kit object main.js builds, resets and steps every frame (game.musou).
// Same interface and events as Zhao Yun's (src/musou/musou.js): active, t, reset, start, stepHero, shot, ready, step;
// musou:ready/start/hit/burst/end. Extras: stepSpecial(inp) (hero.js: aim / strafe), aimShot() (aim camera, aim.js),
// proj (the arrow pool, read by the render side), aim (aim state, read by the aim preview).
// Timeline (musou frames t; hitstop pauses it):
//   0   activation — world freezes, an aura shove clears the stage, the bow thrust overhead (「老當益壯」)
//   30  close-up cut-in: he nocks, half draw toward the lens        76 feet planted wide, wide shot
//   84  VOLLEY (first volley = 'contact'): three flaming arrows every 3 sf while his aim sweeps ≈ 130° left → right across
//       the army (66 arrows in 1.1 s), each pierces 2 and bursts small where it lands
//   150 the giant arrow: a long deep draw, over-the-shoulder camera, embers gather
//   182 RELEASE: a blazing arrow ×5 tears a straight line through everything (pierce ∞), and 26 m out it EXPLODES
//       (≈ 218: musou:burst, the ring launches)                       244 control returns (≈ 4 s)
import { emit } from '../../core/events.js';
import { setState, stickDir } from '../../hero/locomotion.js';
import { ST, wrap } from '../../crowd/crowd.js';
import { SUN_DIR } from '../../world/sky.js';
import { createProjectiles, ARROW } from '../../combat/projectiles.js';
import { createAim } from './aim.js';
import { live } from './model.js';

export const HZ_MUSOU = {
  closeup: 30, plant: 76, volley: 84, volleyEnd: 150, big: 150, release: 182, end: 244,
  aura: { r0: 5.2, k: 0.35, frames: 5 },
  every: 3, sweep: 1.15,                  // volley cadence (sf), half-arc of the sweep (rad)
  volleyShot: { n: 3, spread: 9, pitch: -1.5, speed: 58, g: 5, range: 21, pierce: 2, rad: 0.5, fire: true,
    dmg: 12, kb: 'launch', force: 3, lift: 6.5, hitstop: 0, burst: { range: 1.9, dmg: 8, kb: 'flinch', force: 3, hitstop: 0 } },
  giant: { n: 1, pitch: 0, speed: 44, g: 0, range: 26, pierce: 1e6, rad: 1.9, fire: true, big: 2, burstEnd: true,
    dmg: 40, kb: 'blow', force: 10, lift: 8, heavy: true, hitstop: 0,
    burst: { range: 8.5, dmg: 80, kb: 'launch', force: 5, lift: 12, heavy: true, hitstop: 4 } },
  cost: 1 / 3,
};
const M = HZ_MUSOU;
export const GIANT_FRAMES = Math.round(M.giant.range / M.giant.speed * 60) + 1;   // release → explosion

const easeOut = (u) => 1 - (1 - u) * (1 - u);
const smooth = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
const SUN_AZ = Math.atan2(SUN_DIR.x, SUN_DIR.z), SUN_AVOID = 1.05;
const offSun = (y) => { const d = wrap(y - SUN_AZ); return Math.abs(d) >= SUN_AVOID ? y : SUN_AZ + (d < 0 ? -1 : 1) * SUN_AVOID; };

export function createMusou(game) {
  live.game = game;
  const mu = { active: false, t: 0, wasReady: false, yaw0: 0, seq: 0, giantI: -1, side: 1 };
  const shot = { id: 0, yaw: 0, dist: 0, pitch: 0, fov: 50, height: 1.2, side: 0, shake: 1 };
  const push = [];
  let startMusou = 0;
  mu.proj = createProjectiles(game);
  mu.aim = createAim(game, mu.proj);
  const giant = { ...M.giant, onBurst: (count, x, z) => emit('musou:burst', { count, x, z }) };

  mu.reset = () => { mu.active = false; mu.t = 0; mu.wasReady = false; mu.giantI = -1; push.length = 0; mu.proj.reset(); mu.aim.reset(); };
  mu.stepSpecial = (inp) => mu.aim.step(inp);
  mu.aimShot = () => mu.aim.shot();

  mu.start = (inp) => {
    const h = game.hero, c = game.crowd;
    const [sx, sz, smag] = stickDir(inp, game.cam.yaw);
    if (smag) h.yaw = Math.atan2(sx, sz);
    mu.aim.reset();
    mu.active = true; mu.t = 0; mu.seq++; mu.giantI = -1;
    mu.yaw0 = h.yaw;
    startMusou = h.musou;
    h.move = null; h.vx = h.vz = 0;
    setState(h, 'musou');
    h.musouClip = 'hz_act'; h.musouT = 0;
    h.iframes = M.end + 30;
    game.freeze = 2;
    const { r0, k } = M.aura, R1 = r0 / (1 - k);                          // activation aura: the nearest soldiers recoil
    push.length = 0;
    for (let i = 0; i < c.N; i++) {
      const s = c.st[i];
      if (s === ST.OFF || s === ST.DEAD || c.y[i] > 0.3) continue;
      const dx = c.x[i] - h.x, dz = c.z[i] - h.z, d = Math.hypot(dx, dz);
      if (d >= R1 || d < 1e-3) continue;
      const f = (r0 + d * k) / d;
      push.push([i, c.x[i], c.z[i], h.x + dx * f, h.z + dz * f]);
      c.releaseToken(i);
      c.st[i] = ST.KNOCK; c.stT[i] = 0; c.vx[i] = c.vz[i] = 0;
    }
    emit('musou:start', { x: h.x, z: h.z, activation: M.closeup, burstAt: M.release + GIANT_FRAMES, contact: M.volley });
  };

  const bow = (h, yaw) => ({ x: h.x + Math.sin(yaw) * ARROW.ahead, y: h.y + ARROW.heroY, z: h.z + Math.cos(yaw) * ARROW.ahead, yaw });

  mu.stepHero = (inp) => {
    const h = game.hero, c = game.crowd, t = ++mu.t;
    h.iframes = Math.max(h.iframes, 2);
    h.vx = h.vz = 0;
    h.musou = Math.max(0, startMusou - h.musouMax * M.cost * Math.min(1, t / M.volley));
    if (t < M.volley) game.freeze = Math.max(game.freeze, 2);
    if (t <= M.aura.frames) {
      const u = easeOut(t / M.aura.frames);
      for (const [i, fx, fz, tx, tz] of push) if (c.st[i] === ST.KNOCK) { c.x[i] = fx + (tx - fx) * u; c.z[i] = fz + (tz - fz) * u; }
    }
    if (t < M.closeup) { h.musouClip = 'hz_act'; h.musouT = t / M.closeup; return; }
    if (t < M.plant) { h.musouClip = 'hz_face'; h.musouT = (t - M.closeup) / (M.plant - M.closeup); return; }
    if (t < M.volley) {                                                   // plant: the stick may still aim the volley
      const [dx, dz, mag] = stickDir(inp, game.cam.yaw);
      if (mag) mu.yaw0 += wrap(Math.atan2(dx, dz) - mu.yaw0) * 0.15;
      h.yaw = mu.yaw0 + M.sweep;
      h.musouClip = 'hz_volley'; h.musouT = 0;
      return;
    }
    if (t < M.volleyEnd) {                                               // VOLLEY: the aim sweeps left → right
      const u = (t - M.volley) / (M.volleyEnd - M.volley);
      h.yaw = mu.yaw0 + M.sweep * (1 - 2 * smooth(u));
      h.musouClip = 'hz_volley'; h.musouT = ((t - M.volley) % M.every) / M.every;
      if ((t - M.volley) % M.every === 0) {
        mu.proj.shoot(M.volleyShot, 'musou', bow(h, h.yaw));
        const f = bow(h, h.yaw);
        emit('musou:hit', { x: f.x + Math.sin(h.yaw) * 1.5, y: 1.4, z: f.z + Math.cos(h.yaw) * 1.5, stage: t === M.volley ? 'contact' : 'front', yaw: h.yaw, n: t - M.volley });
      }
      return;
    }
    if (t < M.release) {                                                 // the giant arrow's draw (facing back to centre)
      h.yaw = mu.yaw0 + wrap(h.yaw - mu.yaw0) * 0.85;
      h.musouClip = 'hz_big'; h.musouT = (t - M.big) / (M.release - M.big);
      return;
    }
    if (t === M.release) {
      h.yaw = mu.yaw0;
      mu.side = Math.abs(wrap(mu.yaw0 + 1.3 - SUN_AZ)) >= Math.abs(wrap(mu.yaw0 - 1.3 - SUN_AZ)) ? 1 : -1;   // flank cam: sun behind it
      const b = bow(h, h.yaw);
      mu.giantI = mu.proj.spawn(b.x, b.y, b.z, h.yaw, 0, giant, 'musou', -1);
      emit('arrow:fire', { x: b.x, y: b.y, z: b.z, yaw: h.yaw, n: 1, heavy: true, fire: true, big: 2, sky: false, move: 'musou' });
    }
    h.musouClip = 'hz_fin'; h.musouT = (t - M.release) / (M.end - M.release);
    const g = mu.giantI, P = mu.proj;
    if (g >= 0 && P.st[g] && P.big[g] === 2 && (t - M.release) % 3 === 0) {   // the flight: ticks for the audio build-up
      emit('musou:hit', { x: P.x[g], y: P.y[g], z: P.z[g], stage: 'front', yaw: h.yaw, n: t - M.volley });
    }
    if (t >= M.end) {
      mu.active = false;
      h.musou = Math.max(0, startMusou - h.musouMax * M.cost);
      h.iframes = 30;
      setState(h, 'idle');
      emit('musou:end', {});
    }
  };

  /** Camera shot for the current Musou frame (render side; id change = hard cut). Terms as src/musou/musou.js shot(). */
  mu.shot = () => {
    if (!mu.active) return null;
    const t = mu.t, o = shot;
    o.shake = 0.3; o.side = 0;
    if (t < M.closeup) {                                   // front three-quarter from above, slow push-in on the raised bow
      const u = t / M.closeup;
      Object.assign(o, { id: 1, yaw: offSun(mu.yaw0 + Math.PI * 0.8), dist: 4.3 - 0.6 * u, pitch: 0.34, fov: 46, height: 1.1, side: 0.1 });
    } else if (t < M.plant) {                              // close-up: nocking, the old man's glare
      const u = (t - M.closeup) / (M.plant - M.closeup);
      Object.assign(o, { id: 2, yaw: offSun(mu.yaw0 + Math.PI * 0.72), dist: 1.9 - 0.25 * smooth(u), pitch: 0.12, fov: 32, height: 1.5, side: -0.18 });
    } else if (t < M.big) {                                // wide from behind-left above: the sweep rakes the army
      const u = smooth((t - M.plant) / (M.big - M.plant));
      Object.assign(o, { id: 3, yaw: offSun(mu.yaw0 + 0.5 - 0.25 * u), dist: 7.2 + 1.2 * u, pitch: 0.24, fov: 58, height: 1.6, side: 1.3, shake: 0.5 });
    } else if (t < M.release + 4) {                        // over the right shoulder on the giant draw, slowly pushing in
      const u = smooth((t - M.big) / (M.release - M.big));
      Object.assign(o, { id: 4, yaw: offSun(mu.yaw0 - 0.18), dist: 2.8 - 0.7 * u, pitch: 0.05, fov: 42 - 8 * u, height: 1.55, side: 0.62, shake: 0.2 });
    } else {
      // cut to a high flank shot square to the arrow line (on the side away from the sun): the blaze crosses the frame
      // from him to the explosion, the aim point drifting down range with it
      const u = smooth((t - M.release - 4) / 40), s = mu.side;
      Object.assign(o, { id: 5, yaw: mu.yaw0 + s * 1.3, dist: 12 + 4 * u, pitch: 0.22 + 0.08 * u, fov: 58, height: 2 + u, side: s * (7 + 10 * u), shake: 0.9 });
    }
    return o;
  };

  mu.ready = () => game.hero.musou >= game.hero.musouMax * M.cost - 1e-6;
  mu.step = () => {
    const ready = mu.ready() && game.hero.state !== 'musou';
    if (ready && !mu.wasReady) emit('musou:ready', {});
    mu.wasReady = ready;
    mu.proj.step();
  };
  return mu;
}
