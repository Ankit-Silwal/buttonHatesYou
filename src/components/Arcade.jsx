'use client';

import Link from 'next/link';
import Avatar from './Avatar';
import Account from './Account';
import Wallet from './Wallet';
import { useProfile } from '@/profile/useProfile';
import { GAMES } from '@/economy/catalog';

// Every mini-game, as one big card each. New games show up here as soon as
// they are added to GAMES in the catalog.
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

      <ul className="games">
        {GAMES.map((g) => (
          <li key={g.id}>
            <Link href={g.href} className="game" style={{ '--art': g.color }}>
              <span className="art" aria-hidden="true">
                {g.emoji}
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
          </li>
        ))}
        <li>
          <div className="game soon">
            <span className="art" aria-hidden="true">
              🚧
            </span>
            <span className="info">
              <b>More games soon</b>
              <span className="blurb">The button is reluctantly building more ways for you to bother it.</span>
            </span>
          </div>
        </li>
      </ul>
    </main>
  );
}
