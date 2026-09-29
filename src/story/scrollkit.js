// Ink-scroll map helpers shared by every chapter's scroll map (ch1.js 漢中, sheepmap.js 羊村). Moved out of prologue.js by
// the scroll-player commit; output is byte-identical to upstream's. viewBox 1600×900.
//   peaks(list, h, w)   brush mountains: [[x, y, scale = 1], …] → SVG paths (fill from the caller's <g>)
//   head(d)             arrowhead at the end of a cubic path, along its last control leg
//   arrows(list)        troop arrows [[id, side, 'M x y C …'], …] → the .pl-arw groups the player animates (side: CSS
//                       class — shu / wei, sheep / wolf)
export const peaks = (list, h, w) => list.map(([x, y, k = 1]) =>
  `<path d="M${x - w * k} ${y} Q${x - w * k * 0.35} ${y - h * k * 0.55} ${x} ${y - h * k} Q${x + w * k * 0.3} ${y - h * k * 0.5} ${x + w * k} ${y}Z"/>`).join('');
export function head(d) {                          // arrowhead at the path end, along the last control leg
  const n = d.match(/-?\d+(\.\d+)?/g).map(Number), [cx, cy, x, y] = n.slice(-4), a = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
  return `<path d="M0 0 L-34 -17 L-24 0 L-34 17Z" transform="translate(${x} ${y}) rotate(${a.toFixed(1)})"/>`;
}
export const arrows = (list) => list.map(([id, side, d]) =>
  `<g class="pl-arw ${side}" data-id="${id}"><path class="u" d="${d}" pathLength="1"/><path class="s" d="${d}" pathLength="1"/><g class="hd">${head(d)}</g></g>`).join('');
