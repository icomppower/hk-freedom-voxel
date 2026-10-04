// Input codec: one tick of one player's input as 6 small integers (JSON array on the wire, a few bytes).
//   [mx, my, orbit, tilt] × 1e4, rounded (the same rounding the input logs use: bench/harness/sim.mjs r4)
//   pMask = pressed edges (bit k = ACTIONS[k]), hMask = held (bits 0-5 ACTIONS, bit 6 interact = revive, bit 7 pause)
// Both peers step from the decoded integers (the local player too), so the sim never sees an unquantised float.
export const ACTIONS = ['attack', 'charge', 'jump', 'dodge', 'musou', 'target'];
export const INTERACT = 1 << 6, PAUSE = 1 << 7;
const q = (v) => Math.max(-32000, Math.min(32000, Math.round((+v || 0) * 1e4)));

/** inp = input.sample() shape ({ mx, my, orbit, tilt, pressed, held }); extra = { interact, pause }. */
export function encodeIn(inp, extra = {}) {
  let p = 0, h = 0;
  for (let k = 0; k < ACTIONS.length; k++) { if (inp.pressed?.[ACTIONS[k]]) p |= 1 << k; if (inp.held?.[ACTIONS[k]]) h |= 1 << k; }
  if (extra.interact || inp.held?.interact) h |= INTERACT;
  if (extra.pause) h |= PAUSE;
  return [q(inp.mx), q(inp.my), q(inp.orbit), q(inp.tilt), p, h];
}
export function decodeIn(a) {
  const pressed = {}, held = {};
  for (let k = 0; k < ACTIONS.length; k++) { pressed[ACTIONS[k]] = !!(a[4] & (1 << k)); held[ACTIONS[k]] = !!(a[5] & (1 << k)); }
  held.interact = !!(a[5] & INTERACT);
  return { mx: a[0] / 1e4, my: a[1] / 1e4, orbit: a[2] / 1e4, tilt: a[3] / 1e4, pressed, held };
}
export const EMPTY = [0, 0, 0, 0, 0, 0];
export const isPause = (a) => !!(a && a[5] & PAUSE);
/** Sanity check for anything arriving off the wire (the server checks the same). */
export const validIn = (a) => Array.isArray(a) && a.length === 6 && a.every((v) => Number.isInteger(v) && v >= -32000 && v <= 32000);
