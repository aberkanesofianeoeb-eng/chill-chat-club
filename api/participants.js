export default async function handler(req, res) {
  const FIREBASE_URL = 'https://console.firebase.google.com/project/qrcode-54ca8/database/qrcode-54ca8-default-rtdb/data/~2F'; 

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Test Firebase connectivity first
    const testRes = await fetch(`${FIREBASE_URL}/.json`);
    if (testRes.status === 404) {
      throw new Error('Firebase Realtime Database not found. Please create it in Firebase Console.');
    }

    if (req.method === 'GET') {
      const fbRes = await fetch(`${FIREBASE_URL}/participants.json`);
      const data = await fbRes.json();
      return res.status(200).json(data || {});
    }

    if (req.method === 'POST') {
      const { name, timestamp } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Valid name required' });
      }

      // Check participant limit
      const countRes = await fetch(`${FIREBASE_URL}/participants.json`);
      const existing = await countRes.json();
      const currentCount = existing ? Object.keys(existing).length : 0;
      if (currentCount >= 20) {
        return res.status(409).json({ error: 'Maximum 20 participants reached' });
      }

      const fbRes = await fetch(`${FIREBASE_URL}/participants.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), timestamp: timestamp || Date.now() })
      });
      if (!fbRes.ok) throw new Error(`Firebase POST error: ${fbRes.status}`);
      const data = await fbRes.json();
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== 'admin123') return res.status(401).json({ error: 'Unauthorized' });
      const fbRes = await fetch(`${FIREBASE_URL}/participants.json`, { method: 'DELETE' });
      if (!fbRes.ok) throw new Error(`Firebase DELETE error: ${fbRes.status}`);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error.message);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
