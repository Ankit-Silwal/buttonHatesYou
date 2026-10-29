'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import Account from '@/components/Account';
import Wallet from '@/components/Wallet';
import Icon from '@/components/Icon';
import { useProfile } from '@/profile/useProfile';
import { claimAchievement } from '@/profile/store';
import { ACHIEVEMENTS, ACHIEVEMENT_DIAMONDS, CATEGORIES, medalsOf, achievementStates } from '@/economy/achievements';
import { isBigDay } from '@/economy/chest';
import { ChestArt, ChestDialog, Streak, useChest } from './Chest';
import Badge, { MedalArt } from './Badge';
import './achievements.css';

const fmt = (n) => Math.floor(n).toLocaleString('en-US');
const LEVELS = ACHIEVEMENTS.reduce((n, a) => n + a.levels.length, 0);
const Gem = ({ size = 15 }) => <Icon glyph="💎" size={size} className="gem" />;

// How far along the next level is, 0 to 100 (100 when all are claimed).
function progress({ a, level, value, next }) {
  if (!next) return 100;
  const from = level ? a.levels[level - 1].at : 0;
  return Math.max(0, Math.min(100, ((value - from) / (next.at - from)) * 100));
}

// Claimable first, then the closest to their next medal, finished ones last.
const rank = (x) => (x.claimable ? 300 : x.next ? 100 + progress(x) : 0);
const byRank = (p, q) => rank(q) - rank(p);

