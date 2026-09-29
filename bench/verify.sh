#!/bin/sh
# All gates, in order (stops at the first failure). Needs `npm install` (playwright-core) and Chrome.
#   sh bench/verify.sh [--quick]   (--quick: skip the real-time Chrome runs)
cd "$(dirname "$0")/.."
N="node --import ./bench/harness/register.mjs --no-warnings"
# run a gate, print its last line; on a non-zero exit print its tail and stop (sh has no pipefail)
g() { out=$("$@" 2>&1); rc=$?; if [ $rc -ne 0 ]; then echo "$out" | tail -5; echo "GATE FAILED: $*"; exit 1; fi; echo "$out" | tail -1; }
echo "== ch1 hash gate (Node)";      g $N bench/harness/check.mjs
echo "== rig / dual-wield probes";   g $N bench/harness/rigprobe.mjs; g $N bench/harness/dualprobe.mjs
echo "== character gates";           g $N bench/chars/gates.mjs gok; g $N bench/chars/gates.mjs siume
echo "== boss gate";                 g $N bench/chars/boss.mjs gok
for ch in sheep1 sheep2 sheep3; do
  echo "== $ch: map gate + bot (both officers)"
  g $N bench/maps/mapcheck.mjs $ch gok; g $N bench/maps/mapcheck.mjs $ch siume
  for c in gok siume; do for st in steady rush back; do g $N bench/bot/run.mjs --char $c --chapter $ch --style $st --quiet; done; done
done
echo "== ch1 bot (upstream chapter, informational)"; $N bench/bot/run.mjs --char zhaoyun --quiet 2>&1 | tail -1
[ "$1" = "--quick" ] && { echo "QUICK GATES GREEN"; exit 0; }
echo "== Chrome: crowd skins, scrolls, flow"
g node bench/harness/crowdprobe.mjs ch1; g node bench/harness/skin-test.mjs
g node bench/harness/shots-scroll.mjs ch1; g node bench/harness/scroll-flow.mjs sheep3
echo "== Chrome: ch1 checkpoints";   g node bench/harness/xcheck.mjs ch1-zhaoyun 3600; g node bench/harness/xcheck.mjs ch1-huangzhong 3600
echo "== Chrome: frame time";        g node bench/maps/perfmap.mjs sheep1 sheep3
echo "ALL GATES GREEN"
