export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
  if (!BLOB_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN missing. Add it in Vercel Environment Variables.' });
  }

  const BLOB_URL = `https://blob.vercel-storage.com/participants.json`;

  async function readData() {
    const response = await fetch(BLOB_URL, {
      headers: { Authorization: `Bearer ${BLOB_TOKEN}` }
    });
    if (response.status === 404) return [];
    const data = await response.json();
    return data;
  }

  async function writeData(data) {
    await fetch(BLOB_URL, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${BLOB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  try {
    if (req.method === 'GET') {
      const participants = await readData();
      const obj = {};
      participants.forEach((p, idx) => { obj[idx] = p; });
      return res.status(200).json(obj);
    }

    if (req.method === 'POST') {
      const { name, timestamp } = req.body;
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Name required' });
      }
      let participants = await readData();
      if (participants.length >= 20) {
        return res.status(409).json({ error: 'Maximum 20 participants reached' });
      }
      participants.push({ name: name.trim(), timestamp: timestamp || Date.now() });
      await writeData(participants);
      return res.status(201).json({ name });
    }

    if (req.method === 'DELETE') {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== 'admin123') return res.status(401).json({ error: 'Unauthorized' });
      await writeData([]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
