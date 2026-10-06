// Co-op sim: two heroes on one deterministic field (the page's main.js and the headless clients both step it, so they
// agree by construction). The engine still thinks in "the hero" (game.hero / game.cam / game.musou / game.hitstop): bind()
// swaps those four onto hero i, and step() runs each module with the right hero bound —
//   per hero: camera sim, hero, its hitboxes (combat.heroStep)  →  lead bound: reactions (combat.worldStep), crowd
//   (every soldier takes the nearest living hero: crowd.js c.tgt)  →  per hero: Musou  →  lead bound: story, 2P rules.
// The lead = the first hero still standing (the story's triggers / waves / director follow him).
// Input sources per hero: a decoded network input (src/net/codec.js) or null = bot autoplay, run inside the step on both
// peers alike (bench/bot/bot.mjs policy + revive behaviour, ./coopbot.js).
// 2P rules (brief "Online Co-op 2P"): a downed hero stays down 30 s; the partner holding interact (F / 救 button) within
// 2 m for 3 s revives him at 40 % HP; the timer running out respawns him at the last gate cleared; both down = both back
// at that gate after 2 s. Boss HP × 1.6, officer HP × 1.3 (story/index.js fire), crowd density unchanged, Musou gauges
// separate, no friendly fire (hero hits only ever test the crowd). Emits coop:down {i}, coop:revive {i, by},
// coop:respawn {i, both}, coop:reviving {i, by, k} (k 0-1, every step while held).
import { createHero } from '../hero/hero.js';
import { createCamSim } from '../camera/camera.js';
import { setState } from '../hero/locomotion.js';
import { CHARS } from '../chars/index.js';
import { spawnPoint, setMap, GATES, clampWalk } from '../world/map.js';
import { resolveChapter } from '../story/chapters.js';
import { rng, vrng } from '../core/rng.js';
import { emit } from '../core/events.js';
import { DIFFS } from '../core/difficulty.js';
import { createCoopBot } from './coopbot.js';
import { encodeIn, decodeIn } from './codec.js';
import { newTeam, teamPre, teamStep, install as installTeam } from '../combat/team-musou.js';   // 齊上齊落 Team Musou

export const COOP = {
  reviveR: 2, reviveF: 180, reviveHp: 0.4,   // partner within 2 m holds interact 3 s → 40 % HP
  downF: 1800,                               // 30 s down → respawn at the last gate cleared
  bothDownF: 120,                            // both down: back at that gate after 2 s
  respawnHp: 1, respawnIframes: 120,
  bossHp: 1.6, officerHp: 1.3,               // with 2 heroes
  side: 2.5,                                 // hero 2 starts this far to the right of the spawn
};

/** Bind hero i: game.hero / cam / musou / hitstop become his (the previous hero's hitstop is parked on him). */
export function bind(game, i) {
  const b = game.bound;
  if (b === i) return;
  const H = game.heroes;
  H[b].hs = game.hitstop;
  const h = H[i];
  game.hero = h; game.cam = h.cam; game.musou = h.mu; game.hitstop = h.hs; game.bound = i;
}
/** Back to one hero (leaving co-op on this page): hero 0 bound, the list dropped — the solo code paths again. */
export function detachCoop(game) {
  if (!game.heroes) return;
  bind(game, 0);
  delete game.heroes; delete game.coop; delete game.bound;
}
export const lead = (game) => { const H = game.heroes; for (let i = 0; i < H.length; i++) if (!H[i].dead) return i; return 0; };

/** Turn a solo game (main.js / a headless sim: game.hero, cam, crowd, combat, musou, story) into a 2-hero one. */
export function attachCoop(game) {
  if (game.heroes) return game;
  const h0 = game.hero, h1 = createHero(game);
  h0.cam = game.cam; h0.mu = game.musou; h0.hs = 0; h0.idx = 0; h0.keyBase = 0;
  h1.cam = createCamSim(); h1.mu = game.musou; h1.hs = 0; h1.idx = 1; h1.keyBase = 1 << 26;   // own hit-window keys
  game.heroes = [h0, h1]; game.bound = 0;
  game.coop = { downAt: [-1, -1], reviveT: [0, 0], bot: [null, null], lastGate: null, open: {}, start: null, bothAt: -1, chars: [] };
  return game;
}

/** New co-op battle: { chars: [id, id], chapter, seed }. Deterministic from here (both RNGs reseeded, frame 0). The page
 *  syncs its world after (main.js), the headless clients don't render. Difficulty is fixed (普通 Normal): each player's
 *  stored tier would split the sims. */
