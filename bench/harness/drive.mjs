// Scripted driver used to record the stage-0 input logs: a deterministic function of (sim state, frame). Pushes toward
// the story objective (or up the field), fights whatever stands within reach with mixed strings, charges, jumps and
// dodges, fires the Musou when a segment is full. Only its recorded output matters to the gate (replay never calls it).
import { ST } from '../../src/crowd/crowd.js';

/** World direction (wx, wz) → stick (mx, my) for camera yaw `yaw` (inverse of locomotion.js stickDir). */
export function stickFor(wx, wz, yaw) {
  const l = Math.hypot(wx, wz) || 1, fx = Math.sin(yaw), fz = Math.cos(yaw);
  wx /= l; wz /= l;
  return [-fz * wx + fx * wz, fx * wx + fz * wz];
}

export function nearestFoe(game, maxD = 1e9) {
  const c = game.crowd, h = game.hero;
  let best = -1, bd = maxD * maxD;
  for (let i = 0; i < c.N; i++) {
    const s = c.st[i];
    if (!s || s === ST.DEAD || s === ST.DOWN) continue;
    const d = (c.x[i] - h.x) ** 2 + (c.z[i] - h.z) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  return [best, Math.sqrt(bd)];
}

const STRING = ['attack', 'attack', 'attack', 'charge', 0, 'attack', 'attack', 'attack', 'attack', 'charge', 0, 'attack', 'charge', 0, 0];

export function scriptedPolicy() {
  let k = 0;
  return (game) => {
    const h = game.hero, f = game.frame, inp = { mx: 0, my: 0, orbit: 0, tilt: 0, pressed: {}, held: {} };
    const [i, d] = nearestFoe(game, 7);
    let wx = 0, wz = 1;
    const tgt = game.story.target;
    if (i >= 0) { wx = game.crowd.x[i] - h.x; wz = game.crowd.z[i] - h.z; }
    else if (tgt) { wx = tgt.x - h.x; wz = tgt.z - h.z; }
    const [mx, my] = stickFor(wx, wz, game.cam.yaw);
    const mag = i >= 0 && d < 2.5 ? 0.35 : 1;
    inp.mx = mx * mag; inp.my = my * mag;
    if (f % 900 === 450) inp.orbit = 0.02;                           // a little camera look now and then
    if (i >= 0 && d < 4.5) {
      if (f % 13 === 0) { const a = STRING[k++ % STRING.length]; if (a) { inp.pressed[a] = true; inp.held[a] = true; } }
      if (f % 97 === 0) inp.pressed.jump = true;
      if (f % 211 === 0 && h.hp < h.hpMax * 0.6) inp.pressed.dodge = true;
      if (game.musou.ready() && f % 29 === 0) inp.pressed.musou = true;
    }
    if (f % 1800 === 900) inp.pressed.target = true;
    return inp;
  };
}
