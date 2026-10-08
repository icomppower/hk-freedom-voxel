#!/usr/bin/env node
// Batch voice-over for 香港自由戰士 · Voxel via the Gemini TTS API (same voices as AI Studio → Generate speech).
// One request per line → public/vo/<file>.wav, already trimmed and peak-normalised to −1 dBFS.
// Lines live in tools/vo/lines.json (mirror of the Notion page "Voice Lines — AI Studio TTS (dialogue 粵語)").
//
//   GEMINI_API_KEY=... node tools/vo/generate.mjs              # generate whatever is missing
//   node tools/vo/generate.mjs --only siumei                   # files whose name contains "siumei"
//   node tools/vo/generate.mjs --only vo_777_rage --force      # redo one take
//   node tools/vo/generate.mjs --dry                           # print the requests, call nothing
//   flags: --force  --with-optional  --out <dir>  --model <id>  --jobs <n>
//
// Render-only asset: never touches sim state, no SIM_VERSION bump. Node ≥ 22, no dependencies.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };

const MODEL = opt('model', process.env.VO_MODEL || 'gemini-3.8-flash-tts');
const OUT = opt('out', join(HERE, '../../public/vo'));
const ONLY = opt('only', '');
const JOBS = Number(opt('jobs', 3));
const KEY = process.env.GEMINI_API_KEY;
const URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

const spec = JSON.parse(await readFile(join(HERE, 'lines.json'), 'utf8'));
const styleOf = (who, note) => [spec.lang, spec.cast[who].style, note].filter(Boolean).join('. ');

// ---- requests -------------------------------------------------------------------------------------------------
function single(l) {
  return {
    model: MODEL,
    input: [{ type: 'user_input', content: [{ type: 'text', text: l.zh,
      annotations: [{ type: 'speech_metadata', style: styleOf(l.who, l.note) }] }] }],
    response_format: { type: 'audio' },
    generation_config: { speech_config: [{ voice: spec.cast[l.who].voice }] },
  };
}
function dialog(d) {
  const who = [...new Set(d.turns.map((t) => t.who))];
  if (who.length > 2) throw new Error(`${d.file}: multi-speaker allows 2 speakers`);
  return {
    model: MODEL,
    input: [{ type: 'user_input', content: d.turns.map((t) => ({ type: 'text', text: t.zh,
      annotations: [{ type: 'speech_metadata', speaker: t.who, style: styleOf(t.who, t.note) }] })) }],
    response_format: { type: 'audio' },
    generation_config: { speech_config: { mode: 'conversational',
      speakers: who.map((w) => ({ speaker: w, voice: spec.cast[w].voice })) } },
  };
}

async function call(body, tries = 5) {
  for (let i = 0; ; i++) {
    const r = await fetch(URL, { method: 'POST', headers: { 'x-goog-api-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify(body) });
    if (r.ok) {
      const j = await r.json();
      const audio = (j.steps || []).filter((s) => s.type === 'model_output')
        .flatMap((s) => s.content || []).filter((c) => c.type === 'audio').pop();
      if (!audio?.data) throw new Error(`no audio in response: ${JSON.stringify(j).slice(0, 300)}`);
      return Buffer.from(audio.data, 'base64');
    }
    const msg = (await r.text()).slice(0, 300);
    if ((r.status === 429 || r.status >= 500) && i < tries - 1) {
      const wait = 2000 * 2 ** i; console.warn(`  ${r.status}, retry in ${wait / 1000}s`);
      await new Promise((res) => setTimeout(res, wait)); continue;
    }
    throw new Error(`HTTP ${r.status}: ${msg}`);
  }
}

// ---- audio: WAV in → trim + normalise → WAV out (24 kHz mono 16-bit) -------------------------------------------
function pcmOf(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return { pcm: buf, rate: 24000 }; // raw l16
  const rate = buf.readUInt32LE(24);
  for (let p = 12; p + 8 <= buf.length;) {
    const id = buf.toString('ascii', p, p + 4), len = buf.readUInt32LE(p + 4);
    if (id === 'data') return { pcm: buf.subarray(p + 8, p + 8 + len), rate };
    p += 8 + len + (len & 1);
  }
  throw new Error('WAV without data chunk');
}
function master(pcm, rate) {
  const s = new Int16Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + (pcm.length & ~1)));
  const thr = 0.01 * 32768, pad = Math.round(0.06 * rate);
  let a = 0, b = s.length - 1;
  while (a < s.length && Math.abs(s[a]) < thr) a++;
  while (b > a && Math.abs(s[b]) < thr) b--;
  const cut = s.slice(Math.max(0, a - pad), Math.min(s.length, b + pad + 1));
  let peak = 1; for (const v of cut) peak = Math.max(peak, Math.abs(v));
  const g = (32767 * 10 ** (-1 / 20)) / peak; // peak → −1 dBFS
  for (let i = 0; i < cut.length; i++) cut[i] = Math.round(cut[i] * g);
  const head = Buffer.alloc(44), data = Buffer.from(cut.buffer);
  head.write('RIFF', 0); head.writeUInt32LE(36 + data.length, 4); head.write('WAVEfmt ', 8);
  head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22); head.writeUInt32LE(rate, 24);
  head.writeUInt32LE(rate * 2, 28); head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34);
  head.write('data', 36); head.writeUInt32LE(data.length, 40);
  return { wav: Buffer.concat([head, data]), sec: cut.length / rate, gainDb: 20 * Math.log10(g) };
}

// ---- run ------------------------------------------------------------------------------------------------------
const jobs = [
  ...spec.lines.filter((l) => !l.optional || flag('with-optional')).map((l) => ({ file: l.file, label: `${l.who}: ${l.zh}`, body: () => single(l) })),
  ...spec.dialogs.map((d) => ({ file: d.file, label: d.turns.map((t) => `${t.who}: ${t.zh}`).join(' / '), body: () => dialog(d) })),
].filter((j) => !ONLY || j.file.includes(ONLY));

for (const l of [...spec.lines, ...spec.dialogs.flatMap((d) => d.turns)])
  if (!spec.cast[l.who]) { console.error(`unknown speaker "${l.who}" in lines.json`); process.exit(1); }
if (flag('dry')) { for (const j of jobs) console.log(j.file, JSON.stringify(j.body())); process.exit(0); }
if (!KEY) { console.error('Set GEMINI_API_KEY (AI Studio → Get API key).'); process.exit(1); }
await mkdir(OUT, { recursive: true });

const exists = async (p) => access(p).then(() => true, () => false);
let ok = 0, skip = 0, fail = 0;
const queue = [...jobs];
await Promise.all(Array.from({ length: JOBS }, async () => {
  for (let j; (j = queue.shift());) {
    const path = join(OUT, `${j.file}.wav`);
    if (!flag('force') && await exists(path)) { skip++; continue; }
    try {
      const { pcm, rate } = pcmOf(await call(j.body()));
      const { wav, sec, gainDb } = master(pcm, rate);
      await writeFile(path, wav); ok++;
      console.log(`✓ ${j.file}.wav  ${sec.toFixed(2)} s  gain ${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)} dB  ${j.label}`);
    } catch (e) { fail++; console.error(`✗ ${j.file}: ${e.message}`); }
  }
}));
console.log(`\n${ok} made · ${skip} already there (--force to redo) · ${fail} failed · model ${MODEL} → ${OUT}`);
console.log('Listen before committing: the model can drift to Mandarin. Redo a bad take with --only <file> --force.');
process.exit(fail ? 1 : 0);
