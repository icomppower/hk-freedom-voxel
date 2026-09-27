// Minimap layer (render-only): the whole 定軍山 field drawn once, in the HUD minimap's orientation (map up = +Z, up
// the valley; +X is map-left, as the camera sees it at yaw 0), for hud.js to blit around the hero. Walkable ground
// pale with a bright rim where the cliffs / palisades stop you, the Han River, the castle wall with its gate passage,
// the road dotted in gold. Gates, units and labels are drawn live by the HUD.
import { TERRAIN as G, ROUTE, riverZ, walkIn, WALL_Z, GATE_X, FORDS } from './map.js';

const PPM = 2;                        // px per metre
let layer = null;

/** { canvas, x1, z1, ppm }: canvas pixel (u, v) ↔ world (x1 - u / ppm, z1 - v / ppm). Built on first use. */
export function minimapLayer() {
  if (layer) return layer;
  const W = (G.x1 - G.x0) * PPM, H = (G.z1 - G.z0) * PPM;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  for (let v = 0; v < H; v++) for (let u = 0; u < W; u++) {
    const x = G.x1 - (u + 0.5) / PPM, z = G.z1 - (v + 0.5) / PPM, s = walkIn(x, z), o = (u + v * W) * 4;
    const wet = Math.abs(z - riverZ(x)) < 6.5;
    if (s > 0) {                                                         // field: pale, bright rim at the edge
      const rim = s < 1.2;
      d[o] = 214; d[o + 1] = 184; d[o + 2] = 130; d[o + 3] = rim ? 190 : 96;
      if (wet) { d[o] = 120; d[o + 1] = 160; d[o + 2] = 170; d[o + 3] = 130; }   // the fords
    } else if (wet) { d[o] = 70; d[o + 1] = 120; d[o + 2] = 150; d[o + 3] = 120; }   // deep water
    else { d[o] = 8; d[o + 1] = 5; d[o + 2] = 4; d[o + 3] = Math.min(120, 40 - s * 4); }   // rock: darker the further out
  }
  g.putImageData(img, 0, 0);
  const X = (x) => (G.x1 - x) * PPM, Y = (z) => (G.z1 - z) * PPM;
  // castle wall (-64 … corner tower) + flank wall, gate passage left open
  g.fillStyle = 'rgba(236,214,172,0.8)';
  g.fillRect(X(16.5), Y(WALL_Z + 9), (16.5 + 64) * PPM, 9 * PPM);
  g.fillRect(X(16.5), Y(150), 9 * PPM, 40 * PPM);
  g.clearRect(X(GATE_X + 3.6), Y(WALL_Z + 9), 7.2 * PPM, 9 * PPM);
  g.fillStyle = 'rgba(214,184,130,0.2)'; g.fillRect(X(GATE_X + 3.6), Y(WALL_Z + 9), 7.2 * PPM, 9 * PPM);
  // the road, dotted gold; the ford crossings marked
  g.strokeStyle = 'rgba(208,160,64,0.55)'; g.lineWidth = 1.5; g.setLineDash([4, 5]);
  g.beginPath(); ROUTE.forEach(([x, z], i) => (i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z)))); g.stroke();
  g.setLineDash([]);
  g.fillStyle = 'rgba(236,214,172,0.5)';
  for (const [a, b] of FORDS) for (let x = a + 1; x < b; x += 2.5) g.fillRect(X(x) - 1, Y(riverZ(x)) - 1, 2, 2);
  layer = { canvas: cv, x1: G.x1, z1: G.z1, ppm: PPM };
  return layer;
}
