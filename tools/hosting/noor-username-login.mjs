import { randomUUID } from 'node:crypto';

const MAX_BODY = 8192;
const INVALID = Object.freeze({ status: 401 });

export function createUsernameLogin({ url, serverKey, publishableKey, request = fetch }) {
 const endpoint = new URL(url);
 return async (username, password) => {
  const lookup = await request(new URL('/rest/v1/rpc/noor_username_login_email_r327', endpoint), {
   method: 'POST',
   headers: { apikey: serverKey, Authorization: `Bearer ${serverKey}`, 'Content-Type': 'application/json' },
   body: JSON.stringify({ p_username: username }),
   signal: AbortSignal.timeout(5000),
  });
  if (!lookup.ok) return { status: 503 };
  const email = await lookup.json();
  // Unresolved usernames still go through the provider's authentication path.
  const response = await request(new URL('/auth/v1/token?grant_type=password', endpoint), {
   method: 'POST',
   headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
   body: JSON.stringify({ email: typeof email === 'string' ? email : `${randomUUID()}@invalid.example`, password }),
   signal: AbortSignal.timeout(5000),
  });
  if (response.status === 429) return { status: 429 };
  if (response.status >= 500) return { status: 503 };
  if (!response.ok || typeof email !== 'string') return INVALID;
  const { access_token: proof } = await response.json();
  return typeof proof === 'string' && proof.length > 0 ? { status: 200, proof } : INVALID;
 };
}

export function createUsernameLoginHandler({ authenticate, origin }) {
 const attempts = new Map();
 return async req => {
  if (req.method !== 'POST') return { status: 405 };
  if (req.headers.origin !== origin || req.headers['content-type']?.split(';')[0] !== 'application/json') {
   return { status: 403 };
  }
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.expires <= now) attempts.delete(key);
  // Render supplies the immediate client address at the end of the forwarded chain.
  const key = String(req.headers['x-forwarded-for'] ?? '').split(',').at(-1)?.trim() || req.socket.remoteAddress;
  const entry = attempts.get(key) ?? { count: 0, expires: now + 60_000 };
  if ((!attempts.has(key) && attempts.size >= 2000) || entry.count >= 12) return { status: 429 };
  entry.count++;
  attempts.set(key, entry);
  let payload;
  try {
   const declared = Number(req.headers['content-length']);
   if (!Number.isSafeInteger(declared)) return { status: 411 };
   if (declared > MAX_BODY) return { status: 413 };
   const chunks = [];
   let length = 0;
   for await (const chunk of req) {
    length += chunk.length;
    if (length > MAX_BODY) return { status: 413 };
    chunks.push(chunk);
   }
   payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return { status: 400 }; }
  const { username, password } = payload ?? {};
  if (typeof username !== 'string' || !/^[^\s@]{1,64}$/u.test(username)
      || typeof password !== 'string' || !password || password.length > 1024) return INVALID;
  try { return await authenticate(username, password); }
  catch { return { status: 503 }; }
 };
}
