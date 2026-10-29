// SVG building blocks shared by the house drawings (art.jsx, art-more.jsx).

export const Lin = ({ id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1 }) => (
  <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
    {stops.map(([o, c, op = 1], i) => (
      <stop key={i} offset={o} stopColor={c} stopOpacity={op} />
    ))}
  </linearGradient>
);
export const Rad = ({ id, stops, cx = 0.5, cy = 0.5, r = 0.5, fx, fy }) => (
  <radialGradient id={id} cx={cx} cy={cy} r={r} fx={fx ?? cx} fy={fy ?? cy}>
    {stops.map(([o, c, op = 1], i) => (
      <stop key={i} offset={o} stopColor={c} stopOpacity={op} />
    ))}
  </radialGradient>
);
// A soft contact shadow on the floor.
export const Shadow = ({ u, f, cx, cy, rx, ry, o = 0.35 }) => (
  <>
    <Rad id={u('sh')} stops={[[0, '#2a1608', o], [0.6, '#2a1608', o * 0.4], [1, '#2a1608', 0]]} />
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={f('sh')} />
  </>
);
export const Gloss = ({ id }) => <Lin id={id} stops={[[0, '#fff', 0.55], [0.5, '#fff', 0.08], [1, '#fff', 0]]} />;
