// 第一章「羊村牧場」 The Sheep Village Pasture — chapter data (format: ./ch1.js header; registry: ./chapters.js).
// Story (Storyline page): the wolves raid the shearing festival; 阿角 holds the pasture while elders and lambs run for the
// barns, hooks 灰牙's shield line aside in the barn lane, finds a way round when a burning barn's beam falls across it, and
// holds the village gate alone until the last cart is through; 小咩 drops from a rooftop with the route — the old pier,
// tonight — and together they take the shrine hill and light the signal lantern. Lines: Scroll Cutscenes page (Ch. I).
// Speakers: SPK keys, or a playable id ('gok' / 'siume') — the story resolves that to the hero or the ally line.
// Script (story hook): the carts (six pass the gate over the 90 s hold, the first 8 s in; a cart is lost if the hero is not
// holding the gateway — more than 20 m from it — as it passes), the barn collapse (gate 'barnLane' shuts: the lane is blocked, the objective
// walks the detour west round the barns), the signal lantern (fx.lantern). Win: the lantern lit with ≥ 60 % of the carts safe (else the chapter is lost at the lantern).
import { SHEEP_MAP } from './sheepmap.js';

export const SPK = {
  gok: { name: { zh: '阿角', en: 'Ah Gok' }, seal: '角', side: 'shu' },
  siume: { name: { zh: '小咩', en: 'Siu Me' }, seal: '咩', side: 'shu' },
  grey: { name: { zh: '灰牙', en: 'Grey Fang' }, seal: '牙', side: 'wei' },
  shadow: { name: { zh: '影爪', en: 'Shadow Claw' }, seal: '爪', side: 'wei' },
  iron: { name: { zh: '鐵吻', en: 'Iron Muzzle' }, seal: '吻', side: 'wei' },
  warden: { name: { zh: '狼督', en: 'Warden-Wolf' }, seal: '督', side: 'wei' },
  lamb: { name: { zh: '羊仔', en: 'Lamb' }, seal: '羊', side: 'shu' },
  twelve: { name: { zh: '十二勇士', en: 'The Twelve' }, seal: '十二', side: 'shu' },
  wolf: { name: { zh: '狼兵', en: 'Wolf Soldier' }, seal: '狼', side: 'wei' },
};
// free battle on this map: the arena's officers go by these (story index.js: replaces the crowd's built-in names)
export const freeNames = [{ zh: '狼兵隊長', en: 'WOLF CAPTAIN' }, { zh: '巡夜狼', en: 'NIGHT PATROL' }, { zh: '港口狼', en: 'HARBOR GUARD' }, { zh: '灰牙', en: 'GREY FANG' }];
export const OFF = {
  grey: { name: { zh: '灰牙', en: 'GREY FANG' }, hp: 650, model: 'grey' },
  captain: { name: { zh: '狼兵隊長', en: 'WOLF CAPTAIN' }, hp: 360 },
};

const NAG = { who: 'siume', zh: '角叔，後面仲有羊未走，唔好一個衝咁前！', en: 'Uncle Gok, there are still sheep behind us. Don\'t run on alone!' };
const NAG_GATE = { who: 'gok', zh: '車未過晒，村門唔可以離開。', en: 'Not all the carts are through. I can\'t leave the gate.' };
const LANE_MID = ['barns', 0.18, 0.05];             // ≈ the burning barn (z −40)

