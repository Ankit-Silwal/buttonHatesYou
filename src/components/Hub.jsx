'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import Account from './Account';
import Wallet from './Wallet';
import Wardrobe from './Wardrobe';
import { useProfile } from '@/profile/useProfile';

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
  const [panel, setPanel] = useState(null); // null | 'wardrobe'
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
        <Wallet profile={profile} />
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
          <Link className="pill big" href="/games">
            🎮 Play
          </Link>
          <button className="pill big alt" onClick={() => setPanel('wardrobe')}>
            👕 Wardrobe
          </button>
          <Link className="pill big story-btn" href="/story">
            📖 Story
          </Link>
        </nav>
      )}

      {panel === 'wardrobe' && <Wardrobe wallet={wallet} onPreview={setPreview} onSay={say} onClose={close} />}
    </main>
  );
}
