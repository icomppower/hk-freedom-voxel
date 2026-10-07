// Co-op simulation version. Both peers must step the same simulation code, or the lockstep desyncs (a phone tab left
// open across a deploy kept the old Team Musou-less step: desync at the first Musou press). The lobby exchanges it
// (session.js 'ui' ver) and refuses Ready on a mismatch; the co-op menu compares it with the deployed file to offer a
// reload. Bump SIM_VERSION in any commit that changes what the co-op step computes (sim, rules, bot policy, codec).
//   1 = online co-op (PR #5-#8) · 2 = Team Musou 齊上齊落 (PR #9) · 3 = this handshake
export const SIM_VERSION = 3;
