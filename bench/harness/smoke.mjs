// Smoke: load the game straight into a battle (?go=…), run it for a few seconds of wall time, report sim frames and any
// page errors; optional screenshot. node bench/harness/smoke.mjs "?go=story&char=zhaoyun" [seconds] [out.png]
import { openGame } from './browser.mjs';
const q = process.argv[2] || '?go=story&char=zhaoyun', secs = +(process.argv[3] || 5), shot = process.argv[4];
const g = await openGame({ query: q });
await g.page.waitForTimeout(secs * 1000);
const r = await g.page.evaluate(() => ({ state: __vm.state, frame: __vm.game.frame, chapter: __vm.game.chapter, char: __vm.game.hero.char.id }));
if (shot) await g.page.screenshot({ path: shot });
console.log(JSON.stringify(r), g.errors.length ? 'ERRORS ' + g.errors.join(' | ') : 'no errors');
await g.close();
process.exit(g.errors.length ? 1 : 0);
