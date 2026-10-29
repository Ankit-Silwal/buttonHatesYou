'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { GAME, ITEM, PLAYABLE, cantPlay } from '@/economy/catalog';
import { lookOf } from '@/adventure/kit';
import { useFavorites } from '@/profile/favorites';
import { PAINT, ART_W, ART_H } from './gameArt';
import GameIcon from './GameIcon';
import { useProfile } from '@/profile/useProfile';
import { STORY_UNLOCKS, storyOpen } from '@/economy/levels';
import LockTag from '@/levels/LockTag';

// Menu order: the Adventure games, then the story games (Please Don't, the
// original game, and the two long stories) together under Story mode.
const ORDER = ['flap', 'whack', 'stack', 'pop', 'simon', 'hop', 'run', 'slice', 'button-run', 'table-tennis', 'please-dont', 'how-i-met-your-cursor', 'the-reason'];
const MENU = [...ORDER.map((id) => GAME[id]).filter((g) => g && !g.retired), ...PLAYABLE.filter((g) => !ORDER.includes(g.id))];

// Every game as a tile in one grid: the Games panel of the home screen (and
// of /games). Starred games are pinned to the top, in the order they were
// starred; the rest keep the menu order, with the story games last.
// `why(game)`: the reason he can't play it right now (too hungry, too tired,
// asleep), or null. Those tiles are greyed out and don't open; tapping one
// calls `onBlocked(reason)` instead. So are the games the character he's
// playing as can't play (cantPlay: Cursor and the round-button games).
export function GameGrid({ equipped, why, onBlocked }) {
  const [favorites, toggle] = useFavorites();
  const { wallet, ready } = useProfile();
  const locked = (g) => ready && !storyOpen(wallet, g.id); // story games open as levels are cleared
  const starred = favorites.map((id) => MENU.find((g) => g.id === id)).filter(Boolean);
  const rest = MENU.filter((g) => !favorites.includes(g.id) && g.category !== 'story');
  const stories = MENU.filter((g) => !favorites.includes(g.id) && g.category === 'story');
  const tile = (g, i, on) => (
    <li key={g.id} style={{ '--i': Math.min(i, 10) }}>
      <GameTile game={g} equipped={equipped} why={cantPlay(g, equipped) ?? why?.(g)} misfit={!!cantPlay(g, equipped)} onBlocked={onBlocked} favorite={on} locked={locked(g)} onStar={() => toggle(g.id)} />
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
          {rest.length > 0 && <h2 className="grid-head">All games</h2>}
        </>
      ) : null}
      {rest.length > 0 && <ul className="game-grid">{rest.map((g, i) => tile(g, i, false))}</ul>}
      {stories.length > 0 && (
        <>
          <h2 className="grid-head">📖 Story mode</h2>
          <ul className="game-grid">{stories.map((g, i) => tile(g, rest.length + i, false))}</ul>
        </>
      )}
    </>
  );
}

// One game: a picture of it and its name, with a star to pin it to the top.
// A story game a level still locks shows a padlock and doesn't open; a game
// he can't play right now (`why`) is greyed out and calls onBlocked instead.
function GameTile({ game: g, equipped, why, misfit, onBlocked, favorite, locked, onStar }) {
  const stop = (e) => {
    if (!why) return;
    e.preventDefault();
    onBlocked?.(why);
  };
  const inner = (
    <>
      <span className="gtile-art" style={{ '--tint': g.color }}>
        {/* story games are prequels: their tiles show plain Bobby */}
        {PAINT[g.id] ? <GameArt id={g.id} equipped={g.category === 'story' ? undefined : equipped} /> : <GameIcon id={g.id} />}
      </span>
      <span className="gtile-name">{g.name}</span>
      {locked && <LockTag className="gtile-lockpin">Beat level {STORY_UNLOCKS[g.id]}</LockTag>}
      {misfit && !locked && <span className="lv-lock gtile-lockpin gtile-misfit">Not for {ITEM[equipped?.char]?.name ?? 'him'}</span>}
    </>
  );
  return (
    <div className={`gtile ${why ? 'dim' : ''} ${locked ? 'locked' : ''}`}>
      {locked ? (
        <span className="gtile-link" role="link" aria-disabled="true" title={`Beat level ${STORY_UNLOCKS[g.id]} to unlock`}>
          {inner}
        </span>
      ) : (
        <Link href={g.href} className="gtile-link" title={why ?? g.blurb} aria-disabled={why ? true : undefined} onClick={stop}>
          {inner}
        </Link>
      )}
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
export function GameArt({ id, equipped }) {
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