export const BEATS = [
  // ---- 牧場: the raid on the shearing festival
  {
    when: { wait: 30 },
    gate: 'barnLane',
    obj: { zh: '守住牧場', en: 'Hold the pasture', go: ['field', 0, 0.2] },
    squads: [{ at: ['field', -0.5, 0.35], n: 20 }, { at: ['field', 0.45, 0.4], n: 20 }, { at: ['field', 0, 0.8], n: 24 }, { at: ['field', -0.3, 0.9], n: 18 }],
    limit: { z: ['barns', 0, -1], nag: NAG },
    morale: 0,
    say: [
      { who: 'wolf', zh: '奉狼督命令！搜禁書！全部羊企定！', en: 'By order of the Warden! Search for forbidden books! All sheep stand still!' },
      { who: 'gok', zh: '老人家同細路，入穀倉。其他嘢，交俾我。', en: 'Elders and little ones, into the barns. Leave the rest to me.' },
    ],
  },
  { when: [{ zone: 'field', kos: 40 }, { wait: 30 * 60 }], waves: true, say: [{ who: 'lamb', zh: '角叔！狼仲有好多呀！', en: 'Uncle Gok! There are so many wolves!' }] },
  {
    when: [{ kos: 90 }, { wait: 50 * 60 }],
    banner: { html: '<em>牧場</em> 守住！', en: 'The pasture holds — the flock is in the barns', dur: 170 },
    heal: 0.3, morale: 0.12, waves: false, retire: true, hush: true,
    obj: { zh: '突破穀倉巷', en: 'Break through the barn lane', go: ['barns', 0, -0.6] },
    limit: { z: LANE_MID, nag: NAG },
  },
  // ---- 穀倉巷: 灰牙's shield line
  {
    when: { zone: 'barns' },
    officers: { grey: { at: ['barns', 0.09, -0.35], engaged: true } },
    squads: [{ at: ['barns', 0.09, -0.62], n: 16, cols: 8 }, { at: ['barns', 0.09, -0.2], n: 16, cols: 8, charge: true }],
    obj: { zh: '擊破 灰牙', en: 'Defeat Grey Fang', go: 'grey' },
    say: [
      { who: 'grey', zh: '老羊，讓開。', en: 'Step aside, old sheep.' },
      { who: 'gok', zh: '我企喺度幾十年，今日都唔會郁。', en: 'I\'ve stood here for decades. I\'m not moving today.' },
    ],
  },
  {
    when: { down: 'grey' },
    banner: { html: '灰牙 <em>敗走</em>', en: 'Grey Fang falls back', dur: 170, big: true },
    heal: 0.2, morale: 0.1, hush: true, retire: true,
    say: [{ who: 'grey', zh: '⋯⋯呢隻羊，硬過塊盾。', en: '...This sheep\'s harder than my shield.' }],
    obj: { zh: '穿過穀倉巷', en: 'Get through the barn lane', go: ['barns', 0.09, 0.5] },
    limit: { z: null },
  },
  // ---- set piece: the burning barn's beam falls across the lane (script: gate 'barnLane' shuts) → the detour
  {
    when: [{ at: ['barns', 0, -0.2] }, { wait: 10 * 60 }],
    cue: 'collapse',
    banner: { html: '<em>穀倉</em>倒塌', en: 'A burning barn collapses across the lane', dur: 170 },
    obj: { zh: '搵另一條路', en: 'Find another way', go: ['barns', -0.35, 0.2] },
    squads: [{ at: ['barns', -0.36, -0.2], n: 14, charge: true }, { at: ['barns', -0.3, 0.45], n: 16 }],
    waves: true,
    say: [{ who: 'lamb', zh: '條巷燒著咗！', en: 'The lane\'s on fire!' }, { who: 'gok', zh: '行後面，跟住我。', en: 'Round the back. Follow me.' }],
  },
  // ---- 村門: hold the gate while the carts pass (90 s)
  {
    when: { zone: 'gate' },
    cue: 'carts', waves: true, retire: true,
    obj: { zh: '守住村門，等車隊過', en: 'Hold the gate until the carts pass', go: ['gate', 0, -0.35] },
    limit: { z: ['gate', 0, -0.35], nag: NAG_GATE },
    squads: [{ at: ['gate', -0.4, -0.95], n: 18, charge: true }, { at: ['gate', 0.4, -0.95], n: 18, charge: true }],
    officers: { captain: { at: ['barns', 0, 0.8], engaged: true } },
    say: [{ who: 'lamb', zh: '最後幾架車！角叔，頂住呀！', en: 'The last few carts! Hold on, Uncle Gok!' }],
  },
  {
    when: { flag: 'cartsDone' },
    gate: 'villageGate', waves: false, retire: true, hush: true, heal: 0.3, morale: 0.15, limit: { z: null },
    banner: { html: '<em>村門</em> 守住！', en: 'The gate held — the carts are through', dur: 180 },
    obj: { zh: '上山頂廟', en: 'Take the shrine hill', go: ['shrine', 0, -0.6] },
    say: [
      { who: 'siume', zh: '角叔，我搵到條路。舊碼頭，今晚。', en: 'Uncle Gok, I\'ve found a way. The old pier. Tonight.' },
      { who: 'gok', zh: '你幾時學識用把剪咁打交？', en: 'When did you learn to fight with shears?' },
      { who: 'siume', zh: '剪咗成世羊毛，總有啲用。', en: 'A lifetime of shearing had to be good for something.' },
    ],
  },
  // ---- 山頂廟: the signal lantern
  {
    when: { zone: 'shrine' },
    squads: [{ at: ['shrine', -0.5, -0.1], n: 18, charge: true }, { at: ['shrine', 0.5, 0.1], n: 18, charge: true }, { at: ['shrine', 0, 0.6], n: 16 }],
    obj: { zh: '點起訊號燈', en: 'Light the signal lantern', go: ['shrine', 0, 0.1] },
    say: [
      { who: 'siume', zh: '燈一點，就冇得回頭。', en: 'Once this is lit, there\'s no turning back.' },
      { who: 'gok', zh: '本來就冇打算回頭。', en: 'Never planned to.' },
    ],
  },
  { when: [{ at: ['shrine', 0, 0.02], kos: 20 }, { at: ['shrine', 0, 0.02], wait: 20 * 60 }], cue: 'light' },
  {
    when: { flag: 'lit' },
    win: true, waves: false, morale: 1,
    banner: { html: '<em>訊號燈</em> 點起！', en: 'The signal lantern is lit!', dur: 260, big: true },
    say: [{ who: 'twelve', zh: '燈著咗⋯⋯今晚，我哋行。', en: 'The lantern\'s lit... Tonight, we go.' }],
  },
];

