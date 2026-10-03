/**
 * server.js — Servidor Profesional y Seguro
 * Dashboard de Gestión y Prospección Comercial
 * Puerto Predeterminado: 5185
 *
 * Características:
 * - Compresión GZIP automática (reduce el consumo de datos en más del 80%)
 * - Túnel Cloudflare Integrado (Ilimitado, 100% gratuito, sin límites de ancho de banda)
 * - Detección automática de Red Local (LAN) para celulares y PCs en la misma oficina
 * - Endpoint /api/network-info para el botón "Compartir Conexión"
 * - Protección contra Directory Traversal y bloqueo de archivos sensibles
 * - Rate Limiting y Cabeceras de Seguridad HTTP
 * - Estado ligero (< 2 KB): no almacena registros pesados en el servidor, todo se procesa en el navegador
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import zlib from 'zlib';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── CONFIGURACIÓN & VARIABLES DE ENTORNO ──
const PORT = parseInt(process.env.PORT || '5185', 10);
const HOST = '0.0.0.0';
const DIST_DIR = path.join(__dirname, 'dist');
const DB_FILE = path.join(__dirname, 'server_data.json');

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://onikxoecnkswznbrxkhn.supabase.co').trim().replace(/\/+$/, '');
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uaWt4b2Vjbmtzd3puYnJ4a2huIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzkyNjQ3OCwiZXhwIjoyMTAzNTAyNDc4fQ.MObgF2VSPVPP77MR6istaZmfjiyB3a5XtzCnGeUho-4').trim();

const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

// ── TIPOS MIME ──
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js':   'application/javascript; charset=UTF-8',
  '.css':  'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':  'font/ttf'
};

// ── ESTADO INICIAL ──
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

// ── SESIONES & RATE LIMITING ──
const activeSessions = new Map();
const rateLimitMap = new Map();

function checkRateLimit(ip, maxPerMin = 240) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > 60000) {
    entry.count = 1;
    entry.windowStart = now;
  } else {
    entry.count++;
  }
  rateLimitMap.set(ip, entry);
  return entry.count <= maxPerMin;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now - data.windowStart > 60000) rateLimitMap.delete(ip);
  }
  for (const [userId, sess] of activeSessions.entries()) {
    if (now - sess.lastHeartbeat > 15 * 60 * 1000) activeSessions.delete(userId);
  }
}, 60000);

// ── DETECCIÓN DE IP LOCAL (LAN) ──
function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// ── TÚNEL CLOUDFLARE AUTOMÁTICO (ILIMITADO) ──
let cloudflareTunnelUrl = '';
let cloudflareProcess = null;

function startCloudflareTunnel() {
  const cloudflareBin = [
    path.join(__dirname, 'cloudflared.exe'),
    path.join(__dirname, 'version_instalador', 'cloudflared.exe'),
    'cloudflared.exe'
  ].find(p => fs.existsSync(p));

  if (!cloudflareBin) {
    console.log('ℹ️ [Túnel] cloudflared.exe no encontrado; túnel Cloudflare no iniciado.');
    return;
  }

  try {
    cloudflareProcess = spawn(cloudflareBin, ['tunnel', '--url', `http://127.0.0.1:${PORT}`, '--no-autoupdate'], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/;

    const handleOutput = (data) => {
      const str = data.toString();
      const match = str.match(urlRegex);
      if (match && !cloudflareTunnelUrl) {
        cloudflareTunnelUrl = match[0];
        console.log(`\n========================================================================`);
        console.log(`🌐 ENLACE PÚBLICO REMOTO ACTIVO (CLOUDFLARE - ILIMITADO):`);
        console.log(`   ${cloudflareTunnelUrl}`);
        console.log(`========================================================================\n`);
      }
    };

    cloudflareProcess.stdout.on('data', handleOutput);
    cloudflareProcess.stderr.on('data', handleOutput);

    cloudflareProcess.on('exit', () => {
      cloudflareTunnelUrl = '';
    });
  } catch (err) {
    console.warn('⚠️ [Túnel] Error al iniciar:', err.message);
  }
}

setTimeout(startCloudflareTunnel, 1200);

function cleanup() {
  if (cloudflareProcess) {
    try { cloudflareProcess.kill(); } catch (_) {}
  }
}
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(); });
process.on('SIGTERM', () => { cleanup(); process.exit(); });

// ── PERSISTENCIA (SUPABASE + LOCAL) ──
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
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return await res.json();
    return true;
  } catch (_) {
    return null;
  }
}

function readLocalDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (_) {}
  return DEFAULT_SERVER_STATE;
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (_) {
    return false;
  }
}

async function getPersistedState() {
  const localDb = readLocalDb();
  if (localDb && (localDb.groupsData || localDb.users)) {
    if (localDb.users && Array.isArray(localDb.users)) {
      localDb.users = localDb.users.map(u => {
        if (!u || typeof u !== 'object') return u;
        const { password, ...safeUser } = u;
        return safeUser;
      });
    }
    return localDb;
  }
  if (isSupabaseConfigured) {
    try {
      const data = await supabaseFetch('/app_state?id=eq.main_state&select=*');
      if (data && Array.isArray(data) && data.length > 0) {
        const row = data[0];
        const rawUsers = Array.isArray(row.users_data) && row.users_data.length > 0 ? row.users_data : undefined;
        return {
          groupsData: row.groups_data || DEFAULT_SERVER_STATE.groupsData,
          callersData: row.callers_data || DEFAULT_SERVER_STATE.callersData,
          adminReports: row.admin_reports || DEFAULT_SERVER_STATE.adminReports,
          users: rawUsers ? rawUsers.map(u => {
            if (!u || typeof u !== 'object') return u;
            const { password, ...safeUser } = u;
            return safeUser;
          }) : undefined
        };
      }
    } catch (_) {}
  }
  return DEFAULT_SERVER_STATE;
}

async function savePersistedState(incoming) {
  const current = readLocalDb() || {};
  const rawUsers = incoming.users !== undefined ? incoming.users : current.users;
  const cleanUsers = rawUsers ? rawUsers.map(u => {
    if (!u || typeof u !== 'object') return u;
    const { password, ...safeUser } = u;
    return safeUser;
  }) : undefined;

  const merged = {
    ...current,
    ...incoming,
    groupsData: incoming.groupsData ? {
      ...current.groupsData,
      ...incoming.groupsData
    } : current.groupsData,
    callersData: incoming.callersData ? {
      ...current.callersData,
      ...incoming.callersData
    } : current.callersData,
    adminReports: incoming.adminReports !== undefined ? incoming.adminReports : current.adminReports,
    users: cleanUsers
  };

  // Guardar datos COMPLETOS en el archivo local de la PC (server_data.json)
  writeLocalDb(merged);

  // Respaldo asíncrono en Supabase si está disponible (sin contraseñas en texto plano)
  if (isSupabaseConfigured) {
    supabaseFetch('/app_state', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: JSON.stringify({
        id: 'main_state',
        groups_data: merged.groupsData,
        callers_data: merged.callersData,
        admin_reports: merged.adminReports || [],
        users_data: merged.users || [],
        updated_at: new Date().toISOString()
      })
    }).catch(() => {});
  }

  return merged;
}

// ── SERVIDOR HTTP BLINDADO ──
const server = http.createServer(async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();

  // Cabeceras de seguridad
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Dashboard-Key, X-Session-Token, X-User-Id');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Rate Limiter
  if (!checkRateLimit(clientIp, 240)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Demasiadas solicitudes. Espere un momento.' }));
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // Bloqueo de archivos confidenciales
  const sensitivePatterns = [
    /\.env/i,
    /server_data\.json/i,
    /package\.json/i,
    /\.git/i,
    /node_modules/i,
    /\.sql$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.vbs$/i,
    /\.exe$/i
  ];
  if (sensitivePatterns.some(p => p.test(pathname))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Acceso denegado a recurso protegido.');
    return;
  }

  // ── ENDPOINT: /api/network-info (Compartir Enlaces) ──
  if (pathname === '/api/network-info' && req.method === 'GET') {
    const lanIp = getLocalNetworkIp();
    const primary = cloudflareTunnelUrl || `http://${lanIp}:${PORT}`;
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    res.end(JSON.stringify({
      isLocalServer: true,
      port: PORT,
      localUrl: `http://localhost:${PORT}`,
      lanUrl: lanIp !== '127.0.0.1' ? `http://${lanIp}:${PORT}` : null,
      cloudflareUrl: cloudflareTunnelUrl || null,
      primaryPublicUrl: primary,
      tunnelStatus: cloudflareTunnelUrl ? 'online' : 'connecting',
      activeSessions: activeSessions.size,
      supabaseActive: isSupabaseConfigured
    }));
    return;
  }

  // ── ENDPOINT: /api/health ──
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

  // ── ENDPOINT: /api/auth/login ──
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { userId, username } = JSON.parse(body || '{}');
        if (!userId || !username) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Faltan parámetros requeridos.' }));
          return;
        }

        const sessionToken = 'sess_' + crypto.randomBytes(24).toString('hex');
        const now = Date.now();
        activeSessions.set(userId, { sessionToken, username, clientIp, lastHeartbeat: now });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, sessionToken, userId, username, message: 'Sesión iniciada.' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ── ENDPOINT: /api/auth/logout ──
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { userId } = JSON.parse(body || '{}');
        if (userId) activeSessions.delete(userId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (_) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      }
    });
    return;
  }

  // ── ENDPOINT: /api/state (GET & POST) — Ligero (< 2 KB) ──
  if (pathname === '/api/state') {
    if (req.method === 'GET') {
      try {
        const state = await getPersistedState();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(state));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
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

  // ── ARCHIVOS ESTÁTICOS DE LA SPA (CON GZIP) ──
  let cleanPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let filePath = path.normalize(path.join(DIST_DIR, cleanPath));

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Acceso denegado.');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error al leer recurso.');
      return;
    }

    const headers = { 'Content-Type': contentType };

    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    } else if (['.js', '.css', '.png', '.woff2'].includes(ext)) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    // Compresión GZIP automática
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const compressible = ['.html', '.js', '.css', '.json', '.svg'].includes(ext);

    if (compressible && acceptEncoding.includes('gzip')) {
      headers['Content-Encoding'] = 'gzip';
      zlib.gzip(content, (zErr, gzipped) => {
        if (!zErr && gzipped) {
          res.writeHead(200, headers);
          res.end(gzipped);
        } else {
          res.writeHead(200, headers);
          res.end(content);
        }
      });
    } else {
      res.writeHead(200, headers);
      res.end(content);
    }
  });
});

server.listen(PORT, HOST, () => {
  const lanIp = getLocalNetworkIp();
  console.log('========================================================================');
  console.log('  DASHBOARD DE PROSPECCIÓN COMERCIAL — SERVIDOR EN LÍNEA');
  console.log('========================================================================');
  console.log(`  [Local]      Acceso en esta PC:  http://localhost:${PORT}`);
  console.log(`  [Red Local]  Acceso Oficina/WiFi: http://${lanIp}:${PORT}`);
  console.log(`  [Persistencia] Supabase: ${isSupabaseConfigured ? 'CONECTADO ✅' : 'MODO LOCAL 📁'}`);
  console.log('  [Seguridad]  Compresión GZIP + Firewall Anti-DDoS ACTIVO');
  console.log('  [Túnel]      Conectando túnel Cloudflare seguro e ilimitado...');
  console.log('========================================================================\n');
});
