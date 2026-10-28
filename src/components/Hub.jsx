'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import Account from './Account';
import Wallet from './Wallet';
import Wardrobe from './Wardrobe';
import EnergyChip from '@/house/EnergyChip';
import HubPerks from '@/achievements/HubPerks';
import HomeRoom from '@/hub/HomeRoom';
import GamesPane from '@/hub/GamesPane';
import FoodPane from '@/hub/FoodPane';
import SleepPane from '@/hub/SleepPane';
import BathPane from '@/hub/BathPane';
import '@/hub/hub-panes.css';
import { useNeeds, faceOf } from '@/profile/needs';

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

// The four panels, left to right. The button starts in the living room.
const PANES = [
  { id: 'games', name: 'Games', icon: '🎮' },
  { id: 'home', name: 'Living Room', icon: '🛋️' },
  { id: 'food', name: 'Kitchen', icon: '🍳' },
  { id: 'sleep', name: 'Bedroom', icon: '🛏️' },
  { id: 'bath', name: 'Bathroom', icon: '🛁' },
];
const HOME = 1;

function greeting({ user, wallet }, face) {
  if (face.dirty === 2) return ["Do you smell that? That's me. Bathroom. Please.", 'sad'];
  if (face.mood === 'bored') return ["I'm hungry. And bored. Mostly hungry.", 'bored'];
  if (face.sleepy) return ['I did not sleep. Look at my eyes. LOOK at them.', 'tired'];
  if (wallet.coins >= 1000) return ["You're rich. Buy me something nice.", 'smug'];
  if (user) return [`Oh no. ${user.name?.split(' ')[0] || 'You'}'s back.`, 'annoyed'];
  return ["Oh. A visitor. Please don't press anything.", 'calm'];
}

// When he's neglected he says so instead of the usual poke lines.
const MOANS = {
  bored: ['Feed me and I might look less bored.', 'Nothing to do. Nothing to eat. Typical.'],
  sleepy: ['Zzz-no. I am awake. Barely.', 'My eyes feel like two raisins.'],
  dirty: ['I smell like a gym bag. Bathroom?', 'Is that a fly? It is. It lives here now.', 'I will not sleep like this. Wash me first.'],
};

