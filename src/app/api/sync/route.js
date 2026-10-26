import { currentUser } from '@/server/auth';
import { updateUser, newUser } from '@/server/db';
import { applyEvent, isEventId } from '@/economy/rules';

const MAX_EVENTS = 200;
const SEEN_KEEP = 1000;

// Replays the browser's queued events on the stored wallet. Rewards and prices
// come from the shared catalog, never from the request, and an event id that
// was already applied is skipped, so retrying a sync is always safe.
export async function POST(req) {
  const me = await currentUser();
  if (!me) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.events)) return Response.json({ error: 'Expected { events: [] }' }, { status: 400 });
  const events = body.events.slice(0, MAX_EVENTS);

  const user = await updateUser(me.id, (u) => {
    u ??= newUser(me);
    const seen = new Set(u.seen);
    let wallet = u.wallet;
    for (const ev of events) {
      if (!isEventId(ev?.id) || seen.has(ev.id)) continue;
      seen.add(ev.id);
      wallet = applyEvent(wallet, ev) ?? wallet;
    }
    return { ...u, wallet, seen: [...seen].slice(-SEEN_KEEP), updatedAt: Date.now() };
  });

  return Response.json({ state: user.wallet });
}
