/* Password hashing for the DEMO provider only (PBKDF2-SHA256 through the browser's WebCrypto).
   A real backend hashes on the server (bcrypt/argon2, or the auth service does it for you).
   Even in the demo we never store the password itself. */
import { AuthError, CODES } from "./errors";

const ITER = 150_000;
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
const unhex = s => new Uint8Array(s.match(/../g).map(h => parseInt(h, 16)));

function subtle() {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new AuthError(CODES.UNAVAILABLE, "This browser cannot do secure login (needs https or localhost).");
  return s;
}

async function derive(password, saltBytes) {
  const s = subtle();
  const key = await s.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return hex(await s.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations: ITER }, key, 256));
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: hex(salt), hash: await derive(password, salt) };
}

export async function verifyPassword(password, { salt, hash }) {
  return (await derive(password, unhex(salt))) === hash;
}
