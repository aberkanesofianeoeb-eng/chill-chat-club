export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId = process.env.BLOB_STORE_ID;

  if (!token || !storeId) {
    return res.status(500).json({ error: 'Missing BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID' });
  }

  const BLOB_URL = `https://${storeId}.public.blob.vercel-storage.com/winner.json`;

  async function readWinner() {
    const response = await fetch(BLOB_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Read failed: ${response.status}`);
    return response.json();
  }

  async function writeWinner(winner) {
    const response = await fetch(BLOB_URL, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(winner)
    });
    if (!response.ok) throw new Error(`Write failed: ${response.status}`);
  }

  try {
    if (req.method === 'GET') {
      const winner = await readWinner();
      return res.status(200).json(winner || {});
    }

    if (req.method === 'PUT') {
      const { name, timestamp } = req.body;
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Winner name required' });
      }
      const winner = { name: name.trim(), timestamp: timestamp || Date.now() };
      await writeWinner(winner);
      return res.status(200).json(winner);
    }

    if (req.method === 'DELETE') {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== 'admin123') return res.status(401).json({ error: 'Unauthorized' });
      await writeWinner(null);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Winner API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
