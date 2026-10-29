'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { GAME, PLAYABLE } from '@/economy/catalog';
import { lookOf } from '@/adventure/kit';
import { useFavorites } from '@/profile/favorites';
import { PAINT, ART_W, ART_H } from './gameArt';
import GameIcon from './GameIcon';

// Menu order, as in the Android app: Please Don't (the original game), the
// Adventure games, then the two long stories.
const ORDER = ['please-dont', 'flap', 'whack', 'stack', 'pop', 'simon', 'hop', 'run', 'slice', 'button-run', 'how-i-met-your-cursor', 'the-reason'];
const MENU = [...ORDER.map((id) => GAME[id]).filter((g) => g && !g.retired), ...PLAYABLE.filter((g) => !ORDER.includes(g.id))];

// Every game as a tile in one grid: the Games panel of the home screen (and
// of /games). Starred games are pinned to the top, in the order they were
// starred; the rest keep the menu order.
export function GameGrid({ equipped, dim = false }) {
  const [favorites, toggle] = useFavorites();
  const starred = favorites.map((id) => MENU.find((g) => g.id === id)).filter(Boolean);
  const rest = MENU.filter((g) => !favorites.includes(g.id));
  const tile = (g, i, on) => (
    <li key={g.id} style={{ '--i': Math.min(i, 10) }}>
      <GameTile game={g} equipped={equipped} dim={dim} favorite={on} onStar={() => toggle(g.id)} />
    </li>
  );

  return (
    <>
      {starred.length > 0 ? (
        <>
          <h2 className="grid-head">
            <Star on /> Favorites
          </h2>
          <ul className="game-grid">{starred.map((g, i) => tile(g, i, true))}</ul>
          <h2 className="grid-head">All games</h2>
        </>
      ) : (
        <p className="grid-tip">Tap the star on a game to pin it to the top.</p>
      )}
      <ul className="game-grid">{rest.map((g, i) => tile(g, i, false))}</ul>
    </>
  );
}

// One game: a picture of it and its name, with a star to pin it to the top.
function GameTile({ game: g, equipped, dim, favorite, onStar }) {
  return (
    <div className={`gtile ${dim ? 'dim' : ''}`}>
      <Link href={g.href} className="gtile-link" title={g.blurb}>
        <span className="gtile-art" style={{ '--tint': g.color }}>
          {PAINT[g.id] ? <Art id={g.id} equipped={equipped} /> : <GameIcon id={g.id} />}
        </span>
        <span className="gtile-name">{g.name}</span>
      </Link>
      <button
        type="button"
        className={`gtile-star ${favorite ? 'on' : ''}`}
        aria-pressed={favorite}
        aria-label={favorite ? `Remove ${g.name} from favorites` : `Add ${g.name} to favorites`}
        onClick={onStar}
      >
        <Star on={favorite} />
      </button>
    </div>
  );
}

// A five-pointed star, solid or outlined.
function Star({ on }) {
  return (
    <svg className="star" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M12 2.6 14.6 8.6 21.1 9.2 16.2 13.5 17.7 19.9 12 16.5 6.3 19.9 7.8 13.5 2.9 9.2 9.4 8.6Z"
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={on ? 0 : 2.2}
        strokeLinejoin="round"
      />
    </svg>
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
