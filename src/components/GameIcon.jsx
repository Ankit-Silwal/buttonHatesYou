// Flat line icons for the games, drawn on a 24x24 grid in white on the game's
// tile colour (the same set as the Android app's GameIcons.kt). Used where a
// game needs a mark instead of a picture: the Games grid when there is no
// still, and an Adventure game's title card.

// Each game's tile colour: deep enough for a white icon to read on it.
const TINT = {
  'please-dont': '#d9483b',
  'button-run': '#4f5bd5',
  flap: '#2f86d0',
  whack: '#c0632a',
  stack: '#c98f17',
  pop: '#b83c86',
  simon: '#6a49bf',
  hop: '#1e9480',
  run: '#4a8f2c',
  slice: '#c23b4a',
  'table-tennis': '#2a62b4',
  'the-reason': '#3d4a7a',
  'how-i-met-your-cursor': '#c4567a',
};
export const gameTint = (id) => TINT[id] ?? '#5a6273';

const LINE = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const THIN = { ...LINE, strokeWidth: 1.6 };
const FILL = { fill: 'currentColor' };

const ICONS = {
  // a big push button on its base
  'please-dont': (
    <>
      <circle cx="12" cy="12" r="9" {...LINE} />
      <circle cx="12" cy="12" r="5.5" {...FILL} />
    </>
  ),
  // a keyboard key with a forward chevron
  'button-run': (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" {...LINE} />
      <path d="M9 8.5 13.5 12 9 15.5" {...LINE} />
      <path d="M14.5 15.5H17" {...LINE} />
    </>
  ),
  // a wing
  flap: (
    <>
      <path d="M3 15Q8 4 21 5Q19 11 13 13Q17 14 18 15Q12 19 3 15Z" {...LINE} />
      <path d="M7 14.5 15 9" {...THIN} />
    </>
  ),
  // a mallet
  whack: (
    <>
      <rect x="4" y="3.5" width="13" height="7" rx="2" {...FILL} />
      <path d="M10.5 10.5V20.5" {...LINE} strokeWidth={2.6} />
      <path d="M6 20.5H15" {...LINE} />
    </>
  ),
  // three blocks, the top one sliding off
  stack: (
    <>
      <rect x="4" y="16" width="16" height="4.5" rx="1.5" {...FILL} />
      <rect x="5.5" y="10.5" width="13" height="4.5" rx="1.5" {...FILL} />
      <rect x="9" y="5" width="12" height="4.5" rx="1.5" {...LINE} />
    </>
  ),
  // a cluster of bubbles
  pop: (
    <>
      <circle cx="9" cy="14" r="5" {...LINE} />
      <circle cx="16.5" cy="8" r="3.5" {...LINE} />
      <circle cx="17.5" cy="16.5" r="2.2" {...FILL} />
      <circle cx="7.5" cy="12.5" r="1.2" {...FILL} />
    </>
  ),
  // four pads round a hub
  simon: (
    <>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2.5" {...FILL} />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="2.5" {...LINE} />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="2.5" {...LINE} />
      <rect x="13" y="13" width="7.5" height="7.5" rx="2.5" {...FILL} />
    </>
  ),
  // a cloud with an up arrow
  hop: (
    <>
      <path d="M6.5 20Q2.5 20 2.5 16.5Q2.5 13 6.5 13Q7.5 9 12 9Q16.5 9 17.5 13Q21.5 13 21.5 16.5Q21.5 20 17.5 20Z" {...LINE} />
      <path d="M12 6.5V1.8M9.5 4.2 12 1.8 14.5 4.2" {...LINE} />
    </>
  ),
  // speed lines behind a moving dot
  run: (
    <>
      <circle cx="16" cy="12" r="4.5" {...FILL} />
      <path d="M3 8H9M1.5 12H9M3 16H9" {...LINE} />
    </>
  ),
  // a blade and its cut
  slice: (
    <>
      <path d="M4 20 17 7Q21 3 20 3.5Q20.5 4 18 8.5L6 20.5Z" {...FILL} />
      <path d="M3 10 9 4M14 21 20 15" {...THIN} />
    </>
  ),
  // a paddle and its ball
  'table-tennis': (
    <>
      <circle cx="10" cy="10" r="6.5" {...LINE} />
      <path d="M14.6 14.6 19.5 19.5" {...LINE} strokeWidth={3} />
      <circle cx="18.5" cy="5.5" r="2.2" {...FILL} />
    </>
  ),
  // a sword
  'the-reason': (
    <>
      <path d="M19 3 9 13M19 3V7L10.5 15.5" {...LINE} />
      <path d="M6 12 12 18M8.5 15.5 4 20" {...LINE} />
    </>
  ),
  // a cursor and a heart
  'how-i-met-your-cursor': (
    <>
      <path d="M4 3V17L8 13.5 10.5 19 13 18 10.5 12.5H15.5Z" {...LINE} />
      <path d="M17.5 8.5Q16 6 14.8 7.6Q14 9 17.5 12Q21 9 20.2 7.6Q19 6 17.5 8.5Z" {...FILL} />
    </>
  ),
};

// Just the icon, in currentColor.
export function GameGlyph({ id, size = 24, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {ICONS[id] ?? <path d="M8 5 19 12 8 19Z" {...FILL} />}
    </svg>
  );
}

// A rounded tile in the game's colour with its icon on it. Sized by CSS.
export default function GameIcon({ id, className = '' }) {
  return (
    <span className={`game-icon ${className}`} style={{ '--tint': gameTint(id) }} aria-hidden="true">
      <GameGlyph id={id} />
    </span>
  );
}
