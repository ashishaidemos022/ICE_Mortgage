export async function initiateCall({ phone }) {
  if (!phone) throw new Error('Missing phone number');

  const res = await fetch('/api/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json.detail ? ` — ${JSON.stringify(json.detail)}` : '';
    throw new Error(`${json.error || 'Call failed'}${detail}`);
  }
  return json;
}
