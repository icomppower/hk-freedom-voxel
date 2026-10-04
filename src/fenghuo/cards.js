// 烽火事件牌 Bonfire event cards (sim data, deterministic). Each 烽火戰 battle draws 1–2 cards from the battle seed;
// their effects compose into game.mods (fenghuo.js) and a derived game.diff. All events are fictionalised — inspired by
// recent Asian news, no real names, and no casualty or tragedy is ever turned into a buff.
//   draw(seed)          → [card, …] (1–2 distinct cards, same seed → same cards)
//   compose(cards)      → mods (NEUTRAL with every effect applied)
//   validate()          → [] or a list of problems (the oracle: bench/fenghuo/cards.mjs)
// Effect ops: 'mul' (value = fraction, applied as × (1 + value)), 'add', 'set'.
import { makeRng } from '../core/rng.js';

// stat key → [mods field, op, |bound|, zh label (the card face / HUD chip), +1 = more is good for the player / -1 = less is]
export const STATS = {
  hero_atk:       ['heroAtk', 'mul', 0.3, '攻擊', 1],
  hero_def:       ['heroDef', 'mul', 0.3, '防禦', 1],
  hero_speed:     ['heroSpeed', 'mul', 0.3, '移速', 1],
  hero_hp:        ['heroHp', 'mul', 0.3, '體力上限', 1],
  musou_gain:     ['musouGain', 'mul', 0.3, '無雙充能', 1],
  hero_regen:     ['regen', 'add', 0.01, '脫戰回血 /秒', 1],
  ko_heal:        ['koHeal', 'add', 0.1, '擊倒敵將回血', 1],
  ally_count:     ['allyN', 'add', 8, '我方人數', 1],
  ally_hp:        ['allyHp', 'mul', 0.3, '我方體力', 1],
  ally_reinforce: ['allyReinforce', 'set', null, '我方增援', 1],
  enemy_atk:      ['enemyAtk', 'mul', 0.3, '敵軍攻擊', -1],
  enemy_hp:       ['enemyHp', 'mul', 0.3, '敵軍體力', -1],
  officer_hp:     ['officerHp', 'mul', 0.3, '敵將體力', -1],
  enemy_windup:   ['windup', 'mul', 0.3, '敵軍出手預兆', 1],
  enemy_strikers: ['strikers', 'add', 1, '同時出手敵兵', -1],
  enemy_waves:    ['waves', 'mul', 0.3, '敵軍增援速度', -1],   // unused in v0.2: in a K.O. race fewer waves slowed the pace (G5 r2)
  officers:       ['officers', 'add', 1, '敵將數量', -1],
  minimap:        ['minimap', 'set', null, '小地圖', 1],
  visibility:     ['visibility', 'mul', 0.5, '視野', 1],        // render-only (fog / haze), never read by the sim
  timer_sec:      ['timer', 'add', 60, '時限（秒）', 1],
  rank_bonus:     ['rank', 'add', 1, '評級', 1],
};

export const NEUTRAL = Object.freeze({
  heroAtk: 1, heroDef: 1, heroSpeed: 1, heroHp: 1, musouGain: 1, regen: 0, koHeal: 0,
  allyN: 0, allyHp: 1, allyReinforce: true,
  enemyAtk: 1, enemyHp: 1, officerHp: 1, windup: 1, strikers: 0, waves: 1, officers: 0,
  minimap: true, visibility: 1, timer: 0, rank: 0,
});

