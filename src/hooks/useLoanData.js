import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useLoanData(loanNumber) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loanNumber) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const { data: loan, error: loanErr } = await supabase
        .from('icemortgage_loans')
        .select(`
          *,
          borrower:icemortgage_borrowers(*),
          property:icemortgage_properties(*),
          escrow_account:icemortgage_escrow_accounts(*),
          payments:icemortgage_payments(*),
          disbursements:icemortgage_escrow_disbursements(*),
          documents:icemortgage_documents(*),
          interactions:icemortgage_interactions(*),
          compliance_flags:icemortgage_compliance_flags(*),
          call_predictions:icemortgage_call_predictions(*),
          collections_case:icemortgage_collections_cases(*),
          lossmit_case:icemortgage_lossmit_cases(*, lossmit_documents:icemortgage_lossmit_documents(*))
        `)
        .eq('loan_number', loanNumber)
        .maybeSingle();

      if (cancelled) return;
      if (loanErr) {
        setError(loanErr);
        setLoading(false);
        return;
      }
      setData(loan);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [loanNumber]);

  return { data, loading, error };
}