// ---- scroll (Scroll Cutscenes page, CH1)
export const MAP = SHEEP_MAP;
export const PROLOGUE = [
  { cols: ['海中間有個島', '叫做羊村', '世代剪毛打魚'], en: 'An island in the middle of the sea: Sheep Village. For generations the flock sheared wool and fished.',
    show: ['island', 'pier'], focus: [800, 480, 1.05] },
  { cols: ['狼群坐船嚟到', '話係保護大家', '一住就唔走'], en: 'Wolves came by ship, said they were there to protect everyone, and never left.',
    show: ['wolf1'], focus: [900, 380, 1.15] },
  { cols: ['宵禁 搜屋', '唔准唱舊歌', '出聲就唔見咗'], en: 'Curfew. House searches. No singing the old songs. Sheep who spoke up disappeared.',
    show: ['posts'], focus: [740, 560, 1.3] },
  { cols: ['十二隻後生羊', '決定唔再等', '要過霧海'], en: 'Twelve young sheep decided not to wait. They would cross the fog sea.',
    show: ['twelve', 'route', 'fogsea'], focus: [980, 420, 1.0] },
  { cols: ['角叔揸起牧杖', '你哋行', '我送'], en: 'Uncle Gok picked up his crook. "You go. I\'ll see you off."',
    show: ['gok'], focus: [700, 640, 1.35] },
  { cols: ['剪毛節嗰日', '狼群衝上山坡', '話要搜禁書'], en: 'On shearing-festival day, the wolves stormed the hillside to search for forbidden books.',
    show: ['wolf2', 'pasture', 'grey'], focus: [640, 740, 1.4] },
];
export const STAMP = { small: '第一章', big: '羊村牧場', seal: '剪毛節', en: 'CHAPTER I · THE SHEEP VILLAGE PASTURE' };
export const EPILOGUE = {
  zh: ['訊號燈喺山頂亮起。', '村入面，十二隻後生羊各自望住嗰盞燈，收拾好包袱。'],
  en: ['The signal lantern burned on the hilltop.', 'Across the village, twelve young sheep looked up at it and packed their bundles.'],
};
export const DEFEAT = { zh: '{name}力戰不支，羊群未能走脫⋯⋯', en: '{name} falls at last, and the flock is caught on the hillside...' };

