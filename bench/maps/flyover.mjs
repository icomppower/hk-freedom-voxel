// Map flyover (step 6): the real page on the chapter's map (free battle, so the field is populated), the hero placed at each
// zone's stand point in turn (render check only), a screenshot per stop → bench/out/flyover-<chapter>-<k>.png, then a sheet.
//   node bench/maps/flyover.mjs sheep1 "x,z,yaw;…"
import { openGame } from '../harness/browser.mjs';
const [chapter = 'sheep1', spots = '0,-128,0;0,-58,0;-34,-44,0.3;0,-12,0;0,18,3.14;8,50,0.4;10,80,0'] = process.argv.slice(2);
const g = await openGame({ query: `?go=free&char=gok&ch=${chapter}` }), P = g.page;
await P.waitForTimeout(2500);
let k = 0;
for (const s of spots.split(';')) {
  const [x, z, yaw] = s.split(',').map(Number);
  await P.evaluate(([x, z, yaw]) => { const G = __vm.game; G.hero.x = x; G.hero.z = z; G.hero.yaw = yaw; G.cam.yaw = yaw; G.cam.ctrl = yaw; }, [x, z, yaw]);
  await P.waitForTimeout(1800);
  await P.screenshot({ path: `bench/out/flyover-${chapter}-${k++}.png` });
}
console.log('flyover', k, 'shots', g.errors.slice(0, 3));
await g.close();
