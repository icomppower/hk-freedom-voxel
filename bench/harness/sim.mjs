// Headless sim runner (Node): the game's sim modules stepped at a fixed 60 Hz with no renderer, DOM or wall clock.
// Mirrors main.js step() / startBattle() exactly (keep them in sync). Run with `node --import ./bench/harness/register.mjs`.
//   const sim = await createSim({ enemies })       one sim per process (the event bus and map state are module singletons)
//   sim.start({ char, mode, chapter })              battle reset (deterministic from here: both RNGs reseeded, frame 0)
//   sim.step(inp)                                   one fixed step; inp = { mx, my, orbit, tilt, pressed: {}, held: {} }
//   sim.hash()                                      FNV-1a 32 of the sim state (hero, crowd arrays, cam, frame)
//   sim.end                                         story:end payload once the battle is over ({ win, stats }), else null
// Input logs (bench/harness/logs/*.json): { char, mode, chapter, enemies, frames, rle: [[n, mx, my, orbit, tilt, pMask, hMask], …],
// checks: { frame: hash } } — the raw per-step input as input.sample() returned it (before the camera rotates the stick).
import { rng, vrng } from '../../src/core/rng.js';
import { on, emit } from '../../src/core/events.js';
import * as MAPMOD from '../../src/world/map.js';
import { createHero } from '../../src/hero/hero.js';
import { createCrowd } from '../../src/crowd/crowd.js';
import { createCombat } from '../../src/combat/combat.js';
import { createCamSim } from '../../src/camera/camera.js';
import { CHARS } from '../../src/chars/index.js';
import { createStory } from '../../src/story/index.js';
import { difficulty } from '../../src/core/difficulty.js';

export const ACTIONS = ['attack', 'charge', 'jump', 'dodge', 'musou', 'target'];

export async function createSim({ enemies = 300 } = {}) {
  const game = { frame: 0, hitstop: 0, freeze: 0, mode: 'free', diff: difficulty() };
  game.cam = createCamSim();
  game.hero = createHero(game);
  game.crowd = createCrowd(game, enemies);
  game.combat = createCombat(game);
  game.musou = game.hero.kit.createMusou(game);
  game.story = createStory(game);
  const sim = { game, end: null, events: [] };
  on('story:end', (e) => { sim.end = e; });
  for (const n of ['story:say', 'story:banner', 'story:objective', 'ko', 'hero:down', 'musou:start'])
    on(n, (e) => { if (sim.trace) sim.events.push([game.frame, n, n === 'ko' ? e.officer : n === 'story:objective' ? e.en : n === 'story:banner' ? e.en : null]); });

  sim.start = ({ char = 'zhaoyun', mode = 'story', chapter } = {}) => {
    const ch = CHARS[char] || CHARS.zhaoyun, newKit = ch.kit !== game.hero.kit;
    if (chapter !== undefined && MAPMOD.useChapterMap) MAPMOD.useChapterMap(chapter);   // seam: registries (stage 1+)
    const p = MAPMOD.spawnPoint(mode);
    Object.assign(game, { mode, frame: 0, hitstop: 0, freeze: 0, diff: difficulty(), chapter });
    vrng.seed(7936); rng.seed(1);
    game.hero.reset({ ...p, char: ch });
    if (newKit) game.musou = ch.kit.createMusou(game);
    game.crowd.reset(); game.combat.reset(); game.musou.reset(); game.cam.reset(p.yaw); game.cam.tilt = p.tilt || 0;
    game.story.reset({ mode, char: ch.id, chapter });
    emit('scenario', { mode, char: ch.id, chapter });
    sim.end = null; sim.events.length = 0;
  };

  sim.step = (inp) => {
    game.cam.step(game, inp);
    game.hero.step(inp);
    game.combat.step();
    game.crowd.step();
    game.musou.step();
    game.story.step();
    game.frame++;
  };

  sim.hash = () => stateHash(game);
  return sim;
}

// ---------------------------------------------------------------- state hash
const HF = ['x', 'y', 'z', 'vx', 'vy', 'vz', 'yaw', 'hp', 'musou', 'kos', 'combo', 'comboT', 'stateT', 'moveT', 'iframes', 'airN'];
const CF = ['x', 'z', 'y', 'hp', 'yaw'];
export function stateHash(game) {
  let h = 0x811c9dc5;
  const buf = new Float64Array(1), u8 = new Uint8Array(buf.buffer);
  const num = (v) => { buf[0] = +v || 0; for (let k = 0; k < 8; k++) { h ^= u8[k]; h = Math.imul(h, 0x01000193); } };
  const str = (s) => { s = String(s); for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 0x01000193); } num(s.length); };
  const H = game.hero, C = game.crowd;
  num(game.frame); num(game.hitstop);
  for (const f of HF) num(H[f]);
  str(H.state); str(H.move); num(H.dead ? 1 : 0);
  num(game.cam.yaw); num(game.cam.tilt);
  for (let i = 0; i < C.T; i++) { num(C.st[i]); if (C.st[i]) for (const f of CF) num(C[f][i]); }
  num(C.allyKos); num(C.allyLost); num(C.sq.n);
  const st = game.story.stats(); num(st.kos); num(st.maxChain); num(st.dmg);
  num(game.musou.active ? 1 : 0); num(game.musou.t);
  return (h >>> 0).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------- input logs
const mask = (o) => ACTIONS.reduce((m, a, k) => m | (o[a] ? 1 << k : 0), 0);
const unmask = (m) => Object.fromEntries(ACTIONS.map((a, k) => [a, !!(m & (1 << k))]));
const r4 = (v) => Math.round(v * 1e4) / 1e4;       // stick / look values are stored rounded; replay uses the rounded ones
export function encodeInput(inp) { return [r4(inp.mx), r4(inp.my), r4(inp.orbit), r4(inp.tilt), mask(inp.pressed), mask(inp.held)]; }
export function decodeInput(a) { return { mx: a[0], my: a[1], orbit: a[2], tilt: a[3], pressed: unmask(a[4]), held: unmask(a[5]) }; }
export function rlePush(rle, rec) {
  const last = rle[rle.length - 1];
  if (last && rec.every((v, k) => v === last[k + 1])) last[0]++;
  else rle.push([1, ...rec]);
}
export function* rleFrames(rle) { for (const [n, ...rec] of rle) for (let k = 0; k < n; k++) yield rec; }

/** Replay a log; returns { checks: { frame: hash }, end, frames }. checkEvery: also hash every n frames. */
export function replay(sim, log, { checkEvery = 600 } = {}) {
  sim.start({ char: log.char, mode: log.mode, chapter: log.chapter });
  const checks = {};
  let f = 0;
  for (const rec of rleFrames(log.rle)) {
    sim.step(decodeInput(rec)); f++;
    if (f % checkEvery === 0) checks[f] = sim.hash();
  }
  checks[f] = sim.hash();
  return { checks, end: sim.end, frames: f };
}