const E = (stat, value) => ({ stat, value });
// type: buff (good for the player) | debuff | mixed (cuts both ways: weather, elections)
export const CARDS = [
  { id: 'B01', type: 'buff', name: '人鏈', en: 'Human Chain', flavor: ['街頭手牽手，一條人鏈拉過成個城。', 'Hand in hand, one chain across the whole city.'],
    effects: [E('ally_count', 8), E('ally_hp', 0.2)] },
  { id: 'B02', type: 'buff', name: '雨傘陣', en: 'Umbrella Wall', flavor: ['一把把傘撐起，擋住迎面而來嘅攻勢。', 'Umbrellas up: the blows glance off.'],
    effects: [E('hero_def', 0.25)] },
  { id: 'B03', type: 'buff', name: '海外聲援', en: 'Voices Abroad', flavor: ['大洋彼岸亦有人為你點燈。', 'Across the ocean, someone lights a lamp for you.'],
    effects: [E('musou_gain', 0.25)] },
  { id: 'B04', type: 'buff', name: '制裁令', en: 'Sanctions', flavor: ['外邦凍結物資，鎮壓部隊裝備短缺。', 'Supplies frozen abroad; their kit runs thin.'],
    effects: [E('enemy_hp', -0.15)] },
  { id: 'B05', type: 'buff', name: '罷工潮', en: 'General Strike', flavor: ['工廠停機，裝備線冇人開工。', 'The plants stop; nobody works the armoury line.'],
    effects: [E('enemy_atk', -0.1), E('officer_hp', -0.1)] },
  { id: 'B06', type: 'buff', name: '連儂牆', en: 'Lennon Wall', flavor: ['彩色便條貼滿一面牆，人心未死。', 'A wall of coloured notes: hearts still beat.'],
    effects: [E('hero_atk', 0.15)] },
  { id: 'B07', type: 'buff', name: '夜光行動', en: 'Laser Night', flavor: ['千點光芒照向敵陣，佢哋睇唔清。', 'A thousand points of light: they can\'t see straight.'],
    effects: [E('enemy_windup', 0.25)] },
  { id: 'B08', type: 'buff', name: '地下補給線', en: 'Underground Supply', flavor: ['物資喺暗巷之間靜靜流轉。', 'Supplies pass quietly through back lanes.'],
    effects: [E('ko_heal', 0.08)] },
  { id: 'B09', type: 'buff', name: '全城直播', en: 'Live to the World', flavor: ['鏡頭對準戰場，佢哋出手有所顧忌。', 'Every lens is on them; they hold back.'],
    effects: [E('enemy_atk', -0.15)] },
  { id: 'B10', type: 'buff', name: '飲茶時間', en: 'Yum Cha Break', flavor: ['打完一輪，坐低飲啖茶再嚟過。', 'One round done: sit, sip, go again.'],
    effects: [E('hero_regen', 0.01)] },
  { id: 'B11', type: 'buff', name: '流亡電台', en: 'Exile Radio', flavor: ['短波頻道報出指揮官底細。', 'Shortwave reads out the commanders\' weak spots.'],
    effects: [E('officer_hp', -0.2)] },
  { id: 'B12', type: 'buff', name: '黃色經濟圈', en: 'Yellow Economy', flavor: ['街坊幫襯自己人，糧草充足。', 'Neighbours buy from their own: the larder is full.'],
    effects: [E('rank_bonus', 1)] },
  { id: 'B13', type: 'buff', name: '國際記者會', en: 'World Press', flavor: ['世界目光聚焦，指揮層陣腳大亂。', 'The world is watching; their command falters.'],
    effects: [E('officers', -1)] },
  { id: 'B14', type: 'buff', name: '義務急救站', en: 'Volunteer Medics', flavor: ['白衣義工守住後方。', 'Volunteers in white hold the rear.'],
    effects: [E('hero_hp', 0.2)] },

  { id: 'D01', type: 'debuff', name: '斷網', en: 'Blackout', flavor: ['全城訊號消失，各自為戰。', 'The signal dies city-wide; everyone fights alone.'],
    effects: [E('minimap', false)] },
  { id: 'D02', type: 'debuff', name: '宵禁令', en: 'Curfew', flavor: ['日落之前必須完事。', 'Finish it before the sun goes down.'],
    effects: [E('timer_sec', -60)] },
  { id: 'D03', type: 'debuff', name: '天眼監控', en: 'Sky Eye', flavor: ['街頭鏡頭無處不在，無處可躲。', 'Cameras on every corner: nowhere to hide.'],
    effects: [E('enemy_strikers', 1)] },
  { id: 'D04', type: 'debuff', name: '水炮車', en: 'Water Cannon', flavor: ['藍色水柱掃過長街。', 'Blue water sweeps the street.'],
    effects: [E('hero_speed', -0.15)] },
  { id: 'D05', type: 'debuff', name: '煙霧彈', en: 'Smoke', flavor: ['白煙瀰漫，眼淚直流。', 'White smoke, streaming eyes.'],
    effects: [E('visibility', -0.4), E('hero_atk', -0.05)] },
  { id: 'D06', type: 'debuff', name: '大搜捕', en: 'Dragnet', flavor: ['鎮壓部隊傾巢而出，下手更重。', 'Every unit is out, and they hit harder.'],
    effects: [E('enemy_atk', 0.2)] },
  { id: 'D07', type: 'debuff', name: '假消息洪流', en: 'Disinformation', flavor: ['謠言滿天飛，你睇唔清邊下係真。', 'Rumours everywhere: you misread the next blow.'],
    effects: [E('enemy_windup', -0.15)] },
  { id: 'D08', type: 'debuff', name: '凍結戶口', en: 'Frozen Accounts', flavor: ['糧餉被截，補給斷絕。', 'Funds seized, supplies cut.'],
    effects: [E('hero_hp', -0.15)] },
  { id: 'D09', type: 'debuff', name: '戒嚴', en: 'Martial Law', flavor: ['重甲部隊進駐。', 'Heavy armour moves in.'],
    effects: [E('enemy_hp', 0.2)] },
  { id: 'D10', type: 'debuff', name: '收編傳媒', en: 'Captured Press', flavor: ['電視台只播一把聲。', 'Every channel carries one voice.'],
    effects: [E('musou_gain', -0.2)] },
  { id: 'D11', type: 'debuff', name: '告密熱線', en: 'Snitch Line', flavor: ['有人通風報信，指揮官早已埋伏。', 'Someone talked: a commander lies in wait.'],
    effects: [E('officers', 1)] },
  { id: 'D12', type: 'debuff', name: '封路', en: 'Roadblocks', flavor: ['鐵馬攔街，增援過唔到嚟。', 'Barriers on every road: no help gets through.'],
    effects: [E('ally_reinforce', false)] },
  { id: 'D13', type: 'debuff', name: '盾牆推進', en: 'Shield Wall', flavor: ['一排排盾牌步步進逼。', 'Row on row of shields, step by step.'],
    effects: [E('officer_hp', 0.2)] },
  { id: 'D14', type: 'debuff', name: '統戰滲透', en: 'Infiltration', flavor: ['身邊有人早已轉軚。', 'Some at your side have already turned.'],
    effects: [E('ally_count', -8)] },

  { id: 'M01', type: 'mixed', name: '八號風球', en: 'Typhoon Signal 8', flavor: ['狂風掃城，雙方都寸步難行。', 'Gale across the city: nobody moves fast.'],
    effects: [E('hero_speed', -0.1), E('enemy_windup', 0.15)] },
  { id: 'M02', type: 'mixed', name: '黑色暴雨', en: 'Black Rainstorm', flavor: ['天黑如夜，伸手不見五指。', 'Dark as night: you can\'t see your hand.'],
    effects: [E('visibility', -0.5), E('enemy_windup', 0.15)] },
  { id: 'M03', type: 'mixed', name: '酷熱天氣', en: 'Very Hot Weather', flavor: ['三十六度，出手更狠，身子更虛。', '36 degrees: you hit harder, and wilt faster.'],
    effects: [E('hero_atk', 0.1), E('hero_def', -0.1)] },
  { id: 'M04', type: 'mixed', name: '選舉日', en: 'Election Day', flavor: ['全城投票，雙方都卯足全力。', 'The city votes: both sides go all in.'],
    effects: [E('hero_atk', 0.15), E('enemy_atk', 0.15)] },
];
export const CARD = Object.fromEntries(CARDS.map((c) => [c.id, c]));

