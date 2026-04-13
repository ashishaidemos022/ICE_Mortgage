import { formatCurrency, formatShortDate } from '../../lib/constants';

export default function EscrowDetail({ loan }) {
  const ea = loan.escrow_account;
  const disbursements = (loan.disbursements || []).slice().sort((a, b) => new Date(b.disbursement_date) - new Date(a.disbursement_date));
  const scheduled = disbursements.filter((d) => d.status === 'scheduled' || d.status === 'pending');
  const completed = disbursements.filter((d) => d.status === 'completed');

  if (!ea) {
    return <div className="content-empty">No escrow account on file.</div>;
  }

  const shortage = Number(ea.shortage_surplus);
  const hasChange = ea.payment_change_effective && ea.payment_change_amount;

  return (
    <div>
      {shortage < 0 && (
        <div className="alert amber">
          <div className="icon">⚠</div>
          <div className="flex1">
            <div className="title">Escrow Shortage Detected</div>
            <div className="detail">
              Shortage of <strong>{formatCurrency(Math.abs(shortage))}</strong>.
              {hasChange && (
                <> Payment increasing by <strong>{formatCurrency(ea.payment_change_amount)}</strong>/mo effective <strong>{formatShortDate(ea.payment_change_effective)}</strong>.</>
              )}
            </div>
          </div>
        </div>
      )}
      {shortage > 0 && (
        <div className="alert green">
          <div className="icon">✓</div>
          <div className="flex1">
            <div className="title">Escrow Surplus</div>
            <div className="detail">Surplus of <strong>{formatCurrency(shortage)}</strong>. Refund check issued per RESPA if {'>'}$50.</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h2>Escrow Account Summary</h2></div>
        <div className="card-body">
          <div className="grid-4">
            <Stat label="Current Balance"  value={formatCurrency(ea.current_balance)} />
            <Stat label="Required Cushion" value={formatCurrency(ea.required_cushion)} />
            <Stat label="Shortage / Surplus" value={formatCurrency(ea.shortage_surplus)} color={shortage < 0 ? 'amber' : 'green'} />
            <Stat label="Annual Tax"       value={formatCurrency(ea.annual_tax)} />
            <Stat label="Annual Insurance" value={formatCurrency(ea.annual_insurance)} />
            <Stat label="Insurance Carrier" value={ea.insurance_carrier} text />
            <Stat label="Tax Authority"    value={ea.tax_authority} text />
            <Stat label="Last Analysis"    value={formatShortDate(ea.last_analysis_date)} text />
            <Stat label="Next Analysis"    value={formatShortDate(ea.next_analysis_date)} text />
            {hasChange && <Stat label="Pmt Change Effective" value={formatShortDate(ea.payment_change_effective)} text />}
            {hasChange && <Stat label="Pmt Change Amount" value={formatCurrency(ea.payment_change_amount)} color="amber" />}
          </div>
        </div>
      </div>

      {scheduled.length > 0 && (
        <div className="card">
          <div className="card-header"><h2>Upcoming Disbursements</h2><span className="count">{scheduled.length}</span></div>
          <div className="card-body tight">
            <DisbursementTable rows={scheduled} />
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h2>Disbursement History</h2><span className="count">{completed.length}</span></div>
        <div className="card-body tight">
          <DisbursementTable rows={completed} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color, text }) {
  return (
    <div>
      <div className="xsmall upper text-dim">{label}</div>
      <div className={text ? '' : 'mono'} style={{
        fontSize: text ? 12 : 16,
        fontWeight: 600,
        marginTop: 2,
        color: color === 'amber' ? 'var(--amber)' : color === 'green' ? 'var(--green)' : 'var(--navy)',
      }}>{value}</div>
    </div>
  );
}

function DisbursementTable({ rows }) {
  return (
    <table className="dense">
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Payee</th>
          <th>Type</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((d) => (
          <tr key={d.id}>
            <td>{formatShortDate(d.disbursement_date)}</td>
            <td>{d.description}</td>
            <td>{d.payee}</td>
            <td><span className="badge gray">{d.disbursement_type}</span></td>
            <td className="num">{formatCurrency(d.amount)}</td>
            <td><span className={`badge ${d.status === 'completed' ? 'green' : 'blue'}`}>{d.status}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
