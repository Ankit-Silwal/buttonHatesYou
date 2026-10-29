'use client';

import { useState } from 'react';
import Avatar from '@/components/Avatar';
import { useMe, setMe } from './me';
import './welcome.css';

// The first visit: he asks who you are, so he knows who to blame. Shown
// until a name is given (it can be changed later in the profile).
export default function Welcome({ equipped, onDone }) {
  const me = useMe();
  const [name, setName] = useState('');
  if (!me || me.name) return null;

  function submit(e) {
    e.preventDefault();
    const n = name.trim().slice(0, 20);
    if (!n) return;
    setMe({ name: n });
    onDone?.(n);
  }

  return (
    <div className="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-q">
      <form className="welcome-card" onSubmit={submit}>
        <Avatar size={88} equipped={equipped} mood="annoyed" className="has-legs" />
        <h2 id="welcome-q">Who are you?</h2>
        <input autoFocus maxLength={20} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Your name" />
        <button className="pill big" type="submit" disabled={!name.trim()}>
          That's me
        </button>
      </form>
    </div>
  );
}
