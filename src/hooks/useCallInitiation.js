import { useState, useRef, useEffect } from 'react';
import { initiateCall } from '../lib/callClient';
import { supabase } from '../supabaseClient';

export function useCallInitiation(loan) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const call = async (phone) => {
    if (!phone || status === 'calling') return;
    clearTimeout(timerRef.current);
    setStatus('calling');
    setError(null);
    try {
      await initiateCall({ phone });

      if (loan?.id) {
        await supabase.from('icemortgage_interactions').insert({
          loan_id: loan.id,
          borrower_id: loan.borrower?.id || null,
          interaction_type: 'phone_outbound',
          channel: 'voice',
          direction: 'outbound',
          agent_name: 'Sarah Johnson',
          summary: `Outbound call initiated to ${phone}`,
          topic: 'general',
          sentiment: 'neutral',
        });
      }

      setStatus('success');
      timerRef.current = setTimeout(() => setStatus(null), 2500);
    } catch (err) {
      setError(err.message || String(err));
      setStatus('error');
      timerRef.current = setTimeout(() => { setStatus(null); setError(null); }, 4500);
    }
  };

  return { status, error, call };
}
