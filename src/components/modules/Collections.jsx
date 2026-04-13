import { formatCurrency, formatShortDate, COMPLIANCE_LABELS } from '../../lib/constants';

export default function Collections({ loan, onReferLossMit }) {
  const c = Array.isArray(loan.collections_case) ? loan.collections_case[0] : loan.collections_case;
  const flags = loan.compliance_flags || [];
  const interactions = (loan.interactions || []).filter((i) => i.topic === 'collections')
    .sort((a,b) => new Date(b.created_at)-new Date(a.created_at));

  if (!c) {
    return (
      <div className="content-empty">
        <div>Loan is current — no active collections case.</div>
      </div>
    );
  }

  const programs = Array.isArray(c.eligible_programs) ? c.eligible_programs : [];

  return (
    <div>
      <div className="alert red">
        <div className="icon">⚠</div>
        <div className="flex1">
          <div className="title">{c.days_delinquent} Days Delinquent · {formatCurrency(c.total_amount_due)} Total Due</div>
          <div className="detail">
            Loan #{loan.loan_number} · Status <strong>{loan.loan_status.replace(/_/g,' ')}</strong> ·
            Last contact {c.last_contact_date ? formatShortDate(c.last_contact_date) : 'none'} ({c.last_contact_outcome || '—'})
          </div>
        </div>
      </div>

      <div className="compliance-strip">
        {flags.map((f) => (
          <div className={`compliance-chip ${f.flag_status}`} key={f.id}>
            <span className={`status-dot ${f.flag_status === 'ok' ? 'green' : f.flag_status === 'warning' ? 'amber' : 'red'}`} />
            <strong>{COMPLIANCE_LABELS[f.flag_type] || f.flag_type}</strong>
            <span className="text-dim" style={{ fontWeight: 400, marginLeft: 4 }}>{f.description}</span>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h2>Amount Due Breakdown</h2></div>
          <div className="card-body">
            <div className="data-grid">
              <div className="label">Days Delinquent</div>  <div className="value mono text-red">{c.days_delinquent}</div>
              <div className="label">Total Due</div>        <div className="value mono">{formatCurrency(c.total_amount_due)}</div>
              <div className="label">Late Fees</div>        <div className="value mono text-amber">{formatCurrency(c.total_late_fees)}</div>
              <div className="label">Monthly Pmt</div>      <div className="value mono">{formatCurrency(loan.monthly_payment)}</div>
              <div className="label">Missed Pmts</div>      <div className="value mono">{Math.round(c.days_delinquent / 30)}</div>
              <div className="label">UPB</div>              <div className="value mono">{formatCurrency(loan.current_upb)}</div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={onReferLossMit}>→ Refer to Loss Mitigation</button>{' '}
              <button className="btn">Offer Payment Plan</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>FDCPA Contact Tracking</h2></div>
          <div className="card-body">
            <div className="huge-num text-amber">{c.contact_attempts_this_week} <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>of {c.contact_attempts_max}</span></div>
            <div className="xsmall upper text-dim">Contact attempts this week (7-in-7 rule)</div>
            <div style={{ marginTop: 10, height: 6, background: 'var(--gray-100)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${(c.contact_attempts_this_week / c.contact_attempts_max) * 100}%`, height: '100%', background: 'var(--amber)' }} />
            </div>
            {c.fema_disaster_area && (
              <div className="alert amber" style={{ marginTop: 12, marginBottom: 0 }}>
                <div className="icon">🛡</div>
                <div>
                  <div className="title">FEMA Disaster Protection</div>
                  <div className="detail">{c.fema_disaster_description}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Eligible Assistance Programs</h2><span className="count">{programs.length}</span></div>
        <div className="card-body">
          <div className="grid-3">
            {programs.map((p, i) => (
              <div key={i} className="card" style={{ margin: 0, background: 'var(--surface-2)' }}>
                <div className="card-body">
                  <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{p.program_name}</div>
                  <div className="text-dim" style={{ marginTop: 4, fontSize: 11 }}>{p.description}</div>
                  <div className="mono" style={{ marginTop: 8, fontSize: 11, color: 'var(--blue)', fontWeight: 600 }}>{p.terms}</div>
                  <button className="btn primary sm" style={{ marginTop: 10 }}>Offer to Borrower</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Contact History (FDCPA)</h2><span className="count">{interactions.length}</span></div>
        <div className="card-body tight">
          <table className="dense">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Direction</th>
                <th>Agent</th>
                <th>Outcome</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {interactions.map((i) => (
                <tr key={i.id}>
                  <td>{formatShortDate(i.created_at)}</td>
                  <td>{i.interaction_type?.replace(/_/g,' ')}</td>
                  <td><span className={`badge ${i.direction === 'outbound' ? 'blue' : 'gray'}`}>{i.direction}</span></td>
                  <td>{i.agent_name || '—'}</td>
                  <td className="text-dim">{i.resolution || '—'}</td>
                  <td>{i.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
