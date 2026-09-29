#!/bin/sh
# All gates, in order (stops at the first failure). Needs `npm install` (playwright-core) and Chrome.
#   sh bench/verify.sh [--quick]   (--quick: skip the real-time Chrome runs)
cd "$(dirname "$0")/.."
N="node --import ./bench/harness/register.mjs --no-warnings"
# run a gate, print its last line; on a non-zero exit print its tail and stop (sh has no pipefail)
g() { out=$("$@" 2>&1); rc=$?; if [ $rc -ne 0 ]; then echo "$out" | tail -5; echo "GATE FAILED: $*"; exit 1; fi; echo "$out" | tail -1; }
echo "== ch1 hash gate (Node)";      g $N bench/harness/check.mjs
echo "== rig / dual-wield probes";   g $N bench/harness/rigprobe.mjs; g $N bench/harness/dualprobe.mjs
echo "== ch1 bot (?dev chapter)";    g $N bench/bot/run.mjs --char zhaoyun --quiet
[ "$1" = "--quick" ] && { echo "QUICK GATES GREEN"; exit 0; }
echo "== Chrome: boot, scrolls";     g node bench/harness/smoke.mjs "?x" 4; g node bench/harness/shots-scroll.mjs ch1
echo "== Chrome: crowd";             g node bench/harness/crowdprobe.mjs ch1
echo "== Chrome: ch1 checkpoints";   g node bench/harness/xcheck.mjs ch1-zhaoyun 3600; g node bench/harness/xcheck.mjs ch1-huangzhong 3600
echo "== Chrome: touch hook";        g node bench/harness/touch-twin.mjs; g node bench/harness/touch-ui.mjs
echo "== Chrome: mobile frame time"; g node bench/maps/perf-mobile.mjs ch1
echo "ALL GATES GREEN"
