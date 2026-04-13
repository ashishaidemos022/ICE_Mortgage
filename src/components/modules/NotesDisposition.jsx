import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { formatDate } from '../../lib/constants';

const PRIMARY_REASONS = [
  'escrow_inquiry','payment_question','pmi_inquiry','payoff_request',
  'hardship_disclosure','payment_plan_request','document_request','general',
];
const RESOLUTIONS = ['first_call_resolution','follow_up_required','transferred','escalated'];
const SENTIMENTS  = ['positive','neutral','negative'];

export default function NotesDisposition({ loan, screenPopId, onPushed }) {
  const [note, setNote] = useState('');
  const [primary, setPrimary] = useState('escrow_inquiry');
  const [resolution, setResolution] = useState('first_call_resolution');
  const [sentiment, setSentiment] = useState('neutral');
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState(null);

  const push = async () => {
    if (!note.trim()) return;
    setPushing(true);
    setResult(null);

    const agentName = 'Sarah Johnson';
    const duration = Math.floor(Math.random() * 420) + 180;

    const [{ data: noteRow, error: ne }, { data: dispRow, error: de }, { error: ie }] = await Promise.all([
      supabase.from('icemortgage_notes').insert({
        loan_id: loan.id,
        screen_pop_id: screenPopId || null,
        agent_name: agentName,
        note_text: note,
        synced_to_external: true,
        external_system: 'cti_external',
      }).select().maybeSingle(),
      supabase.from('icemortgage_dispositions').insert({
        loan_id: loan.id,
        screen_pop_id: screenPopId || null,
        primary_reason: primary,
        resolution,
        sentiment,
        agent_name: agentName,
        synced_to_external: true,
      }).select().maybeSingle(),
      supabase.from('icemortgage_interactions').insert({
        loan_id: loan.id,
        borrower_id: loan.borrower_id,
        interaction_type: 'phone_inbound',
        channel: 'voice',
        direction: 'inbound',
        agent_name: agentName,
        summary: `${primary.replace(/_/g,' ')} — ${resolution.replace(/_/g,' ')}`,
        detail: note,
        topic: primary.split('_')[0],
        resolution: resolution.replace('_resolution',''),
        sentiment,
        call_duration_seconds: duration,
        recording_url: `https://recordings.example.com/${loan.loan_number}/${Date.now()}.mp3`,
        transcript_url: `https://transcripts.example.com/${loan.loan_number}/${Date.now()}.txt`,
        external_call_id: `CALL-${Date.now()}`,
      }),
    ]);

    setPushing(false);
    if (ne || de || ie) {
      setResult({ ok: false, err: ne || de || ie });
    } else {
      setResult({ ok: true, noteId: noteRow?.id, dispId: dispRow?.id, duration });
      setNote('');
      onPushed?.();
    }
  };

  return (
    <div className="grid-2">
      <div>
        <div className="card">
          <div className="card-header"><h2>Call Notes</h2></div>
          <div className="card-body">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={10}
              placeholder="Summarize the call: borrower request, actions taken, next steps…"
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid var(--border)',
                borderRadius: 4,
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                lineHeight: 1.5,
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Disposition</h2></div>
          <div className="card-body">
            <Pillset label="Primary Reason" value={primary}    onChange={setPrimary}    options={PRIMARY_REASONS} />
            <Pillset label="Resolution"     value={resolution} onChange={setResolution} options={RESOLUTIONS} />
            <Pillset label="Sentiment"      value={sentiment}  onChange={setSentiment}  options={SENTIMENTS} sentiment />
          </div>
        </div>

        <div className="row gap8">
          <button className="btn primary" onClick={push} disabled={pushing || !note.trim()}>
            {pushing ? 'Pushing…' : '↗ Push Notes & Disposition to External'}
          </button>
          <button className="btn">Save Draft</button>
        </div>

        {result?.ok && (
          <div className="alert green" style={{ marginTop: 12 }}>
            <div className="icon">✓</div>
            <div>
              <div className="title">Synced to External System</div>
              <div className="detail">
                Note {result.noteId?.slice(0,8)} · Disposition {result.dispId?.slice(0,8)} · Call duration {result.duration}s logged to interactions.
              </div>
            </div>
          </div>
        )}
        {result && !result.ok && (
          <div className="alert red" style={{ marginTop: 12 }}>
            <div className="icon">✕</div>
            <div>
              <div className="title">Push Failed</div>
              <div className="detail">{result.err?.message}</div>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="card">
          <div className="card-header"><h2>Call Metadata</h2></div>
          <div className="card-body">
            <div className="data-grid">
              <div className="label">Loan #</div>          <div className="value mono">{loan.loan_number}</div>
              <div className="label">Borrower</div>        <div className="value">{loan.borrower?.first_name} {loan.borrower?.last_name}</div>
              <div className="label">Screen Pop ID</div>   <div className="value mono">{screenPopId ? screenPopId.slice(0,8) : '—'}</div>
              <div className="label">Agent</div>           <div className="value">Sarah Johnson · AG-1042</div>
              <div className="label">Timestamp</div>       <div className="value">{formatDate(new Date())}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Data Flow</h2></div>
          <div className="card-body">
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.6 }}>
              <div>[ Calling System ]</div>
              <div>    ↓ screen_pop (POST)</div>
              <div>[ MSP icemortgage_screen_pops ]</div>
              <div>    ↓ realtime push</div>
              <div>[ Agent Desktop ]</div>
              <div>    ↓ notes + disposition</div>
              <div>[ icemortgage_notes / _dispositions / _interactions ]</div>
              <div>    ↓ push_notes (POST)</div>
              <div>[ Calling System ]  <span className="text-green">← bidirectional sync</span></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Recent Notes (This Loan)</h2></div>
          <div className="card-body">
            <div className="text-dim xsmall">Pushed notes are written to <span className="mono">icemortgage_notes</span> with <span className="mono">synced_to_external=true</span>.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pillset({ label, value, onChange, options, sentiment }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="xsmall upper text-dim" style={{ marginBottom: 4 }}>{label}</div>
      <div className="row gap4" style={{ flexWrap: 'wrap' }}>
        {options.map((o) => {
          const active = value === o;
          const color = sentiment ? (o === 'positive' ? 'green' : o === 'negative' ? 'red' : 'gray') : 'blue';
          return (
            <button
              key={o}
              className={`btn sm ${active ? 'primary' : ''}`}
              onClick={() => onChange(o)}
              style={active && sentiment ? {
                background: `var(--${color === 'green' ? 'green' : color === 'red' ? 'red' : 'blue'})`,
                borderColor: `var(--${color === 'green' ? 'green' : color === 'red' ? 'red' : 'blue'})`,
              } : undefined}
            >
              {o.replace(/_/g, ' ')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
