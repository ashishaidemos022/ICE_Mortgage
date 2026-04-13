import { formatCurrency, formatDate, formatShortDate, LOAN_STATUS_LABELS, LOAN_STATUS_COLORS } from '../../lib/constants';

export default function LoanOverview({ loan }) {
  const b = loan.borrower;
  const p = loan.property;
  const ea = loan.escrow_account;
  const topPrediction = (loan.call_predictions || []).sort((a,c)=>a.prediction_rank-c.prediction_rank)[0];
  const recent = (loan.interactions || []).slice().sort((a,c)=>new Date(c.created_at)-new Date(a.created_at)).slice(0,5);

  const pmiRemovalEligible = loan.pmi_required && loan.ltv < 80;
  const equity = p ? (Number(p.current_value) - Number(loan.current_upb)) : 0;
  const helocEligible = equity > 100000;
  const refiEligible = Number(loan.interest_rate) > 6.0;

  return (
    <div>
      {topPrediction && (
        <div className="alert blue">
          <div className="icon">⚡</div>
          <div className="flex1">
            <div className="title">AI Top Call Prediction — {Math.round(topPrediction.confidence*100)}% confidence</div>
            <div className="detail"><strong>{topPrediction.reason}.</strong> {topPrediction.supporting_signal}</div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h2>Borrower</h2></div>
          <div className="card-body">
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{b.first_name} {b.last_name}</div>
            <div className="text-dim" style={{ marginBottom: 8 }}>SSN ***-**-{b.ssn_last4} · DOB {formatShortDate(b.date_of_birth)}</div>
            <div className="data-grid">
              <div className="label">Phone</div>        <div className="value mono">{b.phone}</div>
              <div className="label">Email</div>        <div className="value" style={{ fontSize: 11 }}>{b.email}</div>
              <div className="label">Mailing</div>      <div className="value" style={{ fontSize: 11 }}>{b.mailing_address}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Property</h2></div>
          <div className="card-body">
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{p?.address}</div>
            <div className="text-dim" style={{ marginBottom: 8 }}>{p?.city}, {p?.state} {p?.zip} · {p?.county} County</div>
            <div className="data-grid">
              <div className="label">Type</div>         <div className="value">{p?.property_type}</div>
              <div className="label">Built</div>        <div className="value">{p?.year_built}</div>
              <div className="label">Size</div>         <div className="value">{p?.sq_ft?.toLocaleString()} sqft · {p?.bedrooms}bd/{p?.bathrooms}ba</div>
              <div className="label">Est. Value</div>   <div className="value mono">{formatCurrency(p?.current_value)}</div>
              <div className="label">Appraised</div>    <div className="value">{formatShortDate(p?.last_appraisal_date)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Loan Details</h2><span className="count mono">{loan.loan_number}</span></div>
        <div className="card-body">
          <div className="grid-4">
            <Stat label="Status"          value={<span className={`badge ${LOAN_STATUS_COLORS[loan.loan_status]}`}>{LOAN_STATUS_LABELS[loan.loan_status]}</span>} />
            <Stat label="Type"            value={loan.loan_type} small />
            <Stat label="Rate"            value={`${loan.interest_rate}%`} mono />
            <Stat label="Investor"        value={loan.investor} />
            <Stat label="Original"        value={formatCurrency(loan.original_balance)} mono />
            <Stat label="Current UPB"     value={formatCurrency(loan.current_upb)} mono />
            <Stat label="LTV"             value={`${loan.ltv}%`} mono />
            <Stat label="Origination"     value={formatShortDate(loan.origination_date)} />
            <Stat label="Monthly (Total)" value={formatCurrency(loan.monthly_payment)} mono />
            <Stat label="Monthly P&I"     value={formatCurrency(loan.monthly_pi)} mono />
            <Stat label="Monthly Escrow"  value={formatCurrency(loan.monthly_escrow)} mono />
            <Stat label="Monthly PMI"     value={loan.pmi_required ? formatCurrency(loan.monthly_pmi) : '—'} mono />
            <Stat label="Next Due"        value={formatShortDate(loan.next_due_date)} />
            <Stat label="Last Payment"    value={formatShortDate(loan.last_payment_date)} />
            <Stat label="Last Amount"     value={formatCurrency(loan.last_payment_amount)} mono />
            <Stat label="Servicer"        value={loan.servicer} small />
          </div>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="card">
          <div className="card-header"><h2>Recent Activity</h2><span className="count">{recent.length}</span></div>
          <div className="card-body">
            <div className="timeline">
              {recent.map((i) => (
                <div className="timeline-item" key={i.id}>
                  <div className="ts">{formatDate(i.created_at)} · {i.interaction_type?.replace(/_/g,' ')} · {i.agent_name || 'System'}</div>
                  <div className="summary">{i.summary}</div>
                  {i.detail && <div className="detail">{i.detail}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h2>Proactive Opportunities</h2></div>
        <div className="card-body">
          <div className="grid-3">
            <OppCard
              eligible={pmiRemovalEligible}
              title="PMI Removal"
              detail={`LTV ${loan.ltv}% — eligible for automatic PMI removal. Save ${formatCurrency(loan.monthly_pmi)}/mo.`}
              disabledDetail={`LTV ${loan.ltv}% — monitor for 78% threshold.`}
              color="green"
            />
            <OppCard
              eligible={helocEligible}
              title="HELOC Offer"
              detail={`Est. equity ${formatCurrency(equity)} — pre-qualifies for HELOC up to ${formatCurrency(equity*0.8)}.`}
              disabledDetail={`Est. equity ${formatCurrency(equity)} — below HELOC threshold.`}
              color="blue"
            />
            <OppCard
              eligible={refiEligible}
              title="Refi Retention"
              detail={`Rate ${loan.interest_rate}% — above market. Refi to 5.99% could save meaningfully.`}
              disabledDetail={`Rate ${loan.interest_rate}% — at or below market.`}
              color="teal"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, mono, small }) {
  return (
    <div>
      <div className="label xsmall upper text-dim">{label}</div>
      <div className={`${mono ? 'mono' : ''}`} style={{ fontSize: small ? 12 : 14, fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function OppCard({ eligible, title, detail, disabledDetail, color }) {
  return (
    <div className="card" style={{ margin: 0, opacity: eligible ? 1 : 0.55 }}>
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <span className={`badge ${eligible ? color : 'gray'}`}>{eligible ? 'Eligible' : 'Not yet'}</span>
        </div>
        <div className="text-dim" style={{ marginTop: 6, fontSize: 11 }}>{eligible ? detail : disabledDetail}</div>
      </div>
    </div>
  );
}
