export default async function handler(req, res) {
  const FIREBASE_URL = 'https://console.firebase.google.com/project/qrcode-54ca8/database/qrcode-54ca8-default-rtdb/data/~2F'; 

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const testRes = await fetch(`${FIREBASE_URL}/.json`);
    if (testRes.status === 404) {
      throw new Error('Firebase Realtime Database not found. Create it in Firebase Console.');
    }

    if (req.method === 'GET') {
      const fbRes = await fetch(`${FIREBASE_URL}/winner.json`);
      const data = await fbRes.json();
      return res.status(200).json(data || {});
    }

    if (req.method === 'PUT') {
      const { name, timestamp } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Valid winner name required' });
      }
      const fbRes = await fetch(`${FIREBASE_URL}/winner.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), timestamp: timestamp || Date.now() })
      });
      if (!fbRes.ok) throw new Error(`Firebase PUT error: ${fbRes.status}`);
      const data = await fbRes.json();
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== 'admin123') return res.status(401).json({ error: 'Unauthorized' });
      const fbRes = await fetch(`${FIREBASE_URL}/winner.json`, { method: 'DELETE' });
      if (!fbRes.ok) throw new Error(`Firebase DELETE error: ${fbRes.status}`);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Winner API Error:', error.message);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
