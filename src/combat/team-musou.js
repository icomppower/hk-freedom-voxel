// Team Musou 齊上齊落 (sim; co-op only — src/net/coopsim.js calls in, the solo step never does). Brief: Notion "CLI Brief —
// Team Musou 齊上齊落". Both heroes alive, both gauges Musou-ready, within 6 m: one player's Musou press is a CALL (90-tick
// window, the press is held back); the partner's press inside it fires the Team Musou, no answer fires the caller's
// own Musou at once; both pressing on the same tick fires it with no caller. Every decision reads the merged lockstep
// inputs and counts ticks, so both peers resolve it identically.
// Firing (300 ticks): 0–60 the cinematic (both heroes back to back at the midpoint, the world frozen by the Musou rule:
// game.freeze; the camera's two-shot comes from mu.shot, wrapped in install()), 60–300 the attack under the normal
// camera — 小美's umbrella wall round both (hits every 15 ticks inside WALL_R, pushes out), 龍仔's two pole sweeps round
// the ring (120, 200: everything within RADIUS), the combined shockwave (280). Both invincible (iframes) and out of
// reach (state 'musou') for all 300 ticks; both gauges are spent fully at the start.
// Numbers: damage per enemy caught by every hit = 1.5 × (龍仔 solo + 小美 solo, each summed over its hits); RADIUS =
// max(9 m, 1.5 × the larger solo radius); a boss takes ≤ 25 % of its max HP per use (per-victim hits: combat.hitOne);
// officers uncapped. A downed hero can't join and isn't revived.
// State: game.coop.team { phase 'idle'|'calling'|'firing', t, caller, cx, cz, seq, log[], budget }. Events: team:call {i},
// team:timeout {i}, team:start {caller, x, z}, team:end; musou:start / musou:end bracket the cinematic (camera, HUD, audio).
import { setState } from '../hero/locomotion.js';
import { clampWalk } from '../world/map.js';
import { emit } from '../core/events.js';
import { ST } from '../crowd/crowd.js';
import { LUNGJAI_MUSOU as LJ } from '../chars/lungjai/musou.js';
import { SIUMEI_MUSOU as SM } from '../chars/siumei/musou.js';

const SOLO_LJ = LJ.spinHit.dmg * LJ.spins.length + LJ.dashHit.dmg + LJ.waveHit.dmg;                  // 126
const SOLO_SM = SM.cutHit.dmg * 6 + SM.tornadoHit.dmg * SM.tornado.length + SM.xHit.dmg;              // 152
const SOLO_R = Math.max(LJ.waveR + 0.8, SM.xHit.range);                                               // 7.8 m
export const TEAM = {
  range: 6, window: 90, cine: 60, end: 300,
  radius: Math.max(9, 1.5 * SOLO_R), wallR: 3.2, bossCap: 0.25,
  wall: Array.from({ length: 16 }, (_, k) => 60 + 15 * k), arcs: [120, 200], blast: 280,
  total: 1.5 * (SOLO_LJ + SOLO_SM),
};
const WALL_DMG = TEAM.total * 0.25 / TEAM.wall.length, ARC_DMG = TEAM.total * 0.4 / TEAM.arcs.length, BLAST_DMG = TEAM.total * 0.35;
const WALL_HIT = { shape: 'circle', dmg: WALL_DMG, kb: 'spin', force: 6, lift: 2.5, hitstop: 0 };
const ARC_HIT = { shape: 'circle', dmg: ARC_DMG, kb: 'spin', force: 8, lift: 4, hitstop: 0, heavy: true };
const BLAST_HIT = { shape: 'circle', dmg: BLAST_DMG, kb: 'launch', force: 7, lift: 9.5, hitstop: 0, heavy: true, yMax: 6 };

export const newTeam = () => ({ phase: 'idle', t: 0, caller: -1, cx: 0, cz: 0, seq: 0, log: [], budget: new Map() });

