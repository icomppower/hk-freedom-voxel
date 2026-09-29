// Shared sim helpers for the 香港自由戰士 chapter scripts (hk1–hk4): walking a polyline, a group of followers on the
// hero's trail. Deterministic (no RNG), sim-side; the chapter world views read the positions from story.fx.

/** Point + heading at u ∈ [0, 1] along a polyline [[x, z], …] (equal weight per leg). */
export function along(path, u) {
  const n = path.length - 1, f = Math.min(n - 1e-6, Math.max(0, u * n)), i = Math.floor(f), k = f - i;
  const [ax, az] = path[i], [bx, bz] = path[i + 1];
  return [ax + (bx - ax) * k, az + (bz - az) * k, Math.atan2(bx - ax, bz - az)];
}

/** Followers: n people waiting at spots; each joins the hero's trail once he comes within `join` m, then walks it (1.8 m
 *  apart); seek (m/s): while waiting, they walk toward him when he is within seekR m. step(h) once per sim step;
 *  list[k] = { x, z, yaw, on, joined, home }. */
export function followers(spots, { join = 4, seek = 0, seekR = 20 } = {}) {
  const trail = [], list = spots.map(([x, z]) => ({ x, z, yaw: Math.PI, on: true, joined: false, home: false }));
  let order = 0;
  return {
    list,
    step(h) {
      if (!trail.length || Math.hypot(h.x - trail[0][0], h.z - trail[0][1]) > 0.9) trail.unshift([h.x, h.z]);
      if (trail.length > 40) trail.length = 40;
      for (const e of list) {
        const d = Math.hypot(h.x - e.x, h.z - e.z);
        if (!e.joined && d < join) { e.joined = true; e.slot = order++; }
        if (!e.joined) {
          if (seek && d < seekR) { const k = seek / 60 / d; e.x += (h.x - e.x) * k; e.z += (h.z - e.z) * k; e.yaw = Math.atan2(h.x - e.x, h.z - e.z); }
          continue;
        }
        const p = trail[Math.min(trail.length - 1, 2 + e.slot * 2)], dx = p[0] - e.x, dz = p[1] - e.z;
        if (dx * dx + dz * dz > 0.0004) e.yaw = Math.atan2(dx, dz);
        e.x = p[0]; e.z = p[1];
      }
    },
  };
}
