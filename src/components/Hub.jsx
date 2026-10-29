'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Account from './Account';
import Wallet from './Wallet';
import Wardrobe from './Wardrobe';
import Icon from './Icon';
import EnergyChip from '@/house/EnergyChip';
import HubPerks from '@/achievements/HubPerks';
import RoomScene, { skyOf } from '@/hub/RoomScene';
import DecorSheet from '@/house/DecorSheet';
import GamesPane from '@/hub/GamesPane';
import FoodPane from '@/hub/FoodPane';
import SleepPane from '@/hub/SleepPane';
import BathPane from '@/hub/BathPane';
import BuySheet from '@/hub/BuySheet';
import WakeSheet from '@/hub/WakeSheet';
import PotionSheet from '@/hub/PotionSheet';
import '@/hub/hub-panes.css';
import '@/hub/flat.css';
import { useNeeds, faceOf } from '@/profile/needs';
import { roomOf } from '@/economy/house';

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
  { id: 'home', name: 'Living Room', short: 'Living', icon: '🛋️' },
  { id: 'food', name: 'Kitchen', icon: '🍳' },
  { id: 'sleep', name: 'Bedroom', icon: '🛏️' },
  { id: 'bath', name: 'Bathroom', icon: '🛁' },
];
const HOME = 1;

// Which panel the page opens on. A fresh visit to `/` is always the Living
// Room. Coming back with the browser's Back button (from a game or the story)
// returns to the panel he left from, which is kept per tab in sessionStorage.
const PANE_KEY = 'bhy.pane';
const indexOf = (id) => PANES.findIndex((p) => p.id === id);
let traversedAt = 0; // the last Back/Forward within this page (soft navigation)
let documentLoad = true; // the first Hub of this document may be a Back reload
if (typeof window !== 'undefined') window.addEventListener('popstate', () => (traversedAt = Date.now()));

function cameBack() {
  const soft = Date.now() - traversedAt < 4000;
  traversedAt = 0;
  let hard = false;
  if (documentLoad) {
    try {
      hard = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
    } catch {}
  }
  documentLoad = false;
  return soft || hard;
}
const savedPane = () => {
  try {
    return indexOf(sessionStorage.getItem(PANE_KEY));
  } catch {
    return -1;
  }
};
const savePane = (i) => {
  try {
    sessionStorage.setItem(PANE_KEY, PANES[i].id);
  } catch {}
};

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

