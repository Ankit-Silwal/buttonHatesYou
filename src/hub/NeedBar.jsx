// One of the button's needs as a labelled bar. `ghost` previews what a
// food would bring it up to.
export default function NeedBar({ kind, label, icon, value, ghost }) {
  const v = Math.round(value);
  const g = ghost != null ? Math.round(Math.min(100, ghost)) : null;
  return (
    <div className={`nb nb-${kind} ${v < 25 ? 'low' : ''}`}>
      <div className="nb-head">
        <span aria-hidden="true">{icon}</span>
        <span className="nb-label">{label}</span>
        <b>
          {v}
          {g != null && g > v && <em> → {g}</em>}
        </b>
      </div>
      <div className="nb-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}>
        {g != null && g > v && <i className="nb-ghost" style={{ width: `${g}%` }} />}
        <i className="nb-fill" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