const ready = (h) => !h.dead && h.state !== 'musou' && h.musou >= h.musouMax / 3 - 1e-6;
/** Both heroes can start a Team Musou right now (render reads this too: the gold pulse and the link line). */
export function eligible(game) {
  const [a, b] = game.heroes;
  return ready(a) && ready(b) && Math.hypot(a.x - b.x, a.z - b.z) <= TEAM.range;
}
/** The hero that opens the umbrella wall (小美), the other sweeps the pole. */
const wallHero = (game) => (game.heroes[1].char?.id === 'siumei' || game.heroes[0].char?.id !== 'siumei' ? 1 : 0);

/** Before the heroes step: resolve calls / answers from this tick's inputs (presses it consumes are cleared, so the
 *  heroes don't also start their own Musou). `bind` = coopsim.bind. */
export function teamPre(game, ins, bind) {
  const T = game.coop.team;
  if (T.phase === 'firing') { for (const x of ins) if (x) x.pressed.musou = false; return; }
  const ok = eligible(game), pa = !!ins[0]?.pressed.musou, pb = !!ins[1]?.pressed.musou;
  if (T.phase === 'idle') {
    if (!ok || !(pa || pb)) return;                               // out of range / not both ready: a solo Musou
    if (pa && pb) { ins[0].pressed.musou = ins[1].pressed.musou = false; return fire(game, -1, 'same', bind); }
    const i = pa ? 0 : 1;
    ins[i].pressed.musou = false;
    Object.assign(T, { phase: 'calling', t: 0, caller: i });
    emit('team:call', { i });
    return;
  }
  // calling
  const c = T.caller, j = 1 - c;
  T.t++;
  ins[c].pressed.musou = false;
  if (ok && ins[j]?.pressed.musou) { ins[j].pressed.musou = false; return fire(game, c, 'answer', bind); }
  if (!ok || T.t >= TEAM.window) {                                // no answer: the caller's own Musou, now
    T.phase = 'idle'; T.caller = -1;
    T.log.push({ f: game.frame, kind: 'timeout', caller: c });
    ins[c].pressed.musou = true;
    emit('team:timeout', { i: c });
  }
}

function fire(game, caller, kind, bind) {
  const T = game.coop.team, H = game.heroes, c = game.crowd;
  const [a, b] = H, w = wallHero(game);
  const cx = (a.x + b.x) / 2, cz = (a.z + b.z) / 2;
  const ax = b.x - a.x, az = b.z - a.z, al = Math.hypot(ax, az) || 1, yaw = Math.atan2(ax / al, az / al);
  Object.assign(T, { phase: 'firing', t: 0, caller, cx, cz, yaw, seq: T.seq + 1 });
  T.log.push({ f: game.frame, kind, caller });
  T.budget.clear();
  for (let i = 0; i < c.N; i++) if (c.boss[i] && c.st[i] !== ST.OFF && c.st[i] !== ST.DEAD) T.budget.set(i, c.hpMax[i] * TEAM.bossCap);
  H.forEach((h, i) => {                                           // back to back across the midpoint, gauges spent
    const s = i ? 1 : -1;
    [h.x, h.z] = clampWalk(cx + Math.sin(yaw) * 0.6 * s, cz + Math.cos(yaw) * 0.6 * s, 0.3);
    h.yaw = yaw + (i ? 0 : Math.PI);
    h.musou = 0; h.musouBuf = 0; h.move = null; h.vx = h.vz = 0; h.y = 0; h.grounded = true;
    h.iframes = TEAM.end + 30;
    setState(h, 'musou');
    h.musouClip = i === w ? 'mu_siumei' : 'mu_lungjai'; h.musouT = 0;
  });
  bind(game, caller < 0 ? 0 : caller);
  game.freeze = Math.max(game.freeze, 2);
  emit('team:start', { caller, x: cx, z: cz });
  emit('musou:start', { x: cx, z: cz, activation: TEAM.cine, burstAt: TEAM.blast, contact: TEAM.arcs[0] });
}

