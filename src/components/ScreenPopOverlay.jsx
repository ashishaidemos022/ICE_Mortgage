import { useEffect, useState } from 'react';
import { MODULE_META, VIEW_LABELS } from '../lib/constants';

export default function ScreenPopOverlay({ pop, onAccept, onDismiss }) {
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    if (!pop) return;
    setCountdown(2);
    const t1 = setTimeout(() => setCountdown(1), 1000);
    const t2 = setTimeout(() => {
      onAccept();
    }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pop, onAccept]);

  if (!pop) return null;

  const moduleMeta = MODULE_META[pop.target_module] || { label: pop.target_module, color: 'blue' };

  return (
    <div className="overlay-backdrop">
      <div className="overlay">
        <div className="overlay-head">
          <div className="label"><span className="pulse" /> Incoming Call · {pop.queue || 'Main Queue'}</div>
          <div className="caller">{pop.caller_name}</div>
          <div className="phone">{pop.caller_phone}</div>
        </div>
        <div className="overlay-body">
          <div className="row"><span className="lbl">Loan Number</span> <span className="val mono">{pop.loan_number}</span></div>
          <div className="row"><span className="lbl">Intent</span>      <span className="val">{(pop.intent || 'general').replace(/_/g, ' ')}</span></div>
          <div className="row"><span className="lbl">Auth</span>        <span className="val">{pop.auth_method?.replace(/_/g, ' ') || '—'} {pop.auth_score != null && <span className="mono text-green">({Number(pop.auth_score).toFixed(1)}%)</span>}</span></div>
          <div className="row"><span className="lbl">Routing</span>     <span className="val"><span className={`badge ${moduleMeta.color}`}>{moduleMeta.label}</span> → {VIEW_LABELS[pop.target_view] || pop.target_view}</span></div>
        </div>
        <div className="overlay-foot">
          <div className="countdown">Auto-routing in {countdown}s…</div>
          <button className="btn" onClick={onDismiss}>Dismiss</button>
          <button className="btn primary" onClick={onAccept}>Accept Now</button>
        </div>
      </div>
    </div>
  );
}