export default function Hub() {
  const needs = useNeeds();
  const { profile } = needs;
  const { wallet, user, ready } = profile;
  const face = faceOf(needs);
  const [panel, setPanel] = useState(null); // null | 'wardrobe'
  const [preview, setPreview] = useState(null);
  const [line, setLine] = useState({ text: '', mood: null, n: 0 });
  const [pressed, setPressed] = useState(false);
  const [at, setAt] = useState(HOME); // the panel in view
  const pokes = useRef(0);
  const calmTimer = useRef(0);
  const pager = useRef(null);

  const say = useCallback((text, mood = 'calm') => {
    setLine((l) => ({ text, mood, n: l.n + 1 }));
    clearTimeout(calmTimer.current);
    calmTimer.current = setTimeout(() => setLine((l) => ({ ...l, mood: null })), 2600);
  }, []);

  // Say hello once we know who this is.
  const greeted = useRef(false);
  useEffect(() => {
    if (!ready || !needs.ready || greeted.current) return;
    greeted.current = true;
    say(...greeting(profile, face));
  }, [ready, needs.ready, profile, face, say]);

  // Open on Living Room, between Games and Kitchen.
  useLayoutEffect(() => {
    const el = pager.current;
    if (el) el.scrollLeft = el.clientWidth * HOME;
  }, []);

  // Which panel is in view, from the scroll position.
  const frame = useRef(0);
  const onScroll = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = pager.current;
      if (el) setAt(Math.round(el.scrollLeft / el.clientWidth));
    });
  }, []);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const go = useCallback((i) => {
    const el = pager.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: el.clientWidth * i, behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  // Keep the current panel centred when the window is resized.
  useEffect(() => {
    const fit = () => {
      const el = pager.current;
      if (el) el.scrollLeft = el.clientWidth * Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    };
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Left and right arrows move between the panels.
  useEffect(() => {
    const onKey = (e) => {
      if (panel || e.altKey || e.ctrlKey || e.metaKey || /input|textarea|select/i.test(e.target?.tagName)) return;
      const el = pager.current;
      if (!el) return;
      const here = Math.round(el.scrollLeft / el.clientWidth);
      if (e.key === 'ArrowRight' && here < PANES.length - 1) go(here + 1);
      if (e.key === 'ArrowLeft' && here > 0) go(here - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, go]);

  function poke() {
    setPressed(true);
    setTimeout(() => setPressed(false), 140);
    pokes.current++;
    if (needs.asleep) return say('Zzz… *mumbles* …not the button…', 'sleep');
    if (pokes.current % 7 === 0) return say('OKAY. Go earn some coins and leave me alone.', 'angry');
    if (face.dirty && pokes.current % 2 === 1) return say(pick(MOANS.dirty), 'sad');
    if (face.mood === 'bored' && pokes.current % 2 === 0) return say(pick(MOANS.bored), 'bored');
    if (face.sleepy && pokes.current % 3 === 0) return say(pick(MOANS.sleepy), 'tired');
    const p = pick(POKES);
    typeof p === 'string' ? say(p, 'smug') : say(...p);
  }

  const close = useCallback(() => {
    setPanel(null);
    setPreview(null);
  }, []);

  const mood = line.mood ?? face.mood;
  const equipped = preview ?? wallet.equipped;

  return (
    <main className="hub" data-panel={panel ?? undefined} data-at={PANES[at]?.id}>
      <div className={`pager ${panel ? 'locked' : ''}`} ref={pager} onScroll={onScroll}>
        <section className="pane pane-games" aria-label="Games" inert={at !== 0}>
          <GamesPane needs={needs} equipped={wallet.equipped} go={go} />
        </section>

        <section className="pane pane-home" aria-label="Living Room" inert={at !== HOME}>
          <HomeRoom />
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
                equipped={equipped}
                mood={mood}
                sleepy={face.sleepy}
                dirty={face.dirty}
                grime={face.grime}
                onClick={poke}
                aria-label="The button. It would rather you didn't."
              />
              {needs.asleep && (
                <span className="hero-zz" aria-hidden="true">
                  <i>z</i>
                  <i>z</i>
                  <i>Z</i>
                </span>
              )}
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
                <span className="ico">🛋️</span> Decorate
              </Link>
            </nav>
          )}
        </section>

        <section className="pane pane-food" aria-label="Kitchen" inert={at !== 2}>
          <FoodPane needs={needs} wallet={wallet} active={at === 2} />
        </section>

        <section className="pane pane-sleep" aria-label="Bedroom" inert={at !== 3}>
          <SleepPane needs={needs} wallet={wallet} go={go} />
        </section>

        <section className="pane pane-bath" aria-label="Bathroom" inert={at !== 4}>
          <BathPane needs={needs} wallet={wallet} active={at === 4} />
        </section>
      </div>

      <header className="hub-top">
        <div className="hub-left">
          <Wallet profile={profile} />
          <EnergyChip go={go} />
        </div>
        <Account user={user} ready={ready} />
      </header>
      {!panel && at === HOME && <HubPerks />}

      {!panel && (
        <nav className="dock" aria-label="Panels">
          {PANES.map((p, i) => {
            const alert = (p.id === 'food' && needs.hunger < 25) || (p.id === 'sleep' && needs.energy < 25 && !needs.asleep) || (p.id === 'bath' && needs.dirt >= 40);
            return (
              <button key={p.id} className={`dock-btn ${at === i ? 'on' : ''} ${alert ? 'alert' : ''}`} aria-current={at === i ? 'page' : undefined} onClick={() => go(i)}>
                <span className="dock-ico" aria-hidden="true">
                  {p.icon}
                </span>
                <span className="dock-name">{p.name}</span>
              </button>
            );
          })}
        </nav>
      )}

      {panel === 'wardrobe' && <Wardrobe wallet={wallet} onPreview={setPreview} onSay={say} onClose={close} />}
    </main>
  );
}
