'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import Account from './Account';
import Wallet from './Wallet';
import { useProfile } from '@/profile/useProfile';
import { GAMES, CATEGORIES } from '@/economy/catalog';
import { lookOf } from '@/adventure/kit';
import { PAINT, ART_W, ART_H } from './gameArt';

// Every mini-game, as one big card each, on its category's shelf. New games
// show up here as soon as they are added to GAMES in the catalog.
export default function Arcade() {
  const profile = useProfile();
  const equipped = profile.wallet.equipped;

  return (
    <main className="arcade">
      <header className="hub-top">
        <div className="arcade-left">
          <Link href="/" className="chip home" aria-label="Back home">
            🏠
          </Link>
          <Wallet profile={profile} />
        </div>
        <Account user={profile.user} ready={profile.ready} />
      </header>

      <div className="arcade-head">
        <Avatar size={64} equipped={equipped} mood="smug" className="has-legs" />
        <div>
          <h1>Games</h1>
          <p>Finish a game to earn coins and diamonds. The button will hate every second of it.</p>
        </div>
      </div>

      {CATEGORIES.map((cat) => (
        <section key={cat.id} className="shelf" aria-labelledby={`shelf-${cat.id}`}>
          <div className="shelf-head">
            <h2 id={`shelf-${cat.id}`} className="games-head">
              {cat.name}
            </h2>
            <p>{cat.blurb}</p>
          </div>
          <ul className="games">
            {GAMES.filter((g) => g.category === cat.id).map((g) => (
              <li key={g.id}>
                <GameCard game={g} equipped={equipped} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

function GameCard({ game: g, equipped }) {
  return (
    <Link href={g.href} className="game" style={{ '--art': g.color }}>
      <span className="art" aria-hidden="true">
        {PAINT[g.id] ? <Art id={g.id} equipped={equipped} /> : g.emoji}
      </span>
      <span className="info">
        <b>{g.name}</b>
        <span className="blurb">{g.blurb}</span>
        <span className="meta">
          <span className="prize">{g.prize}</span>
          <span className="pill">Play</span>
        </span>
      </span>
    </Link>
  );
}

// A still picture from the game itself, redrawn when the outfit changes.
function Art({ id, equipped }) {
  const ref = useRef(null);
  const key = JSON.stringify(equipped);

  useEffect(() => {
    const cv = ref.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = ART_W * dpr;
    cv.height = ART_H * dpr;
    const c = cv.getContext('2d');
    c.scale(dpr, dpr);
    try {
      PAINT[id](c, lookOf(equipped));
    } catch (err) {
      console.error(`card art for ${id}`, err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, key]);

  return <canvas ref={ref} width={ART_W} height={ART_H} />;
}
