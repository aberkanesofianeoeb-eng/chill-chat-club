const BIN_ID = 'https://api.jsonbin.io/v3/b/69dfb73d856a6821893962f0';      // <-- paste your Bin ID
const API_KEY = '$2a$10$TYs1WVnDjyIBd9xo7GnJ4u6PeW48TkFtMzxQiKoEBmk3esvTXLOfm';    // <-- paste your API key
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  async function readData() {
    const response = await fetch(BASE_URL, {
      headers: { 'X-Master-Key': API_KEY }
    });
    const data = await response.json();
    return data.record; // { participants: [], winner: null }
  }

  async function writeData(record) {
    await fetch(BASE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify(record)
    });
  }

  try {
    // GET participants & winner
    if (req.method === 'GET') {
      const data = await readData();
      const participants = data.participants || [];
      const obj = {};
      participants.forEach((p, idx) => { obj[idx] = p; });
      return res.status(200).json({
        participants: obj,
        count: participants.length,
        winner: data.winner
      });
    }

    // POST register participant
    if (req.method === 'POST') {
      const { name, timestamp } = req.body;
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Name required' });
      }
      const data = await readData();
      let participants = data.participants || [];
      // Optional: set a maximum (e.g., 20)
      if (participants.length >= 20) {
        return res.status(409).json({ error: 'Maximum 20 participants reached' });
      }
      participants.push({ name: name.trim(), timestamp: timestamp || Date.now() });
      await writeData({ participants, winner: data.winner });
      return res.status(201).json({ name });
    }

    // PUT draw winner (admin only) – picks random from current list, then clears
    if (req.method === 'PUT') {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== 'admin123') return res.status(401).json({ error: 'Unauthorized' });
      const data = await readData();
      const participants = data.participants || [];
      if (participants.length === 0) {
        return res.status(400).json({ error: 'No participants to draw from' });
      }
      const randomIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[randomIndex].name;
      // Clear participants for next round, keep winner in record (optional)
      await writeData({ participants: [], winner });
      return res.status(200).json({ winner });
    }

    // DELETE manual reset (admin only)
    if (req.method === 'DELETE') {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== 'admin123') return res.status(401).json({ error: 'Unauthorized' });
      await writeData({ participants: [], winner: null });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
