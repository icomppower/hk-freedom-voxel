// Autoplay bot (stage 2d, lane L4): a deterministic policy (sim state → input) that plays a story chapter like a steady
// DW player — follows the objective arrow (A* on the map's walk grid, closed gates as walls), fights whatever blocks the way, duels officers, dodges an
// officer's real blow (the red-star window), fires the Musou into a crowd or at an officer, and breaks out when stuck.
// Used headless (bench/bot/run.mjs, Node sim) and in the page (window.__onStep), never by the game itself.
//   const policy = createBot({ style })   style: 'steady' (default) | 'rush' (never stops to fight unless blocked) |
//                                          'back' (steady, but doubles back 40 m every 90 s: soft-lock probe)
//   inp = policy(game)                    → { mx, my, orbit, tilt, pressed, held }
import { ST } from '../../src/crowd/crowd.js';
import { TERRAIN, GATES, MAP, routeNear, routeAt, walkIn } from '../../src/world/map.js';

// ---- A* on the map's 2 m walk grid (closed gates are walls): the next waypoint toward a goal, replanned every second
const _open = [];
/** Grid path from (x0, z0) to (x1, z1) → [[x, z], …] node centres, or null. Nodes need walk value ≥ 1 m (≥ 0.4 m at the
 *  goal / start) and must be clear of closed gates by 1.2 m. */
export function gridPath(x0, z0, x1, z1) {
  const G = TERRAIN, { nx, nz, x0: gx, z0: gz, step } = G;
  const idx = (x, z) => Math.max(0, Math.min(nx - 1, Math.round((x - gx) / step))) + Math.max(0, Math.min(nz - 1, Math.round((z - gz) / step))) * nx;
  const closed = Object.values(GATES).filter((g) => !g.open).map((g) => g.rect);
  const free = (k, loose) => {
    if (G.in[k] < (loose ? 0.4 : 1.0)) return false;
    const x = gx + (k % nx) * step, z = gz + Math.floor(k / nx) * step;
    for (const r of closed) if (x > r[0] - 1.2 && x < r[2] + 1.2 && z > r[1] - 1.2 && z < r[3] + 1.2) return false;
    return true;
  };
  const s = idx(x0, z0), t = idx(x1, z1), N = nx * nz;
  const gs = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  const hx = (k) => Math.hypot((k % nx) - (t % nx), Math.floor(k / nx) - Math.floor(t / nx));
  gs[s] = 0; _open.length = 0; _open.push([hx(s), s]);
  let it = 0;
  while (_open.length && it++ < 40000) {
    let bi = 0; for (let i = 1; i < _open.length; i++) if (_open[i][0] < _open[bi][0]) bi = i;
    const [, k] = _open[bi]; _open[bi] = _open[_open.length - 1]; _open.pop();
    if (done[k]) continue; done[k] = 1;
    if (k === t) break;
    const i = k % nx, j = Math.floor(k / nx);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
      const n = ii + jj * nx; if (done[n] || !free(n, n === t || k === s)) continue;
      const g = gs[k] + (di && dj ? 1.414 : 1);
      if (g < gs[n]) { gs[n] = g; from[n] = k; _open.push([g + hx(n), n]); }
    }
  }
  if (from[t] < 0 && s !== t) return null;
  const out = [];
  for (let k = t; k >= 0 && k !== s; k = from[k]) out.push([gx + (k % nx) * step, gz + Math.floor(k / nx) * step]);
  return out.reverse();
}

/** World direction → stick for camera yaw (inverse of locomotion.js stickDir). */
export function stickFor(wx, wz, yaw) {
  const l = Math.hypot(wx, wz) || 1, fx = Math.sin(yaw), fz = Math.cos(yaw);
  wx /= l; wz /= l;
  return [-fz * wx + fx * wz, fx * wx + fz * wz];
}
const alive = (s) => s && s !== ST.DEAD && s !== ST.DOWN && s !== ST.OFF;

