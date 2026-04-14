// api/participants.js
export default async function handler(req, res) {
  const FIREBASE_URL = process.env.FIREBASE_URL || 'https://qrcode-54ca8-default-rtdb.firebaseio.com';
  const FIREBASE_AUTH = process.env.FIREBASE_AUTH; // optional token

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const authQuery = FIREBASE_AUTH ? `?auth=${FIREBASE_AUTH}` : '';

  try {
    if (req.method === 'GET') {
      const response = await fetch(`${FIREBASE_URL}/participants.json${authQuery}`);
      const text = await response.text();
      if (!response.ok) {
        console.error('Firebase GET error body:', text);
        return res.status(response.status).json({ error: text });
      }
      const data = JSON.parse(text || '{}');
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      if (!req.body || !req.body.name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      const payload = { name: req.body.name, timestamp: req.body.timestamp || Date.now() };
      const response = await fetch(`${FIREBASE_URL}/participants.json${authQuery}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await response.text();
      if (!response.ok) {
        console.error('Firebase POST error body:', text);
        return res.status(response.status).json({ error: text });
      }
      const data = JSON.parse(text);
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const adminPassword = req.headers['x-admin-key'];
      if (adminPassword !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const response = await fetch(`${FIREBASE_URL}/participants.json${authQuery}`, { method: 'DELETE' });
      const text = await response.text();
      if (!response.ok) {
        console.error('Firebase DELETE error body:', text);
        return res.status(response.status).json({ error: text });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || String(error) });
  }
}
