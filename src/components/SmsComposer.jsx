import { useState } from 'react';
import { sendSms } from '../lib/smsClient';
import { supabase } from '../supabaseClient';

export default function SmsComposer({ loan, presetMessage = '', title = 'Send SMS', onClose }) {
  const b = loan?.borrower || {};
  const borrowerName = `${b.first_name || ''} ${b.last_name || ''}`.trim();
  const [message, setMessage] = useState(presetMessage);
  const [phone, setPhone]     = useState(b.phone || '');
  const [sending, setSending] = useState(false);
  const [status, setStatus]   = useState(null);
  const [error, setError]     = useState(null);

  const charCount = message.length;
  const segments  = Math.max(1, Math.ceil(charCount / 160));

  const handleSend = async () => {
    setSending(true);
    setError(null);
    setStatus(null);
    try {
      await sendSms({ borrowerName, phone, message });

      if (loan?.id) {
        await supabase.from('icemortgage_interactions').insert({
          loan_id: loan.id,
          borrower_id: loan.borrower?.id || null,
          interaction_type: 'sms',
          channel: 'digital',
          direction: 'outbound',
          agent_name: 'Sarah Johnson',
          summary: `SMS sent to ${borrowerName}`,
          detail: message,
          topic: 'general',
          sentiment: 'neutral',
        });
      }

      setStatus('SMS sent successfully.');
      setTimeout(() => onClose?.(), 1200);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sms-modal-head">
          <div>
            <div className="upper text-dim" style={{ fontSize: 10 }}>{title}</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{borrowerName || 'Borrower'}</div>
            <div className="mono text-dim" style={{ fontSize: 11 }}>Loan {loan?.loan_number}</div>
          </div>
          <button className="btn" onClick={onClose} disabled={sending}>×</button>
        </div>

        <div className="sms-modal-body">
          <label className="sms-field">
            <div className="label">To</div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={sending}
            />
          </label>

          <label className="sms-field">
            <div className="label">Message</div>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message…"
              disabled={sending}
            />
            <div className="sms-meta">
              <span>{charCount} chars · {segments} segment{segments > 1 ? 's' : ''}</span>
            </div>
          </label>

          {error  && <div className="alert red"><div><div className="title">Send failed</div><div className="detail">{error}</div></div></div>}
          {status && <div className="alert green"><div><div className="title">Success</div><div className="detail">{status}</div></div></div>}
        </div>

        <div className="sms-modal-foot">
          <button className="btn" onClick={onClose} disabled={sending}>Cancel</button>
          <button
            className="btn primary"
            onClick={handleSend}
            disabled={sending || !message.trim() || !phone.trim()}
          >
            {sending ? 'Sending…' : 'Send SMS'}
          </button>
        </div>
      </div>
    </div>
  );
}
