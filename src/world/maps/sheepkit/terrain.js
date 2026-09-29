// 羊村 map render kit — terrain (render-only; shared by the pasture / lantern / harbor world builders).
// buildGround(root, opts): one flat-shaded heightfield over the active map's 2 m grid (src/world/map.js TERRAIN): walkable
// nodes sit exactly on ground() (the same grid), nodes outside the walk field rise into hills / cliffs with distance, so
// the edge of the playfield reads as a slope, not a wall. Each 1 m tile takes one colour (colorAt at its centre, jittered
// by a stable hash): the voxel look of the upstream terrain without its 定軍山-specific passes.
//   opts: colorAt(x, z, y, inside, out) → 0xRRGGBB   (inside: walk value m; out: metres outside the walk edge)
//         rise(x, z, out) → metres the ground climbs outside the walk field (default: 0.55 m per m out, ≤ 9 m + noise)
//         sea { y, color, size } (optional): a flat sea plane at y
import * as THREE from 'three';
import { TERRAIN as G, noise2 } from '../../map.js';
import { hash01 } from '../../../core/rng.js';
import { shade } from '../../../core/voxel.js';

const defRise = (x, z, out) => Math.min(9, out * 0.55) + (out > 2 ? noise2(x * 0.05, z * 0.05, 71) * 4 : 0);

/** Height (m) of the rendered terrain at node k (walkable: the sim ground; outside: risen). */
function nodeY(k, x, z, rise) {
  const f = G.in[k], h = G.h[k];
  return f > -0.6 ? h : h + rise(x, z, -f - 0.6);
}

export function buildGround(root, { colorAt, rise = defRise, sea = null, roughness = 0.95 } = {}) {
  const { nx, nz, x0, z0, step } = G, N = nx * nz, Y = new Float32Array(N);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = i + j * nx; Y[k] = nodeY(k, x0 + i * step, z0 + j * step, rise); }
  // each 2 m cell is split into 2 × 2 one-metre tiles (bilinear heights), each with its own colour: a voxel tile floor
  const quads = (nx - 1) * (nz - 1) * 4, pos = new Float32Array(quads * 18), col = new Float32Array(quads * 18);
  const c = new THREE.Color(), h = step / 2;
  let p = 0;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const k = i + j * nx, x = x0 + i * step, z = z0 + j * step;
    const ya = Y[k], yb = Y[k + 1], yc = Y[k + nx], yd = Y[k + nx + 1];
    const Yb = (u, v) => ya * (1 - u) * (1 - v) + yb * u * (1 - v) + yc * (1 - u) * v + yd * u * v;
    const inside = (G.in[k] + G.in[k + 1] + G.in[k + nx] + G.in[k + nx + 1]) / 4;
    for (let sj = 0; sj < 2; sj++) for (let si = 0; si < 2; si++) {
      const u0 = si / 2, v0 = sj / 2, u1 = u0 + 0.5, v1 = v0 + 0.5, tx = x + si * h, tz = z + sj * h;
      const cy = Yb(u0 + 0.25, v0 + 0.25);
      c.set(shade(colorAt(tx + h / 2, tz + h / 2, cy, inside, Math.max(0, -inside)), 0.9 + hash01(i * 2 + si, j * 2 + sj, 9) * 0.2));
      const v = [[tx, Yb(u0, v0), tz], [tx, Yb(u0, v1), tz + h], [tx + h, Yb(u1, v0), tz], [tx + h, Yb(u1, v0), tz], [tx, Yb(u0, v1), tz + h], [tx + h, Yb(u1, v1), tz + h]];
      for (const [vx, vy, vz] of v) { pos[p] = vx; pos[p + 1] = vy; pos[p + 2] = vz; col[p] = c.r; col[p + 1] = c.g; col[p + 2] = c.b; p += 3; }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness, metalness: 0 }));
  mesh.receiveShadow = true; mesh.name = 'ground';
  root.add(mesh);
  if (sea) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(sea.size || 2400, sea.size || 2400), new THREE.MeshStandardMaterial({ color: sea.color, roughness: 0.35, metalness: 0.1 }));
    s.rotation.x = -Math.PI / 2; s.position.y = sea.y; s.receiveShadow = true; s.name = 'sea';
    root.add(s);
  }
  return { mesh, heightAt: (x, z) => { const i = Math.round((x - x0) / step), j = Math.round((z - z0) / step); return Y[Math.max(0, Math.min(nx - 1, i)) + Math.max(0, Math.min(nz - 1, j)) * nx]; } };
}
