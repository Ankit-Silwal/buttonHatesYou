'use client';

import { useEffect, useRef, useState } from 'react';
import { signInWithGoogle, signOut } from '@/profile/store';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

let gsi = null;
function loadGoogle() {
  gsi ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = resolve;
    s.onerror = () => {
      gsi = null; // let the next attempt try again (we may be offline)
      reject();
    };
    document.head.append(s);
  });
  return gsi;
}

export default function Account({ user, ready }) {
  const slot = useRef(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready || user || !CLIENT_ID) return;
    let live = true;
    loadGoogle()
      .then(() => {
        if (!live || !slot.current) return;
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: ({ credential }) => {
            setError('');
            signInWithGoogle(credential).catch((e) => setError(e.message));
          },
        });
        google.accounts.id.renderButton(slot.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin' });
      })
      .catch(() => live && setError('Sign-in needs internet.'));
    return () => {
      live = false;
    };
  }, [ready, user]);

  if (!CLIENT_ID) {
    return (
      <span className="chip muted" title="Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local to turn on Google sign-in">
        Sign-in soon
      </span>
    );
  }

  if (!user) {
    return (
      <div className="account">
        <div ref={slot} />
        {error && <span className="account-error">{error}</span>}
      </div>
    );
  }

  return (
    <div className="account">
      <button className="chip who" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" /> : '🙂'}
        <span className="name">{user.name?.split(' ')[0] || 'You'}</span>
      </button>
      {open && (
        <div className="account-menu">
          <b>{user.name}</b>
          <span>{user.email}</span>
          <button
            className="pill ghost"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
