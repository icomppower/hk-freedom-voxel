// Scroll gate (Scroll Cutscenes page): every card of every 香港自由戰士 scroll (PROLOGUE, ENDING) has ≤ 3 columns of ≤ 7
// characters (spaces don't count), an English line, and only marks / arrows the map defines (data-id in MAP).
//   node --import ./bench/harness/register.mjs bench/harness/cols.mjs
import { CHAPTERS } from '../../src/story/chapters.js';
let bad = 0, cards = 0;
for (const [id, C] of Object.entries(CHAPTERS)) {
  if (!/^hk/.test(id)) continue;
  const ids = new Set([...C.MAP.matchAll(/data-id="([^"]+)"/g)].map((m) => m[1]));
  for (const [name, list] of [['PROLOGUE', C.PROLOGUE], ['ENDING', C.ENDING]]) for (const [k, card] of (list || []).entries()) {
    cards++;
    const long = card.cols.filter((c) => [...c.replace(/\s/g, '')].length > 7), miss = card.show.filter((s) => !ids.has(s));
    if (long.length || card.cols.length > 3 || !card.en || miss.length) { bad++; console.log(`FAIL ${id} ${name}[${k}] ${long.join('/')} ${miss.length ? 'unknown marks ' + miss.join(',') : ''}`); }
  }
}
console.log(bad ? `COLS FAIL ${bad}/${cards} cards` : `COLS PASS ${cards}/${cards} cards (≤ 7 per column, ≤ 3 columns, known marks)`);
process.exit(bad ? 1 : 0);
