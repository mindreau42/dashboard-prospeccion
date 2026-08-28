import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── CONFIGURATION & ENVIRONMENT VARIABLES ──
const PORT = process.env.PORT || 5185;
const DB_FILE = path.join(__dirname, 'server_data.json');
const DIST_DIR = path.join(__dirname, 'dist');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '').trim();
const DASHBOARD_API_KEY = (process.env.DASHBOARD_API_KEY || '').trim();

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const DEFAULT_SERVER_STATE = {
  groupsData: {
    'Setters Aspirantes': {
      records: [],
      url: 'https://docs.google.com/spreadsheets/d/1Z2CXH0YmaPcTVjQlCCnduRKdM91lrTiAcvqo2nH-E1k/edit?usp=sharing',
      sourceName: 'Google Sheets (Setters Aspirantes)',
      lastSync: ''
    },
    'Setters Oficiales': {
      records: [],
      url: 'https://docs.google.com/spreadsheets/d/1uPX_UFqe1giECEIOANQ8ihVAxybP-HHTsNKZy2gpqhM/edit?usp=sharing',
      sourceName: 'Google Sheets (Setters Oficiales)',
      lastSync: ''
    }
  },
  callersData: {
    'Caller 1': {
      name: 'Caller 1 — Nury',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1XVwdte_5CKGHSxmeEQo5AT812REs_1YF/edit?usp=sharing&ouid=109702363461847797717&rtpof=true&sd=true',
      callerRecords: [],
      scorecardReports: [],
      lastSync: ''
    },
    'Caller 2': {
      name: 'Caller 2',
      sheetUrl: '',
      callerRecords: [],
      scorecardReports: [],
      lastSync: ''
    }
  },
  adminReports: []
};

// ── IN-MEMORY ACTIVE SESSIONS STORE (1 SESSION PER USER ENFORCEMENT) ──
// Map<userId, { sessionToken, username, ip, userAgent, lastHeartbeat, createdAt }>
const activeSessions = new Map();

// Periodic cleanup of stale sessions (> 10 minutes without heartbeat)
setInterval(() => {
  const now = Date.now();
  for (const [userId, sess] of activeSessions.entries()) {
    if (now - sess.lastHeartbeat > 10 * 60 * 1000) {
      activeSessions.delete(userId);
    }
  }
}, 60 * 1000);

// ── SUPABASE REST STORAGE ADAPTER (RESILIENT & ZERO EXTERNAL LIBS) ──
const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