/** 1–2 distinct cards from a seed (its own RNG: the sim's rng is untouched). */
export function draw(seed) {
  const r = makeRng((seed >>> 0) ^ 0x9e3779b9);
  r.next();
  const n = r.next() < 0.5 ? 1 : 2, pool = CARDS.slice(), out = [];
  for (let k = 0; k < n; k++) out.push(pool.splice(Math.floor(r.next() * pool.length), 1)[0]);
  return out;
}

/** Cards → mods. mul stacks multiplicatively (× (1 + v) each), add sums, set: the last card wins. */
export function compose(cards) {
  const m = { ...NEUTRAL };
  for (const c of cards) for (const e of c.effects) {
    const [f, op] = STATS[e.stat];
    if (op === 'mul') m[f] *= 1 + e.value; else if (op === 'add') m[f] += e.value; else m[f] = e.value;
  }
  return m;
}

/** Signed effect text for a card face / chip: '攻擊 +15%', '小地圖 關閉'. */
export function effectText(e) {
  const [, op, , zh] = STATS[e.stat];
  if (op === 'set') return `${zh} ${e.value ? '開啟' : '關閉'}`;
  const v = e.value, s = v > 0 ? '+' : '−', a = Math.abs(v);
  if (op === 'mul') return `${zh} ${s}${Math.round(a * 100)}%`;
  if (e.stat === 'hero_regen' || e.stat === 'ko_heal') return `${zh} ${s}${+(a * 100).toFixed(1)}%`;
  return `${zh} ${s}${a}`;
}

