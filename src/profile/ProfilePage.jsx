'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import Account from '@/components/Account';
import Wallet from '@/components/Wallet';
import Icon from '@/components/Icon';
import Achievements from '@/achievements/Achievements';
import LevelRoad from '@/levels/LevelRoad';
import { useProfile } from './useProfile';
import { useMe, setMe } from './me';
import { readyCount } from '@/economy/achievements';
import { isCode, usedCode } from '@/economy/codes';
import { redeemCode } from './store';
import './profile.css';

const TABS = [
  { id: 'me', name: 'Profile', icon: '👕' },
  { id: 'levels', name: 'Levels', icon: '⭐' },
  { id: 'achievements', name: 'Achievements', icon: '🏆' },
  { id: 'settings', name: 'Settings', icon: '⚙️' },
];

// The profile: who you are (name, player id, account), your achievements and
// the settings, as three tabs. The tab is in the URL hash (#achievements).
export default function ProfilePage() {
  const profile = useProfile();
  const me = useMe();
  const [tab, setTab] = useState('me');
  const waiting = profile.ready ? readyCount(profile.wallet) : 0;

  useEffect(() => {
    const fromHash = () => {
      const h = location.hash.slice(1);
      if (TABS.some((t) => t.id === h)) setTab(h);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  const pick = (id) => {
    setTab(id);
    history.replaceState(null, '', id === 'me' ? location.pathname : `#${id}`);
  };

  return (
    <main className="arcade profile-page">
      <header className="hub-top">
        <div className="arcade-left">
          <Link href="/" className="chip home" aria-label="Back home">
            <Icon glyph="🛋️" size={20} tint="currentColor" />
          </Link>
          <Wallet profile={profile} />
        </div>
      </header>

      <div className="pf-tabs" role="tablist" aria-label="Profile">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`pf-tab ${tab === t.id ? 'on' : ''}`} onClick={() => pick(t.id)}>
            <Icon glyph={t.icon} size={18} tint="currentColor" />
            <span>{t.name}</span>
            {t.id === 'achievements' && waiting > 0 && <i className="pf-dot">{waiting}</i>}
          </button>
        ))}
      </div>

      {tab === 'me' && <MeTab profile={profile} me={me} />}
      {tab === 'levels' && <LevelRoad />}
      {tab === 'achievements' && <Achievements embedded />}
      {tab === 'settings' && (
        <>
          <SettingsTab me={me} />
          <CodesCard profile={profile} />
        </>
      )}
    </main>
  );
}

function MeTab({ profile, me }) {
  const { wallet, ready, user } = profile;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  if (!me) return null;

  function save(e) {
    e.preventDefault();
    const n = name.trim().slice(0, 20);
    if (n) setMe({ name: n });
    setEditing(false);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(me.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <section className="pf-card pf-me">
      <div className="pf-hero">
        <Avatar size={96} equipped={wallet.equipped} mood="smug" className="has-legs" />
      </div>
      {editing ? (
        <form className="pf-name-form" onSubmit={save}>
          <input autoFocus maxLength={20} value={name} onChange={(e) => setName(e.target.value)} aria-label="Your name" />
          <button className="pill" type="submit">
            Save
          </button>
        </form>
      ) : (
        <h1 className="pf-name">
          {me.name || 'Mystery player'}
          <button
            className="pf-edit"
            onClick={() => {
              setName(me.name);
              setEditing(true);
            }}
            aria-label="Change your name"
          >
            ✎
          </button>
        </h1>
      )}
      <div className="pf-id">
        <span>Player ID</span>
        <code>{me.id}</code>
        <button className="pf-copy" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="pf-stats">
        <div>
          <b>{ready ? (wallet.stats?.runs ?? 0).toLocaleString('en-US') : '…'}</b>
          <span>games played</span>
        </div>
        <div>
          <b>{ready ? (wallet.stats?.days ?? 0) : '…'}</b>
          <span>days with him</span>
        </div>
        <div>
          <b>{ready ? wallet.owned.length : '…'}</b>
          <span>things bought</span>
        </div>
      </div>

      <div className="pf-row">
        <div>
          <b>Friends</b>
          <span>Coming soon</span>
        </div>
        <button className="pill alt" disabled>
          Add a friend
        </button>
      </div>
      <div className="pf-row">
        <div>
          <b>Account</b>
          <span>{user ? user.email ?? user.name : 'Playing on this device'}</span>
        </div>
        <Account user={user} ready={ready} />
      </div>
    </section>
  );
}

function SettingsTab({ me }) {
  if (!me) return null;
  const rows = [
    { key: 'sound', name: 'Sound effects', icon: '🔊' },
    { key: 'mic', name: 'Copy-me mic button', icon: '🎤' },
  ];
  return (
    <section className="pf-card pf-settings">
      {rows.map((r) => (
        <div className="pf-row" key={r.key}>
          <div className="pf-row-name">
            <Icon glyph={r.icon} size={20} />
            <b>{r.name}</b>
          </div>
          <div className="pf-row-end">
            <button role="switch" aria-checked={me[r.key]} aria-label={r.name} className={`pf-switch ${me[r.key] ? 'on' : ''}`} onClick={() => setMe({ [r.key]: !me[r.key] })}>
              <i />
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}

// Codes: type one in, get what it gives (once each).
function CodesCard({ profile }) {
  const [code, setCode] = useState('');
  const [said, setSaid] = useState(null); // { text, good }
  const fmt = (n) => n.toLocaleString('en-US');

  function submit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    if (!isCode(code)) return setSaid({ text: 'That code does nothing. Like you.', good: false });
    if (usedCode(profile.wallet, code)) return setSaid({ text: 'Already used that one. Greedy.', good: false });
    const got = redeemCode(code);
    if (!got) return setSaid({ text: 'Something went wrong. Try again.', good: false });
    setCode('');
    setSaid({ text: `+${fmt(got.coins)} coins, +${fmt(got.diamonds)} diamonds. Fine. Take it.`, good: true });
  }

  return (
    <section className="pf-card pf-codes">
      <h2>Codes</h2>
      <form className="pf-name-form" onSubmit={submit}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter a code" aria-label="Code" autoCapitalize="characters" spellCheck={false} maxLength={32} />
        <button className="pill" type="submit" disabled={!code.trim() || !profile.ready}>
          Redeem
        </button>
      </form>
      {said && (
        <p className={`pf-code-said ${said.good ? 'good' : 'bad'}`} role="status">
          {said.text}
        </p>
      )}
    </section>
  );
}

