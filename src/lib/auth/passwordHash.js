/* Password hashing for the DEMO provider only.
   Uses PBKDF2-SHA256 (WebCrypto) when the browser supports it — that's secure contexts only (https:// or localhost://).
   Falls back to a simple iterated hash when accessed via IP address, where crypto.subtle is unavailable.
   A real backend hashes on the server (bcrypt/argon2). Even in the demo we never store the password itself. */
import { AuthError, CODES } from "./errors";

const ITER = 150_000;
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
const unhex = s => new Uint8Array(s.match(/../g).map(h => parseInt(h, 16)));

function hasSubtle() {
  return Boolean(globalThis.crypto?.subtle);
}

/* PBKDF2-SHA256 — secure contexts (localhost, https) */
async function derivePbkdf2(password, saltBytes) {
  const s = globalThis.crypto.subtle;
  const key = await s.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return hex(await s.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations: ITER }, key, 256));
}

/* Simple iterated hash — works everywhere, including non-secure contexts (IP address).
   Not cryptographically strong, fine for demo data kept in this browser only. */
function deriveSimple(password, saltBytes) {
  const pw = new TextEncoder().encode(password);
  const combined = new Uint8Array(pw.length + saltBytes.length);
  combined.set(pw);
  combined.set(saltBytes, pw.length);
  /* FNV-1a style mix of password+salt */
  let h = 0x811c9dc5;
  for (let i = 0; i < combined.length; i++) {
    h ^= combined[i];
    h = (h * 0x01000193) | 0;
  }
  /* extra iterations to make it slower than a single pass */
  for (let i = 0; i < ITER; i++) {
    h ^= (i & 0xff);
    h = (h * 0x01000193) | 0;
  }
  return Math.abs(h).toString(16).padStart(64, "0");
}

async function derive(password, saltBytes) {
  return hasSubtle() ? await derivePbkdf2(password, saltBytes) : deriveSimple(password, saltBytes);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: hex(salt), hash: await derive(password, salt) };
}

export async function verifyPassword(password, { salt, hash }) {
  return (await derive(password, unhex(salt))) === hash;
}
