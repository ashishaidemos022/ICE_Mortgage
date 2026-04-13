let cachedToken = null;
let cachedExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedExpiry - 30_000) return cachedToken;

  const tokenUrl     = process.env.SMS_TOKEN_URL;
  const clientId     = process.env.SMS_CLIENT_ID;
  const clientSecret = process.env.SMS_CLIENT_SECRET;
  const scope        = process.env.SMS_SCOPE;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body  = new URLSearchParams({ grant_type: 'client_credentials', scope });

  const res = await fetch(tokenUrl, {
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { borrowerName, phone, message } = req.body || {};
    if (!phone)   return res.status(400).json({ error: 'Missing phone' });
    if (!message) return res.status(400).json({ error: 'Missing message' });

    const token = await getAccessToken();

    const payload = {
      'data::patient_name':            borrowerName || '',
      'data::message':                 message,
      'contacts[0]::channels[0]::uri': toE164(phone),
    };

    const apiRes = await fetch(process.env.SMS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await apiRes.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: 'SMS send failed', detail: data });
    }

    return res.status(200).json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
