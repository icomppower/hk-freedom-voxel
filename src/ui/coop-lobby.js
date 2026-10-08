// Online co-op screens (only with ?coop, src/net/page.js): the lobby (flow state 'coop', #coop) and the battle overlay
// (#coop-hud). Own CSS (injected once), px-sized with ≥ 44 px targets: fits 844×390 landscape and 390-wide portrait.
//   menu    Quick Match · Create Room · Join (4-letter code) · your name · Back
//   queue   searching (n waiting) · Cancel
//   room    code + Copy Link · both players (name, 龍仔 / 小美 — one each, ⇄ swaps) · chapter (room creator picks, hk1 …
//           hk4 in campaign order: hk1 hk7 hk2 hk3 hk6 hk4) · live ping · Ready × 2 → the room starts (seed, chapter, slots) · Leave
// Errors: room full · no such room · server busy, try later (create refused, socket refused: the Free plan's daily quota).
// Overlay: the partner's name + HP (down: 30 s count, reviving: ring), banners (waiting for partner, partner reconnecting /
// on autoplay / paused, desync at tick N, re-simulating), the 救 revive button (hold, or F), ?coopdebug readout.
import { CHARS } from '../chars/index.js';
import { CHAPTERS, CHAPTER_ORDER } from '../story/chapters.js';
import { inkWipe, createNav, sfx } from './menu.js';
import { COOP } from '../net/coopsim.js';

const CSS = `
/* the 5th title item (網上合作): the menu packs tighter so 致敬 still fits a 390 px-tall phone */
#title .t-main { gap: 0; margin-top: 1.2rem; }
#title .t-main button { padding-top: .25rem; padding-bottom: .6rem; min-height: 44px; box-sizing: border-box; }
#coop:not([hidden]) { display: flex; }
#coop { align-items: center; justify-content: center; padding: 12px 16px; box-sizing: border-box;
  background: radial-gradient(ellipse at 50% 40%, rgba(20,14,10,.78), rgba(8,5,4,.94)); overflow-y: auto; }
#coop .cp { width: min(560px, 100%); max-height: 100%; display: flex; flex-direction: column; gap: 10px; color: #f4ead8; font: 600 15px/1.3 var(--sans); }
#coop h2 { margin: 0; font: 700 30px/1.1 var(--brush); letter-spacing: 4px; color: #f4ead8; }
#coop h2 small, #coop .lbl small { display: block; font: 600 11px/1.2 var(--sans); letter-spacing: .18em; color: #b9a888; margin-top: 3px; }
#coop .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: stretch; }
#coop button, #coop input { min-height: 44px; box-sizing: border-box; border-radius: 6px; font: 700 17px/1.1 var(--kai); }
#coop button { flex: 1 1 140px; padding: 6px 12px; color: #f4ead8; background: rgba(0,0,0,.45); border: 2px solid rgba(239,227,207,.55); cursor: pointer; }
#coop button small { display: block; font: 600 10px/1.2 var(--sans); letter-spacing: .14em; color: #d8c8a8; margin-top: 2px; }
#coop button.pri { background: #b3261e; border-color: #e8b04a; }
#coop button.on { background: #2c6a48; border-color: #f2c14e; }
#coop button:disabled { opacity: .45; cursor: default; }
#coop button:focus-visible { outline: 3px solid #f2c14e; outline-offset: 1px; }
#coop input { flex: 1 1 120px; min-width: 0; padding: 6px 10px; color: #1b120c; background: #f4ead8; border: 2px solid #e8b04a; text-transform: uppercase; letter-spacing: .3em; }
#coop input.nm { text-transform: none; letter-spacing: 0; font-family: var(--sans); }
#coop .lbl { font: 700 15px/1.2 var(--kai); color: #f4ead8; align-self: center; flex: 0 0 auto; }
#coop .code { font: 700 34px/1 var(--sans); letter-spacing: .3em; color: #f2c14e; align-self: center; }
#coop .pl { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
#coop .card { padding: 8px 10px; border-radius: 6px; background: rgba(0,0,0,.4); border: 2px solid rgba(239,227,207,.25); min-height: 44px; }
#coop .card.me { border-color: #f2c14e; }
#coop .card b { display: block; font: 700 22px/1.1 var(--brush); }
#coop .card i { font-style: normal; font-size: 12px; color: #b9a888; }
#coop .card .rd { color: #7ddc9a; }
#coop .err { padding: 8px 10px; border-radius: 6px; background: rgba(179,38,30,.85); font: 700 15px/1.3 var(--kai); }
#coop .msg { font: 600 14px/1.3 var(--sans); color: #d8c8a8; }
#coop .chap { display: flex; gap: 8px; align-items: stretch; }
#coop .chap .nm2 { flex: 1 1 auto; text-align: center; align-self: center; font: 700 20px/1.1 var(--brush); }
#coop .chap .nm2 small { display: block; font: 600 10px/1.2 var(--sans); letter-spacing: .14em; color: #b9a888; }
#coop .chap button { flex: 0 0 52px; }
@media (max-height: 430px) { #coop h2 { font-size: 24px; } #coop .code { font-size: 26px; } #coop .cp { gap: 7px; } #coop .card b { font-size: 18px; } }
#coop-hud { position: fixed; inset: 0; pointer-events: none; z-index: 2; font: 600 13px/1.25 var(--sans); color: #f4ead8; text-shadow: 0 1px 3px #000; }
#coop-hud .ph { position: absolute; left: 50%; top: 6px; translate: -50% 0; min-width: 160px; padding: 4px 10px; border-radius: 6px; background: rgba(0,0,0,.45); text-align: center; }
#coop-hud .ph b { font: 700 15px/1.1 var(--kai); }
#coop-hud .ph .hp { height: 6px; margin-top: 3px; background: rgba(0,0,0,.6); border-radius: 3px; overflow: hidden; }
#coop-hud .ph .hp i { display: block; height: 100%; background: #7ddc9a; transform-origin: 0 50%; }
#coop-hud .ph.down .hp i { background: #b3261e; }
#coop-hud .bn { position: absolute; left: 50%; top: 34%; translate: -50% 0; max-width: 90vw; padding: 8px 16px; border-radius: 8px; background: rgba(0,0,0,.66); font: 700 20px/1.25 var(--kai); text-align: center; }
#coop-hud .bn small { display: block; font: 600 12px/1.3 var(--sans); letter-spacing: .08em; color: #d8c8a8; }
#coop-hud .bn button { pointer-events: auto; margin-top: 8px; min-height: 44px; padding: 6px 14px; font: 700 15px/1 var(--kai); color: #f4ead8; background: #b3261e; border: 2px solid #e8b04a; border-radius: 6px; }
#coop-hud .rv { position: absolute; right: max(16px, 22vw); bottom: max(16px, 32vh); width: 64px; height: 64px; border-radius: 50%; pointer-events: auto; touch-action: none;
  font: 700 26px/1 var(--brush); color: #fff; background: rgba(44,106,72,.85); border: 3px solid #f2c14e; }
#coop-hud .rv small { display: block; font: 600 9px/1 var(--sans); letter-spacing: .1em; }
#coop-hud .dbg { position: absolute; left: 6px; bottom: 6px; margin: 0; padding: 4px 6px; font: 11px/1.3 monospace; color: #0f0; background: rgba(0,0,0,.7); white-space: pre; }
`;
let styled = false;
export function style() { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.append(s); }

