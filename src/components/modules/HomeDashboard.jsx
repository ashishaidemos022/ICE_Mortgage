import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { formatCurrency, formatShortDate, MODULE_META } from '../../lib/constants';
import PhoneLink from '../PhoneLink';

const PORTFOLIO = {
  total_loans:          48273,
  total_upb:            9_423_418_004,
  delinquency_rate:     3.82,
  active_lossmit:       127,
  calls_this_month:     14892,
  fcr_rate:             72.4,
};

const DELINQUENCY = [
  { bucket: 'Current',        count: 46432, pct: 96.19, color: 'green'  },
  { bucket: '30 Days',        count: 1014,  pct: 2.10,  color: 'amber'  },
  { bucket: '60 Days',        count: 434,   pct: 0.90,  color: 'orange' },
  { bucket: '90+ Days',       count: 266,   pct: 0.55,  color: 'red'    },
  { bucket: 'Forbearance',    count: 97,    pct: 0.20,  color: 'red'    },
  { bucket: 'Foreclosure',    count: 30,    pct: 0.06,  color: 'red'    },
];

const TRENDS = {
  delinquency_30d_delta:  -0.12,
  upb_30d_delta:          +0.8,
  lossmit_30d_delta:      +6,
  calls_30d_delta:        -3.2,
};

const CALLS_BY_INTENT = [
  { intent: 'Payment Inquiry',  pct: 34 },
  { intent: 'Escrow',           pct: 22 },
  { intent: 'Payoff / Refi',    pct: 14 },
  { intent: 'Past Due',         pct: 12 },
  { intent: 'Hardship',         pct: 9  },
  { intent: 'Documents / Other',pct: 9  },
];