// Every achievement: the ones with a medal to claim up top (with Claim all),
// then the rest by category, closest first. Which cards sit up top is decided
// when the page opens (and after Claim all), so a card doesn't jump away from
// under the finger the moment it's claimed. `embedded`: a tab of the profile
// page, which has its own top bar and title.
export default function Achievements({ embedded = false }) {
  const profile = useProfile();
  const { wallet, ready } = profile;
  const [burst, setBurst] = useState(null); // { id, level, diamonds, n }
  const [haul, setHaul] = useState(null); // Claim all: { diamonds, medals, list }
  const [front, setFront] = useState(null); // ids shown up top
  const [chestOpen, setChestOpen] = useState(false);
  const bursts = useRef(0);
  const states = achievementStates(wallet);
  const claimed = states.reduce((n, x) => n + x.level, 0);
  const earned = states.reduce((n, x) => n + x.a.levels.slice(0, x.level).reduce((m, l) => m + l.diamonds, 0), 0);
  const waiting = states.reduce((n, x) => n + x.claimable, 0);
  const pending = states.reduce((n, x) => n + x.a.levels.slice(x.level, x.level + x.claimable).reduce((m, l) => m + l.diamonds, 0), 0);

  if (ready && !front) setFront(new Set(states.filter((x) => x.claimable).map((x) => x.a.id)));
  const top = front ? states.filter((x) => front.has(x.a.id)).sort(byRank) : [];

  function claim(x) {
    const got = claimAchievement(x.a.id, x.level + 1);
    if (!got) return;
    setBurst({ id: x.a.id, level: x.level, diamonds: got.diamonds, n: ++bursts.current });
  }

  // Every claimable level of every achievement, in order, one claim each.
  function claimAll() {
    let diamonds = 0;
    let medals = 0;
    const list = [];
    for (const x of states) {
      let got = 0;
      for (let k = 1; k <= x.claimable; k++) {
        const r = claimAchievement(x.a.id, x.level + k);
        if (!r) break;
        diamonds += r.diamonds;
        got++;
      }
      if (got) list.push({ a: x.a, level: x.level + got });
      medals += got;
    }
    if (!medals) return;
    setBurst(null);
    setFront(new Set());
    setHaul({ diamonds, medals, list });
  }

  const card = (x, i) => (
    <li key={x.a.id} style={{ '--i': Math.min(i, 10) }}>
      <Card x={x} ready={ready} burst={burst?.id === x.a.id ? burst : null} onClaim={() => claim(x)} />
    </li>
  );

  const Wrap = embedded ? 'div' : 'main';
  return (
    <Wrap className={`arcade ach-page ${embedded ? 'embedded' : ''}`}>
      {!embedded && (
      <header className="hub-top">
        <div className="arcade-left">
          <Link href="/" className="chip home" aria-label="Back home">
            🏠
          </Link>
          <Wallet profile={profile} />
        </div>
        <Account user={profile.user} ready={ready} />
      </header>
      )}

      {!embedded && (
        <div className="arcade-head">
          <Avatar size={64} equipped={wallet.equipped} mood={waiting ? 'annoyed' : 'smug'} className="has-legs" />
          <h1>Achievements</h1>
        </div>
      )}

      {ready && (
        <section className="ach-overview" aria-label="Your progress">
          <div className="ach-stat">
            <b>
              {claimed}
              <small>/{LEVELS}</small>
            </b>
            <span>medals</span>
          </div>
          <div className="ach-stat">
            <b>
              {earned}
              <small>/{ACHIEVEMENT_DIAMONDS}</small>
            </b>
            <span>
              <Gem size={13} /> earned
            </span>
          </div>
          <div className={`ach-stat ${waiting ? 'hot' : ''}`}>
            <b>{waiting}</b>
            <span>ready to claim</span>
          </div>
          <ChestTile onOpen={() => setChestOpen(true)} />
        </section>
      )}

      {top.length > 0 && (
        <section className="shelf ach-ready" aria-labelledby="ach-ready">
          <div className="shelf-head">
            <h2 id="ach-ready">Ready to claim</h2>
            {waiting > 0 && (
              <button className="pill claim claim-all" onClick={claimAll}>
                Claim all
                <span className="claim-all-sum">
                  +{pending} <Gem size={16} />
                </span>
              </button>
            )}
          </div>
          <ul className="ach-grid">{top.map(card)}</ul>
        </section>
      )}

      {CATEGORIES.map((cat) => (
        <section key={cat.id} className={`shelf cat-${cat.id}`} aria-labelledby={`ach-${cat.id}`}>
          <div className="shelf-head">
            <h2 id={`ach-${cat.id}`}>{cat.name}</h2>
          </div>
          <ul className="ach-grid">
            {states
              .filter((x) => x.a.cat === cat.id && !front?.has(x.a.id))
              .sort(byRank)
              .map(card)}
          </ul>
        </section>
      ))}

      {chestOpen && <ChestDialog onClose={() => setChestOpen(false)} />}
      {haul && <Haul haul={haul} onClose={() => setHaul(null)} />}
    </Wrap>
  );
}

function ChestTile({ onOpen }) {
  const chest = useChest();
  if (!chest) return null;
  return (
    <button className={`ach-chest ${chest.ready ? 'ready' : ''}`} onClick={onOpen}>
      <ChestArt big={chest.ready && isBigDay(chest.streak)} state={chest.ready ? 'closed' : 'open'} />
      <span className="ach-chest-text">
        <b>{chest.ready ? 'Daily chest ready!' : 'Chest opened today'}</b>
        <Streak streak={chest.alive} />
      </span>
    </button>
  );
}

// What Claim all got, in one go: the diamonds, and the badges they came from.
function Haul({ haul, onClose }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const shown = haul.list.slice(0, 8);
  return (
    <div className="chest-dialog" role="dialog" aria-modal="true" aria-label="Medals claimed" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="chest-card ach-haul">
        <span className="haul-rays" aria-hidden="true" />
        <p className="kicker">{haul.medals === 1 ? '1 medal claimed' : `${haul.medals} medals claimed`}</p>
        <div className="haul-gem" aria-hidden="true">
          <Gem size={72} />
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} style={{ '--a': `${i * 30}deg`, '--d': `${70 + (i % 3) * 22}px`, '--n': i }} />
          ))}
        </div>
        <h2 className="haul-sum" aria-live="polite">
          +{haul.diamonds} <Gem size={26} />
        </h2>
        <ul className="haul-badges">
          {shown.map((x, i) => (
            <li key={x.a.id} style={{ '--i': i }} title={x.a.name}>
              <Badge a={x.a} level={x.level} size={40} />
            </li>
          ))}
          {haul.list.length > shown.length && <li className="haul-more">+{haul.list.length - shown.length}</li>}
        </ul>
        <button className="pill" onClick={onClose} autoFocus>
          Nice
        </button>
      </div>
    </div>
  );
}

