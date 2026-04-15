export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId = process.env.BLOB_STORE_ID;

  if (!token) {
    return res.status(500).json({ error: 'Missing BLOB_READ_WRITE_TOKEN' });
  }
  if (!storeId) {
    return res.status(500).json({ error: 'Missing BLOB_STORE_ID. Add it in Environment Variables.' });
  }

  // Correct blob URL format
  const BLOB_URL = `https://${storeId}.public.blob.vercel-storage.com/participants.json`;

  async function readParticipants() {
    const response = await fetch(BLOB_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Read failed: ${response.status}`);
    const data = await response.json();
    console.log(`Read ${data.length} participants`);
    return data;
  }

  async function writeParticipants(participants) {
    const response = await fetch(BLOB_URL, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(participants)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Write failed: ${response.status} - ${text}`);
    }
    console.log(`Written ${participants.length} participants`);
  }

  try {
    if (req.method === 'GET') {
      const participants = await readParticipants();
      const obj = {};
      participants.forEach((p, idx) => { obj[idx] = p; });
      return res.status(200).json(obj);
    }

    if (req.method === 'POST') {
      const { name, timestamp } = req.body;
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Name required' });
      }
      let participants = await readParticipants();
      if (participants.length >= 20) {
        return res.status(409).json({ error: 'Maximum 20 participants reached' });
      }
      participants.push({ name: name.trim(), timestamp: timestamp || Date.now() });
      await writeParticipants(participants);
      return res.status(201).json({ name });
    }

    if (req.method === 'DELETE') {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== 'admin123') return res.status(401).json({ error: 'Unauthorized' });
      await writeParticipants([]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
