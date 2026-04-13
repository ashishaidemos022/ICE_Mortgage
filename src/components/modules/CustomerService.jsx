import { formatDate, formatCurrency, formatShortDate } from '../../lib/constants';

const TALK_SCRIPTS = {
  'Escrow payment increase': (loan, ea) => [
    `Thank you for calling. I can see your 2026 annual escrow analysis was completed on ${formatShortDate(ea?.last_analysis_date)}.`,
    `Your monthly payment will change by ${formatCurrency(ea?.payment_change_amount)} effective ${formatShortDate(ea?.payment_change_effective)}, driven by projected property tax and insurance increases.`,
    `We can walk through the line items, discuss one-time shortage payoff, or enroll you in the spread option over 12 months — what would you like to do?`,
  ],
  'Payment posting question': (loan) => [
    `I can see your last payment of ${formatCurrency(loan.last_payment_amount)} posted on ${formatShortDate(loan.last_payment_date)} via ACH Auto-Pay.`,
    `It was applied to the ${formatShortDate(loan.last_payment_date)} due date. What specifically would you like me to clarify?`,
  ],
  'PMI removal inquiry': (loan) => [
    `Great question. Your current LTV is ${loan.ltv}%, which is close to the 78% automatic PMI removal threshold.`,
    `You can request borrower-initiated PMI cancellation once LTV reaches 80%, based on original value. I can start that process today if you'd like.`,
  ],
  'Requesting payment plan': () => [
    `I understand — let's talk about what's available. Based on your account, you qualify for a repayment plan, and because your area was declared a federal disaster zone, you may also be eligible for FEMA forbearance.`,
    `Can you tell me a bit about your situation so I can recommend the best option?`,
  ],
  'Forbearance extension request': (loan, ea, lm) => [
    `Thank you for reaching out. I can see your current forbearance ends ${formatShortDate(lm?.forbearance_end)}, with ${lm?.deferred_amount ? formatCurrency(lm.deferred_amount) : 'an'} deferred balance.`,
    `You've submitted an extension request through Servicing Digital. I need to confirm a few items on your borrower response package — some documents appear incomplete or expired.`,
  ],
  'Payoff statement request': (loan) => [
    `Happy to help. Your current UPB is ${formatCurrency(loan.current_upb)} at ${loan.interest_rate}%. Let me generate a payoff quote with a 30-day good-through date.`,
    `Would you like me to email the statement or send it via Servicing Digital?`,
  ],
};

export default function CustomerService({ loan }) {
  const predictions = (loan.call_predictions || []).sort((a,c)=>a.prediction_rank-c.prediction_rank);
  const top = predictions[0];
  const ea = loan.escrow_account;
  const lm = Array.isArray(loan.lossmit_case) ? loan.lossmit_case[0] : loan.lossmit_case;
  const script = top ? (TALK_SCRIPTS[top.reason]?.(loan, ea, lm) || [`Acknowledge caller. Pull up loan context. Listen actively.`]) : [];
  const interactions = (loan.interactions || []).slice().sort((a,c)=>new Date(c.created_at)-new Date(a.created_at));

  return (
    <div>
      {top && (
        <div className="alert blue">
          <div className="icon">⚡</div>
          <div className="flex1">
            <div className="title">Top Reason Forecast — {Math.round(top.confidence*100)}%</div>
            <div className="detail"><strong>{top.reason}.</strong> {top.supporting_signal}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h2>Suggested Talk Script</h2><span className="count">{top?.reason || 'general'}</span></div>
        <div className="card-body">
          {script.map((line, i) => (
            <div key={i} style={{
              padding: '8px 12px',
              marginBottom: 6,
              background: 'var(--blue-soft)',
              borderLeft: '3px solid var(--blue)',
              borderRadius: 3,
              fontSize: 12,
              lineHeight: 1.5,
            }}>
              <span className="mono text-blue" style={{ fontWeight: 700, marginRight: 6 }}>{i+1}.</span>{line}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Conversation History</h2><span className="count">{interactions.length} interactions</span></div>
        <div className="card-body">
          {interactions.length === 0 && <div className="text-dim">No prior interactions.</div>}
          <div className="timeline">
            {interactions.map((i) => (
              <div className="timeline-item" key={i.id}>
                <div className="ts">
                  {formatDate(i.created_at)} · {i.interaction_type?.replace(/_/g,' ')} · {i.agent_name || 'System'}
                  {i.topic && <> · topic: <strong>{i.topic}</strong></>}
                  {i.sentiment && <> · <span className={`badge ${i.sentiment === 'positive' ? 'green' : i.sentiment === 'negative' ? 'red' : 'gray'}`}>{i.sentiment}</span></>}
                </div>
                <div className="summary">{i.summary}</div>
                {i.detail && <div className="detail">{i.detail}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
