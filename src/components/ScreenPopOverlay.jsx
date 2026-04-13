import { MODULE_META, VIEW_LABELS } from '../lib/constants';
import LoanOverview from './modules/LoanOverview';

export default function ScreenPopOverlay({ pop, loan, loading, onAccept, onDismiss }) {
  if (!pop) return null;

  const moduleMeta = MODULE_META[pop.target_module] || { label: pop.target_module, color: 'blue' };
  const loanReady = loan && loan.loan_number === pop.loan_number;

  return (
    <div className="overlay-backdrop">
      <div className="overlay overlay-full">
        <div className="overlay-head">
          <div className="overlay-head-left">
            <div className="label"><span className="pulse" /> Incoming Call · {pop.queue || 'Main Queue'}</div>
            <div className="caller">{pop.caller_name}</div>
            <div className="phone">{pop.caller_phone}</div>
          </div>
          <div className="overlay-head-right">
            <div className="row"><span className="lbl">Loan Number</span> <span className="val mono">{pop.loan_number}</span></div>
            <div className="row"><span className="lbl">Intent</span>      <span className="val">{(pop.intent || 'general').replace(/_/g, ' ')}</span></div>
            <div className="row"><span className="lbl">Auth</span>        <span className="val">{pop.auth_method?.replace(/_/g, ' ') || '—'} {pop.auth_score != null && <span className="mono text-green">({Number(pop.auth_score).toFixed(1)}%)</span>}</span></div>
            <div className="row"><span className="lbl">Routing</span>     <span className="val"><span className={`badge ${moduleMeta.color}`}>{moduleMeta.label}</span> → {VIEW_LABELS[pop.target_view] || pop.target_view}</span></div>
          </div>
        </div>

        <div className="overlay-client360">
          {!loanReady || loading ? (
            <div className="content-empty">Loading Client 360 for loan {pop.loan_number}…</div>
          ) : (
            <LoanOverview loan={loan} />
          )}
        </div>

        <div className="overlay-foot">
          <div className="countdown">Client 360 — review before routing. Overlay stays until dismissed.</div>
          <button className="btn" onClick={onDismiss}>Dismiss</button>
          <button className="btn primary" onClick={onAccept} disabled={!loanReady}>
            Accept &amp; Route to {moduleMeta.label}
          </button>
        </div>
      </div>
    </div>
  );
}
