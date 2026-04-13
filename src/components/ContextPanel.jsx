import { formatCurrency, formatShortDate, LOAN_STATUS_LABELS, LOAN_STATUS_COLORS, MODULE_META, VIEW_LABELS } from '../lib/constants';

export default function ContextPanel({ loan, caller, activeView }) {
  if (!loan) {
    return (
      <div className="context">
        <div className="context-section">
          <h3>Caller Context</h3>
          <div className="text-dim" style={{ fontSize: 11 }}>Awaiting screen pop or loan lookup…</div>
        </div>
      </div>
    );
  }

  const b = loan.borrower;
  const predictions = (loan.call_predictions || []).sort((a, c) => a.prediction_rank - c.prediction_rank);
  const statusColor = LOAN_STATUS_COLORS[loan.loan_status] || 'gray';
  const moduleMeta = MODULE_META[activeView?.module] || { label: '—', color: 'blue' };

  return (
    <div className="context">
      <div className="caller-identity">
        <div className="name">{caller?.name || `${b.first_name} ${b.last_name}`}</div>
        <div className="phone">{caller?.phone || b.phone}</div>
        {caller?.auth_method && (
          <div className="auth">
            <span className="upper" style={{ fontSize: 10 }}>{caller.auth_method.replace(/_/g, ' ')}</span>
            <span className="score">{caller.auth_score?.toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="context-section">
        <h3>Loan Summary</h3>
        <div className="loan-summary-row"><span className="label">Loan #</span>     <span className="value">{loan.loan_number}</span></div>
        <div className="loan-summary-row"><span className="label">Status</span>     <span><span className={`badge ${statusColor}`}>{LOAN_STATUS_LABELS[loan.loan_status]}</span></span></div>
        <div className="loan-summary-row"><span className="label">Type</span>       <span className="value" style={{ fontSize: 10 }}>{loan.loan_type}</span></div>
        <div className="loan-summary-row"><span className="label">Rate</span>       <span className="value">{loan.interest_rate}%</span></div>
        <div className="loan-summary-row"><span className="label">UPB</span>        <span className="value">{formatCurrency(loan.current_upb)}</span></div>
        <div className="loan-summary-row"><span className="label">Monthly</span>    <span className="value">{formatCurrency(loan.monthly_payment)}</span></div>
        <div className="loan-summary-row"><span className="label">Next Due</span>   <span className="value">{formatShortDate(loan.next_due_date)}</span></div>
        <div className="loan-summary-row"><span className="label">Last Paid</span>  <span className="value">{formatShortDate(loan.last_payment_date)}</span></div>
        <div className="loan-summary-row"><span className="label">Investor</span>   <span className="value">{loan.investor}</span></div>
        <div className="loan-summary-row"><span className="label">LTV</span>        <span className="value">{loan.ltv}%</span></div>
      </div>

      <div className="context-section">
        <h3>AI Call Predictions</h3>
        {predictions.length === 0 && <div className="text-dim xsmall">No predictions</div>}
        {predictions.map((p) => {
          const pct = Math.round(p.confidence * 100);
          return (
            <div className="prediction-card" key={p.id}>
              <span className="confidence-pct">{pct}%</span>
              <span className="rank">{p.prediction_rank}</span>
              <span className="reason">{p.reason}</span>
              <div className="signal">{p.supporting_signal}</div>
              <div className="confidence-bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>

      <div className="context-section">
        <h3>Screen Pop Target</h3>
        <div className="context-target">
          <span className={`badge ${moduleMeta.color}`} style={{ marginRight: 6 }}>{moduleMeta.label}</span>
          → {VIEW_LABELS[activeView?.view] || '—'}
        </div>
      </div>

      <div className="context-section">
        <h3>Quick Actions</h3>
        <div className="col">
          <button className="btn">✎ Push Notes to External</button>
          <button className="btn">⎘ Copy Loan Summary</button>
          <button className="btn">↗ Log Interaction</button>
        </div>
      </div>
    </div>
  );
}
