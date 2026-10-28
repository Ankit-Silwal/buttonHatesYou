import { currentUser, publicUser } from '@/server/auth';
import { updateUser, newUser, walletOf } from '@/server/db';

// Who is signed in, and their wallet as the server knows it.
export async function GET() {
  const me = await currentUser();
  if (!me) return Response.json({ user: null });
  const user = await updateUser(me.id, (u) => u ?? newUser(me));
  return Response.json({ user: publicUser(user), state: walletOf(user) });
}
