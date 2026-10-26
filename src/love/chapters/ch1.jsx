'use client';

// Chapter 1: The Loneliest Button Alive.
// Every level gets { win(line), fail(line), say(text, mood), fails } and
// fills the stage (.lv is absolutely positioned over the whole play area).

import { useEffect, useRef, useState } from 'react';
import { Bobby, Bubble, Drag, over, useFrame, useLater, useEvery, rand, pick, shuffle, sfx } from '../kit';

/* ---------- 1. 404: Girlfriend Not Found ---------- */
const newZone = (w) => ({ at: rand(0.15, 0.85 - w), w });

function HeartReboot({ win, say }) {
  const [step, setStep] = useState('check'); // check | error | reboot | alive
  const [hits, setHits] = useState(0);
  const [pos, setPos] = useState(0);
  const [zone, setZone] = useState(() => newZone(0.16));
  const dir = useRef(1);
  const speed = useRef(0.6);
  const later = useLater();

  useFrame((dt) => {
    setPos((p) => {
      let n = p + dir.current * speed.current * dt;
      if (n > 1) [n, dir.current] = [1, -1];
      if (n < 0) [n, dir.current] = [0, 1];
      return n;
    });
  }, step === 'reboot');

  function shock() {
    if (step !== 'reboot') return;
    if (pos >= zone.at && pos <= zone.at + zone.w) {
      const n = hits + 1;
      setHits(n);
      sfx.heart();
      speed.current += 0.25;
      if (n === 3) {
        setStep('alive');
        say("IT'S ALIVE. IT BEATS. Now find it a girlfriend.", 'smug');
        later(() => win('My heart works! It just has nobody to beat for. Yet.'), 1600);
      } else {
        say(['Ba-dump! Again!', 'BA-DUMP. One more!'][n - 1], 'smug');
        setZone(newZone(0.16 - n * 0.03));
      }
    } else {
      sfx.zap();
      say(pick(['OW. That was my kidney.', "That's not my heart, that's my elbow.", 'I felt that in my firmware.']), 'angry');
    }
  }

  useEffect(() => {
    const key = (e) => (e.code === 'Space' || e.code === 'Enter') && (e.preventDefault(), shock());
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  return (
    <div className="lv center">
      <Bobby size={150} mood={step === 'alive' ? 'smug' : 'sad'} love={step === 'alive'} tears={step === 'error'}>
        <button
          className={`chest-heart ${step === 'alive' ? 'beating' : ''}`}
          onClick={() => {
            if (step !== 'check') return;
            sfx.bad();
            setStep('error');
            say('Error?? ERROR??', 'scared');
          }}
          aria-label="Bobby's heart"
        >
          {step === 'check' ? '🩶' : step === 'alive' ? '❤️' : '💔'}
        </button>
        {step === 'check' && <Bubble>Click my heart. Is it working?</Bubble>}
      </Bobby>

      {step === 'error' && (
        <div className="win-dialog">
          <div className="win-bar">⚠️ heart.exe</div>
          <p>
            <b>LOVE_NOT_FOUND</b> (0x404)
            <br />
            This heart has never been used.
          </p>
          <button className="pill love-btn" onClick={() => (setStep('reboot'), say('Reboot it! Shock me when the pulse is green!', 'scared'))}>
            Reboot heart
          </button>
        </div>
      )}

      {step === 'reboot' && (
        <>
          <div className="ecg" onPointerDown={shock}>
            <span className="zone" style={{ left: `${zone.at * 100}%`, width: `${zone.w * 100}%` }} />
            <span className="marker" style={{ left: `${pos * 100}%` }} />
          </div>
          <div className="row">
            <span className="beats">{'❤️'.repeat(hits)}{'🖤'.repeat(3 - hits)}</span>
            <button className="pill love-btn big" onClick={shock}>
              ⚡ Shock
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- 2. Give Me a Glow-Up ---------- */
const GLOW = [
  { id: 'hair', label: 'Hair', icon: '🍝', line: "It's spaghetti. Italian. Extremely romantic." },
  { id: 'shades', label: 'Sunglasses', icon: '🕶️', line: "I can't see anything. I look incredible." },
  { id: 'stache', label: 'Mustache', icon: <span className="stache" />, line: 'Instant 45 years old. Women love a mortgage.' },
  { id: 'shoes', label: 'Shoes', icon: '👠', line: 'Heels. I am finally 50 pixels tall.' },
];

function GlowUp({ win, say }) {
  const [worn, setWorn] = useState([]);
  const me = useRef(null);
  const later = useLater();

  function wear(item) {
    const next = [...worn, item.id];
    setWorn(next);
    sfx.pop();
    say(item.line, 'smug');
    if (next.length === GLOW.length) later(() => win("I'm a 14 out of 10. Society isn't ready."), 1400);
  }

  return (
    <div className="lv glow">
      <div className="glow-bobby" ref={me}>
        <Bobby size={170} mood={worn.length ? 'smug' : 'calm'} className="dropzone">
          {worn.includes('hair') && <span className="acc hair">🍝</span>}
          {worn.includes('shades') && <span className="acc shades">🕶️</span>}
          {worn.includes('stache') && <span className="acc stache-on"><span className="stache" /></span>}
          {worn.includes('shoes') && (
            <span className="acc shoes">
              <i>👠</i>
              <i>👠</i>
            </span>
          )}
        </Bobby>
        <div className="ratings">
          <span>
            Bobby says: <b>{10 + worn.length}/10</b>
          </span>
          <span>
            Everyone else: <b>{Math.max(1, 4 - worn.length)}/10</b>
          </span>
        </div>
      </div>
      <div className="shelf">
        {GLOW.filter((g) => !worn.includes(g.id)).map((g) => (
          <Drag key={g.id} className="item" onDrop={(pt) => over(pt, me.current) && (wear(g), false)} onPick={() => say(`Ooh. ${g.label}. Put it on me.`)}>
            <span className="icon">{g.icon}</span>
            <span>{g.label}</span>
          </Drag>
        ))}
      </div>
    </div>
  );
}

/* ---------- 3. Take My Dating Profile Picture ---------- */
const POSES = [
  { mood: 'smug', rot: -12, line: 'Smolder.' },
  { mood: 'scared', rot: 8, line: 'Candid!' },
  { mood: 'angry', rot: 0, line: 'Mysterious and dangerous.' },
  { mood: 'calm', rot: 20, line: 'Casual lean.' },
  { mood: 'tired', rot: -25, line: 'Sleepy but hot.' },
  { mood: 'sad', rot: 4, line: 'Deep. Poetic.' },
];

function ProfilePic({ win, fail, say }) {
  const [at, setAt] = useState({ x: 50, y: 50, pose: POSES[0] });
  const [shots, setShots] = useState([]);
  const [flash, setFlash] = useState(0);
  const [picked, setPicked] = useState(null);
  const frame = useRef(null);
  const me = useRef(null);
  const later = useLater();
  const done = shots.length >= 3;

  useEvery(() => setAt({ x: rand(12, 88), y: rand(18, 80), pose: pick(POSES) }), done ? null : 750);

  function snap() {
    if (done) return;
    sfx.shutter();
    setFlash((f) => f + 1);
    const f = frame.current.getBoundingClientRect();
    const b = me.current.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    const inFrame = cx > f.left && cx < f.right && cy > f.top && cy < f.bottom;
    const miss = Math.hypot(cx - (f.left + f.width / 2), cy - (f.top + f.height / 2));
    const next = [...shots, { ...at, inFrame, miss }];
    setShots(next);
    say(inFrame ? at.pose.line : "I wasn't even in that one!", inFrame ? 'smug' : 'annoyed');
    if (next.length < 3) return;
    if (!next.some((s) => s.inFrame)) return later(() => fail("I'm not in ANY of these. That's three pictures of a wall."), 900);
    const worst = next.reduce((a, s, i) => (s.miss > next[a].miss ? i : a), 0);
    later(() => {
      setPicked(worst);
      say('THIS ONE. Mysterious. Iconic. Mostly forehead.', 'smug');
    }, 900);
    later(() => win('My new profile picture. I can feel the matches coming.'), 2600);
  }

  return (
    <div className="lv photo" onPointerDown={(e) => e.target.closest('.shutter, .film') || snap()}>
      <div className="viewfinder" ref={frame}>
        <i />
        <i />
        <i />
        <i />
      </div>
      {!done && (
        <div className="poser" ref={me} style={{ left: `${at.x}%`, top: `${at.y}%`, rotate: `${at.pose.rot}deg` }}>
          <Bobby size={90} mood={at.pose.mood} />
        </div>
      )}
      {flash > 0 && <div className="camera-flash" key={flash} />}
      <div className="film">
        {shots.map((s, i) => (
          <figure key={i} className={`polaroid ${picked === i ? 'fav' : ''} ${s.inFrame ? '' : 'blurry'}`}>
            <span style={{ rotate: `${s.pose.rot}deg` }}>
              <Bobby size={40} mood={s.pose.mood} legs={false} />
            </span>
            <figcaption>{picked === i ? '⭐ FAVORITE' : s.inFrame ? s.pose.line : 'blurry'}</figcaption>
          </figure>
        ))}
        {!done && (
          <button className="shutter" onClick={snap} aria-label="Take photo">
            📸
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- 4. The Worst Bio Ever Written ---------- */
const BIO = [
  { lead: 'I am a…', options: ['Professional button', 'Emotionally clickable', 'Part-time doorbell'] },
  { lead: 'Looking for…', options: ['A long-term press', 'Someone to hold my cursor', 'Literally anyone'] },
  { lead: 'My love language is…', options: ['Being pressed', 'Error messages', 'Aggressive clicking'] },
  { lead: 'Red flag:', options: ['I have no off switch', 'Sometimes I am a link', 'I cry at loading screens'] },
];
const BIO_REACT = ['Accurate.', 'Bold. I like it.', 'Women love honesty.', "Wow. You get me.", 'Inspirational.'];

function WorstBio({ win, say }) {
  const [picks, setPicks] = useState({});
  const [posted, setPosted] = useState(false);
  const later = useLater();
  const full = BIO.every((_, i) => picks[i]);

  return (
    <div className="lv bio">
      <div className="profile-card">
        <div className="pc-head">
          <Bobby size={64} mood={posted ? 'smug' : 'calm'} legs={false} />
          <div>
            <b>Bobby, 404</b>
            <span>📍 Middle of the page</span>
          </div>
        </div>
        {BIO.map((row, i) => (
          <div key={i} className="bio-row">
            <span className="lead">{row.lead}</span>
            <span className={`fill ${picks[i] ? 'set' : ''}`}>{picks[i] ?? '______'}</span>
          </div>
        ))}
        {posted && <div className="stamp">PUBLISHED</div>}
      </div>

      {!posted && (
        <div className="chips">
          {BIO.map((row, i) => (
            <div key={i} className="chip-group">
              <small>{row.lead}</small>
              {row.options.map((o) => (
                <button
                  key={o}
                  className={`chip-btn ${picks[i] === o ? 'on' : ''}`}
                  onClick={() => {
                    sfx.click(i * 10);
                    setPicks((p) => ({ ...p, [i]: o }));
                    say(pick(BIO_REACT), 'smug');
                  }}
                >
                  {o}
                </button>
              ))}
            </div>
          ))}
          <button
            className="pill love-btn"
            disabled={!full}
            onClick={() => {
              setPosted(true);
              sfx.ding();
              say('Published. 4 billion people can read this now. Perfect.', 'smug');
              later(() => win('That bio is a masterpiece. Shakespeare wishes.'), 1600);
            }}
          >
            Publish bio
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- 5. Zero Matches ---------- */
const FAKE = [
  '🔋 Battery at 2%',
  '💌 0 new matches',
  '🔥 Hot buttons in your area (scam)',
  '📰 Local button still single, sources say',
  '⬆️ Update available: Love 2.0 (not compatible)',
  '💧 Reminder: drink water',
  '👀 Someone viewed your profile (it was you)',
  '🗓️ Reminder: you are alone',
  '🧾 Your free trial of love has ended',
  '📦 Your package is delayed. Like your love life.',
  '🤖 A bot liked your photo',
  '🧓 Grandma: "any girlfriends yet?"',
];
const NEEDED = 10;
const MAX_PILE = 7;

function ZeroMatches({ win, fail, say }) {
  const [notes, setNotes] = useState([]);
  const [cleared, setCleared] = useState(0);
  const [match, setMatch] = useState(false);
  const deck = useRef(shuffle(FAKE));
  const n = useRef(0);
  const later = useLater();

  useEvery(
    () => {
      const text = deck.current[n.current++ % deck.current.length];
      const next = [{ id: n.current, text }, ...notes];
      setNotes(next);
      sfx.tick();
      if (next.length > MAX_PILE) fail('My phone died. Of embarrassment.');
    },
    match || cleared >= NEEDED || notes.length > MAX_PILE ? null : Math.max(550, 1100 - cleared * 50)
  );

  function dismiss(id) {
    sfx.swoosh();
    setNotes((list) => list.filter((x) => x.id !== id));
    const c = cleared + 1;
    setCleared(c);
    if (c === 4) say('Keep going. A match is coming. I can feel it in my circuits.', 'smug');
    if (c === NEEDED) {
      setNotes([]);
      say('Wait. WAIT. Something is happening!', 'scared');
      later(() => (setMatch(true), sfx.win()), 900);
    }
  }

  return (
    <div className="lv zero">
      <div className="side-bobby">
        <Bobby size={110} mood={match ? 'smug' : 'tired'} sweat={!match} love={match} />
        <span className="refresh">{match ? '' : '🔄 refreshing…'}</span>
      </div>
      <div className="phone">
        <div className="phone-top">
          <span>9:41</span>
          <b>BtnDr</b>
          <span>📶</span>
        </div>
        {!match ? (
          <ul className="notes">
            {notes.map((x) => (
              <li key={x.id} onClick={() => dismiss(x.id)}>
                <span>{x.text}</span>
                <button aria-label="Dismiss">✕</button>
              </li>
            ))}
            {!notes.length && <li className="empty">No notifications. Like always.</li>}
          </ul>
        ) : (
          <div className="its-a-match">
            <p>✨ IT&apos;S A MATCH ✨</p>
            <div className="pair">
              <Bobby size={60} love legs={false} />
              <span className="fridge">
                🧊<small>Fridge Button</small>
              </span>
            </div>
            <q>I keep things cool.</q>
            <button className="pill love-btn" onClick={() => win("She's perfect. She's so cold. I can fix her.")}>
              Say hi
            </button>
          </div>
        )}
        <div className="phone-count">
          {Math.min(cleared, NEEDED)} / {NEEDED} cleared
        </div>
      </div>
    </div>
  );
}

const chapter1 = { 1: HeartReboot, 2: GlowUp, 3: ProfilePic, 4: WorstBio, 5: ZeroMatches };
export default chapter1;