export default function HomeDashboard({ onOpenLoan }) {
  const [screenPops, setScreenPops] = useState([]);
  const [attention, setAttention] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [popsRes, loansRes] = await Promise.all([
        supabase
          .from('icemortgage_screen_pops')
          .select('id, loan_number, caller_name, caller_phone, intent, target_module, queue, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('icemortgage_loans')
          .select(`
            loan_number, loan_status, current_upb, monthly_payment, next_due_date,
            borrower:icemortgage_borrowers(first_name, last_name),
            escrow_account:icemortgage_escrow_accounts(shortage_surplus, payment_change_effective, payment_change_amount),
            collections_case:icemortgage_collections_cases(contact_attempts_this_week, contact_attempts_max, fema_disaster_area, days_delinquent),
            lossmit_case:icemortgage_lossmit_cases(case_type, forbearance_end, brp_status, extension_requested)
          `),
      ]);

      if (cancelled) return;

      setScreenPops(popsRes.data || []);

      const items = [];
      for (const loan of (loansRes.data || [])) {
        const name = `${loan.borrower?.first_name || ''} ${loan.borrower?.last_name || ''}`.trim();
        const lm = Array.isArray(loan.lossmit_case) ? loan.lossmit_case[0] : loan.lossmit_case;
        const cc = Array.isArray(loan.collections_case) ? loan.collections_case[0] : loan.collections_case;
        const ea = Array.isArray(loan.escrow_account) ? loan.escrow_account[0] : loan.escrow_account;

        if (lm?.forbearance_end) {
          items.push({
            severity: 'red',
            label: 'Forbearance expiring',
            detail: `${name} · ends ${formatShortDate(lm.forbearance_end)}${lm.brp_status ? ` · BRP ${lm.brp_status}` : ''}`,
            loan_number: loan.loan_number,
          });
        }
        if (ea?.payment_change_effective && Number(ea.payment_change_amount) !== 0) {
          items.push({
            severity: 'amber',
            label: 'Escrow payment change',
            detail: `${name} · ${Number(ea.payment_change_amount) > 0 ? '+' : ''}${formatCurrency(ea.payment_change_amount)}/mo effective ${formatShortDate(ea.payment_change_effective)}`,
            loan_number: loan.loan_number,
          });
        }
        if (cc?.contact_attempts_this_week >= 3) {
          items.push({
            severity: 'amber',
            label: 'FDCPA contact limit',
            detail: `${name} · ${cc.contact_attempts_this_week}/${cc.contact_attempts_max} attempts used this week`,
            loan_number: loan.loan_number,
          });
        }
        if (cc?.fema_disaster_area) {
          items.push({
            severity: 'blue',
            label: 'FEMA disaster area',
            detail: `${name} · ${cc.days_delinquent || 0} days delinquent · eligible for forbearance`,
            loan_number: loan.loan_number,
          });
        }
      }
      setAttention(items);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  const fmtBig = (n) => {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
    return formatCurrency(n);
  };
  const fmtCount = (n) => n.toLocaleString('en-US');
  const fmtDelta = (n, suffix = '') => {
    const sign = n > 0 ? '+' : '';
    return `${sign}${n}${suffix}`;
  };

  return (
    <div className="home-dash">
      <div className="home-hero">
        <div>
          <div className="home-hero-eyebrow">ICE MSP® Servicing · Portfolio Overview</div>
          <h2 className="home-hero-title">Good morning, Sarah.</h2>
          <div className="home-hero-sub">
            {fmtCount(PORTFOLIO.total_loans)} loans serviced · {fmtBig(PORTFOLIO.total_upb)} total UPB · as of {formatShortDate(new Date())}
          </div>
        </div>
        <div className="home-hero-pulse">
          <span className="pulse-dot" />
          <div>
            <div className="upper" style={{ fontSize: 10 }}>Live Operations</div>
            <div className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{screenPops.length} active screen pops</div>
          </div>
        </div>
      </div>

      <div className="home-kpis">
        <div className="home-kpi">
          <div className="label">Total Loans Serviced</div>
          <div className="value">{fmtCount(PORTFOLIO.total_loans)}</div>
          <div className="delta text-green">{fmtDelta(+142)} MTD</div>
        </div>
        <div className="home-kpi">
          <div className="label">Total UPB</div>
          <div className="value">{fmtBig(PORTFOLIO.total_upb)}</div>
          <div className="delta text-green">{fmtDelta(TRENDS.upb_30d_delta, '%')} 30d</div>
        </div>
        <div className="home-kpi">
          <div className="label">Delinquency Rate</div>
          <div className="value">{PORTFOLIO.delinquency_rate.toFixed(2)}%</div>
          <div className="delta text-green">{fmtDelta(TRENDS.delinquency_30d_delta, '%')} 30d</div>
        </div>
        <div className="home-kpi">
          <div className="label">Active Loss-Mit Cases</div>
          <div className="value">{fmtCount(PORTFOLIO.active_lossmit)}</div>
          <div className="delta text-amber">{fmtDelta(TRENDS.lossmit_30d_delta)} 30d</div>
        </div>
        <div className="home-kpi">
          <div className="label">Calls This Month</div>
          <div className="value">{fmtCount(PORTFOLIO.calls_this_month)}</div>
          <div className="delta text-green">{fmtDelta(TRENDS.calls_30d_delta, '%')} 30d</div>
        </div>
        <div className="home-kpi">
          <div className="label">First Call Resolution</div>
          <div className="value">{PORTFOLIO.fcr_rate.toFixed(1)}%</div>
          <div className="delta text-green">{fmtDelta(+1.3, '%')} 30d</div>
        </div>
      </div>

      <div className="home-grid">
        <div className="card">
          <div className="card-header"><h2>Delinquency Breakdown</h2><span className="text-dim" style={{ fontSize: 11 }}>{fmtCount(PORTFOLIO.total_loans)} loans</span></div>
          <div className="card-body">
            {DELINQUENCY.map((row) => (
              <div className="delinq-row" key={row.bucket}>
                <div className="delinq-label">{row.bucket}</div>
                <div className="delinq-bar-wrap">
                  <div className={`delinq-bar ${row.color}`} style={{ width: `${Math.max(row.pct, 0.8) * 3.5}%` }} />
                </div>
                <div className="delinq-count mono">{fmtCount(row.count)}</div>
                <div className="delinq-pct mono text-dim">{row.pct.toFixed(2)}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Attention Items</h2><span className="text-dim" style={{ fontSize: 11 }}>{attention.length} flagged</span></div>
          <div className="card-body">
            {loading && <div className="text-dim" style={{ fontSize: 12 }}>Loading…</div>}
            {!loading && attention.length === 0 && <div className="text-dim" style={{ fontSize: 12 }}>No items requiring attention.</div>}
            {attention.map((item, i) => (
              <button
                key={i}
                className={`attention-item ${item.severity}`}
                onClick={() => onOpenLoan?.(item.loan_number)}
              >
                <div className="attention-sev" />
                <div className="attention-body">
                  <div className="attention-label">{item.label}</div>
                  <div className="attention-detail">{item.detail}</div>
                </div>
                <div className="attention-loan mono">{item.loan_number}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="home-grid">
        <div className="card">
          <div className="card-header"><h2>Live Screen Pop Feed</h2><span className="text-dim" style={{ fontSize: 11 }}>Most recent 8</span></div>
          <div className="card-body">
            {loading && <div className="text-dim" style={{ fontSize: 12 }}>Loading…</div>}
            {!loading && screenPops.length === 0 && <div className="text-dim" style={{ fontSize: 12 }}>No screen pops yet. Trigger one via the API to see it here.</div>}
            {screenPops.length > 0 && (
              <table className="dense">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Caller</th>
                    <th>Loan</th>
                    <th>Intent</th>
                    <th>Routed To</th>
                    <th>Queue</th>
                  </tr>
                </thead>
                <tbody>
                  {screenPops.map((p) => {
                    const meta = MODULE_META[p.target_module] || { label: p.target_module || '—', color: 'blue' };
                    return (
                      <tr key={p.id} onClick={() => onOpenLoan?.(p.loan_number)} style={{ cursor: 'pointer' }}>
                        <td className="mono text-dim">{new Date(p.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{p.caller_name}<div className="text-dim mono" style={{ fontSize: 10 }}><PhoneLink phone={p.caller_phone} showIcon={false} /></div></td>
                        <td className="mono">{p.loan_number}</td>
                        <td>{(p.intent || 'general').replace(/_/g, ' ')}</td>
                        <td><span className={`badge ${meta.color}`}>{meta.label}</span></td>
                        <td className="text-dim">{p.queue || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Calls by Intent (MTD)</h2><span className="text-dim" style={{ fontSize: 11 }}>{fmtCount(PORTFOLIO.calls_this_month)} total</span></div>
          <div className="card-body">
            {CALLS_BY_INTENT.map((row) => (
              <div className="delinq-row" key={row.intent}>
                <div className="delinq-label">{row.intent}</div>
                <div className="delinq-bar-wrap">
                  <div className="delinq-bar blue" style={{ width: `${row.pct * 2.4}%` }} />
                </div>
                <div className="delinq-count mono">{fmtCount(Math.round(PORTFOLIO.calls_this_month * row.pct / 100))}</div>
                <div className="delinq-pct mono text-dim">{row.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