/** In place of both heroes' hero.step while firing (camera sim and hitboxes still step as usual). */
export function teamStep(game, bind) {
  const T = game.coop.team, H = game.heroes, t = ++T.t, w = wallHero(game), p = 1 - w;
  for (const h of H) { h.iframes = Math.max(h.iframes, 2); h.vx = h.vz = 0; }
  const hw = H[w], hp = H[p];
  hw.musouT = t < TEAM.cine ? 0.08 * t / TEAM.cine : 0.65;        // 小美 holds the umbrellas-open spin of her clip
  hp.musouT = t < TEAM.cine ? 0.08 * t / TEAM.cine : 0.14 + 0.8 * (t - TEAM.cine) / (TEAM.end - TEAM.cine);
  if (t < TEAM.cine) { game.freeze = Math.max(game.freeze, 2); return; }
  if (t === TEAM.cine) emit('musou:end', {});                     // the camera eases back to the gameplay rig
  hw.yaw += 0.3;
  for (const a of TEAM.arcs) if (t > a - 15 && t <= a + 15) hp.yaw += Math.PI * 2 / 30;
  const key = -(6000000 + (T.seq % 1000) * 1000);
  if (TEAM.wall.includes(t)) hits(game, w, WALL_HIT, TEAM.wallR, key - t, bind);
  if (TEAM.arcs.includes(t)) { hits(game, p, ARC_HIT, TEAM.radius, key - t, bind); emit('team:arc', { x: T.cx, z: T.cz }); }
  if (t === TEAM.blast) { hits(game, p, BLAST_HIT, TEAM.radius, key - t, bind); emit('musou:burst', { count: 0, x: T.cx, z: T.cz }); }
  if (t >= TEAM.end) {
    for (const h of H) { h.iframes = 30; h.musouClip = null; h.musouT = 0; setState(h, 'idle'); }
    T.phase = 'idle'; T.caller = -1;
    emit('team:end', {});
  }
}

/** One hit on every foe within r of the centre, credited to hero `by`; bosses capped at bossCap × hpMax per use. */
function hits(game, by, hit, r, key, bind) {
  const T = game.coop.team, c = game.crowd, prev = game.bound;
  bind(game, by);
  for (let i = 0; i < c.N; i++) {
    const s = c.st[i];
    if (s === ST.OFF || s === ST.DEAD || Math.hypot(c.x[i] - T.cx, c.z[i] - T.cz) > r) continue;
    let h = hit;
    if (T.budget.has(i)) {
      const d = Math.min(hit.dmg, T.budget.get(i));
      if (d <= 1e-9) continue;
      T.budget.set(i, T.budget.get(i) - d);
      h = { ...hit, dmg: d };
    }
    game.combat.hitOne(i, h, T.cx, T.cz, Math.atan2(c.x[i] - T.cx, c.z[i] - T.cz), key, true, 'musou');
  }
  bind(game, prev);
}

/** Wrap each hero's mu.shot so the camera gets the back-to-back two-shot during the cinematic (render-only). */
export function install(game) {
  for (const h of game.heroes) {
    const mu = h.mu, solo = mu.shot;
    if (!solo || mu.teamWrapped) continue;
    const o = { id: 50, yaw: 0, dist: 5.2, pitch: 0.12, fov: 46, height: 1.25, side: 0, shake: 0.3 };
    mu.shot = () => {
      const T = game.coop?.team;
      if (T?.phase === 'firing' && T.t < TEAM.cine) {
        const u = T.t / TEAM.cine;
        Object.assign(o, { id: 50, yaw: T.yaw + Math.PI / 2 + 0.25 * u, dist: 5.2 - 1.2 * u, height: 1.2 + 0.2 * u });
        return o;
      }
      return solo();
    };
    mu.teamWrapped = true;
  }
}
