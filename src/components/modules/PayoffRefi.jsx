import { formatCurrency, formatShortDate } from '../../lib/constants';

export default function PayoffRefi({ loan }) {
  const p = loan.property;
  const upb = Number(loan.current_upb);
  const rate = Number(loan.interest_rate);
  const perDiem = (upb * (rate / 100)) / 365;
  const today = new Date('2026-04-12');
  const goodThrough = new Date(today); goodThrough.setDate(goodThrough.getDate() + 30);
  const daysAccrued = 30;
  const accruedInterest = perDiem * daysAccrued;
  const payoffFees = 65;
  const payoffTotal = upb + accruedInterest + payoffFees;

  const currentValue = Number(p?.current_value || 0);
  const equity = currentValue - upb;
  const newLtv = (upb / currentValue) * 100;
  const maxHeloc = Math.max(0, (currentValue * 0.85) - upb);

  const refiScenarios = [
    {
      name: '30yr Rate-Term Refi',
      rate: 5.99,
      term: 360,
      amount: upb,
      pi: monthlyPi(upb, 5.99, 360),
      cashOut: 0,
    },
    {
      name: '30yr Cash-Out Refi',
      rate: 6.25,
      term: 360,
      amount: upb + 50000,
      pi: monthlyPi(upb + 50000, 6.25, 360),
      cashOut: 50000,
    },
    {
      name: 'HELOC (variable)',
      rate: 8.50,
      term: 240,
      amount: Math.min(maxHeloc, 100000),
      pi: monthlyPi(Math.min(maxHeloc, 100000), 8.50, 240),
      cashOut: Math.min(maxHeloc, 100000),
    },
  ];
  const currentPi = Number(loan.monthly_pi);

  return (
    <div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h2>Payoff Quote</h2><span className="count">Good through {formatShortDate(goodThrough)}</span></div>
          <div className="card-body">
            <div className="huge-num">{formatCurrency(payoffTotal)}</div>
            <div className="xsmall upper text-dim">Total payoff amount</div>
            <div className="data-grid" style={{ marginTop: 14 }}>
              <div className="label">Principal (UPB)</div>   <div className="value mono">{formatCurrency(upb)}</div>
              <div className="label">Interest Rate</div>     <div className="value mono">{rate.toFixed(3)}%</div>
              <div className="label">Per Diem</div>          <div className="value mono">{formatCurrency(perDiem)}</div>
              <div className="label">Days Accrued</div>      <div className="value mono">{daysAccrued} days</div>
              <div className="label">Accrued Interest</div>  <div className="value mono">{formatCurrency(accruedInterest)}</div>
              <div className="label">Payoff Fees</div>       <div className="value mono">{formatCurrency(payoffFees)}</div>
              <div className="label">Good Through</div>      <div className="value">{formatShortDate(goodThrough)}</div>
            </div>
            <div className="row gap8" style={{ marginTop: 14 }}>
              <button className="btn primary">Email Payoff Statement</button>
              <button className="btn">Send via Servicing Digital</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Equity Analysis</h2></div>
          <div className="card-body">
            <div className="huge-num text-green">{formatCurrency(equity)}</div>
            <div className="xsmall upper text-dim">Available equity</div>
            <div className="data-grid" style={{ marginTop: 14 }}>
              <div className="label">Property Value</div>    <div className="value mono">{formatCurrency(currentValue)}</div>
              <div className="label">Current UPB</div>       <div className="value mono">{formatCurrency(upb)}</div>
              <div className="label">Current LTV</div>       <div className="value mono">{newLtv.toFixed(1)}%</div>
              <div className="label">Max HELOC (85% LTV)</div><div className="value mono text-green">{formatCurrency(maxHeloc)}</div>
              <div className="label">Last Appraisal</div>    <div className="value">{formatShortDate(p?.last_appraisal_date)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Refinance & HELOC Comparison</h2><span className="count">Retention offers</span></div>
        <div className="card-body tight">
          <table className="dense">
            <thead>
              <tr>
                <th>Product</th>
                <th>Rate</th>
                <th>Term</th>
                <th>Loan Amount</th>
                <th>Cash Out</th>
                <th>Est. Monthly P&I</th>
                <th>vs. Current</th>
                <th>Break-even</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {refiScenarios.map((s) => {
                const delta = s.pi - currentPi;
                const breakeven = delta < 0 ? Math.ceil(3500 / Math.abs(delta)) : null;
                return (
                  <tr key={s.name}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td className="mono">{s.rate.toFixed(2)}%</td>
                    <td className="mono">{s.term}mo</td>
                    <td className="mono num">{formatCurrency(s.amount)}</td>
                    <td className="mono num">{s.cashOut > 0 ? formatCurrency(s.cashOut) : '—'}</td>
                    <td className="mono num">{formatCurrency(s.pi)}</td>
                    <td className="mono num" style={{ color: delta < 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {delta < 0 ? '−' : '+'}{formatCurrency(Math.abs(delta))}
                    </td>
                    <td className="mono">{breakeven ? `${breakeven} mo` : '—'}</td>
                    <td><button className="btn sm primary">Model</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="alert teal">
        <div className="icon">★</div>
        <div>
          <div className="title">Retention Play Recommendation</div>
          <div className="detail">
            Borrower has {formatCurrency(equity)} of available equity and is at rate {rate.toFixed(2)}%. Recommend pitching the
            <strong> 30yr rate-term refi at 5.99%</strong> — saves {formatCurrency(Math.max(0, currentPi - refiScenarios[0].pi))}/mo.
            Mention the HELOC alternative for borrowers who want to keep their current rate intact.
          </div>
        </div>
      </div>
    </div>
  );
}

function monthlyPi(principal, annualRate, months) {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}
