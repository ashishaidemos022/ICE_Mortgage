const TOKEN_URL     = import.meta.env.VITE_SMS_TOKEN_URL;
const API_URL       = import.meta.env.VITE_SMS_API_URL;
const CLIENT_ID     = import.meta.env.VITE_SMS_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_SMS_CLIENT_SECRET;
const SCOPE         = import.meta.env.VITE_SMS_SCOPE;

let cachedToken = null;
let cachedExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedExpiry - 30_000) return cachedToken;

  const basic = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const body = new URLSearchParams({ grant_type: 'client_credentials', scope: SCOPE });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OAuth token request failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  cachedToken  = json.access_token;
  cachedExpiry = now + (Number(json.expires_in || 3600) * 1000);
  return cachedToken;
}

function toE164(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (String(phone).startsWith('+')) return String(phone);
  return `+${digits}`;
}

export async function sendSms({ borrowerName, phone, message }) {
  if (!TOKEN_URL || !API_URL || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('SMS credentials not configured. Check VITE_SMS_* environment variables.');
  }
  if (!phone)   throw new Error('Missing phone number');
  if (!message) throw new Error('Missing message body');

  const token = await getAccessToken();

  const payload = {
    'data::patient_name':              borrowerName || '',
    'data::message':                   message,
    'contacts[0]::channels[0]::uri':   toE164(phone),
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`SMS send failed (${res.status}): ${text}`);
  }

  return res.json().catch(() => ({ ok: true }));
}
