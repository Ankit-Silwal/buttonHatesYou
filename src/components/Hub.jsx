'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Wallet from './Wallet';
import Avatar from './Avatar';
import Wardrobe from './Wardrobe';
import Icon from './Icon';
import Loading from './Loading';
import { LevelRing } from '@/levels/LevelChip';
import NeedRings from '@/hub/NeedRings';
import { ChestButton } from '@/achievements/HubPerks';
import Welcome from '@/profile/Welcome';
import { useMe } from '@/profile/me';
import { voiceOf } from '@/avatar/voices';
import { useUndressed, worn } from '@/profile/undress';
import { readyCount } from '@/economy/achievements';
import RoomScene, { skyOf } from '@/hub/RoomScene';
import DecorSheet from '@/house/DecorSheet';
import GamesPane from '@/hub/GamesPane';
import FoodPane from '@/hub/FoodPane';
import SleepPane from '@/hub/SleepPane';
import BathPane from '@/hub/BathPane';
import BuySheet from '@/hub/BuySheet';
import WakeSheet from '@/hub/WakeSheet';
import PotionSheet from '@/hub/PotionSheet';
import LayoutEditor from '@/hub/LayoutEditor';
import { useHubLayout } from '@/hub/layout';
import '@/hub/hub-panes.css';
import '@/house/chip.css';
import '@/hub/flat.css';
import { useNeeds, faceOf } from '@/profile/needs';
import { useMimic } from '@/hub/mimic';
import { roomOf } from '@/economy/house';
import { placePiece, unplacePiece } from '@/profile/store';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const SLAPS_TO_FALL = 6; // this many taps in SLAP_WINDOW_MS knocks him over
const SLAP_WINDOW_MS = 3000;
const FALL_MS = 2600;
// The ways a flurry of slaps knocks him over (each a CSS animation, see
// .hero[data-fall] in hub/scene.css), with what he says about it.
const FALLS = [
  ['topple', (who) => `OW. I fell over. Happy now, ${who}?`],
  ['topple-left', () => 'Timber. That was me. I was the tree.'],
  ['backflip', () => 'I did a backflip. Against my will.'],
  ['faceplant', () => 'Floor. Face. Friends now.'],
  ['spin', () => 'The room is spinning. Or I am. Both.'],
  ['bounce', () => 'I BOUNCED. Buttons should not bounce.'],
  ['pancake', () => 'I am a pancake now. A sad, flat pancake.'],
  ['roll', () => 'Rolling away from you. Forever. Okay, coming back.'],
  ['upside', (who) => `Upside down. Thanks, ${who}. Really.`],
  ['slip', () => 'Who left a banana peel in the LIVING ROOM?'],
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

function greeting({ user, wallet }, face, name) {
  if (face.dirty === 2) return ["Do you smell that? That's me. Bathroom. Please.", 'sad'];
  if (face.mood === 'bored') return [wallet.equipped?.char && wallet.equipped.char !== 'char-bobby' ? pick(voiceOf(wallet.equipped).hungry) : "I'm hungry. And bored. Mostly hungry.", 'bored'];
  if (face.sleepy) return ['I did not sleep. Look at my eyes. LOOK at them.', 'tired'];
  if (wallet.coins >= 1000) return ["You're rich. Buy me something nice.", 'smug'];
  // otherwise, however the character he's playing says hello (avatar/voices.js)
  return voiceOf(wallet.equipped).greet(name || user?.name?.split(' ')[0]);
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
  const [potionFor, setPotionFor] = useState(null); // the potion the shop points out
  const [decorView, setDecorView] = useState(null); // { house, at }: what is being tried in it
  const [sky, setSky] = useState('day');
  const [preview, setPreview] = useState(null);
  const [line, setLine] = useState({ text: '', mood: null, n: 0 });
  const [at, setAt] = useState(Math.max(0, indexOf(initial))); // the panel in view
  const [quip, setQuip] = useState(null); // a remark a sheet makes in a room: { pane, text, n }
  const pokes = useRef(0);
  const me = useMe();
  const calmTimer = useRef(0);
  const pager = useRef(null);
  const layout = useHubLayout(); // where the controls sit (Settings → Layout)

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
    say(...greeting(profile, face, me?.name));
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

  // Tapping him is a slap: he's hurt and says so, and a flurry of slaps
  // knocks him over. Stroking him makes him happy.
  const slaps = useRef([]);
  const [fallen, setFallen] = useState(null); // which of FALLS, while he's down
  const [hearts, setHearts] = useState(0);
  const fallTimer = useRef(0);
  const lastFall = useRef(null);
  const fallDeck = useRef([]);
  useEffect(() => () => clearTimeout(fallTimer.current), []);
  const who = me?.name || 'you';

  function poke() {
    if (fallen) return;
    pokes.current++;
    if (needs.asleep) return say('Zzz… *mumbles* …not the button…', 'sleep');
    const now = Date.now();
    slaps.current = [...slaps.current.filter((t) => now - t < SLAP_WINDOW_MS), now];
    if (slaps.current.length >= SLAPS_TO_FALL) {
      slaps.current = [];
      // a shuffled deck: every fall once before any comes round again
      if (!fallDeck.current.length) fallDeck.current = [...FALLS].sort(() => Math.random() - 0.5).filter((f, i) => i || f[0] !== lastFall.current);
      const [id, line] = fallDeck.current.pop();
      lastFall.current = id;
      setFallen(id);
      say(line(who), 'sad');
      clearTimeout(fallTimer.current);
      fallTimer.current = setTimeout(() => {
        setFallen(null);
        say('I am getting up. Slowly. With dignity.', 'annoyed');
      }, FALL_MS);
      return;
    }
    if (face.dirty && pokes.current % 3 === 1) return say(pick(MOANS.dirty), 'sad');
    if (face.mood === 'bored' && pokes.current % 3 === 2) return say(pick(MOANS.bored), 'bored');
    if (face.sleepy && pokes.current % 4 === 0) return say(pick(MOANS.sleepy), 'tired');
    const voice = voiceOf(wallet.equipped);
    if (pokes.current % 4 === 0) return say(voice.slap(who), 'sad');
    say(...pick(voice.pokes));
  }

  function pat() {
    if (fallen || needs.asleep) return;
    slaps.current = [];
    say(pick(voiceOf(wallet.equipped).pats), 'happy');
    setHearts((h) => h + 1);
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
  // While decorating, the room's furniture can be dragged around. A drop
  // that can't be placed (a piece being previewed, not bought yet) moves the
  // preview instead.
  const [moved, setMoved] = useState(null);
  const editor = useMemo(
    () =>
      decor && {
        onMove: (item, x, y) => {
          if (!placePiece(item, x, y, decor)) setMoved({ item, x, y, n: Date.now() });
        },
        onRemove: (item) => unplacePiece(item, decor),
      },
    [decor]
  );
  const editIn = (room) => (panel === 'decor' && decor === room ? editor : null);
  const houseOf = (room) => tryingIn(room)?.house ?? roomOf(wallet, room);

  const roomSay = useCallback((pane, text) => setQuip({ pane, text, n: Date.now() }), []);

  // He copies what you say (the mic button in the living room).
  const [talking, setTalking] = useState(false);
  const mimic = useMimic({
    onHear: () => say('…', 'calm'),
    onTalk: () => {
      setTalking(true);
      setLine((l) => ({ ...l, text: '', mood: 'smug' }));
    },
    onDone: () => {
      setTalking(false);
      say(pick(voiceOf(wallet.equipped).mimic), 'smug');
    },
  });
  const mimicWas = useRef('off');
  useEffect(() => {
    if (mimic.state === 'denied') say("I can't hear you. You didn't let me use the mic.", 'annoyed');
    if (mimic.state === 'unsupported') say('This browser has no ears. Neither do I.', 'annoyed');
    if (mimic.state === 'listening' && mimicWas.current === 'asking') say('Go on. Say something.', 'smug');
    mimicWas.current = mimic.state;
  }, [mimic.state, say]);
  // Only in the living room, and not while a sheet is open or the tab is hidden.
  const mimicOff = mimic.off;
  useEffect(() => {
    if (at !== HOME || panel || needs.asleep) mimicOff();
  }, [at, panel, needs.asleep, mimicOff]);
  useEffect(() => {
    const hide = () => document.hidden && mimicOff();
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [mimicOff]);

  const mood = line.mood ?? face.mood;
  // what he's actually wearing: nothing, while his clothes are on the bathroom stand
  const off = useUndressed();
  const wearing = worn(wallet.equipped, off);
  const shown = off ? { ...wallet, equipped: wearing } : wallet; // for the rooms
  const equipped = preview ?? wearing;

  return (
    <main className="hub" data-panel={panel ?? undefined} data-at={PANES[at]?.id} {...layout}>
      <div className={`pager ${panel ? 'locked' : ''}`} ref={pager} onScroll={onScroll}>
        <section className="pane pane-games" aria-label="Games" inert={at !== 0}>
          <GamesPane needs={needs} equipped={wearing} go={go} active={at === 0} />
        </section>

        <section className="pane pane-room pane-home" aria-label="Living Room" inert={at !== HOME}>
          <RoomScene
            kind="living"
            sky={sky}
            house={houseOf('living')}
            preview={tryingIn('living')?.at}
            edit={editIn('living')}
            equipped={equipped}
            mood={mood}
            sleepy={face.sleepy}
            dirty={face.dirty}
            grime={face.grime}
            asleep={needs.asleep}
            line={line}
            onPoke={poke}
            onPat={pat}
            hearts={hearts}
            pose={fallen ? 'fallen' : needs.hunger < 25 && !needs.asleep ? 'tummy' : undefined}
            fall={fallen ?? undefined}
            talking={talking}
            extras={
              me?.mic !== false && <button
                type="button"
                className={`mic-btn ${mimic.state}`}
                onClick={mimic.toggle}
                disabled={needs.asleep}
                aria-pressed={mimic.on}
                aria-label={mimic.on ? 'Stop him copying you' : 'Let him copy what you say (uses the microphone)'}
              >
                <Icon glyph="🎤" size={24} tint="currentColor" />
                {mimic.state === 'denied' && <i className="mic-x" aria-hidden="true" />}
              </button>
            }
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
          <FoodPane needs={needs} wallet={shown} active={at === 2} sky={sky} view={tryingIn('kitchen')} edit={editIn('kitchen')} quip={quip} onDecorate={() => openDecor('kitchen')} onBuy={() => setPanel('buy')} onPotions={(id) => (setPotionFor(id ?? null), setPanel('potions'))} />
        </section>

        <section className="pane pane-room pane-sleep" aria-label="Bedroom" inert={at !== 3}>
          <SleepPane needs={needs} wallet={shown} go={go} active={at === 3} sky={sky} view={tryingIn('bedroom')} edit={editIn('bedroom')} quip={quip} onDecorate={() => openDecor('bedroom')} onWake={() => setPanel('wake')} onPotions={(id) => (setPotionFor(id ?? null), setPanel('potions'))} />
        </section>

        <section className="pane pane-room pane-bath" aria-label="Bathroom" inert={at !== 4}>
          <BathPane needs={needs} wallet={wallet} active={at === 4} sky={sky} />
        </section>
      </div>

      <header className="hub-top">
        <div className="hub-left">
          <LevelRing go={go} openWardrobe={() => setPanel('wardrobe')} openDecor={openDecor} openFood={() => setPanel('buy')}>
            <Link href={ready && readyCount(wallet) ? '/profile#achievements' : '/profile'} className="profile-btn" aria-label={`Profile${me?.name ? `: ${me.name}` : ''}`}>
              <Avatar size={44} equipped={wearing} mood="smug" />
              {ready && readyCount(wallet) > 0 && <span className="perk-badge">{readyCount(wallet)}</span>}
            </Link>
          </LevelRing>
          <Wallet profile={profile} compact />
        </div>
      </header>

      <NeedRings go={go} equipped={wallet.equipped}>
        <ChestButton />
      </NeedRings>

      {ready && <Welcome equipped={wallet.equipped} onDone={(n) => say(`${n}. Great. I'll remember that. Unfortunately.`, 'annoyed')} />}

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

      {panel === 'wardrobe' && <Wardrobe wallet={wallet} undressed={off} onPreview={setPreview} onSay={say} onClose={close} onBath={() => (close(), go(4))} />}
      {panel === 'buy' && <BuySheet wallet={wallet} onClose={close} />}
      {panel === 'wake' && <WakeSheet wallet={wallet} asleep={needs.asleep} onSay={(t) => roomSay('sleep', t)} onClose={close} />}
      {panel === 'potions' && <PotionSheet wallet={wallet} needs={needs} target={potionFor} onSay={(t) => roomSay(PANES[at]?.id, t)} onClose={close} />}
      {panel === 'decor' && decor && <DecorSheet room={decor} wallet={wallet} onPreview={setDecorView} moved={moved} onClose={close} />}

      <LayoutEditor />
      <Loading done={ready && needs.ready} />
    </main>
  );
}
