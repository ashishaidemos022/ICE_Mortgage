export async function sendSms({ borrowerName, phone, message }) {
  if (!phone)   throw new Error('Missing phone number');
  if (!message) throw new Error('Missing message body');

  const res = await fetch('/api/send-sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ borrowerName, phone, message }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json.detail ? ` — ${JSON.stringify(json.detail)}` : '';
    throw new Error(`${json.error || 'SMS send failed'}${detail}`);
  }
  return json;
}