const ERR = {
  full: ['房間已滿', 'Room full — two players already'],
  not_found: ['找不到房間', 'No room with that code'],
  busy: ['伺服器繁忙，請稍後再試', 'Server busy — try later'],
  closed: ['房間已關閉', 'The room closed'],
  expired: ['配對逾時', 'No partner found in 2 min — try again'],
  version: ['版本不同 — 兩部機都請重新載入', 'Your partner runs a different game version — both reload the page'],
  stale: ['有新版本 — 請重新載入', 'A new version is out — reload before playing online'],
};

export function createCoopLobby(el, flow, coop) {
  style();
  const C = coop.C;
  let mode = 'menu', joinCode = '';
  const html = () => {
    const S = C.S, vbad = !!S?.verMismatch?.(), ek = vbad ? 'version' : C.stale ? 'stale' : C.error, err = ek && ERR[ek];
    const E = err ? `<div class="err">${err[0]}<br><small>${err[1]}</small>${vbad || C.stale ? '<br><button data-a="reload" class="pri">重新載入<small>RELOAD</small></button>' : ''}</div>` : '';
    if (S && S.phase === 'queue') {
      return `<h2>快速配對<small>QUICK MATCH</small></h2><div class="msg">搜尋隊友中… Searching for a partner${C.queueN ? ` (${C.queueN} waiting)` : ''}</div>
        <div class="row"><button data-a="cancel">取消<small>CANCEL</small></button></div>`;
    }
    if (S && (S.phase === 'joining' || (S.phase === 'lobby' && !S.lobbyMsg))) {
      return `<h2>連線中<small>CONNECTING · ${S.code || ''}</small></h2><div class="msg">${C.status === 'reconnecting' ? '重新連線… Reconnecting' : '加入房間… Joining the room'}</div>
        <div class="row"><button data-a="leave">離開<small>LEAVE</small></button></div>`;
    }
    if (S && S.phase === 'lobby' && S.lobbyMsg) {
      const m = S.lobbyMsg, you = S.you, host = m.host === you, me = m.players[you];
      const ci = CHAPTER_ORDER.indexOf(m.chapter), ch = CHAPTERS[m.chapter];
      const card = (p, k) => p ? `<div class="card${k === you ? ' me' : ''}" data-k="${k}"><b>${CHARS[p.pick]?.name.zh ?? '—'}</b>${esc(p.name)}${k === you ? ' (你 you)' : ''}${p.bot ? ' 🤖' : ''}<br>
        <i class="${p.ready ? 'rd' : ''}">${p.ready ? '準備好 READY' : p.on ? '未準備 not ready' : '離線 offline'}</i></div>`
        : `<div class="card" data-k="${k}"><b>…</b><i>等待隊友 waiting for a partner</i></div>`;
      const alone = !m.players[1 - you];
      return `<div class="row"><h2>房間<small>${m.kind === 'quick' ? 'QUICK MATCH ROOM' : 'PRIVATE ROOM'}</small></h2><span class="code">${S.code}</span>
          ${m.kind !== 'quick' ? '<button data-a="copy" style="flex:0 1 150px">複製連結<small>COPY LINK</small></button>' : ''}</div>
        ${E}<div class="pl">${card(m.players[0], 0)}${card(m.players[1], 1)}</div>
        <div class="chap"><button data-a="ch-" ${host && ci > 0 ? '' : 'disabled'} aria-label="previous chapter">◀</button>
          <div class="nm2">${ch.title.small} ${ch.title.zh}<small>${ch.title.en}${host ? '' : ' · 房主選擇 host picks'}</small></div>
          <button data-a="ch+" ${host && ci < CHAPTER_ORDER.length - 1 ? '' : 'disabled'} aria-label="next chapter">▶</button></div>
        <div class="row"><button data-a="swap">換角色 ⇄<small>SWAP CHARACTERS</small></button>
          <button data-a="ready" class="${me?.ready ? 'on' : 'pri'}" ${alone || vbad ? 'disabled' : ''}>${me?.ready ? '已準備' : '準備'}<small>${me?.ready ? 'READY ✓ (tap to cancel)' : 'READY'}</small></button></div>
        <div class="row">${alone && host && BOT ? '<button data-a="bot">加入電腦<small>ADD BOT (?coopbot)</small></button>' : ''}
          <button data-a="leave">離開<small>LEAVE</small></button></div>
        <div class="msg">延遲 ping ${Math.round(S.rtt())} ms</div>`;
    }
    if (mode === 'join') {
      return `<h2>加入房間<small>JOIN A ROOM</small></h2>${E}
        <div class="row"><input class="code-in" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD" value="${joinCode}" aria-label="room code">
          <button data-a="join-go" class="pri">加入<small>JOIN</small></button></div>
        <div class="row"><button data-a="back-menu">返回<small>BACK</small></button></div>`;
    }
    return `<h2>網上合作<small>ONLINE CO-OP · 2 PLAYERS</small></h2>${E}
      <div class="row"><span class="lbl">名字<small>NAME</small></span><input class="nm" maxlength="16" value="${esc(coop.name)}" aria-label="your name"></div>
      <div class="row"><button data-a="quick" class="pri">快速配對<small>QUICK MATCH</small></button><button data-a="create">建立房間<small>CREATE ROOM</small></button></div>
      <div class="row"><button data-a="join">輸入房號<small>JOIN WITH A CODE</small></button><button data-a="title">返回<small>BACK TO TITLE</small></button></div>`;
  };
  const BOT = new URLSearchParams(location.search).has('coopbot');
  const wrap = document.createElement('div'); wrap.className = 'cp'; el.append(wrap);
  let last = '';
  const refresh = () => {
    if (el.hidden) return;
    const h = html();
    if (h === last) return;
    const focusCode = document.activeElement?.classList.contains('code-in');
    last = h; wrap.innerHTML = h;
    const ci = wrap.querySelector('.code-in');
    if (ci) { ci.addEventListener('input', () => { joinCode = ci.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); }); if (focusCode || mode === 'join') ci.focus(); }
    const nm = wrap.querySelector('.nm');
    if (nm) nm.addEventListener('change', () => coop.setName(nm.value));
  };
  const act = (a) => {
    const S = C.S, m = S?.lobbyMsg;
    sfx(a === 'title' || a === 'leave' || a === 'cancel' || a === 'back-menu' ? 'back' : 'ok');
    const nm = wrap.querySelector('.nm'); if (nm) coop.setName(nm.value);
    switch (a) {
      case 'quick': coop.quick(); break;
      case 'create': coop.create(); break;
      case 'reload': location.reload(); break;
      case 'join': mode = 'join'; C.error = null; break;
      case 'join-go': if (/^[A-Z]{4}$/.test(joinCode)) { mode = 'menu'; coop.join(joinCode); } else C.error = 'not_found'; break;
      case 'back-menu': mode = 'menu'; C.error = null; break;
      case 'cancel': coop.cancel(); break;
      case 'leave': coop.leave(); mode = 'menu'; break;
      case 'title': inkWipe(() => flow.go('title')); return;
      case 'copy': {
        const u = coop.link();
        (navigator.clipboard?.writeText(u) ?? Promise.reject()).then(() => toast('已複製 Link copied'), () => prompt('Copy this link', u));
        return;
      }
      case 'swap': S?.swap(); break;
      case 'ready': S?.ready(!m?.players[S.you]?.ready); break;
      case 'ch-': case 'ch+': { const i = CHAPTER_ORDER.indexOf(m.chapter) + (a === 'ch+' ? 1 : -1); if (CHAPTER_ORDER[i]) S.chapter(CHAPTER_ORDER[i]); break; }
      case 'bot': S?.bot(true); break;
    }
    last = ''; refresh();
  };
  wrap.addEventListener('click', (e) => { const b = e.target.closest('button[data-a]'); if (b && !b.disabled) act(b.dataset.a); });
  wrap.addEventListener('keydown', (e) => { if (e.code === 'Enter' && e.target.classList.contains('code-in')) { e.preventDefault(); act('join-go'); } });
  const toast = (t) => { const d = document.createElement('div'); d.className = 'msg'; d.textContent = t; wrap.append(d); setTimeout(() => d.remove(), 1600); };
  const nav = createNav({
    move: (d) => { if (document.activeElement?.tagName === 'INPUT') return; const bs = [...wrap.querySelectorAll('button:not(:disabled)')], i = bs.indexOf(document.activeElement); bs[(i + d + bs.length) % bs.length]?.focus(); },
    ok: () => { const b = document.activeElement?.closest?.('button[data-a]'); if (b) b.click(); },
    back: () => { if (C.S) act(C.S.phase === 'queue' ? 'cancel' : 'leave'); else if (mode === 'join') act('back-menu'); else act('title'); },
  });
  let tick = 0;
  return {
    enter(c = {}) {
      last = ''; mode = 'menu'; nav.start();
      if (c.join) { coop.join(c.join); }
      refresh();
      clearInterval(tick); tick = setInterval(refresh, 500);              // ping / queue count
    },
    exit() { nav.stop(); clearInterval(tick); },
    refresh() { refresh(); },
  };
}
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---------------------------------------------------------------- battle overlay
const BANNER = {
  waiting: ['等待隊友…', 'Waiting for partner'],
  left: ['隊友斷線，重新連線中…', 'Partner reconnecting — their hero switches to autoplay after 60 s'],
  bot: ['隊友角色由電腦操控', "Partner's hero on autoplay"],
  back: ['隊友回來了', 'Partner is back'],
  paused: ['隊友暫停了遊戲', 'Paused by your partner'],
  reconnecting: ['重新連線中…', 'Reconnecting to the room'],
  resim: ['重新同步中…', 'Re-simulating the battle'],
  desync: ['不同步', 'Desync — a report was sent'],
  'room-closed': ['房間已關閉', 'The room closed'],
};
export function createCoopOverlay(C, { revive }) {
  style();
  const el = document.createElement('div'); el.id = 'coop-hud'; el.hidden = true;
  el.innerHTML = `<div class="ph"><b></b><div class="hp"><i></i></div><small class="st"></small></div><div class="bn" hidden></div>
    <button class="rv" hidden aria-label="revive">救<small>HOLD · F</small></button>${new URLSearchParams(location.search).has('coopdebug') ? '<pre class="dbg"></pre>' : ''}`;
  document.body.append(el);
  const ph = el.querySelector('.ph'), nameEl = ph.querySelector('b'), hpI = ph.querySelector('.hp i'), st = ph.querySelector('.st');
  const bn = el.querySelector('.bn'), rv = el.querySelector('.rv'), dbg = el.querySelector('.dbg');
  const hold = (v) => (e) => { e.preventDefault(); revive(v); rv.style.background = v ? '#f2c14e' : ''; };
  rv.addEventListener('pointerdown', hold(true)); rv.addEventListener('pointerup', hold(false)); rv.addEventListener('pointercancel', hold(false)); rv.addEventListener('pointerleave', hold(false));
  let fixed = null, flash = null, flashT = 0, lastDbg = 0;
  const show = (k, extra = '') => {
    const b = BANNER[k];
    const h = b ? `${b[0]}${extra}<small>${b[1]}</small>` : '';
    if (bn.dataset.h !== h) { bn.dataset.h = h; bn.innerHTML = h; }
    bn.hidden = !h;
  };
  return {
    banner(k, a, b) {
      if (k === 'desync') { fixed = ['desync', ` @ tick ${a}${b ? ` · 房號 room ${b}` : ''}`]; return; }
      if (k === 'resim') { flash = ['resim', ` ${a} / ${b}`]; flashT = performance.now() + 300; return; }
      fixed = [k, ''];
    },
    flashKey(k) { flash = [k, '']; flashT = performance.now() + 3000; },
    event(k, i, both) {
      const you = C.you === i;
      const t = k === 'down' ? (you ? '你倒下了 — 等隊友救援 (F)' : '隊友倒下了 — 走近按住 救 / F') : k === 'revive' ? (you ? '隊友救起了你' : '已救起隊友') : both ? '兩人倒下 — 回到上一道關卡' : (you ? '你在關卡重生' : '隊友在關卡重生');
      flash = ['x', '']; flashT = performance.now() + 2200; bn.dataset.h = t; bn.innerHTML = t; bn.hidden = false;
    },
    update(game, C2) {
      el.hidden = !C.inBattle;
      if (!C.inBattle || !game.heroes) return;
      const S = C.S, p = game.heroes[1 - C.you], me = game.heroes[C.you], K = game.coop;
      nameEl.textContent = C.partner || '隊友';
      hpI.style.transform = `scaleX(${Math.max(0, p.hp / p.hpMax).toFixed(3)})`;
      ph.classList.toggle('down', !!p.dead);
      const rt = K.reviveT[C.you] / COOP.reviveF, rtP = K.reviveT[1 - C.you] / COOP.reviveF;
      st.textContent = p.dead ? `倒下 DOWN ${Math.max(0, Math.ceil((COOP.downF - (game.frame - K.downAt[1 - C.you])) / 60))} s${rt ? ` · 救援 ${Math.round(rt * 100)} %` : ''}`
        : me.dead ? `你倒下 YOU'RE DOWN ${Math.max(0, Math.ceil((COOP.downF - (game.frame - K.downAt[C.you])) / 60))} s${rtP ? ` · 救援 ${Math.round(rtP * 100)} %` : ''}` : '';
      rv.hidden = !(p.dead && !me.dead);
      // banners: a fixed one (desync / room closed) wins; then flashes; then live states
      const now = performance.now();
      if (fixed && (fixed[0] === 'desync' || fixed[0] === 'room-closed')) show(...fixed);
      else if (flash && now < flashT) { if (flash[0] !== 'x') show(...flash); }
      else {
        flash = null;
        const paused = S?.frames[S.simT - 1]?.[1 - C.you]?.[5] & 128;
        const k = C.status === 'reconnecting' ? 'reconnecting' : C.status === 'partner-left' && S?.partnerGone ? 'left'
          : paused ? 'paused' : C.waitingSince && now - C.waitingSince > 400 ? 'waiting' : null;
        show(k);
      }
      if (dbg && now - lastDbg > 250) {
        lastDbg = now;
        const s = S?.stats || {}, lh = s.lastHash;
        dbg.textContent = `rtt ${Math.round(S?.rtt() ?? 0)} ms · D ${S?.D} · tick ${S?.simT} · queue ${S?.depth()} · stalls ${s.stalls} (${(100 * s.stalls / Math.max(1, s.stalls + s.steps)).toFixed(1)} %)\n` +
          `hash ${lh ? `${lh[0]} ${lh[1]}` : '-'} · msgs ${S?.sock?.msgs ?? 0} (${C2 && C2.mpm ? C2.mpm() : '-'} /min) · you ${C.you} · ${C.status}\nteam: ${C.teamStatus?.() ?? '-'}`;
      }
    },
  };
}
