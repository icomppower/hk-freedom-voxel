// Room codes and allocation (shared by the worker and the matchmaker; kept out of index.ts, whose exports must all be
// handlers / Durable Object classes).
import type { Env } from "./index";

export const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // 4 letters, no I / O (and no digits, so no 0 / 1)
const CODE_LEN = 4;

function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LEN));
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return out;
}

/** Allocate a fresh room (retry on the rare collision with a live one). */
export async function allocRoom(env: Env, kind: "private" | "quick"): Promise<string | null> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode();
    const stub = env.ROOM.get(env.ROOM.idFromName(code));
    const res = await stub.fetch(`https://room/init?kind=${kind}&code=${code}`, { method: "POST" });
    const data = (await res.json()) as { fresh: boolean };
    if (data.fresh) return code;
  }
  return null;
}

