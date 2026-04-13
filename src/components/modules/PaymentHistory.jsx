import { formatCurrency, formatShortDate } from '../../lib/constants';

export default function PaymentHistory({ loan }) {
  const payments = (loan.payments || []).slice().sort((a, b) => new Date(b.due_date) - new Date(a.due_date));
  const ea = loan.escrow_account;
  const hasChange = ea && ea.payment_change_effective && ea.payment_change_amount;

  return (
    <div>
      <div className="card">
        <div className="card-header"><h2>Payment Summary</h2></div>
        <div className="card-body">
          <div className="grid-4">
            <Breakdown label="Principal & Interest" value={loan.monthly_pi} />
            <Breakdown label="Escrow (Taxes+Ins)"   value={loan.monthly_escrow} />
            <Breakdown label="PMI"                  value={loan.monthly_pmi} />
            <Breakdown label="Total Monthly"        value={loan.monthly_payment} bold />
          </div>
        </div>
      </div>

      {hasChange && (
        <div className="alert amber">
          <div className="icon">⚠</div>
          <div className="flex1">
            <div className="title">Payment Change Pending</div>
            <div className="detail">
              Monthly payment increases by <strong>{formatCurrency(ea.payment_change_amount)}</strong> effective <strong>{formatShortDate(ea.payment_change_effective)}</strong> due to annual escrow analysis.
            </div>
            <div className="grid-2" style={{ marginTop: 10, maxWidth: 420 }}>
              <div>
                <div className="xsmall upper text-dim">Current</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{formatCurrency(loan.monthly_payment)}</div>
              </div>
              <div>
                <div className="xsmall upper text-dim">New (effective {formatShortDate(ea.payment_change_effective)})</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--amber)' }}>
                  {formatCurrency(Number(loan.monthly_payment) + Number(ea.payment_change_amount))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h2>Payment History — Last 12 Months</h2><span className="count">{payments.length} entries</span></div>
        <div className="card-body tight">
          <table className="dense">
            <thead>
              <tr>
                <th>Due Date</th>
                <th>Amount Due</th>
                <th>Received</th>
                <th>Amount Paid</th>
                <th>Method</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Escrow</th>
                <th>Late Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{formatShortDate(p.due_date)}</td>
                  <td className="num">{formatCurrency(p.amount_due)}</td>
                  <td>{p.date_received ? formatShortDate(p.date_received) : '—'}</td>
                  <td className="num">{p.amount_paid != null && p.amount_paid > 0 ? formatCurrency(p.amount_paid) : '—'}</td>
                  <td>{p.payment_method || '—'}</td>
                  <td className="num text-dim">{p.principal_applied ? formatCurrency(p.principal_applied) : '—'}</td>
                  <td className="num text-dim">{p.interest_applied  ? formatCurrency(p.interest_applied)  : '—'}</td>
                  <td className="num text-dim">{p.escrow_applied    ? formatCurrency(p.escrow_applied)    : '—'}</td>
                  <td className="num">{p.late_fee > 0 ? <span className="text-amber">{formatCurrency(p.late_fee)}</span> : '—'}</td>
                  <td><StatusChip status={p.payment_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Breakdown({ label, value, bold }) {
  return (
    <div>
      <div className="xsmall upper text-dim">{label}</div>
      <div className="mono" style={{ fontSize: bold ? 22 : 16, fontWeight: bold ? 700 : 600, color: 'var(--navy)', marginTop: 2 }}>
        {formatCurrency(value)}
      </div>
    </div>
  );
}

function StatusChip({ status }) {
  const map = {
    applied:  'green',
    pending:  'amber',
    returned: 'red',
    partial:  'amber',
    late:     'orange',
  };
  return <span className={`badge ${map[status] || 'gray'}`}>{status || '—'}</span>;
}
