// Co-op state hash (FNV-1a 32): every hero (with his camera and Musou), the crowd arrays, the story counters — the
// desync check both peers send every 120 ticks. Same fields as the solo harness hash (bench/harness/sim.mjs stateHash),
// once per hero.
import { bind } from './coopsim.js';

const HF = ['x', 'y', 'z', 'vx', 'vy', 'vz', 'yaw', 'hp', 'musou', 'kos', 'combo', 'comboT', 'stateT', 'moveT', 'iframes', 'airN'];
const CF = ['x', 'z', 'y', 'hp', 'yaw'];
export function coopHash(game) {
  let h = 0x811c9dc5;
  const buf = new Float64Array(1), u8 = new Uint8Array(buf.buffer);
  const num = (v) => { buf[0] = +v || 0; for (let k = 0; k < 8; k++) { h ^= u8[k]; h = Math.imul(h, 0x01000193); } };
  const str = (s) => { s = String(s); for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 0x01000193); } num(s.length); };
  game.hero.hs = game.hitstop;                         // the bound hero's hitstop lives in game.hitstop (coopsim bind)
  num(game.frame);
  for (const H of game.heroes) {
    for (const f of HF) num(H[f]);
    str(H.state); str(H.move); num(H.dead ? 1 : 0); num(H.hs);
    num(H.cam.yaw); num(H.cam.tilt); num(H.mu.active ? 1 : 0); num(H.mu.t);
  }
  const C = game.crowd;
  for (let i = 0; i < C.T; i++) { num(C.st[i]); if (C.st[i]) for (const f of CF) num(C[f][i]); }
  num(C.allyKos); num(C.allyLost); num(C.sq.n);
  const b = game.bound;
  bind(game, 0);
  const st = game.story.stats(); num(st.kos); num(st.maxChain); num(st.dmg);
  bind(game, b);
  const K = game.coop; num(K.downAt[0]); num(K.downAt[1]); num(K.reviveT[0]); num(K.reviveT[1]);
  return (h >>> 0).toString(16).padStart(8, '0');
}