// `initial`: the panel to open on ('games' for /games, otherwise the living room).
export default function Hub({ initial = 'home' }) {
  const needs = useNeeds();
  const { profile } = needs;
  const { wallet, user, ready } = profile;
  const face = faceOf(needs);
  const [panel, setPanel] = useState(null); // null | 'wardrobe' | 'decor' | 'buy' | 'wake' | 'potions'
  const [decor, setDecor] = useState(null); // the room being decorated
  const [decorView, setDecorView] = useState(null); // { house, at }: what is being tried in it
  const [sky, setSky] = useState('day');
  const [preview, setPreview] = useState(null);
  const [line, setLine] = useState({ text: '', mood: null, n: 0 });
  const [at, setAt] = useState(Math.max(0, indexOf(initial))); // the panel in view
  const [quip, setQuip] = useState(null); // a remark a sheet makes in a room: { pane, text, n }
  const pokes = useRef(0);
  const calmTimer = useRef(0);
  const pager = useRef(null);

  const say = useCallback((text, mood = 'calm') => {
    setLine((l) => ({ text, mood, n: l.n + 1 }));
    clearTimeout(calmTimer.current);
    calmTimer.current = setTimeout(() => setLine((l) => ({ ...l, mood: null })), 2600);
  }, []);

  // The windows show the real time of day.
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setSky(skyOf(d.getHours() + d.getMinutes() / 60));
    };
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);

  // Say hello once we know who this is.
  const greeted = useRef(false);
  useEffect(() => {
    if (!ready || !needs.ready || greeted.current) return;
    greeted.current = true;
    say(...greeting(profile, face));
  }, [ready, needs.ready, profile, face, say]);

  // Open on the panel asked for, before the first paint. Only a Back
  // navigation to the living room returns to where he was.
  useLayoutEffect(() => {
    const el = pager.current;
    if (!el) return;
    let i = Math.max(0, indexOf(initial));
    if (initial === 'home' && cameBack() && savedPane() >= 0) i = savedPane();
    el.scrollLeft = el.clientWidth * i;
    setAt(i);
    savePane(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Which panel is in view, from the scroll position.
  const frame = useRef(0);
  const onScroll = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = pager.current;
      if (!el) return;
      const i = Math.min(PANES.length - 1, Math.max(0, Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
      setAt(i);
      savePane(i);
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
    setDecor(null);
    setDecorView(null);
  }, []);

  // Decorating a room: the sheet opens, the panel stays on that room and
  // shows whatever is being tried in it.
  const openDecor = useCallback((room) => {
    setDecor(room);
    setDecorView(null);
    setPanel('decor');
  }, []);
  const tryingIn = (room) => (panel === 'decor' && decor === room ? decorView : null);
  const houseOf = (room) => tryingIn(room)?.house ?? roomOf(wallet, room);

  const roomSay = useCallback((pane, text) => setQuip({ pane, text, n: Date.now() }), []);

  const mood = line.mood ?? face.mood;
  const equipped = preview ?? wallet.equipped;

  return (
    <main className="hub" data-panel={panel ?? undefined} data-at={PANES[at]?.id}>
      <div className={`pager ${panel ? 'locked' : ''}`} ref={pager} onScroll={onScroll}>
        <section className="pane pane-games" aria-label="Games" inert={at !== 0}>
          <GamesPane needs={needs} equipped={wallet.equipped} go={go} />
        </section>

        <section className="pane pane-room pane-home" aria-label="Living Room" inert={at !== HOME}>
          <RoomScene
            kind="living"
            sky={sky}
            house={houseOf('living')}
            preview={tryingIn('living')?.at}
            equipped={equipped}
            mood={mood}
            sleepy={face.sleepy}
            dirty={face.dirty}
            grime={face.grime}
            asleep={needs.asleep}
            line={line}
            onPoke={poke}
            tray={
              <nav className="rs-pills" aria-label="Living room">
                <button className="pill play" onClick={() => go(0)} style={{ '--i': 0 }}>
                  <Icon glyph="🎮" size={18} tint="currentColor" /> Play
                </button>
                <button className="pill alt" onClick={() => setPanel('wardrobe')} style={{ '--i': 1 }}>
                  <Icon glyph="👕" size={18} tint="currentColor" /> Wardrobe
                </button>
                <Link className="pill story-btn" href="/story" style={{ '--i': 2 }}>
                  <Icon glyph="📚" size={18} tint="currentColor" /> Story
                </Link>
                <button className="pill house-btn" onClick={() => openDecor('living')} style={{ '--i': 3 }}>
                  <Icon glyph="🛋️" size={18} tint="currentColor" /> Decorate
                </button>
              </nav>
            }
          />
        </section>

        <section className="pane pane-room pane-food" aria-label="Kitchen" inert={at !== 2}>
          <FoodPane needs={needs} wallet={wallet} active={at === 2} sky={sky} view={tryingIn('kitchen')} quip={quip} onDecorate={() => openDecor('kitchen')} onBuy={() => setPanel('buy')} onPotions={() => setPanel('potions')} />
        </section>

        <section className="pane pane-room pane-sleep" aria-label="Bedroom" inert={at !== 3}>
          <SleepPane needs={needs} wallet={wallet} go={go} sky={sky} view={tryingIn('bedroom')} quip={quip} onDecorate={() => openDecor('bedroom')} onWake={() => setPanel('wake')} onPotions={() => setPanel('potions')} />
        </section>

        <section className="pane pane-room pane-bath" aria-label="Bathroom" inert={at !== 4}>
          <BathPane needs={needs} wallet={wallet} active={at === 4} sky={sky} onPotions={() => setPanel('potions')} />
        </section>
      </div>

      <header className="hub-top">
        <div className="hub-left">
          <Wallet profile={profile} compact />
          <EnergyChip go={go} compact />
        </div>
        <div className="hub-right">
          <HubPerks compact />
          <Account user={user} ready={ready} />
        </div>
      </header>

      {!panel && (
        <nav className="dock" aria-label="Panels">
          {PANES.map((p, i) => {
            const alert = (p.id === 'food' && needs.hunger < 25) || (p.id === 'sleep' && needs.energy < 25 && !needs.asleep) || (p.id === 'bath' && needs.dirt >= 40);
            return (
              <button key={p.id} className={`dock-btn ${at === i ? 'on' : ''} ${alert ? 'alert' : ''}`} aria-current={at === i ? 'page' : undefined} aria-label={p.name + (alert ? ', needs attention' : '')} onClick={() => go(i)}>
                <span className="dock-ico" aria-hidden="true">
                  <Icon glyph={p.icon} size={20} tint="currentColor" />
                </span>
                <span className="dock-name">{p.short ?? p.name}</span>
              </button>
            );
          })}
        </nav>
      )}

      {panel === 'wardrobe' && <Wardrobe wallet={wallet} onPreview={setPreview} onSay={say} onClose={close} />}
      {panel === 'buy' && <BuySheet wallet={wallet} onClose={close} />}
      {panel === 'wake' && <WakeSheet wallet={wallet} asleep={needs.asleep} onSay={(t) => roomSay('sleep', t)} onClose={close} />}
      {panel === 'potions' && <PotionSheet wallet={wallet} needs={needs} onSay={(t) => roomSay(PANES[at]?.id, t)} onClose={close} />}
      {panel === 'decor' && decor && <DecorSheet room={decor} wallet={wallet} onPreview={setDecorView} onClose={close} />}
    </main>
  );
}
