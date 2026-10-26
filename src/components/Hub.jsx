'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import Account from './Account';
import Sheet from './Sheet';
import Wardrobe from './Wardrobe';
import { useProfile } from '@/profile/useProfile';
import { GAMES } from '@/economy/catalog';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const POKES = [
  ['Hey. HEY. Hands off.', 'annoyed'],
  "I'm not a button in here. I'm a homeowner.",
  ['Go play a game. Bother someone else.', 'annoyed'],
  'That tickles. I hate that it tickles.',
  ["Poke me one more time and I'm calling Kevin.", 'angry'],
  ['This is a no-pressing zone.', 'angry'],
  ['I can hear you breathing.', 'scared'],
  'Nice outfit, right? You paid for it.',
];

const SYNC = {
  guest: ['💾', 'On this device', 'Playing as a guest: everything is saved on this device. Sign in to keep it in the cloud.'],
  offline: ['📴', 'Offline', "You're offline. Everything is saved on this device and will sync when you're back."],
  syncing: ['🔄', 'Syncing', 'Saving to the cloud…'],
  pending: ['⏳', 'Waiting', 'Some changes are waiting to sync.'],
  error: ['⚠️', 'Retrying', "Can't reach the server. Everything is saved on this device; we'll keep trying."],
  synced: ['☁️', 'Saved', 'Saved to the cloud.'],
};

const DECOR = [
  { e: '🖼️', x: '12%', y: '18%' },
  { e: '🕰️', x: '84%', y: '16%' },
  { e: '🪴', x: '6%', y: 'calc(72% - 60px)', cls: 'big' },
  { e: '🛋️', x: '78%', y: 'calc(72% - 62px)', cls: 'big' },
];

function greeting({ user, wallet }) {
  if (wallet.coins >= 100) return ["You're rich. Buy me something nice.", 'smug'];
  if (user) return [`Oh no. ${user.name?.split(' ')[0] || 'You'}'s back.`, 'annoyed'];
  return ["Oh. A visitor. Please don't press anything.", 'calm'];
}

export default function Hub() {
  const profile = useProfile();
  const { wallet, user, ready } = profile;
  const [panel, setPanel] = useState(null); // null | 'games' | 'wardrobe'
  const [preview, setPreview] = useState(null);
  const [line, setLine] = useState({ text: '', mood: 'calm', n: 0 });
  const [pressed, setPressed] = useState(false);
  const pokes = useRef(0);
  const calmTimer = useRef(0);

  const say = useCallback((text, mood = 'calm') => {
    setLine((l) => ({ text, mood, n: l.n + 1 }));
    clearTimeout(calmTimer.current);
    calmTimer.current = setTimeout(() => setLine((l) => ({ ...l, mood: 'calm' })), 2600);
  }, []);

  // Say hello once we know who this is.
  const greeted = useRef(false);
  useEffect(() => {
    if (!ready || greeted.current) return;
    greeted.current = true;
    say(...greeting(profile));
  }, [ready, profile, say]);

  function poke() {
    setPressed(true);
    setTimeout(() => setPressed(false), 140);
    pokes.current++;
    if (pokes.current % 7 === 0) return say("OKAY. Go earn some coins and leave me alone.", 'angry');
    const p = pick(POKES);
    typeof p === 'string' ? say(p, 'smug') : say(...p);
  }

  const close = useCallback(() => {
    setPanel(null);
    setPreview(null);
  }, []);

  const [icon, label, hint] = SYNC[profile.status];

  return (
    <main className="hub" data-panel={panel ?? undefined}>
      <div className="hub-room" aria-hidden="true">
        {DECOR.map((d) => (
          <span key={d.e} className={`decor ${d.cls ?? ''}`} style={{ '--x': d.x, '--y': d.y }}>
            {d.e}
          </span>
        ))}
      </div>

      <header className="hub-top">
        <div className="wallet">
          <span className="chip" title="Coins">
            🪙 <b key={wallet.coins}>{wallet.coins}</b>
          </span>
          <span className="chip" title="Diamonds">
            💎 <b key={wallet.diamonds}>{wallet.diamonds}</b>
          </span>
          {ready && (
            <span className="chip sync" title={hint}>
              {icon} <span className="label">{label}</span>
            </span>
          )}
        </div>
        <Account user={user} ready={ready} />
      </header>

      <p className="hub-line" key={line.n} aria-live="polite">
        {line.text}
      </p>

      <div className="hub-stage">
        <Avatar
          as="button"
          type="button"
          className={`hero has-legs ${pressed ? 'press' : ''}`}
          size={panel ? 'clamp(96px, 22vh, 150px)' : 'clamp(130px, 30vmin, 220px)'}
          equipped={preview ?? wallet.equipped}
          mood={line.mood}
          onClick={poke}
          aria-label="The button. It would rather you didn't."
        />
      </div>

      {!panel && (
        <nav className="hub-actions">
          <button className="pill big" onClick={() => setPanel('games')}>
            🎮 Play
          </button>
          <button className="pill big alt" onClick={() => setPanel('wardrobe')}>
            👕 Wardrobe
          </button>
        </nav>
      )}

      {panel === 'games' && (
        <Sheet title="Games" onClose={close}>
          <div className="sheet-body">
            {GAMES.map((g) => (
              <article key={g.id} className="game-card">
                <span className="emoji">{g.emoji}</span>
                <div>
                  <h3>{g.name}</h3>
                  <p>{g.blurb}</p>
                  <p className="reward">
                    Finish it: +{g.reward.coins} 🪙{g.reward.diamonds ? ` +${g.reward.diamonds} 💎` : ''}
                  </p>
                </div>
                <Link className="pill" href={g.href}>
                  Play
                </Link>
              </article>
            ))}
            <article className="game-card soon">
              <span className="emoji">🚧</span>
              <div>
                <h3>More games soon</h3>
                <p>The button is reluctantly building more ways for you to bother it.</p>
              </div>
            </article>
          </div>
        </Sheet>
      )}

      {panel === 'wardrobe' && <Wardrobe wallet={wallet} onPreview={setPreview} onSay={say} onClose={close} />}
    </main>
  );
}
