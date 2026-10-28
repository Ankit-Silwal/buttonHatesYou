'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { GAMES, CATEGORIES } from '@/economy/catalog';
import { lookOf } from '@/adventure/kit';
import { PAINT, ART_W, ART_H } from './gameArt';

// Every mini-game, as one big card each, on its category's shelf: the Games
// panel of the home screen (and of /games). New games show up here as soon as
// they are added to GAMES in the catalog.
export function Shelves({ equipped }) {
  return (
    <>
      {CATEGORIES.map((cat) => (
        <section key={cat.id} className="shelf" aria-labelledby={`shelf-${cat.id}`}>
          <div className="shelf-head">
            <h2 id={`shelf-${cat.id}`} className="games-head">
              {cat.name}
            </h2>
            <p>{cat.blurb}</p>
          </div>
          <ul className="games">
            {GAMES.filter((g) => g.category === cat.id).map((g, i) => (
              <li key={g.id} style={{ '--i': Math.min(i, 8) }}>
                <GameCard game={g} equipped={equipped} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
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
