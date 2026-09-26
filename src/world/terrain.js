// Terrain of the 定軍山 field (render-only, built once from the map grid in map.js):
//  · ground: one textured plane over the whole 2 m grid, heights = ground(), vertex colours for dust drifts, paving
//    joints, damp river banks, scorched earth, cliff-foot AO and bare rock on the high ground, with a dry-grass map
//    splatted in by grassAt() (+ instanced wind-swayed tufts, boulders at the cliff feet);
//  · cliffs: 2 m voxel rock columns on every node outside the walkable edge, stepped in 1 m courses — tall and sheer
//    along the pass (DW8's canyon stages), low ridges round the camp plateau, gentle hills round the ford, a drop on
//    the summit's rim (the vista). Only exposed faces are built, so a camera that slips inside a cliff sees through it;
//    they receive shadows but cast none (a 30 m wall would black out the whole pass floor under the low sun);
//  · the Han River (water strip, stepping stones at the fords), raised voxel cobbles on the road and plazas, rubble,
//    pines on the heights, and layered hazy mountains with Dingjun's peak behind the summit.
import * as THREE from 'three';
import { makeRng, hash01 } from '../core/rng.js';
import { hazeColor, SUN_DIR, SUN_AZ } from './sky.js';
import { TERRAIN as G, PIECE_IDS, ground, noise2, smooth, riverZ, routeDist, FORDS, WATER_Y, SUMMIT_H, CAMP_H, WALL_Z, GATE_X } from './map.js';

const { x0: X0, z0: Z0, step: S, nx: NX, nz: NZ } = G;

// ---------------------------------------------------------------- cliff heights
// Rise (m) toward which the rock climbs away from the walkable edge, per owning piece (× 0.65-1.35 ridge noise).
const RISE = { honjin: 5, ford: 9, mouth: 22, basin: 26, climb: 34, plaza: 3, gateway: 3, court: 3.5, ramp: 16, summit: 40 };
const COL = -1.4;                    // a node grows a column this far outside the walk edge (its face then stands ≥ 0.4 m out)
/** Column top per grid node (m, 1 m courses), NaN where there is walkable ground / river. */
const TOP = new Float32Array(NX * NZ).fill(NaN);
for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
  const k = i + j * NX, f = G.in[k];
  if (f > COL) continue;
  const x = X0 + i * S, z = Z0 + j * S, h = G.h[k], d = -f, id = PIECE_IDS[G.own[k]];
  if (id === 'ford' && Math.abs(z - riverZ(x)) < 7.5) continue;              // the river cuts through the banks
  const n = noise2(x * 0.045, z * 0.045, 71);
  let t;
  if (id === 'summit' && z < 212) t = d < 3 ? SUMMIT_H + 1 : SUMMIT_H - Math.min(SUMMIT_H + 1, (d - 3) * (1.1 + n));   // rim, then the drop
  else t = h + Math.max(1.2, RISE[id] * (0.65 + 0.7 * n) * (1 - Math.exp(-d / 7))) + (hash01(i, j, 5) - 0.5) * 1.2;
  t *= smooth(0, 30, Math.min(i, j, NX - 1 - i, NZ - 1 - j) * S);           // settle onto the outer plain at the grid rim
  TOP[k] = Math.round(t);
}
/** Surface height at (x, z) including rock columns (props on the heights: watchtowers, pines, troops). */
export function topAt(x, z) {
  const i = Math.round((x - X0) / S), j = Math.round((z - Z0) / S);
  const t = i >= 0 && j >= 0 && i < NX && j < NZ ? TOP[i + j * NX] : NaN;
  return Number.isNaN(t) ? ground(x, z) : t;
}

// ---------------------------------------------------------------- ground
/** Paving mask 0..1: 1 = cobbled road / plaza, 0 = packed dirt. */
function paveMask(x, z) {
  if (Math.abs(z - riverZ(x)) < 9) return 0;                                  // the ford itself is a dirt track
  let m = noise2(x * 0.07, z * 0.07, 5) * 1.3 - 0.62;
  m += 1.25 * Math.max(0, 1 - routeDist(x, z) / 3.4);                         // the road
  if (z > 76 && z < 140 && x > -30 && x < 5) m += 0.55;                      // plaza + courtyard: worn paving
  if (Math.hypot(x - 2, z - 194) < 13) m += 0.7;                             // summit parade ground
  if (Math.hypot(x, z + 140) < 11) m += 0.6;                                 // 本陣 square
  const hole = noise2(x * 0.15, z * 0.15, 8);                                // broken patches of bare dust
  m -= Math.max(0, Math.min(1, (hole - 0.5) / 0.14)) * 1.0;
  return Math.max(0, Math.min(1, m));
}

