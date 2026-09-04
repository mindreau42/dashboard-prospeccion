import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Dashboard-Key, X-Session-Token, X-User-Id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { userId, username } = body;

    if (!userId || !username) {
      return res.status(400).json({ error: 'Faltan parámetros de usuario requeridos.' });
    }

    const sessionToken = 'sess_' + crypto.randomBytes(24).toString('hex');

    return res.status(200).json({
      ok: true,
      sessionToken,
      userId,
      username,
      message: 'Sesión iniciada exitosamente.'
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
