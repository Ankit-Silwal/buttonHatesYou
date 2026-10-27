'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import { useProfile } from '@/profile/useProfile';
import { spendEnergy, whyNot, currentNeeds, PLAY_COST } from '@/profile/needs';
import './gate.css';

const LINES = {
  tired: ['Too tired. Feed me or let me nap.', 'I have no energy for your games. Snacks first.', "Can't. My battery is at zero. Emotionally too."],
  asleep: ["Shh. I'm asleep. Wake me up at home first.", 'Zzz… (he is asleep. Go wake him up in the house.)'],
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Every game start goes through this. `kind` is 'adventure' or 'story'.
//
//   const gate = useEnergyGate('adventure');
//   start: if (!gate.spend()) return;   // spends energy, or shows the refusal
//   mount: if (gate.once()) startGame();  // same, but only once per mount
//   render: {gate.refusal}
export function useEnergyGate(kind) {
  const [refused, setRefused] = useState(null);
  const spent = useRef(null);

  const spend = useCallback(
    (mount = false) => {
      if (spendEnergy(kind)) return true;
      const why = whyNot(kind) ?? 'tired';
      setRefused({ why, line: pick(LINES[why]), mount });
      return false;
    },
    [kind]
  );

  // React may run a mount effect twice (Strict Mode); pay only the first time.
  const once = useCallback(() => (spent.current ??= spend(true)), [spend]);

  const refusal = refused && <TooTired kind={kind} {...refused} onClose={() => setRefused(null)} />;
  return { spend: () => spend(), once, refusal, refused: !!refused };
}

// The refusal card. When the game was refused on page load (`mount`) there's
// nothing behind it to go back to, so it offers the games list instead.
export function TooTired({ kind, why, line, mount, onClose }) {
  const { wallet } = useProfile();
  const energy = Math.floor(currentNeeds().energy);
  return (
    <div className="too-tired" role="dialog" aria-modal="true" aria-label="Too tired to play">
      <div className="tt-card">
        <div className="tt-hero">
          <Avatar size={92} equipped={wallet.equipped} mood="tired" className="tt-av" />
          <span className="tt-z" aria-hidden="true">
            <i>z</i>
            <i>z</i>
            <i>Z</i>
          </span>
        </div>
        <p className="tt-line">{line}</p>
        <div className="tt-meter" aria-label={`Energy ${energy} of 100`}>
          <span className="tt-bolt">⚡</span>
          <span className="tt-bar">
            <i style={{ width: `${energy}%` }} />
          </span>
          <b>{energy}</b>
        </div>
        <p className="tt-note">
          {why === 'asleep' ? 'He is in bed. ' : ''}A game needs {PLAY_COST[kind]} energy. Food is cheap, naps are free.
        </p>
        <div className="tt-row">
          <Link className="pill" href="/house">
            🏠 Go home
          </Link>
          {mount ? (
            <Link className="pill ghost" href="/games">
              All games
            </Link>
          ) : (
            <button className="pill ghost" onClick={onClose}>
              Fine
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
