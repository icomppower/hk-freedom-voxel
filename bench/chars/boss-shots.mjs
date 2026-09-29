// Boss fight in the real page (the bosstest chapter of bench/chars/boss.mjs, registered in the page), the bot as ?char;
// shots in phase 1, phase 3 (cracked glaive) and just after the KO (kneel, broken glaive) → bench/out/boss-*.png
import { openGame } from '../harness/browser.mjs';
const char = process.argv[2] || 'gok';
const g = await openGame({}), P = g.page, wait = (ms) => P.waitForTimeout(ms);
await wait(2500);
await P.evaluate(async (char) => {
  const { CHAPTERS } = await import('/src/story/chapters.js');
  const { wardenBoss } = await import('/src/chars/officers/warden/boss.js');
  const { createBot } = await import('/bench/bot/bot.mjs');
  const C1 = CHAPTERS.ch1;
  CHAPTERS.bosstest = { ...C1, id: 'bosstest', cast: ['gok', 'siume'], skin: { foe: 'wolf', ally: 'sheep' },
    OFF: { warden: { name: { zh: '狼督', en: 'WARDEN-WOLF' }, hp: 2340, boss: true, model: 'warden' } },
    BEATS: [
      { when: { wait: 30 }, officers: { warden: { at: ['honjin', 0, 0.85], engaged: true } }, obj: { zh: '擊破狼督', en: 'Defeat the Warden-Wolf', go: 'warden' } },
      { when: { below: ['warden', 0.5] }, skip: { down: 'warden' }, banner: { html: '<em>燈塔</em>熄滅', en: 'The lighthouse goes dark' } },
      { when: { below: ['warden', 0.2] }, skip: { down: 'warden' }, banner: { html: '狼督 <em>暴怒</em>', en: 'The Warden-Wolf rages' } },
      { when: { down: 'warden' }, win: true, banner: { html: '狼督 <em>刀斷</em>', en: 'The Warden-Wolf\'s glaive breaks', big: true } },
    ],
    script: (g, api) => wardenBoss(g, api, { arena: [0, -132], r: 12, calls: [[-0.8, 0.6], [0.8, 0.6]] }) };
  const bot = createBot();
  window.__onStep = (inp) => Object.assign(inp, bot(window.__vm.game));
  __vm.flow.go('battle', { mode: 'story', char, chapter: 'bosstest' });
}, char);
const ph = (p) => P.waitForFunction((p) => (window.__vm.game.story.fx?.phase || 0) >= p, p, { timeout: 400000, polling: 50 });
await ph(1); await wait(6000); await P.screenshot({ path: 'bench/out/boss-p1.png' });
await ph(3); await wait(1500); await P.screenshot({ path: 'bench/out/boss-p3.png' });
await P.waitForFunction(() => (window.__vm.game.timeScale ?? 1) < 1, null, { timeout: 400000, polling: 50 });   // the KO's victory slow-mo
await wait(3000); await P.screenshot({ path: 'bench/out/boss-ko.png' });
console.log('boss shots', g.errors.slice(0, 3));
await g.close();