async function supabaseFetch(endpoint, options = {}) {
  if (!isSupabaseConfigured) return null;
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=representation',
    ...options.headers
  };
  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[Supabase Error] ${options.method || 'GET'} ${endpoint} -> ${res.status}:`, errText);
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    return true;
  } catch (err) {
    console.error(`[Supabase Network Error] ${endpoint}:`, err.message);
    return null;
  }
}

// ── LOCAL STORAGE FALLBACK ──
function readLocalDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[DB] Error reading local DB file:', err.message);
  }
  return DEFAULT_SERVER_STATE;
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[DB] Error writing local DB file:', err.message);
    return false;
  }
}

// ── UNIFIED DATABASE READ & WRITE ──
async function getPersistedState() {
  if (isSupabaseConfigured) {
    const data = await supabaseFetch('/app_state?id=eq.main_state&select=*');
    if (data && Array.isArray(data) && data.length > 0) {
      const row = data[0];
      return {
        groupsData: row.groups_data || DEFAULT_SERVER_STATE.groupsData,
        callersData: row.callers_data || DEFAULT_SERVER_STATE.callersData,
        adminReports: row.admin_reports || DEFAULT_SERVER_STATE.adminReports
      };
    }
  }
  return readLocalDb();
}

async function savePersistedState(incoming) {
  const current = await getPersistedState();
  const merged = {
    ...current,
    ...incoming,
    groupsData: incoming.groupsData ? { ...current.groupsData, ...incoming.groupsData } : current.groupsData,
    callersData: incoming.callersData ? { ...current.callersData, ...incoming.callersData } : current.callersData,
    adminReports: incoming.adminReports !== undefined ? incoming.adminReports : current.adminReports,
    users: incoming.users !== undefined ? incoming.users : current.users
  };

  // Always write local file as backup cache
  writeLocalDb(merged);

  // If Supabase is active, persist permanently in PostgreSQL
  if (isSupabaseConfigured) {
    await supabaseFetch('/app_state', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: JSON.stringify({
        id: 'main_state',
        groups_data: merged.groupsData,
        callers_data: merged.callersData,
        admin_reports: merged.adminReports,
        updated_at: new Date().toISOString()
      })
    });
  }

  return merged;
}

// ── HTTP SERVER & ROUTER ──
const server = http.createServer(async (req, res) => {
  // ── SECURITY HEADERS ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Dashboard-Key, X-Session-Token, X-User-Id');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const pathname = parsedUrl.pathname;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // ── HEALTH CHECK FOR RENDER ──
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      uptime: Math.round(process.uptime()),
      supabaseActive: isSupabaseConfigured,
      activeSessionsCount: activeSessions.size,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // ── 1. AUTH: SINGLE SESSION LOGIN (POST /api/auth/login) ──
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { userId, username } = JSON.parse(body || '{}');
        if (!userId || !username) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Faltan parámetros de usuario requeridos.' }));
          return;
        }

        // Generate strong session token
        const sessionToken = 'sess_' + crypto.randomBytes(24).toString('hex');
        const now = Date.now();

        // STRICT CONCURRENCY: Replace any previous active session for this user
        activeSessions.set(userId, {
          sessionToken,
          username,
          ip,
          userAgent,
          lastHeartbeat: now,
          createdAt: now
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          sessionToken,
          userId,
          username,
          message: 'Sesión única inicializada exitosamente.'
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ── 2. AUTH: HEARTBEAT & SINGLE SESSION VALIDATION (POST /api/auth/heartbeat) ──
  if (pathname === '/api/auth/heartbeat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { userId, sessionToken } = JSON.parse(body || '{}');
        if (!userId || !sessionToken) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, code: 'INVALID_CREDENTIALS', message: 'Credenciales incompletas.' }));
          return;
        }

        const currentSession = activeSessions.get(userId);

        // Check if session exists and token matches
        if (!currentSession || currentSession.sessionToken !== sessionToken) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            ok: false,
            code: 'SESSION_TERMINATED',
            message: 'Tu sesión fue cerrada porque se inició sesión en otro dispositivo o navegador.'
          }));
          return;
        }

        // Update heartbeat
        currentSession.lastHeartbeat = Date.now();
        activeSessions.set(userId, currentSession);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, active: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ── 3. AUTH: LOGOUT (POST /api/auth/logout) ──
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { userId, sessionToken } = JSON.parse(body || '{}');
        if (userId && activeSessions.has(userId)) {
          const current = activeSessions.get(userId);
          if (!sessionToken || current.sessionToken === sessionToken) {
            activeSessions.delete(userId);
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'Sesión finalizada.' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ── 4. STATE API: GET & POST /api/state (PERSISTENT CLOUD & LOCAL) ──
  if (pathname === '/api/state') {
    if (req.method === 'GET') {
      const state = await getPersistedState();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify(state));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const incoming = JSON.parse(body || '{}');
          const saved = await savePersistedState(incoming);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, state: saved }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  // ── 5. STATIC FILES (SPA DIST DELIVERY) ──
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error al leer archivo: ' + err.message);
      return;
    }
    const headers = { 'Content-Type': contentType };
    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    } else if (ext === '.js' || ext === '.css' || ext === '.woff2') {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }
    res.writeHead(200, headers);
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Server] Dashboard activo en http://0.0.0.0:${PORT}`);
  console.log(`🔒 [Seguridad] Límite de sesión única (1 sesión por usuario) ACTIVO.`);
  console.log(`☁️  [Persistencia] Supabase: ${isSupabaseConfigured ? 'CONECTADO ✅' : 'MODO LOCAL (server_data.json) 📁'}`);
});
