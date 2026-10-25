import { Sound } from './sound';
import { dom, pick, h, shake } from './core';

// To skip a level you have to type one of these. Exactly.
const SKIP_PHRASES = [
  'i eat cereal with a fork',
  'leetcode sucks',
  'hulalala',
  'i lost to a button',
  'the button is my king',
  'please mr button let me pass',
  'my mouse deserves better',
  'i cannot pop balloons',
  'i am a professional loser',
  'kid games are too hard for me',
  'my pet rock is smarter than me',
];

const normalize = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

let open = false;

export function closeSkip() {
  if (!open) return;
  open = false;
  dom.overlay.hidden = true;
  dom.overlay.innerHTML = '';
  dom.overlay.className = '';
}

// canSkip: is skipping still allowed right now (the level may end while typing)
// onSkip: called once the phrase is typed correctly
export function openSkip({ canSkip, onSkip, onCancel }) {
  if (open || !canSkip()) return;
  open = true;
  const phrase = pick(SKIP_PHRASES);
  // A solid backdrop: a blurred one lets the animated arena draw over the card.
  dom.overlay.className = 'skipping';
  dom.overlay.innerHTML = `<div class="card skip-card">
    <h2>Skip this level? 🍼</h2>
    <p>Fine. But first, type this exactly:</p>
    <p class="phrase"></p>
    <input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type it, no pasting…">
    <p class="hint"></p>
    <div class="row"><button class="pill" data-a="go">Skip</button><button class="pill ghost" data-a="no">I'll play</button></div>
  </div>`;
  dom.overlay.hidden = false;
  const card = dom.overlay.querySelector('.card');
  const input = card.querySelector('input');
  const hint = card.querySelector('.hint');
  card.querySelector('.phrase').textContent = `“${phrase}”`;
  input.focus();

  const attempt = () => {
    if (!canSkip()) return closeSkip();
    if (normalize(input.value) === phrase) {
      closeSkip();
      onSkip();
      return;
    }
    Sound.nope();
    shake(card, 6);
    hint.textContent = pick(["That's not what it says.", 'Typing is hard too, huh?', 'Read it again. Slowly.', 'Close! Not really.']);
  };

  // Keep keys away from the game behind (the climb listens for arrows/space).
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') attempt();
    if (e.key === 'Escape') closeSkip();
  });
  input.addEventListener('keyup', (e) => e.stopPropagation());
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    Sound.nope();
    hint.textContent = 'No pasting. Type it like you mean it.';
  });
  card.querySelector('[data-a=go]').addEventListener('click', attempt);
  card.querySelector('[data-a=no]').addEventListener('click', () => {
    closeSkip();
    onCancel?.();
  });
}

export function loserStamp(sub) {
  Sound.bad();
  const msg = h('div', 'loser', '<b>LOSER</b><span></span>');
  msg.querySelector('span').textContent = sub;
  dom.fx.append(msg);
  msg.addEventListener('animationend', () => msg.remove());
}