function groundTexture() {
  // 24 m tile of packed dusty earth: blotchy tone, gravel, cracks and a few half-buried flat stones.
  const SZ = 1024, PX = SZ / 24;
  const c = document.createElement('canvas'); c.width = c.height = SZ;
  const g = c.getContext('2d');
  const r = makeRng(99);
  g.fillStyle = '#86725f'; g.fillRect(0, 0, SZ, SZ);                        // pale dust: bright between the dark cobbles (low chroma: the warm sun and grade add the peach)
  for (let i = 0; i < 160; i++) {                                            // tone blotches (dust / damp)
    const x = r.int(0, SZ), y = r.int(0, SZ), rad = r.range(30, 110), light = r.chance(0.55);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, light ? 'rgba(214,186,160,0.42)' : 'rgba(50,38,36,0.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 9000; i++) {                                           // gravel / grain (voxel-sized specks, soft)
    const v = r.range(0.84, 1.14), q = r.int(2, 5);
    g.fillStyle = `rgb(${124 * v | 0},${106 * v | 0},${92 * v | 0})`;
    g.fillRect(r.int(0, SZ - 1), r.int(0, SZ - 1), q, q);
  }
  // half-buried flat stones with bevels: few and soft — the open valley shows far more bare dirt than the old plaza did,
  // and hard dark slabs there read as floating tiles
  for (let i = 0; i < 80; i++) {
    const w = r.range(0.3, 0.7) * PX, h = r.range(0.25, 0.5) * PX, x = r.int(0, SZ), y = r.int(0, SZ), v = r.range(0.9, 1.15);
    g.fillStyle = `rgb(${112 * v | 0},${98 * v | 0},${90 * v | 0})`; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255,236,214,0.16)'; g.fillRect(x, y, w, 2);
    g.fillStyle = 'rgba(25,14,12,0.22)'; g.fillRect(x, y + h - 3, w, 3);
  }
  g.strokeStyle = 'rgba(40,26,22,0.35)'; g.lineWidth = 2;                   // cracks
  for (let i = 0; i < 60; i++) {
    let x = r.int(0, SZ), y = r.int(0, SZ);
    g.beginPath(); g.moveTo(x, y);
    let a = r.range(0, 6.28);                                                   // wandering, never closing on itself
    for (let k = 0; k < 6; k++) { a += r.range(-0.7, 0.7); const l = r.range(10, 24); x += Math.cos(a) * l; y += Math.sin(a) * l; g.lineTo(x, y); }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * Dry golden-olive grass mask 0..1 on the open ground: gone on the road and the paving, trampled into patches where
 * the fight runs, lush on the river banks, bare in the Wei camp's plaza/courtyard. Also seeds the grass tufts.
 */
function grassAt(x, z) {
  const k = Math.round((x - X0) / S) + Math.round((z - Z0) / S) * NX, inside = G.in[k] ?? -9;
  let g = smooth(0.2, 0.52, noise2(x * 0.05 + 13, z * 0.05 - 7, 41));
  g *= smooth(2.5, 7.5, routeDist(x, z)) * (1 - paveMask(x, z));
  if (inside > 5) g *= 0.5 + 0.5 * smooth(0.42, 0.7, noise2(x * 0.11, z * 0.11, 43));   // trampled where the fight runs
  const dz = Math.abs(z - riverZ(x));
  g = Math.max(g, (1 - smooth(8, 15, dz)) * smooth(4.4, 6.2, dz));              // lush banks, not in the water
  if (z > 74 && z < 142 && x > -44 && x < 7) g *= 0.15;                         // the Wei camp: beaten earth
  return g;
}

function grassTexture() {
  // 8 m tile of dry grass seen from above: olive ground cover, dense 1×3 texel blades in straw gold / sage / deep olive,
  // dark gaps. Alpha = a blade-height noise, used to break the grass/dirt edge into ragged tufts (not a smooth blend).
  const SZ = 256, c = document.createElement('canvas'); c.width = c.height = SZ;
  const g = c.getContext('2d'), r = makeRng(313);
  g.fillStyle = '#4c5030'; g.fillRect(0, 0, SZ, SZ);
  const COLS = ['#6c7040', '#7d7a44', '#5a6036', '#948648', '#454a2a', '#687244', '#a08e52'];   // olive, sage, a little straw
  for (let i = 0; i < 9000; i++) { g.fillStyle = COLS[r.int(0, COLS.length - 1)]; g.fillRect(r.int(0, SZ - 1), r.int(0, SZ - 1), 1, r.int(2, 4)); }
  // (a DataTexture, not the canvas: a canvas premultiplies, which would crush the colour under a low alpha)
  const d = new Uint8Array(g.getImageData(0, 0, SZ, SZ).data);
  for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) {
    const n = 0.5 * Math.sin(x * 0.19 + Math.sin(y * 0.13) * 2) * Math.sin(y * 0.23 + Math.sin(x * 0.11) * 2) + 0.5;
    d[(y * SZ + x) * 4 + 3] = Math.min(255, (n * 0.6 + hash01(x, y, 7) * 0.4) * 255);
  }
  const t = new THREE.DataTexture(d, SZ, SZ);
  t.generateMipmaps = true; t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/** Ground splat: dirt map × vertex tone (drifts, AO, scorch, damp banks, rock dust) with the grass map blended in by
 *  aGrass, its edge broken by the grass alpha into ragged tufts, plus a world-space macro tone so no tile repeats. */
function splatMaterial(map, grass) {
  const m = new THREE.MeshStandardMaterial({ map, vertexColors: true, roughness: 0.96 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.tGrass = { value: grass };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aGrass; varying float vGrass; varying vec2 vGw;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGrass = aGrass; vGw = position.xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tGrass; varying float vGrass; varying vec2 vGw;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec4 gT = texture2D(tGrass, vGw / 8.0);
        float gF = texture2D(tGrass, vGw / 61.0 + 0.37).a;                       // macro: lusher / drier patches
        float gm = smoothstep(0.42, 0.58, vGrass + (gT.a - 0.5) * 0.55);
        vec3 grassC = gT.rgb * mix(vec3(0.82, 0.92, 0.7), vec3(1.05, 1.0, 0.72), gF);
        diffuseColor.rgb = mix(diffuseColor.rgb * (0.88 + 0.24 * gF), grassC, gm);`);
  };
  return m;
}

function groundMesh(scorch) {
  const tex = groundTexture(), grass = grassTexture();
  const out = new THREE.Group();
  const W = (NX - 1) * S, D = (NZ - 1) * S;
  const geo = new THREE.PlaneGeometry(W, D, NX - 1, NZ - 1);
  geo.rotateX(-Math.PI / 2);
  geo.translate(X0 + W / 2, 0, Z0 + D / 2);
  const p = geo.attributes.position, col = new Float32Array(p.count * 3), gr = new Float32Array(p.count);
  const nearRock = (i, j) => {                                                   // AO: ground at a cliff foot
    let n = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ii = i + di, jj = j + dj, kk = ii + jj * NX;
      if (ii >= 0 && jj >= 0 && ii < NX && jj < NZ && TOP[kk] > G.h[kk] + 1) n++;   // NaN compares false
    }
    return n;
  };
  for (let v = 0; v < p.count; v++) {
    const x = p.getX(v), z = p.getZ(v), i = Math.round((x - X0) / S), j = Math.round((z - Z0) / S), k = i + j * NX;
    const h = G.h[k], t = TOP[k];
    p.setY(v, Number.isNaN(t) ? h : Math.min(h, t) - 0.35);                  // under a rock column: tucked below its top
    const dust = noise2(x * 0.045 + 40, z * 0.045, 9);
    let kk = 1.04 + (dust - 0.5) * 0.85;                                       // broad dust drifts vs darker trampled earth
    kk *= 1 - 0.28 * paveMask(x, z);                                           // dark joints under the paving
    let sc = 0;
    for (const [sx, sz, ss] of scorch) sc = Math.max(sc, Math.exp(-((x - sx) ** 2 + (z - sz) ** 2) / (9 * ss * ss)));
    kk *= 1 - 0.55 * sc;                                                       // scorched earth
    const wet = 1 - smooth(5, 11, Math.abs(z - riverZ(x)));                   // damp dark banks
    kk *= 1 - 0.3 * wet;
    kk *= 1 - 0.1 * (1 - smooth(0, 4.5, routeDist(x, z)));                    // the road: worn darker by the march
    kk *= 1 - 0.09 * Math.min(4, nearRock(i, j));                              // contact shadow at the cliff foot
    const rock = smooth(1, 6, h - 3 - z / 18) * (1 - smooth(-6, -1, G.in[k]) * 0.4);   // high ground: bare, cooler rock dust
    col[v * 3] = kk * (1.03 - 0.1 * wet - 0.08 * rock); col[v * 3 + 1] = kk * (1 - 0.02 * wet); col[v * 3 + 2] = kk * (0.94 + 0.04 * wet + 0.08 * rock);
    gr[v] = grassAt(x, z) * (1 - sc) * (1 - 0.6 * rock);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aGrass', new THREE.BufferAttribute(gr, 1));
  geo.computeVertexNormals();
  const t1 = tex.clone(); t1.needsUpdate = true; t1.repeat.set(W / 24, D / 24);
  const inner = new THREE.Mesh(geo, splatMaterial(t1, grass));
  inner.receiveShadow = true;
  inner.name = 'ground';
  out.add(inner);
  // the plain beyond the grid: dry grassland (the grass map, dimmed) under the haze
  const og = new THREE.PlaneGeometry(2400, 2400, 8, 8); og.rotateX(-Math.PI / 2);
  const t2 = grass.clone(); t2.needsUpdate = true; t2.repeat.set(2400 / 8, 2400 / 8);
  const outer = new THREE.Mesh(og, new THREE.MeshStandardMaterial({ map: t2, color: 0xc9bfa0, roughness: 0.97 }));
  outer.position.set(0, -0.6, 30);                                             // under the grid (its rim settles to 0)
  out.add(outer);
  return out;
}

/**
 * Grass tufts (one instanced mesh): two crossed quads with a pixel-art blade cutout, rooted where grassAt() is dense,
 * swaying in the valley wind in the vertex shader (GRASS_TIME, advanced by world.js). Normals point up so they light
 * like the ground they grow from. Never on the road or the water; ≤ 0.7 m so nothing hides the fight.
 */
export const GRASS_TIME = { value: 0 };
function tufts() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 16;
  const g = cv.getContext('2d');
  for (let b = 0; b < 7; b++) {                                                 // blades: leaning, tapering
    const x0 = 1 + b * 2 + (b % 2), h = 9 + ((b * 5) % 7), lean = (b % 3) - 1;
    for (let y = 0; y < h; y++) {
      const t = y / h, x = Math.round(x0 + lean * t * t * 3);
      g.fillStyle = `rgb(${190 + 60 * t | 0},${190 + 50 * t | 0},${160 + 30 * t | 0})`;
      g.fillRect(x, 15 - y, y < h * 0.5 ? 2 : 1, 1);
    }
  }
  const map = new THREE.CanvasTexture(cv);
  map.magFilter = THREE.NearestFilter; map.minFilter = THREE.NearestFilter; map.generateMipmaps = false; map.colorSpace = THREE.SRGBColorSpace;
  const q1 = new THREE.PlaneGeometry(1, 1), q2 = new THREE.PlaneGeometry(1, 1);
  q1.translate(0, 0.5, 0); q2.translate(0, 0.5, 0); q2.rotateY(Math.PI / 2);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([...q1.attributes.position.array, ...q2.attributes.position.array], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([...q1.attributes.uv.array, ...q2.attributes.uv.array], 2));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(Array.from({ length: 8 }, () => [0, 1, 0]).flat(), 3));
  geo.setIndex([...q1.index.array, ...[...q2.index.array].map((i) => i + 4)]);
  const mat = new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = GRASS_TIME;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec2 gp = instanceMatrix[3].xz;
        float gw = sin(uTime * 1.9 + gp.x * 0.21 + gp.y * 0.13) * 0.6 + sin(uTime * 3.3 + gp.x * 0.7) * 0.25 + 0.35;
        transformed.xz += vec2(0.75, 0.55) * gw * 0.22 * uv.y * uv.y;`);
  };
  const r = makeRng(404), spots = [];
  for (let n = 0; n < 80000 && spots.length < 9000; n++) {
    const x = r.range(X0 + 4, X0 + (NX - 1) * S - 4), z = r.range(-160, 222);
    const k = Math.round((x - X0) / S) + Math.round((z - Z0) / S) * NX;
    if (TOP[k] > G.h[k] || G.in[k] < -1.2 || Math.abs(z - riverZ(x)) < 4.8) continue;   // not in the rock or the water
    const gm = grassAt(x, z);
    if (r.next() > (gm - 0.35) * 2.2) continue;
    spots.push([x, z, gm]);
  }
  const mesh = new THREE.InstancedMesh(geo, mat, spots.length);
  const m = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler(), pp = new THREE.Vector3(), sc = new THREE.Vector3(), c = new THREE.Color();
  const TINTS = [0x8e9070, 0xa09a78, 0x80896a, 0xaa9e7a, 0x8a8e6e];   // olive-sage, blue kept in: the warm sun + grade add the gold
  spots.forEach(([x, z, gm], i) => {
    const w = r.range(0.45, 0.8), hgt = r.range(0.32, 0.62) * (0.7 + 0.5 * gm);
    mesh.setMatrixAt(i, m.compose(pp.set(x, ground(x, z) - 0.03, z), qq.setFromEuler(e.set(0, r.range(0, 3.14), 0)), sc.set(w, hgt, w)));
    mesh.setColorAt(i, c.set(TINTS[r.int(0, TINTS.length - 1)]).multiplyScalar(r.range(0.8, 1.05)));
  });
  mesh.receiveShadow = true;
  mesh.name = 'grass';
  return mesh;
}

/** Boulders at the cliff feet and along the field's edges (low-poly, flat shaded; only outside the walkable edge). */
function boulders() {
  const r = makeRng(505), list = [];
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const k = i + j * NX, f = G.in[k];
    if (f > -0.4 || f < -3.5 || hash01(i, j, 91) > 0.16) continue;
    const x = X0 + i * S + r.range(-0.8, 0.8), z = Z0 + j * S + r.range(-0.8, 0.8);
    if (Math.abs(z - riverZ(x)) < 6) continue;
    list.push([x, z, r.range(0.4, 1.3) * (hash01(i, j, 92) < 0.15 ? 1.8 : 1)]);
  }
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), list.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(), c = new THREE.Color();
  const COLS = [0x806a5e, 0x6e5d55, 0x8c7a6a, 0x756a5a];
  list.forEach(([x, z, s], i) => {
    mesh.setMatrixAt(i, m.compose(p.set(x, topAt(x, z) + s * 0.25, z), q.setFromEuler(e.set(r.range(0, 3), r.range(0, 3), r.range(0, 3))), sc.set(s * r.range(0.9, 1.4), s * r.range(0.55, 0.85), s * r.range(0.9, 1.3))));
    mesh.setColorAt(i, c.set(COLS[r.int(0, 3)]).multiplyScalar(r.range(0.8, 1.1)));
  });
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.name = 'boulders';
  return mesh;
}