/** Does this effect help the player? (card face colours, the balance check) */
export function helps(e) {
  const g = STATS[e.stat][4];
  return typeof e.value === 'boolean' ? e.value : (e.value > 0) === (g > 0);
}

/** Oracle checks on the deck itself. */
export function validate() {
  const bad = [], ids = new Set();
  let buff = 0, debuff = 0;
  for (const c of CARDS) {
    if (ids.has(c.id)) bad.push(`${c.id}: duplicate id`); ids.add(c.id);
    if (!['buff', 'debuff', 'mixed'].includes(c.type)) bad.push(`${c.id}: type ${c.type}`);
    if (c.type === 'buff') buff++; if (c.type === 'debuff') debuff++;
    if (!c.name || !c.en || !c.flavor || c.flavor.length !== 2) bad.push(`${c.id}: text`);
    if (!c.effects.length) bad.push(`${c.id}: no effects`);
    const ups = c.effects.filter(helps).length;                      // a buff only helps, a debuff only hurts, mixed does both
    if (c.type === 'buff' && ups !== c.effects.length) bad.push(`${c.id}: buff with a downside`);
    if (c.type === 'debuff' && ups) bad.push(`${c.id}: debuff with an upside`);
    if (c.type === 'mixed' && (!ups || ups === c.effects.length)) bad.push(`${c.id}: mixed card one-sided`);
    for (const e of c.effects) {
      const s = STATS[e.stat];
      if (!s) { bad.push(`${c.id}: unknown stat ${e.stat}`); continue; }
      if (s[1] === 'set') { if (typeof e.value !== 'boolean') bad.push(`${c.id}: ${e.stat} wants a boolean`); }
      else if (typeof e.value !== 'number' || !Number.isFinite(e.value) || Math.abs(e.value) > s[2] + 1e-9) bad.push(`${c.id}: ${e.stat} ${e.value} out of ±${s[2]}`);
    }
  }
  if (Math.abs(buff - debuff) > 2) bad.push(`buff/debuff ${buff}:${debuff} (want 1:1 ± 2)`);
  return bad;
}
