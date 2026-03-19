// Vercel serverless function — /api/config
// Env vars: KV_REST_API_URL, KV_REST_API_TOKEN, ADMIN_HASH

const KV_KEY = 'income_config';

async function kvGet() {
  const res = await fetch(`${process.env.KV_REST_API_URL}/get/${KV_KEY}`, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` }
  });
  const data = await res.json();
  if (data.result) {
    // Upstash returns a string — may be double-encoded from old writes
    let parsed = data.result;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { return {}; }
    }
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { return {}; }
    }
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  }
  return {};
}

async function kvSet(value) {
  const str = JSON.stringify(value);
  await fetch(`${process.env.KV_REST_API_URL}/set/${KV_KEY}/${encodeURIComponent(str)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`
    }
  });
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — public config
  if (req.method === 'GET') {
    try {
      const config = await kvGet();
      return res.status(200).json(config);
    } catch (e) {
      return res.status(200).json({});
    }
  }

  // POST — admin actions
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { hash, action, config } = body;
    const adminHash = process.env.ADMIN_HASH;

    if (!hash || !adminHash || hash !== adminHash) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (action === 'verify') {
      return res.status(200).json({ ok: true });
    }

    if (action === 'save' && config) {
      const sanitized = {
        ca: String(config.ca || '').slice(0, 200),
        twitter: String(config.twitter || '').slice(0, 500),
        community: String(config.community || '').slice(0, 500),
        buy: String(config.buy || '').slice(0, 500)
      };
      try {
        await kvSet(sanitized);
        return res.status(200).json({ ok: true });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to save' });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