// ---------------------------------------------------------------- cliffs
/** World-space voxel grain: every `cell` m texel of the surface gets its own ± amt/2 value (chiselled rock up close,
 *  averaged away by mips of distance/DoF). Non-instanced meshes. */
export function voxelGrain(mat, cell, amt) {
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGrainP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGrainP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGrainP;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 gCell = floor(vGrainP / ${cell.toFixed(3)} + 0.25);                // + 0.25: faces sit on cell boundaries
        diffuseColor.rgb *= 1.0 + (fract(sin(dot(gCell, vec3(12.9898, 78.233, 37.719))) * 43758.5453) - 0.5) * ${amt.toFixed(3)};`);
  };
  return mat;
}

/**
 * Voxel mesher over TOP: a top quad per column and, on each side, the face down to the lower neighbour (or into the
 * ground beside it) in ≤ 2 m courses, so the strata banding lands on every course. Warm mauve-brown rock that the
 * haze carries into the mountains' tone; lighter dusty tops, a few mossy ones on the heights.
 */
function cliffs() {
  const pos = [], nor = [], col = [], idx = [];
  // tops a shade darker than the valley dust (the low sun lights them flat-on: a paler top reads as snow)
  const c = new THREE.Color(), ROCK = new THREE.Color(0x735a50), DARK = new THREE.Color(0x4a3a37), TOPC = new THREE.Color(0x7d6656), MOSS = new THREE.Color(0x5a5a3c), GRASSY = new THREE.Color(0x6f6c3e);
  // ao: [bottom, top] brightness of a face quad (vertex order: bottom pair, top pair) — baked voxel AO: dark at the foot
  // of every face, a sunlit lip on the top course
  const quad = (a, b, cc, d, n, ao = [1, 1]) => {
    const o = pos.length / 3;
    [a, b, cc, d].forEach((q, vi) => { const k = vi < 2 ? ao[0] : ao[1]; pos.push(q[0], q[1], q[2]); nor.push(n[0], n[1], n[2]); col.push(c.r * k, c.g * k, c.b * k); });
    idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  };
  const lowAt = (i, j) => {                                                    // neighbour's surface (outside the grid: below the plain)
    if (i < 0 || j < 0 || i >= NX || j >= NZ) return -2;
    const k = i + j * NX, t = TOP[k];
    return Number.isNaN(t) ? G.h[k] - 0.6 : t;
  };
  const SIDES = [[1, 0, [1, 0, 0]], [-1, 0, [-1, 0, 0]], [0, 1, [0, 0, 1]], [0, -1, [0, 0, -1]]];
  const hs = S / 2;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const k = i + j * NX, t = TOP[k];
    if (Number.isNaN(t)) continue;
    const x = X0 + i * S, z = Z0 + j * S, v = hash01(i, j, 17), rise = t - G.h[k];
    const grassy = noise2(x * 0.06 + 5, z * 0.06, 77) > 0.5;                 // patches of dry grass on the lower shelves
    c.copy(rise > 7 && v < 0.35 ? MOSS : grassy && rise < 14 ? GRASSY : TOPC).multiplyScalar(0.84 + v * 0.26);
    quad([x - hs, t, z + hs], [x + hs, t, z + hs], [x + hs, t, z - hs], [x - hs, t, z - hs], [0, 1, 0]);
    for (const [di, dj, n] of SIDES) {
      const lo = lowAt(i + di, j + dj);
      if (lo >= t) continue;
      // face corners: the edge shared with the neighbour, CCW seen from outside
      const ex = x + di * hs, ez = z + dj * hs, ax = dj ? -hs : 0, az = di ? hs : 0;
      const [p0x, p0z, p1x, p1z] = di > 0 || dj < 0 ? [ex + ax, ez - az, ex - ax, ez + az] : [ex - ax, ez + az, ex + ax, ez - az];
      for (let y1 = t; y1 > lo;) {
        const y0 = Math.max(lo, Math.ceil(y1 - 2));
        const band = 0.5 + 0.5 * Math.sin(y0 * 1.9 + noise2(x * 0.1, z * 0.1, 3) * 4);   // strata
        c.copy(ROCK).lerp(DARK, band * 0.55 + (y1 < t ? 0.1 : 0)).multiplyScalar(0.86 + hash01(i * 7 + di, j * 7 + dj, y0 | 0) * 0.2);
        quad([p0x, y0, p0z], [p1x, y0, p1z], [p1x, y1, p1z], [p0x, y1, p0z], n, [y0 <= lo ? 0.5 : 0.9, y1 >= t ? 1.14 : 1]);
        y1 = y0;
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  const m = new THREE.Mesh(geo, voxelGrain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }), 0.5, 0.2));
  m.receiveShadow = true;
  m.name = 'cliffs';
  return m;
}

/** Voxel pines on the rock tops (instanced trunk + three tiers): Dingjun's wooded shoulders, thicker toward the summit. */
function pines() {
  const spots = [];
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const k = i + j * NX, t = TOP[k];
    if (Number.isNaN(t) || t - G.h[k] < 5 || hash01(i, j, 23) > 0.07 + 0.05 * smooth(60, 200, Z0 + j * S)) continue;
    spots.push([X0 + i * S + (hash01(i, j, 24) - 0.5) * 1.2, t, Z0 + j * S + (hash01(i, j, 25) - 0.5) * 1.2, 0.8 + hash01(i, j, 26) * 0.7]);
  }
  const g = new THREE.BoxGeometry(1, 1, 1);
  const trunkM = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: 0x3e2a1e, roughness: 0.95 }), spots.length);
  const leafM = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), spots.length * 3);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  spots.forEach(([x, y, z, k], n) => {
    q.setFromEuler(e.set(0, hash01(n, 3) * 1.6, 0));
    trunkM.setMatrixAt(n, m.compose(p.set(x, y + 1.2 * k, z), q, s.set(0.35 * k, 2.4 * k, 0.35 * k)));
    for (let t = 0; t < 3; t++) {
      const w = (2.6 - t * 0.75) * k;
      leafM.setMatrixAt(n * 3 + t, m.compose(p.set(x, y + (2.0 + t * 1.25) * k, z), q, s.set(w, 1.3 * k, w)));
      leafM.setColorAt(n * 3 + t, c.set(0x3f4a34).multiplyScalar(0.8 + t * 0.1 + hash01(n, t) * 0.2));
    }
  });
  const grp = new THREE.Group();
  grp.add(trunkM, leafM);
  grp.name = 'pines';
  return grp;
}

// ---------------------------------------------------------------- Han River
function river() {
  const grp = new THREE.Group();
  // a strip following the centreline across the whole grid, 15 m wide, a little wider than the cut
  const n = 112, pos = [], idx = [];
  for (let s = 0; s <= n; s++) {
    const x = X0 + (s / n) * (NX - 1) * S, z = riverZ(x);
    pos.push(x, WATER_Y, z - 7.8, x, WATER_Y, z + 7.8);
    if (s < n) { const o = s * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  // low roughness: the golden sky and the low sun glint off it; translucent so the ford's shallow bed shows through
  const water = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x8a96a0, roughness: 0.22, metalness: 0, transparent: true, opacity: 0.78, depthWrite: false }));
  water.renderOrder = 0.5;
  water.receiveShadow = true;
  water.name = 'river';
  grp.add(water);
  // stepping stones marking each crossing + scattered boulders in the pools
  const r = makeRng(33), stones = [];
  for (const [a, b] of FORDS) for (let x = a + 1.5; x < b - 1; x += r.range(1.6, 2.6)) for (let o = -4; o <= 4; o += r.range(2.2, 3.2)) {
    if (r.chance(0.35)) continue;
    stones.push([x + r.range(-0.4, 0.4), riverZ(x) + o, r.range(0.55, 0.9), r.range(0.3, 0.42)]);   // tops just clear of the water
  }
  for (let i = 0; i < 40; i++) { const x = r.range(-100, 100); stones.push([x, riverZ(x) + r.range(-6, 6), r.range(0.8, 2.2), r.range(0.5, 1.4)]); }
  const sm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true }), stones.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  stones.forEach(([x, z, w, h], i) => {
    sm.setMatrixAt(i, m.compose(p.set(x, WATER_Y + 0.1 - h / 2, z), q.setFromEuler(e.set(r.range(-0.15, 0.15), r.range(0, 3), r.range(-0.15, 0.15))), s.set(w, h, w * r.range(0.7, 1.1))));
    sm.setColorAt(i, c.set(0x8a7a70).multiplyScalar(r.range(0.8, 1.15)));
  });
  sm.receiveShadow = true;
  grp.add(sm);
  return grp;
}

// ---------------------------------------------------------------- cobbles + rubble
/**
 * Raised voxel cobbles (instanced): irregular 1×1 … 2×2-cell blocks packed on a 0.42 m grid over the road and the
 * plazas, fraying into scattered loose stones on the dirt. Built per 4 m block, only where paving can occur.
 */
function cobbles() {
  const r = makeRng(11), C = 0.42, B = 10, list = [];                          // 10 cells ≈ 4.2 m blocks
  const DUST = new THREE.Color(0xa99a8c);
  const PAL = [0x625c5a, 0x5a5553, 0x6a625c, 0x55504e, 0x6d645c, 0x5e5856];   // grey-brown stone: cool against the warm dirt
  const taken = new Uint8Array(B * B);
  for (let bz = Z0; bz < Z0 + (NZ - 1) * S; bz += B * C) for (let bx = X0; bx < X0 + (NX - 1) * S; bx += B * C) {
    const cx = bx + B * C / 2, cz = bz + B * C / 2;
    if (routeDist(cx, cz) > 8 && paveMask(cx, cz) < 0.05 && paveMask(bx, bz) < 0.05) continue;
    if (G.in[Math.round((cx - X0) / S) + Math.round((cz - Z0) / S) * NX] < -2) continue;   // nothing under the rock
    taken.fill(0);
    for (let j = 0; j < B; j++) for (let i = 0; i < B; i++) {
      if (taken[j * B + i]) continue;
      const x0 = bx + i * C, z0 = bz + j * C;
      const m = paveMask(x0 + C / 2, z0 + C / 2);
      if (r.next() > (m - 0.36) * 4.5) {                                       // dirt (narrow frayed edge): occasional loose stone
        if (r.chance(0.012)) list.push([x0 + C / 2, z0 + C / 2, r.range(0.18, 0.38), r.range(0.18, 0.34), r.range(0.04, 0.12), r.range(0, 6.28), 0.85, 0, 0]);
        continue;
      }
      const big = r.chance(0.1);
      let w = big || r.chance(0.14) ? 2 : 1, d = big || r.chance(0.14) ? 2 : 1;
      if (i + w > B || taken[j * B + i + 1]) w = 1;
      if (j + d > B) d = 1;
      for (let dj = 0; dj < d; dj++) for (let di = 0; di < w; di++) taken[(j + dj) * B + i + di] = 1;
      const gap = r.range(0.06, 0.11), loose = m < 0.5 ? 1 : 0, heave = r.chance(0.1) ? 1 : 0;   // heaved stones: raised + tipped, they catch the low sun
      // irregular: each stone shrunk, nudged and turned inside its cells, so the paving reads as hand-laid cobbles, not a tile grid
      list.push([x0 + w * C / 2 + r.range(-0.05, 0.05), z0 + d * C / 2 + r.range(-0.05, 0.05), (w * C - gap) * r.range(0.88, 1), (d * C - gap) * r.range(0.88, 1),
        r.range(0.03, 0.06) + (big && r.chance(0.3) ? 0.05 : 0) + loose * r.range(0, 0.02) + heave * r.range(0.03, 0.08), r.range(-0.2, 0.2) + loose * r.range(-0.3, 0.3), 1,
        heave * r.range(-0.09, 0.09), heave * r.range(-0.09, 0.09)]);
    }
  }
  // 16×16 voxel-grain map on every stone face (chipped, dusty tops) — multiplied by the per-stone colour
  const cv = document.createElement('canvas'); cv.width = cv.height = 16;
  const g = cv.getContext('2d');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const edge = x === 0 || y === 0 || x === 15 || y === 15, v = (0.86 + hash01(x, y, 3) * 0.18 + (edge ? 0.07 : 0)) * 255;
    g.fillStyle = `rgb(${Math.min(255, v * 1.02) | 0},${Math.min(255, v) | 0},${Math.min(255, v * 0.97) | 0})`; g.fillRect(x, y, 1, 1);
  }
  const grain = new THREE.CanvasTexture(cv);
  grain.magFilter = THREE.NearestFilter; grain.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: grain, roughness: 0.93, flatShading: true });
  // with distance the stones blend toward one dusty tone: chunky cobbles up close, a calm dusty plain behind the fight
  // and flatten/widen into one surface (dark sides and gaps turn into moiré stripes at grazing angles)
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float cobbleD = distance((modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz, cameraPosition);
      float cobbleF = smoothstep(12.0, 34.0, cobbleD);
      transformed.y = mix(transformed.y, 0.5, cobbleF * 0.92);
      transformed.xz *= 1.0 + cobbleF * 0.25;                                   // close the dark gaps far away`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${DUST.r.toFixed(3)}, ${DUST.g.toFixed(3)}, ${DUST.b.toFixed(3)}) * 0.62, smoothstep(12.0, 40.0, length(vViewPosition)) * 0.6);   // → the dirt plane's tone`);
  };
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, list.length);
  mesh.name = 'cobbles';
  const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  const pos = new THREE.Vector3(), scl = new THREE.Vector3();
  list.forEach(([x, z, w, d, top, rot, v, tx, tz], i) => {
    const h = top + 0.12;
    q.setFromEuler(e.set(tx, rot, tz));
    mt.compose(pos.set(x, ground(x, z) + top - h / 2, z), q, scl.set(w, h, d));
    mesh.setMatrixAt(i, mt);
    c.set(PAL[r.int(0, PAL.length - 1)]).multiplyScalar(v * r.range(0.8, 1.1));      // wide per-stone value spread: a cobbled floor, not tiles
    c.lerp(DUST, Math.min(1, Math.max(0, noise2(x * 0.09 + 40, z * 0.09, 9) - 0.3) * 1.7 * r.next()));   // dust-covered stones (patchy)
    if (r.chance(0.07)) c.lerp(DUST, 0.45);                                           // a few sun-bleached stones
    mesh.setColorAt(i, c);
  });
  mesh.receiveShadow = true;
  return mesh;
}

