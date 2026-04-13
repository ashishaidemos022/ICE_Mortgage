import { useState } from 'react';
import { formatCurrency, formatShortDate, daysBetween, COMPLIANCE_LABELS } from '../../lib/constants';
import SmsComposer from '../SmsComposer';

export default function LossMitigation({ loan }) {
  const [smsOpen, setSmsOpen] = useState(false);
  const lm = Array.isArray(loan.lossmit_case) ? loan.lossmit_case[0] : loan.lossmit_case;
  const flags = loan.compliance_flags || [];

  if (!lm) {
    return <div className="content-empty">No active loss mitigation case.</div>;
  }

  const brpDocs = lm.lossmit_documents || [];
  const workouts = Array.isArray(lm.eligible_workouts) ? lm.eligible_workouts : [];
  const today = new Date('2026-04-12');
  const daysToExpiry = lm.forbearance_end ? daysBetween(today, lm.forbearance_end) : null;
  const expiringSoon = daysToExpiry != null && daysToExpiry <= 45;

  return (
    <div>
      <div className={`alert ${expiringSoon ? 'red' : 'amber'}`}>
        <div className="icon">⚑</div>
        <div className="flex1">
          <div className="title">Case {lm.case_number} · {lm.case_type?.replace(/_/g,' ')} · {lm.status}</div>
          <div className="detail">
            {lm.forbearance_end && (
              <>Forbearance expires <strong>{formatShortDate(lm.forbearance_end)}</strong> ({daysToExpiry} days) · </>
            )}
            Deferred amount: <strong>{formatCurrency(lm.deferred_amount)}</strong> · Hardship: <strong>{lm.hardship_reason?.replace(/_/g,' ')}</strong>
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
          <div className="card-header"><h2>Case Summary</h2></div>
          <div className="card-body">
            <div className="data-grid">
              <div className="label">Case Number</div>        <div className="value mono">{lm.case_number}</div>
              <div className="label">Case Type</div>          <div className="value">{lm.case_type?.replace(/_/g,' ')}</div>
              <div className="label">Status</div>             <div className="value"><span className="badge blue">{lm.status}</span></div>
              <div className="label">SPOC</div>               <div className="value">{lm.spoc_name}</div>
              <div className="label">Hardship Reason</div>    <div className="value">{lm.hardship_reason?.replace(/_/g,' ')}</div>
              <div className="label">Forbearance Start</div>  <div className="value">{formatShortDate(lm.forbearance_start)}</div>
              <div className="label">Forbearance End</div>    <div className="value">{formatShortDate(lm.forbearance_end)}</div>
              <div className="label">Deferred Amount</div>    <div className="value mono">{formatCurrency(lm.deferred_amount)}</div>
              <div className="label">Extension Requested</div><div className="value">{lm.extension_requested ? `Yes (via ${lm.extension_requested_via?.replace(/_/g,' ')})` : 'No'}</div>
              <div className="label">BRP Status</div>         <div className="value"><span className={`badge ${lm.brp_status === 'complete' ? 'green' : 'amber'}`}>{lm.brp_status}</span></div>
              <div className="label">GSE Evaluation</div>     <div className="value"><span className="badge blue">{lm.gse_evaluation}</span></div>
              <div className="label">Dual-Tracking</div>      <div className="value">{lm.dual_tracking_check ? '⚠ Review required' : 'Clear'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Borrower Response Package</h2><span className="count">{brpDocs.length} docs</span></div>
          <div className="card-body tight">
            <table className="dense">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {brpDocs.map((d) => (
                  <tr key={d.id}>
                    <td>{d.document_name}</td>
                    <td>
                      <span className={`badge ${d.status === 'received' ? 'green' : d.status === 'expired' ? 'red' : 'amber'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td>{formatShortDate(d.received_date)}</td>
                    <td>{formatShortDate(d.expiry_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Eligible Workout Options</h2><span className="count">{workouts.length}</span></div>
        <div className="card-body">
          <div className="grid-2">
            {workouts.map((w, i) => (
              <div className="card" key={i} style={{ margin: 0, background: 'var(--surface-2)' }}>
                <div className="card-body">
                  <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 13 }}>{w.option}</div>
                  <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>{w.description}</div>
                  <div style={{ marginTop: 8, padding: 8, background: 'var(--blue-soft)', borderRadius: 3, fontSize: 11 }}>
                    <div className="xsmall upper text-blue" style={{ fontWeight: 700 }}>Impact</div>
                    <div className="mono" style={{ marginTop: 2 }}>{w.impact}</div>
                  </div>
                  {w.requires && (
                    <div className="text-dim" style={{ marginTop: 6, fontSize: 10 }}>
                      <strong>Requires:</strong> {w.requires}
                    </div>
                  )}
                  <button className="btn primary sm" style={{ marginTop: 10 }}>Model This Option</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Second-Level Review</h2></div>
        <div className="card-body">
          <div className="row gap8">
            <button className="btn primary">Approve Extension</button>
            <button className="btn" onClick={() => setSmsOpen(true)}>✉ Send BRP Doc Request SMS</button>
            <button className="btn">Send to GSE for NPV</button>
            <button className="btn danger">Deny (with reason)</button>
          </div>
          <div className="text-dim" style={{ marginTop: 10, fontSize: 11 }}>
            All workout decisions logged to MSP with timestamp and agent ID. Second-level review required for modifications and foreclosure referrals.
          </div>
        </div>
      </div>

      {smsOpen && (() => {
        const outstanding = brpDocs.filter((d) => d.status !== 'received').map((d) => d.document_name);
        const docList = outstanding.length > 0 ? outstanding.join(', ') : 'documents previously requested';
        const preset = `Hi ${loan.borrower?.first_name || ''}, this is your loss mitigation SPOC ${lm.spoc_name || ''}. To complete your ${lm.case_type?.replace(/_/g,' ')} review for case ${lm.case_number}, please upload the following: ${docList}. Deadline: ${formatShortDate(lm.forbearance_end)}. Upload via Servicing Digital or reply for help.`;
        return <SmsComposer loan={loan} title="Send BRP Document Request" presetMessage={preset} onClose={() => setSmsOpen(false)} />;
      })()}
    </div>
  );
}