export function createBot({ style = 'steady' } = {}) {
  let k = 0, lastProg = 0, bestD = 1e9, stuckT = 0, backUntil = -1, unstick = 0, dodgeCd = 0, sweep = 0, path = null, planF = -999, planGoal = [0, 0];
  const STR = ['attack', 'attack', 'attack', 'attack', 'charge'], STR_HZ = ['attack', 'attack', 'attack', 'charge'];
  return (game) => {
    const h = game.hero, c = game.crowd, f = game.frame, inp = { mx: 0, my: 0, orbit: 0, tilt: 0, pressed: {}, held: {} };
    const press = (a) => { inp.pressed[a] = true; inp.held[a] = true; };
    if (h.dead) return inp;
    // ---- surroundings: nearest foe, nearest officer, foes within 4.5 m, an officer's blow about to land on us
    let nf = -1, nd = 1e9, of = -1, od = 1e9, near = 0, threat = -1;
    for (let i = 0; i < c.N; i++) {
      if (!alive(c.st[i])) continue;
      const d = Math.hypot(c.x[i] - h.x, c.z[i] - h.z);
      if (d < nd) { nd = d; nf = i; }
      if (c.type[i] === 1 && d < od) { od = d; of = i; }
      if (d < 4.5) near++;
      if (c.st[i] === ST.ATTACK && c.foe[i] < 0 && !c.feint[i] && d < 3.6 && c.stT[i] >= game.diff.windup - 12 && c.stT[i] < game.diff.windup - 2) threat = i;
    }
    // ---- where to: the objective arrow (an officer or a place), along the road when it is far
    const tgt = game.story.target;
    let gx = h.x, gz = h.z + 20;
    if (tgt) { gx = tgt.x; gz = tgt.z; }
    if (style === 'back' && f % 5400 === 2700) backUntil = f + 600;       // soft-lock probe: turn round for 10 s
    if (f < backUntil) { gx = h.x; gz = h.z - 40; }
    const dT = Math.hypot(gx - h.x, gz - h.z);
    let wx = gx - h.x, wz = gz - h.z;
    let viaRoad = false;
    if (dT > 26 && f >= backUntil) {                                   // far: the road (switchbacks, the chokepoints' lines)…
      const gr = routeNear(gx, gz), sg = gr.s, gd = gr.d, sh = routeNear(h.x, h.z).s;
      if (gd < 8 && Math.abs(sg - sh) > 10) {                          // (only for a goal on the road: an off-road goal is A*'s)
        let clear = true;                                               // …while the next 18 m of it are open
        for (let d = 2; d <= 18 && clear; d += 2) { const q = routeAt(sh + Math.sign(sg - sh) * d), x = q[0], z = q[1];
          if (walkIn(x, z) < 0.3) clear = false;
          for (const g of Object.values(GATES)) if (!g.open && x > g.rect[0] - 1 && x < g.rect[2] + 1 && z > g.rect[1] - 1 && z < g.rect[3] + 1) clear = false; }
        const p = routeAt(sh + Math.sign(sg - sh) * 9);
        if (clear) { wx = p[0] - h.x; wz = p[1] - h.z; viaRoad = true; }
      }
    }
    if (!viaRoad && dT > 6 && f >= backUntil) {                        // else A* on the walk grid, 8 m ahead
      if (!path || f - planF > 60 || Math.hypot(planGoal[0] - gx, planGoal[1] - gz) > 3) { path = gridPath(h.x, h.z, gx, gz); planF = f; planGoal = [gx, gz]; }
      if (path && path.length) {
        let k = 0; while (k < path.length - 1 && Math.hypot(path[k][0] - h.x, path[k][1] - h.z) < 8) k++;
        wx = path[k][0] - h.x; wz = path[k][1] - h.z;
      }
    }
    // progress watch: no approach to the goal for 6 s while not fighting → wiggle sideways + jump for 1.5 s
    if (dT < bestD - 0.5) { bestD = dT; lastProg = f; }
    if (tgt && Math.abs(dT - bestD) > 25) bestD = dT;                     // a new objective far away: re-arm
    if (f - lastProg > 360 && near < 3) { unstick = 90; lastProg = f; bestD = dT; }
    if (unstick > 0) { unstick--; const s = (f >> 5) & 1 ? 1 : -1; const l = Math.hypot(wx, wz) || 1; wx = wx / l - s * wz / l * 1.5; wz = wz / l + s * wx / l * 1.5; if (unstick === 60) press('jump'); }

    const hz = h.char.id === 'huangzhong', reach = hz ? 9 : 3.2;
    const offTarget = typeof tgt === 'object' && tgt && of >= 0 && Math.hypot(c.x[of] - tgt.x, c.z[of] - tgt.z) < 0.5;
    // fight: the officer we're sent after once within reach, else whatever stands in front within reach
    let fight = -1;
    if (offTarget && od < reach + 2) fight = of;
    // on the way to a far objective only what blocks the path is fought: the nearest foe in a ±40° cone toward the waypoint
    // within reach (a bow shoots the column open), or one pressed against us (a bow's reach would otherwise hold the hero
    // on the endless waves forever); near the objective, anything in reach
    else if (dT > 16) {
      const l = Math.hypot(wx, wz) || 1, ux = wx / l, uz = wz / l, cone = hz ? 7 : 2.6;
      let bd = 1e9;
      for (let i = 0; i < c.N; i++) {
        if (!alive(c.st[i])) continue;
        const ex = c.x[i] - h.x, ez = c.z[i] - h.z, d = Math.hypot(ex, ez);
        if (d < bd && (d < 1.3 || (d < cone && (ex * ux + ez * uz) > d * 0.77))) { bd = d; fight = i; }
      }
      if (style === 'rush' && bd > 1.3 && near <= 6) fight = -1;
    } else if (nf >= 0 && nd < reach) fight = nf;
    if (fight >= 0) { wx = c.x[fight] - h.x; wz = c.z[fight] - h.z; }
    const [mx, my] = stickFor(wx, wz, game.cam.yaw);
    const closeIn = fight >= 0 ? Math.hypot(wx, wz) : 99;
    const mag = fight >= 0 ? (closeIn > (hz ? 6 : 2.2) ? 1 : 0.3) : 1;
    inp.mx = mx * mag; inp.my = my * mag;

    if (dodgeCd > 0) dodgeCd--;
    if (threat >= 0 && dodgeCd === 0 && h.state !== 'musou') {          // an officer's real blow: roll out sideways
      const tx = c.x[threat] - h.x, tz = c.z[threat] - h.z, l = Math.hypot(tx, tz) || 1;
      const [dx, dy] = stickFor(-tz / l - tx / l * 0.5, tx / l - tz / l * 0.5, game.cam.yaw);
      inp.mx = dx; inp.my = dy; press('dodge'); dodgeCd = 50;
      return inp;
    }
    if (h.hp < h.hpMax * 0.4 && near >= 6 && dodgeCd === 0 && h.state !== 'musou' && nf >= 0) {   // hurt and swarmed: roll out
      const tx = c.x[nf] - h.x, tz = c.z[nf] - h.z, l = Math.hypot(tx, tz) || 1;
      const [dx, dy] = stickFor(-tx / l, -tz / l, game.cam.yaw);
      inp.mx = dx; inp.my = dy; press('dodge'); dodgeCd = 70;
      return inp;
    }
    const musouWant = game.musou.ready() && (near >= 8 || (of >= 0 && od < 4) || h.hp < h.hpMax * 0.35);
    if (musouWant && f % 7 === 0) press('musou');
    if (fight >= 0 && closeIn < reach + 0.5 && f % 12 === 0) {
      const S = hz ? STR_HZ : STR, a = S[k++ % S.length];
      press(a);
    }
    if (fight < 0 && near === 0 && dT > 30 && f % 240 === 120 && style !== 'back') press('dash' in (h.kit.moves || {}) ? 'jump' : 'jump');
    if (fight >= 0 && sweep++ % 600 === 599) press('jump');               // a jump attack now and then (air string)
    return inp;
  };
}