/** Clusters of loose voxel rubble over the walkable field: broken paving, masonry chunks and charred planks, < 0.4 m. */
function rubble() {
  const r = makeRng(17), list = [];
  const COLS = [0x7a6a60, 0x6c5d56, 0x857266, 0x5f5049, 0x8c7a6c, 0x3a2a22];
  for (let k = 0; k < 420 && list.length < 2400; k++) {
    const cx = r.range(-60, 60), cz = r.range(-156, 215);
    const ii = Math.round((cx - X0) / S), jj = Math.round((cz - Z0) / S), f = G.in[ii + jj * NX];
    if (f < 0.5 || routeDist(cx, cz) < 3 || Math.abs(cz - riverZ(cx)) < 6) continue;   // on the field, off the road and the water
    const n = r.int(3, 10), spread = r.range(0.6, 1.6), gy = ground(cx, cz);
    for (let i = 0; i < n; i++) {
      const sz = r.range(0.1, 0.34) * (i === 0 ? 1.25 : 1), wood = r.chance(0.12);
      const sx = wood ? sz * 3 : sz * r.range(0.8, 1.3), sy = wood ? 0.08 : sz * r.range(0.6, 1), szz = wood ? 0.14 : sz * r.range(0.8, 1.3);
      list.push({ p: [cx + r.range(-spread, spread) * (i ? 1 : 0.2), gy + sy / 2 - 0.01, cz + r.range(-spread, spread) * (i ? 1 : 0.2)], s: [sx, sy, szz],
        r: [r.range(-0.25, 0.25), r.range(0, 3.14), r.range(-0.25, 0.25)], c: wood ? COLS[5] : COLS[r.int(0, 4)], v: r.range(0.85, 1.1) });
    }
  }
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.92, flatShading: true }), list.length);
  mesh.name = 'rubble';
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(), c = new THREE.Color();
  list.forEach((b, i) => {
    mesh.setMatrixAt(i, m.compose(p.set(...b.p), q.setFromEuler(e.set(...b.r)), sc.set(...b.s)));
    mesh.setColorAt(i, c.set(b.c).multiplyScalar(b.v));
  });
  mesh.receiveShadow = true;
  return mesh;
}

