export default async function handler(req, res) {
  const FIREBASE_URL = 'https://qrcode-54ca8-default-rtdb.firebaseio.com';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const response = await fetch(`${FIREBASE_URL}/winner.json`, {
        method: 'GET'
      });
      if (!response.ok) throw new Error(`Firebase error: ${response.status}`);
      const data = await response.json();
      return res.status(200).json(data || {});
    }

    if (req.method === 'PUT') {
      if (!req.body || !req.body.name) {
        return res.status(400).json({ error: 'Missing winner name' });
      }

      const response = await fetch(`${FIREBASE_URL}/winner.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: req.body.name,
          timestamp: req.body.timestamp || Date.now()
        })
      });

      if (!response.ok) throw new Error(`Firebase error: ${response.status}`);
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const adminPassword = req.headers['x-admin-key'];
      if (adminPassword !== 'admin123') {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const response = await fetch(`${FIREBASE_URL}/winner.json`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error(`Firebase error: ${response.status}`);
      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('Winner API Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
