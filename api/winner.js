let winner = null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET winner
    if (req.method === 'GET') {
      return res.status(200).json(winner || {});
    }

    // PUT winner
    if (req.method === 'PUT') {
      const { name, timestamp } = req.body;
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Valid winner name required' });
      }
      winner = { name: name.trim(), timestamp: timestamp || Date.now() };
      return res.status(200).json(winner);
    }

    // DELETE winner (admin only)
    if (req.method === 'DELETE') {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== 'admin123') return res.status(401).json({ error: 'Unauthorized' });
      winner = null;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Winner API Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