// ---------------------------------------------------------------- distant mountains
// periodic 1D value noise around the horizon ring
function ringNoise(n, seed) {
  const r = makeRng(seed), vals = Array.from({ length: n }, () => r.next());
  return (a) => {
    const f = ((a / (Math.PI * 2)) % 1 + 1) % 1 * n, i = Math.floor(f), t = f - i, u = t * t * (3 - 2 * t);
    return vals[i % n] * (1 - u) + vals[(i + 1) % n] * u;
  };
}

/**
 * Three rings of jagged mountains round the middle of the map (0, MZ), faceted (flat triangles) with baked light and
 * haze so they need no fog and blend into the sky at their base. Peaks stay low in angle (≈ 2-7°) so the gameplay
 * camera still sees sky above them — except Dingjun's own peak on the first ring, straight up the valley (bearing
 * PEAK_A, just right of the sunset saddle): the dark shoulder every zone looks toward, the summit's backdrop.
 * Blue-leaning mauve: the post grade warms them onto the concept's #7e7384–#898197.
 */
const MZ = 30, PEAK_A = -0.1;
function mountains() {
  const layers = [
    { r: 330, lo: 8, hi: 40, col: 0x474a5c, haze: 0.3, seed: 3, peak: 34 },
    { r: 480, lo: 16, hi: 64, col: 0x53576e, haze: 0.44, seed: 7, peak: 0 },
    { r: 680, lo: 30, hi: 112, col: 0x646b8a, haze: 0.58, seed: 13, peak: 0 },
  ];
  const pos = [], cols = [];
  const A = 420, L = new THREE.Vector3(SUN_DIR.x, 0.6, SUN_DIR.z).normalize();   // the low sun: north faces backlit
  const tmpC = new THREE.Color(), hz = new THREE.Color(), base = new THREE.Color(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), n = new THREE.Vector3(), cen = new THREE.Vector3();
  for (const ly of layers) {
    const n1 = ringNoise(11, ly.seed), n2 = ringNoise(29, ly.seed + 1), n3 = ringNoise(83, ly.seed + 2), n4 = ringNoise(190, ly.seed + 3);
    const ridge = (a) => {
      const v = n1(a) * 0.5 + n2(a) * 0.3 + n3(a) * 0.14 + n4(a) * 0.06;
      const da = Math.atan2(Math.sin(a - SUN_AZ), Math.cos(a - SUN_AZ));      // a saddle where the sun sets: the disc stays clear
      const dp = Math.atan2(Math.sin(a - PEAK_A), Math.cos(a - PEAK_A));
      return (ly.lo + (ly.hi - ly.lo) * Math.pow(Math.max(0, v - 0.18) / 0.82, 1.7)) * (1 - 0.8 * Math.exp(-((da / 0.2) ** 2))) + ly.peak * Math.exp(-((dp / 0.09) ** 2)) * (0.85 + 0.3 * n4(a));
    };
    // radial profile rows: [radius offset, height fraction, jitter]
    const rows = [[-70, -0.1, 0], [-34, 0.42, 0.18], [0, 1, 0], [40, 0.66, 0.2], [110, 0.15, 0]];
    const vtx = (ai, ri) => {
      const a = (ai / A) * Math.PI * 2, [dr, fh, jit] = rows[ri];
      const rr = ly.r + dr + (hash01(ai, ri, ly.seed) - 0.5) * 16;
      const hh = ridge(a) * fh + (hash01(ai * 3, ri, ly.seed + 9) - 0.5) * jit * (ly.hi * 0.5);
      return [Math.sin(a) * rr, hh, MZ + Math.cos(a) * rr];
    };
    base.set(ly.col);
    for (let ai = 0; ai < A; ai++) for (let ri = 0; ri < rows.length - 1; ri++) {
      const a = vtx(ai, ri), b = vtx(ai + 1, ri), c = vtx(ai + 1, ri + 1), d = vtx(ai, ri + 1);
      for (const tri of [[a, b, c], [a, c, d]]) {
        e1.set(tri[1][0] - tri[0][0], tri[1][1] - tri[0][1], tri[1][2] - tri[0][2]);
        e2.set(tri[2][0] - tri[0][0], tri[2][1] - tri[0][1], tri[2][2] - tri[0][2]);
        n.crossVectors(e2, e1).normalize();
        if (n.y < 0) n.negate();
        cen.set((tri[0][0] + tri[1][0] + tri[2][0]) / 3, (tri[0][1] + tri[1][1] + tri[2][1]) / 3, (tri[0][2] + tri[1][2] + tri[2][2]) / 3);
        const lit = 0.55 + 0.85 * Math.max(0, n.dot(L));
        const hf = Math.max(0, Math.min(1, cen.y / ly.hi));
        tmpC.copy(base).multiplyScalar(lit * (0.9 + hf * 0.25));
        hazeColor(e1.set(cen.x, cen.y, cen.z - MZ).normalize(), hz);
        tmpC.lerp(hz, Math.min(1, ly.haze + (1 - hf) * 0.22));
        for (const v of tri) { pos.push(v[0], v[1], v[2]); cols.push(tmpC.r, tmpC.g, tmpC.b); }
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.computeBoundingSphere();
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
  m.renderOrder = -0.5;
  return m;
}

/** fieldFires: [x, z, scale] burning wrecks (their ground is scorched). */
export function buildTerrain(scene, fieldFires) {
  const r = makeRng(61), scorch = fieldFires.map(([x, z, s]) => [x, z, s]);
  for (let i = 0; i < 26; i++) scorch.push([r.range(-40, 40), r.range(-110, 200), r.range(0.5, 0.9)]);
  scene.add(groundMesh(scorch), cliffs(), pines(), river(), cobbles(), rubble(), tufts(), boulders(), mountains());
}