export function coopStart(game, { chars, chapter, seed = 1 }) {
  const K = game.coop, H = game.heroes;
  const CH = resolveChapter(chapter, chars[0]);
  setMap(CH.map);
  const p = spawnPoint('story');
  Object.assign(game, { mode: 'story', chapter: CH.id, frame: 0, freeze: 0, diff: DIFFS.find((d) => d.id === 'normal'), timeScale: 1 });
  vrng.seed(7936); rng.seed(seed >>> 0);
  for (let i = 0; i < H.length; i++) {
    bind(game, i);
    const ch = CHARS[chars[i]], h = H[i];
    const ox = i ? Math.cos(p.yaw) * COOP.side : 0, oz = i ? -Math.sin(p.yaw) * COOP.side : 0;
    const [x, z] = clampWalk(p.x + ox, p.z + oz, 0.5);
    h.reset({ x, z, yaw: p.yaw, char: ch });
    game.hitstop = 0;
    h.mu = game.musou = ch.kit.createMusou(game);
    h.mu.reset(); h.cam.reset(p.yaw); h.cam.tilt = p.tilt || 0;
  }
  bind(game, 0);
  game.crowd.reset(); game.combat.reset();
  game.story.reset({ mode: 'story', char: chars[0], chapter: CH.id });
  game.crowd.heroHp = H.reduce((s, h) => s + h.hp, 0);
  Object.assign(K, { downAt: [-1, -1], reviveT: [0, 0], bot: [null, null], lastGate: null, open: {}, start: { x: p.x, z: p.z, yaw: p.yaw }, bothAt: -1, chars: [...chars] });
  for (const id in GATES) K.open[id] = GATES[id].open;
  K.team = newTeam(); installTeam(game);
  emit('scenario', { mode: 'story', char: chars[0], chapter: CH.id, coop: true });
  return CH;
}

/** One fixed step. ins[i] = decoded input (codec.decodeIn) or null (bot autoplay for hero i). */
export function coopStep(game, ins) {
  const H = game.heroes, K = game.coop, n = H.length;
  for (let i = 0; i < n; i++) {
    if (ins[i]) { K.bot[i] = null; continue; }
    if (!K.bot[i]) K.bot[i] = createCoopBot(i);
    bind(game, i);
    ins[i] = decodeIn(encodeIn(K.bot[i](game)));          // quantised like a network input
  }
  teamPre(game, ins, bind);
  const team = K.team.phase === 'firing';                 // Team Musou: it drives both heroes instead of hero.step
  for (let i = 0; i < n; i++) { bind(game, i); game.cam.step(game, ins[i]); if (!team) { game.hero.step(ins[i]); game.combat.heroStep(); } }
  if (team) { teamStep(game, bind); for (let i = 0; i < n; i++) { bind(game, i); game.combat.heroStep(); } }
  const L = lead(game);
  bind(game, L);
  game.combat.worldStep();
  game.crowd.step();
  for (let i = 0; i < n; i++) { bind(game, i); game.musou.step(); }
  bind(game, L);
  game.story.step();
  rules(game, ins);
  game.frame++;
}

// ---------------------------------------------------------------- 2P rules
function rules(game, ins) {
  const H = game.heroes, K = game.coop, f = game.frame;
  for (const id in GATES) { const o = GATES[id].open; if (o && !K.open[id]) K.lastGate = id; K.open[id] = o; }
  for (let i = 0; i < H.length; i++) {
    const h = H[i];
    if (h.dead && K.downAt[i] < 0) { K.downAt[i] = f; emit('coop:down', { i }); }
    if (!h.dead) K.downAt[i] = -1;
  }
  // revive: a standing partner within reach, holding interact
  for (let i = 0; i < H.length; i++) {
    const h = H[i], j = 1 - i, d = H[j];
    if (h.dead || !d || !d.dead || !ins[i]?.held?.interact || Math.hypot(h.x - d.x, h.z - d.z) > COOP.reviveR) { K.reviveT[i] = 0; continue; }
    K.reviveT[i]++;
    emit('coop:reviving', { i: j, by: i, k: K.reviveT[i] / COOP.reviveF });
    if (K.reviveT[i] >= COOP.reviveF) { K.reviveT[i] = 0; standUp(game, d, COOP.reviveHp, null); emit('coop:revive', { i: j, by: i }); }
  }
  const down = H.filter((h) => h.dead).length;
  if (down === H.length) {
    if (K.bothAt < 0) K.bothAt = f;
    if (f - K.bothAt >= COOP.bothDownF) {
      K.bothAt = -1;
      const p = respawnAt(game);
      H.forEach((h, i) => { standUp(game, h, COOP.respawnHp, p, i); K.downAt[i] = -1; emit('coop:respawn', { i, both: true }); });
    }
    return;
  }
  K.bothAt = -1;
  for (let i = 0; i < H.length; i++) {
    if (H[i].dead && K.downAt[i] >= 0 && f - K.downAt[i] >= COOP.downF) {
      standUp(game, H[i], COOP.respawnHp, respawnAt(game), i); K.downAt[i] = -1; emit('coop:respawn', { i, both: false });
    }
  }
}
/** The last gate cleared (its far side, on the walkable ground), else the chapter's start. */
function respawnAt(game) {
  const K = game.coop, g = K.lastGate && GATES[K.lastGate];
  if (g) { const r = g.rect; return { x: (r[0] + r[2]) / 2, z: r[3] + 4, yaw: K.start.yaw }; }
  return { ...K.start };
}
function standUp(game, h, hpK, p, i = 0) {
  h.dead = false; h.hp = Math.max(1, Math.round(h.hpMax * hpK)); h.move = null; h.musouBuf = 0;
  h.vx = h.vy = h.vz = 0; h.iframes = COOP.respawnIframes; h.combo = 0; h.comboT = 0;
  if (p) { const [x, z] = clampWalk(p.x + (i ? COOP.side : 0), p.z, 0.5); h.x = x; h.z = z; h.y = 0; h.yaw = p.yaw; h.grounded = true; }
  setState(h, 'idle');
}
