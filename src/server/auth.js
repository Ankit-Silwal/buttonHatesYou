import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose';
import { cookies } from 'next/headers';

const COOKIE = 'buttonHatesYou.session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is not set');
  return new TextEncoder().encode(s);
}

// Checks the ID token Google Identity Services hands the browser.
export async function verifyGoogle(credential) {
  const { payload } = await jwtVerify(credential, googleKeys, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  });
  return { id: payload.sub, email: payload.email ?? '', name: payload.name ?? '', picture: payload.picture ?? '' };
}

export async function startSession(user) {
  const token = await new SignJWT({ email: user.email, name: user.name, picture: user.picture })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

// The signed-in user, or null.
export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    return { id: payload.sub, email: payload.email, name: payload.name, picture: payload.picture };
  } catch {
    return null;
  }
}

export const publicUser = ({ id, email, name, picture }) => ({ id, email, name, picture });
