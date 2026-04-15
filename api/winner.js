const STORE_ID = 'store_O90tt5CEPDOMLqkn'; // same as above
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!TOKEN) return res.status(500).json({ error: 'Missing token' });

  const winnerUrl = `https://${STORE_ID}.public.blob.vercel-storage.com/winner.json`;

  async function readWinner() {
    const res = await fetch(winnerUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Read failed: ${res.status}`);
    return res.json();
  }

  async function writeWinner(winner) {
    const res = await fetch(winnerUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(winner)
    });
    if (!res.ok) throw new Error(`Write failed: ${res.status}`);
  }

  try {
    if (req.method === 'GET') {
      const winner = await readWinner();
      return res.status(200).json(winner || {});
    }
    if (req.method === 'PUT') {
      const { name, timestamp } = req.body;
      if (!name || name.trim() === '') return res.status(400).json({ error: 'Winner name required' });
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
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
