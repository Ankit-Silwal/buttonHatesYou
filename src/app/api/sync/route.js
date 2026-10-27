import { currentUser } from '@/server/auth';
import { updateUser, newUser } from '@/server/db';
import { applyEvent, isEventId, normalize } from '@/economy/rules';

const MAX_EVENTS = 200;
const SEEN_KEEP = 1000;
const CLOCK_SKEW = 5 * 60_000; // how far ahead of ours a browser's clock may be

// Replays the browser's queued events on the stored wallet. Rewards and prices
// come from the shared catalog, never from the request, and an event id that
// was already applied is skipped, so retrying a sync is always safe. An
// Adventure run sends its score and play time, never its payout: applyEvent
// works the payout out again and caps it (see applyRun in rules.js).
// Needs events (food, sleep, games) are timed by the browser, but never later
// than the server's clock, and never earlier than the last one (see rules.js).
export async function POST(req) {
  const me = await currentUser();
  if (!me) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.events)) return Response.json({ error: 'Expected { events: [] }' }, { status: 400 });
  const events = body.events.slice(0, MAX_EVENTS);

  const user = await updateUser(me.id, (u) => {
    u ??= newUser(me);
    const seen = new Set(u.seen);
    const now = Date.now() + CLOCK_SKEW;
    let wallet = normalize(u.wallet); // profiles from before the house get defaults
    for (const ev of events) {
      if (!isEventId(ev?.id) || seen.has(ev.id)) continue;
      seen.add(ev.id);
      wallet = applyEvent(wallet, ev, now) ?? wallet;
    }
    return { ...u, wallet, seen: [...seen].slice(-SEEN_KEEP), updatedAt: Date.now() };
  });

  return Response.json({ state: user.wallet });
}
