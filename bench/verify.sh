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
echo "== character + boss gates";    g $N bench/chars/gates.mjs lungjai; g $N bench/chars/gates.mjs siumei
g $N bench/chars/boss.mjs lungjai; g $N bench/chars/boss.mjs siumei; g $N bench/chars/stamp-model.mjs
echo "== scroll columns";            g $N bench/harness/cols.mjs
echo "== cutscene look";             g $N bench/chars/cut-look.mjs
for ch in hk1 hk2 hk3 hk5 hk4; do
  echo "== $ch: map gate + bot (both playables × steady / rush / back)"
  g $N bench/maps/mapcheck.mjs $ch lungjai; g $N bench/maps/mapcheck.mjs $ch siumei
  for c in lungjai siumei; do for st in steady rush back; do g $N bench/bot/run.mjs --char $c --chapter $ch --style $st --quiet; done; done
done
echo "== co-op (Node): 2P bots hk1, 2P rules, battle carry-over"
g $N bench/net/duo.mjs hk1; g $N bench/net/rules.mjs; g $N bench/net/carry.mjs hk1 3000 hk2 hk1
[ "$1" = "--quick" ] && { echo "QUICK GATES GREEN"; exit 0; }
echo "== Chrome: boot, scrolls";     g node bench/harness/smoke.mjs "?x" 4; g node bench/harness/shots-scroll.mjs ch1
echo "== Chrome: crowd, skins, UI";  g node bench/harness/crowdprobe.mjs ch1; g node bench/harness/skin-test.mjs
g node bench/harness/ui-flow.mjs bench/out/ui; g node bench/harness/result-fit.mjs
g node bench/harness/shots-scroll.mjs hk1 --char lungjai
echo "== Chrome: ch1 checkpoints";   g node bench/harness/xcheck.mjs ch1-zhaoyun 3600; g node bench/harness/xcheck.mjs ch1-huangzhong 3600
echo "== Chrome: touch hook";        g node bench/harness/touch-twin.mjs; g node bench/harness/touch-ui.mjs; g node bench/harness/phone-flow.mjs
echo "== Chrome: ending flow";       g node bench/harness/scroll-flow.mjs hk4
echo "== Chrome: cutscenes";         g node bench/harness/cut-flow.mjs; g node bench/harness/cut-shots.mjs; g node bench/harness/cut-shots.mjs --skip
echo "== Chrome: ?preview gallery";   g node bench/harness/preview-flow.mjs
g node bench/harness/cut-shots.mjs --mobile; g node bench/harness/ending-fit.mjs
echo "== Chrome: 機場 look (#debug asserts)"; g node bench/maps/airport-look.mjs lungjai
echo "== Chrome: frame time";        g node bench/maps/perfmap.mjs hk1 hk4 hk5
echo "== Chrome: mobile frame time"; g node bench/maps/perf-mobile.mjs ch1 hk1 hk4 hk5
echo "ALL GATES GREEN"
