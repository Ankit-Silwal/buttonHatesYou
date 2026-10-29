import { statsOf } from './achievements';

// Hard quests: long, difficult goals beside the levels, each paid once.
// Shared by the browser and the server. `game` (a game id, for its icon) or
// `icon` (an emoji id for <Icon>). A quest's `stat(stats, wallet)` is
// read from what the wallet already counts (see achievements.js statsOf), so
// claiming can be checked on both:
//   { id, type: 'quest', quest }   claims a finished quest (once per wallet)
const best = (game) => (s) => s.best?.[game] ?? 0;

export const QUESTS = Object.freeze([
  { id: 'q-flap', game: 'flap', name: 'Pipe Legend', goal: 'Reach 60 pipes in one Flappy Regret run', stat: best('flap'), at: 60, reward: { coins: 6000, diamonds: 20 } },
  { id: 'q-stack', game: 'stack', name: 'Skyscraper', goal: 'Stack 70 floors in Tower of Regret', stat: best('stack'), at: 70, reward: { coins: 6000, diamonds: 20 } },
  { id: 'q-simon', game: 'simon', name: 'Perfect Memory', goal: 'Copy 30 rounds in a row in Copy Me', stat: best('simon'), at: 30, reward: { coins: 6000, diamonds: 20 } },
  { id: 'q-pop', game: 'pop', name: 'Pop Star', goal: 'Score 6000 points in Pop Tantrum', stat: best('pop'), at: 6000, reward: { coins: 6000, diamonds: 20 } },
  { id: 'q-feed', icon: '🍪', name: 'Personal Chef', goal: 'Feed him 500 times', stat: (s, w) => w?.stats?.eaten ?? 0, at: 500, reward: { coins: 8000, diamonds: 25 } },
  { id: 'q-wash', icon: '🧼', name: 'Squeaky Forever', goal: 'Wash him 250 times', stat: (s, w) => w?.stats?.washes ?? 0, at: 250, reward: { coins: 8000, diamonds: 25 } },
  { id: 'q-nap', icon: '💤', name: 'Sleep Whisperer', goal: 'Put him to bed 200 times', stat: (s) => s.naps ?? 0, at: 200, reward: { coins: 8000, diamonds: 25 } },
  { id: 'q-streak', icon: '🔥', name: 'Never Missed a Day', goal: 'Open the daily chest 60 days in a row', stat: (s) => s.bestStreak ?? 0, at: 60, reward: { coins: 10000, diamonds: 40 } },
  { id: 'q-runs', icon: '🎮', name: 'No Life', goal: 'Play 2000 games', stat: (s) => s.runs ?? 0, at: 2000, reward: { coins: 10000, diamonds: 35 } },
  { id: 'q-rich', icon: '🪙', name: 'Coin Hoarder', goal: 'Earn 250,000 coins from games', stat: (s) => s.runCoins ?? 0, at: 250_000, reward: { coins: 15000, diamonds: 40 } },
  { id: 'q-owner', icon: '🛋️', name: 'Owns Everything', goal: 'Own 150 things', stat: (s, w) => (Array.isArray(w?.owned) ? w.owned.length : 0), at: 150, reward: { coins: 20000, diamonds: 50 } },
]);
export const QUEST = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

// Every quest with how far along it is: { q, value, done, claimed }.
export function questStates(w) {
  const s = statsOf(w);
  const claimed = Array.isArray(w?.quests) ? w.quests : [];
  return QUESTS.map((q) => {
    const value = Math.min(q.at, Math.floor(q.stat(s, w)));
    return { q, value, done: value >= q.at, claimed: claimed.includes(q.id) };
  });
}

// The new wallet, null when not allowed, undefined when not a quest event.
export function applyQuestEvent(w, ev) {
  if (ev.type !== 'quest') return undefined;
  const q = typeof ev.quest === 'string' && Object.hasOwn(QUEST, ev.quest) ? QUEST[ev.quest] : null;
  const claimed = Array.isArray(w.quests) ? w.quests : [];
  if (!q || claimed.includes(q.id) || q.stat(statsOf(w), w) < q.at) return null;
  return { ...w, coins: w.coins + q.reward.coins, diamonds: w.diamonds + q.reward.diamonds, quests: [...claimed, q.id] };
}
