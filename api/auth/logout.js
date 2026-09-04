export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Dashboard-Key, X-Session-Token, X-User-Id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return res.status(200).json({ ok: true, message: 'Sesión finalizada.' });
}
