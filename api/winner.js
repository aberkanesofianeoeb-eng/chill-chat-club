export default async function handler(req, res) {
  const FIREBASE_URL = 'https://console.firebase.google.com/project/qrcode-54ca8/database/qrcode-54ca8-default-rtdb/data/~2F';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET winner
    if (req.method === 'GET') {
      const fbRes = await fetch(`${FIREBASE_URL}/winner.json`);
      if (!fbRes.ok) throw new Error(`Firebase error: ${fbRes.status}`);
      const data = await fbRes.json();
      return res.status(200).json(data || {});
    }

    // PUT winner (set winner)
    if (req.method === 'PUT') {
      const { name, timestamp } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Valid winner name required' });
      }

      const fbRes = await fetch(`${FIREBASE_URL}/winner.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          timestamp: timestamp || Date.now()
        })
      });

      if (!fbRes.ok) throw new Error(`Firebase PUT error: ${fbRes.status}`);
      const data = await fbRes.json();
      return res.status(200).json(data);
    }

    // DELETE winner (admin only)
    if (req.method === 'DELETE') {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const fbRes = await fetch(`${FIREBASE_URL}/winner.json`, {
        method: 'DELETE'
      });
      if (!fbRes.ok) throw new Error(`Firebase DELETE error: ${fbRes.status}`);
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'OPTIONS']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });

  } catch (error) {
    console.error('winner API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
