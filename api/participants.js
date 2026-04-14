// In-memory storage (resets on cold starts, but works immediately)
let participants = [];
let nextId = 1;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET all participants
    if (req.method === 'GET') {
      // Convert to object format compatible with frontend
      const obj = {};
      participants.forEach(p => { obj[p.id] = { name: p.name, timestamp: p.timestamp }; });
      return res.status(200).json(obj);
    }

    // POST new participant
    if (req.method === 'POST') {
      const { name, timestamp } = req.body;
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Valid name required' });
      }
      if (participants.length >= 20) {
        return res.status(409).json({ error: 'Maximum 20 participants reached' });
      }
      const newParticipant = {
        id: nextId++,
        name: name.trim(),
        timestamp: timestamp || Date.now()
      };
      participants.push(newParticipant);
      return res.status(201).json({ name: newParticipant.name });
    }

    // DELETE all participants (admin only)
    if (req.method === 'DELETE') {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== 'admin123') return res.status(401).json({ error: 'Unauthorized' });
      participants = [];
      nextId = 1;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
