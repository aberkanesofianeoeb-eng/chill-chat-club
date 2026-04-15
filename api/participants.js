export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Debug: log all env vars (will appear in Vercel function logs)
  console.log('All env vars:', Object.keys(process.env));
  console.log('BLOB_STORE_ID:', process.env.BLOB_STORE_ID);
  console.log('BLOB_READ_WRITE_TOKEN exists?', !!process.env.BLOB_READ_WRITE_TOKEN);

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId = process.env.BLOB_STORE_ID;

  if (!token) {
    return res.status(500).json({ error: 'Missing BLOB_READ_WRITE_TOKEN' });
  }
  if (!storeId) {
    return res.status(500).json({ error: 'Missing BLOB_STORE_ID. Current env keys: ' + Object.keys(process.env).join(', ') });
  }

  // Use the correct URL format
  const participantsUrl = `https://${storeId}.public.blob.vercel-storage.com/participants.json`;

  async function readParticipants() {
    const response = await fetch(participantsUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Read failed: ${response.status}`);
    return response.json();
  }

  async function writeParticipants(participants) {
    const response = await fetch(participantsUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(participants)
    });
    if (!response.ok) throw new Error(`Write failed: ${response.status}`);
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
      if (!name || name.trim() === '') return res.status(400).json({ error: 'Name required' });
      let participants = await readParticipants();
      if (participants.length >= 20) return res.status(409).json({ error: 'Max 20 reached' });
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
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