// ---- script: the carts, the barn collapse, the lantern
const CART_PATH = [[-34, -46], [-36, -30], [-20, -13], [0, -6], [0, 6], [-8, 20], [-14, 30]];
const DETOUR = [[-6, -68], [-30, -64], [-38, -42], [-32, -20], [-8, -11]];
const HOLD = 90 * 60;
export function script(game, api) {
  const fx = { carts: [0, 1, 2, 3, 4, 5].map(() => ({ x: 0, z: 0, yaw: 0, on: false, lost: false })), lantern: false, safe: 0, lost: 0 };
  let cartsT = -1, collapsed = false, dk = -1;
  const detour = () => api.objective({ zh: '搵另一條路', en: 'Find another way round the barns', go: DETOUR[dk] });
  const along = (u) => {                                          // point + heading at u ∈ [0, 1] along CART_PATH
    const n = CART_PATH.length - 1, f = Math.min(n - 1e-6, Math.max(0, u * n)), i = Math.floor(f), k = f - i;
    const [ax, az] = CART_PATH[i], [bx, bz] = CART_PATH[i + 1];
    return [ax + (bx - ax) * k, az + (bz - az) * k, Math.atan2(bx - ax, bz - az)];
  };
  return {
    fx,
    cue(name) {
      if (name === 'collapse' && !collapsed) { collapsed = true; api.gate('barnLane', false); dk = game.hero.z > -38 ? DETOUR.length : 0; if (dk < DETOUR.length) detour(); }
      if (name === 'carts' && cartsT < 0) cartsT = api.t();
      if (name === 'light') {
        if (fx.safe < 4) { api.lose(); return; }                   // < 60 % of the carts through: the flock is caught
        fx.lantern = true; api.flag('lit', true);
      }
    },
    step() {
      const h = game.hero;
      if (dk >= 0 && dk < DETOUR.length && cartsT < 0) {             // the detour: next waypoint once within 5 m (or past the beam)
        const [x, z] = DETOUR[dk];
        if (Math.hypot(h.x - x, h.z - z) < 5 || (h.z > -38 && dk < 3)) { dk = h.z > -38 ? Math.max(dk + 1, 4) : dk + 1; if (dk < DETOUR.length) detour(); }
      }
      if (cartsT < 0) return;
      const k = api.t() - cartsT;
      fx.carts.forEach((cart, j) => {                                // cart j leaves at 8 + 13 s·j, 10 s to cross, passes the gate at 60 %
        const u = (k - 480 - j * 780) / 600;
        cart.on = u >= 0 && u <= 1 && !cart.lost;
        if (u < 0 || cart.done) return;
        [cart.x, cart.z, cart.yaw] = along(Math.min(1, u));
        if (!cart.checked && u >= 0.6) {                           // at the gate: lost if nobody holds the gateway
          cart.checked = true;
          if (Math.hypot(h.x, h.z - 0.5) > 20) { cart.lost = true; fx.lost++; } else fx.safe++;
        }
        if (u >= 1) cart.done = true;
      });
      if (k === HOLD) api.flag('cartsDone', true);                  // 90 s: the hold is over
    },
  };
}