const prizeOf = (l) => [l.diamonds && `${l.diamonds} diamond${l.diamonds === 1 ? '' : 's'}`, l.coins && `${l.coins} coin${l.coins === 1 ? '' : 's'}`].filter(Boolean).join(' and ');

function Medal({ medal, state, level, pop }) {
  const what = state === 'got' ? 'claimed' : state === 'ready' ? 'ready to claim' : `${fmt(level.at)} for ${prizeOf(level)}`;
  return (
    <span className={`medal ${medal.id} ${state} ${pop ? 'pop' : ''}`} title={`${medal.name}: ${what}`}>
      <MedalArt medal={medal.id} state={state} />
    </span>
  );
}

function Card({ x, ready, burst, onClaim }) {
  const { a, level, value, next, claimable } = x;
  const done = !next;
  const shown = next ?? a.levels[a.levels.length - 1];
  const pct = progress(x);
  const medals = medalsOf(a);
  const medal = medals[Math.min(level, medals.length - 1)];

  return (
    <article className={`ach-card cat-${a.cat} ${claimable ? 'ready' : ''} ${done ? 'done' : ''} ${burst ? 'claimed' : ''}`} key={burst?.n}>
      <div className="ach-top">
        <span className="ach-ico">
          <Badge a={a} level={level} />
        </span>
        <div className="ach-title">
          <b>{a.name}</b>
          <span className="ach-goal">{done ? (medals.length > 1 ? 'Every medal. Show-off.' : 'Done. Nobody believed you would.') : a.goal(next.at)}</span>
        </div>
      </div>

      <div className="ach-medals" aria-label={`${level} of ${a.levels.length} medals`}>
        {medals.map((m, i) => (
          <Medal key={m.id} medal={m} level={a.levels[i]} state={i < level ? 'got' : i < level + claimable ? 'ready' : 'locked'} pop={burst && burst.level === i} />
        ))}
      </div>

      <div className="ach-progress">
        <div className="ach-bar" role="progressbar" aria-valuemin={0} aria-valuemax={shown.at} aria-valuenow={Math.min(value, shown.at)}>
          <i style={{ width: `${ready ? pct : 0}%` }} />
        </div>
        <span className="ach-count">
          {fmt(Math.min(value, shown.at))} / {fmt(shown.at)}
        </span>
      </div>

      <div className="ach-foot">
        {done ? (
          <span className="ach-reward done">Complete</span>
        ) : (
          <span className="ach-reward">
            <span className={`dot ${medal.id}`} /> {medal.name} ·{' '}
            {next.coins ? (
              <>
                +{next.coins} <Icon glyph="🪙" size={14} />
              </>
            ) : (
              <>
                +{next.diamonds} <Gem size={14} />
              </>
            )}
          </span>
        )}
        {claimable > 0 && (
          <button className="pill claim" onClick={onClaim}>
            Claim
          </button>
        )}
      </div>

      {burst && (
        <span className="ach-burst" aria-live="polite">
          <span className="ach-plus">
            +{burst.diamonds} <Gem size={20} />
          </span>
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} style={{ '--a': `${i * 36}deg`, '--d': `${60 + (i % 3) * 18}px` }}>
              {i % 2 ? <Gem size={14} /> : '✦'}
            </i>
          ))}
        </span>
      )}
    </article>
  );
}
