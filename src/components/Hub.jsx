'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import Account from './Account';
import Wallet from './Wallet';
import Wardrobe from './Wardrobe';
import EnergyChip from '@/house/EnergyChip';
import HubPerks from '@/achievements/HubPerks';
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

// Things in the room. --horizon (hub.css) is where the wall meets the floor.
const DECOR = [
  { e: '🖼️', x: '12%', y: '18%', cls: 'wall' },
  { e: '🕰️', x: '84%', y: '16%', cls: 'wall' },
  { e: '🪴', x: '6%', y: 'calc(var(--horizon) - 0.86em)', cls: 'big' },
  { e: '🛋️', x: '78%', y: 'calc(var(--horizon) - 0.9em)', cls: 'big' },
];

// Dust drifting through the light: [left %, delay s, duration s, size px]
const MOTES = [
  [18, 0, 14, 4], [26, 5, 18, 3], [34, 2, 16, 5], [42, 9, 20, 3], [58, 4, 17, 4],
  [66, 11, 15, 3], [72, 1, 19, 5], [82, 7, 16, 3], [12, 13, 21, 3], [50, 6, 22, 4],
];

function greeting({ user, wallet }) {
  if (wallet.coins >= 1000) return ["You're rich. Buy me something nice.", 'smug'];
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
        <div className="room-wall" />
        <div className="room-shaft" />
        <div className="room-lamp" />
        <div className="room-floor" />
        <div className="room-glow" />
        <div className="room-motes">
          {MOTES.map(([x, d, t, sz], i) => (
            <i key={i} style={{ '--x': `${x}%`, '--d': `-${d}s`, '--t': `${t}s`, '--sz': `${sz}px` }} />
          ))}
        </div>
        {DECOR.map((d) => (
          <span key={d.e} className={`decor ${d.cls ?? ''}`} style={{ '--x': d.x, '--y': d.y }}>
            {d.e}
          </span>
        ))}
      </div>

      <header className="hub-top">
        <div className="hub-left">
          <Wallet profile={profile} />
          <EnergyChip />
        </div>
        <Account user={user} ready={ready} />
      </header>
      {!panel && <HubPerks />}

      <p className="hub-line" key={line.n} aria-live="polite">
        {line.text}
      </p>

      <div className="hub-stage">
        <div className="hero-spot">
          <Avatar
            as="button"
            type="button"
            className={`hero has-legs ${pressed ? 'press' : ''}`}
            size={panel ? 'clamp(96px, 22vh, 150px)' : 'var(--hs)'}
            equipped={preview ?? wallet.equipped}
            mood={line.mood}
            onClick={poke}
            aria-label="The button. It would rather you didn't."
          />
        </div>
      </div>

      {!panel && (
        <nav className="hub-actions">
          <Link className="pill big play" href="/games" style={{ '--i': 0 }}>
            <span className="ico">🎮</span> Play
          </Link>
          <button className="pill big alt" onClick={() => setPanel('wardrobe')} style={{ '--i': 1 }}>
            <span className="ico">👕</span> Wardrobe
          </button>
          <Link className="pill big story-btn" href="/story" style={{ '--i': 2 }}>
            <span className="ico">📖</span> Story
          </Link>
          <Link className="pill big house-btn" href="/house" style={{ '--i': 3 }}>
            <span className="ico">🏠</span> House
          </Link>
        </nav>
      )}

      {panel === 'wardrobe' && <Wardrobe wallet={wallet} onPreview={setPreview} onSay={say} onClose={close} />}
    </main>
  );
}
