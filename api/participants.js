// HARDCODE YOUR STORE ID HERE (temporary)
const STORE_ID = 'store_O90tt5CEPDOMLqkn'; // <-- PASTE YOUR ACTUAL STORE ID
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN; // still use env var for token

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!TOKEN) {
    return res.status(500).json({ error: 'Missing BLOB_READ_WRITE_TOKEN' });
  }

  const participantsUrl = `https://${STORE_ID}.public.blob.vercel-storage.com/participants.json`;

  async function readParticipants() {
    const res = await fetch(participantsUrl, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`Read failed: ${res.status}`);
    return res.json();
  }

  async function writeParticipants(participants) {
    const res = await fetch(participantsUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(participants)
    });
    if (!res.ok) throw new Error(`Write failed: ${res.status}`);
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
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
