import { verifyGoogle, startSession, publicUser } from '@/server/auth';
import { updateUser, newUser } from '@/server/db';
import { normalize } from '@/economy/rules';

// The browser signs in with Google Identity Services and posts the ID token here.
export async function POST(req) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.SESSION_SECRET) {
    return Response.json({ error: 'Google sign-in is not set up on this server yet.' }, { status: 503 });
  }
  const { credential } = await req.json().catch(() => ({}));
  if (typeof credential !== 'string') return Response.json({ error: 'Missing credential' }, { status: 400 });

  let profile;
  try {
    profile = await verifyGoogle(credential);
  } catch {
    return Response.json({ error: 'That Google sign-in did not check out.' }, { status: 401 });
  }

  const user = await updateUser(profile.id, (u) => (u ? { ...u, ...profile, updatedAt: Date.now() } : newUser(profile)));
  await startSession(profile);
  return Response.json({ user: publicUser(user), state: normalize(user.wallet) });
}
