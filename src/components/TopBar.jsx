import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function TopBar({ activeLoan, onSelectLoan }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const q = query.trim();
      const isNumeric = /^\d+$/.test(q);

      let rows = [];
      if (isNumeric) {
        const { data } = await supabase
          .from('icemortgage_loans')
          .select('loan_number, loan_status, borrower:icemortgage_borrowers(first_name,last_name)')
          .ilike('loan_number', `%${q}%`)
          .limit(8);
        rows = data || [];
      } else {
        const { data } = await supabase
          .from('icemortgage_loans')
          .select('loan_number, loan_status, borrower:icemortgage_borrowers!inner(first_name,last_name)')
          .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`, { foreignTable: 'icemortgage_borrowers' })
          .limit(8);
        rows = data || [];
      }
      if (!cancelled) { setResults(rows); setOpen(true); }
    }, 180);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  useEffect(() => {
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <span className="ice">ICE</span>
        <span className="platform">MSP® Servicing Platform</span>
      </div>
      <div className="topbar-search" ref={boxRef}>
        <span className="icon">⌕</span>
        <input
          placeholder="Loan number or borrower name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
        />
        {open && results.length > 0 && (
          <div className="topbar-search-results">
            {results.map((r) => (
              <button
                key={r.loan_number}
                onClick={() => {
                  onSelectLoan(r.loan_number);
                  setQuery('');
                  setResults([]);
                  setOpen(false);
                }}
              >
                <span className="loan-no">{r.loan_number}</span>
                <span className="loan-label">
                  {r.borrower?.first_name} {r.borrower?.last_name} · {r.loan_status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex1" />
      {activeLoan && (
        <div className="topbar-agent" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <span className="mono" style={{ color: '#B8C5D6' }}>LOAN</span>
          <span className="mono" style={{ fontWeight: 600 }}>{activeLoan}</span>
        </div>
      )}
      <div className="topbar-agent">
        <span className="avatar">SJ</span>
        <div>
          <div style={{ fontWeight: 600 }}>Sarah Johnson</div>
          <div style={{ fontSize: 10, color: '#B8C5D6' }}><span className="status-dot" style={{ background: '#4CAF50', width: 6, height: 6 }} /> Customer Service · Available</div>
        </div>
      </div>
    </div>
  );
}
