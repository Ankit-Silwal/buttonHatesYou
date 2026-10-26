'use client';

import Link from 'next/link';
import Avatar from './Avatar';
import Account from './Account';
import Wallet from './Wallet';
import { useProfile } from '@/profile/useProfile';
import { GAMES, CATEGORIES } from '@/economy/catalog';

// Every mini-game, as one big card each, on its category's shelf. New games
// show up here as soon as they are added to GAMES in the catalog.
export default function Arcade() {
  const profile = useProfile();

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
        <Avatar size={64} equipped={profile.wallet.equipped} mood="smug" className="has-legs" />
        <div>
          <h1>Games</h1>
          <p>Finish a game to earn coins and diamonds. The button will hate every second of it.</p>
        </div>
      </div>

      {GAMES.some((g) => g.best) && (
        <section className="best">
          <h2>
            <span className="star" aria-hidden="true">
              ⭐
            </span>{' '}
            Best ones
          </h2>
          <ul className="games featured">
            {GAMES.filter((g) => g.best)
              .sort((a, b) => a.best - b.best)
              .map((g) => (
              <li key={g.id}>
                <GameCard game={g} best />
              </li>
            ))}
          </ul>
        </section>
      )}

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
                <GameCard game={g} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

function GameCard({ game: g, best }) {
  return (
    <Link href={g.href} className={`game ${best ? 'best' : ''}`} style={{ '--art': g.color }}>
      <span className="art" aria-hidden="true">
        {g.emoji}
        {g.best && <span className="badge">★ Best</span>}
      </span>
      <span className="info">
        <b>
          {g.name} {g.best && <span className="star">★</span>}
        </b>
        <span className="blurb">{g.blurb}</span>
        <span className="meta">
          <span className="prize">{g.prize}</span>
          <span className="pill">Play</span>
        </span>
      </span>
    </Link>
  );
}
