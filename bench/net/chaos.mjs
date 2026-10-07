// Human-like inputs for the cross-engine probe (bench/net/xengine.mjs --chaos): the co-op bot's choice plus what bots never
// do — camera orbit / tilt sweeps, lock-on (target) taps, extra dodges / jumps, held interact, Musou presses at odd
// moments — all from a hash of (frame, slot), then encoded to the wire integers (both engines get identical input).
import { createCoopBot } from '../../src/net/coopbot.js';
import { encodeIn, decodeIn } from '../../src/net/codec.js';
const h01 = (a, b) => ((Math.imul(a * 73856093 ^ b * 19349663, 2654435761) >>> 0) % 100000) / 100000;
export function createChaos() {
  const bots = [createCoopBot(0), createCoopBot(1)];
  return (game, i, bind) => {
    bind(game, i);
    const inp = bots[i](game), f = game.frame, r = (k) => h01(f + k * 7919, i + 1);
    inp.pressed = { ...inp.pressed }; inp.held = { ...inp.held };
    const seg = Math.floor(f / 90);                                   // 1.5 s segments of camera behaviour
    const mode = h01(seg, i + 11);
    if (mode < 0.35) inp.orbit = Math.sin(f * 0.05 + i) * 0.9;       // sweep the camera
    else if (mode < 0.5) inp.orbit = (h01(seg, i + 3) - 0.5) * 2;     // hold a turn
    if (h01(seg, i + 5) < 0.3) inp.tilt = (h01(seg, i + 7) - 0.5) * 1.6;
    if (r(1) < 0.012) inp.pressed.target = true;                      // lock-on taps
    if (h01(seg, i + 9) < 0.15) inp.held.target = true;               // hold lock-on
    if (r(2) < 0.01) inp.pressed.dodge = true;
    if (r(3) < 0.008) inp.pressed.jump = true;
    if (r(4) < 0.006) inp.pressed.musou = true;                       // presses at odd moments (team calls, solo)
    if (h01(seg, i + 13) < 0.1) inp.held.interact = true;
    if (r(5) < 0.2) { inp.mx = (r(6) - 0.5) * 2; inp.my = (r(8) - 0.5) * 2; }   // wobbly stick
    return decodeIn(encodeIn(inp));
  };
}
