// A need as a small chip on the room scene, with a note under it.
export function NeedHud({ kind, icon, label, value, suffix = '', note }) {
  const v = Math.round(value);
  return (
    <>
      <div className={`hud-chip nb nb-${kind} ${v < 25 ? 'low' : ''}`}>
        <span aria-hidden="true">{icon}</span>
        <div className="nb-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}>
          <i className="nb-fill" style={{ width: `${v}%` }} />
        </div>
        <b>
          {v}
          {suffix}
        </b>
      </div>
      {note && <p className="hud-note">{note}</p>}
    </>
  );
}
