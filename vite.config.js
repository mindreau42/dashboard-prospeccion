import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function apiStatePlugin() {
  const DB_FILE = path.join(process.cwd(), 'server_data.json');

  const activeSessionsDev = new Map();

  const handleApiState = (req, res, next) => {
    const url = req.url || '';
    if (url.startsWith('/api/health')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'ok', activeSessions: activeSessionsDev.size }));
      return;
    }

    if (url.startsWith('/api/auth/login') && req.method === 'POST') {
      let body = '';
      req.on('data', c => { body += c; });
      req.on('end', () => {
        try {
          const { userId, username } = JSON.parse(body || '{}');
          const sessionToken = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
          activeSessionsDev.set(userId, { sessionToken, username, lastHeartbeat: Date.now() });
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, sessionToken, userId, username }));
        } catch (e) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (url.startsWith('/api/auth/heartbeat') && req.method === 'POST') {
      let body = '';
      req.on('data', c => { body += c; });
      req.on('end', () => {
        try {
          const { userId, sessionToken } = JSON.parse(body || '{}');
          const current = activeSessionsDev.get(userId);
          if (!current || current.sessionToken !== sessionToken) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, code: 'SESSION_TERMINATED', message: 'Sesión finalizada por duplicado o expiración.' }));
            return;
          }
          current.lastHeartbeat = Date.now();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (url.startsWith('/api/auth/logout') && req.method === 'POST') {
      let body = '';
      req.on('data', c => { body += c; });
      req.on('end', () => {
        try {
          const { userId } = JSON.parse(body || '{}');
          if (userId) activeSessionsDev.delete(userId);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (url.startsWith('/api/state')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      if (req.method === 'GET') {
        try {
          if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
            return;
          }
        } catch (_) {}
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({}));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body || '{}');
            let current = {};
            if (fs.existsSync(DB_FILE)) {
              try { current = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } catch (_) {}
            }
            const merged = {
              ...current,
              ...incoming,
              groupsData: incoming.groupsData ? { ...current.groupsData, ...incoming.groupsData } : current.groupsData,
              callersData: incoming.callersData ? { ...current.callersData, ...incoming.callersData } : current.callersData,
              adminReports: incoming.adminReports !== undefined ? incoming.adminReports : current.adminReports,
              users: incoming.users !== undefined ? incoming.users : current.users
            };
            fs.writeFileSync(DB_FILE, JSON.stringify(merged, null, 2), 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, state: merged }));
          } catch (err) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }
    }
    next();
  };

  return {
    name: 'api-state-plugin',
    configureServer(server) {
      server.middlewares.use(handleApiState);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApiState);
    }
  };
}

export default defineConfig({
  plugins: [react(), apiStatePlugin()],
  build: {
    // ── CODE OBFUSCATION & PRODUCTION SECURITY ──
    sourcemap: false, // Disables source maps so original source code cannot be viewed in DevTools
    minify: 'esbuild',
    target: 'esnext',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'chart.js', 'react-chartjs-2', 'lucide-react', 'xlsx']
        },
        // Obfuscate generated asset and chunk file names with hash
        chunkFileNames: 'assets/[hash].js',
        entryFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash].[ext]'
      }
    }
  },
  esbuild: {
    // Strip all debug console logs and debugger breakpoints from production bundle
    drop: ['console', 'debugger'],
    legalComments: 'none'
  },
  server: {
    port: 5185,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
    allowedHosts: [
      'playmaker-plod-splashing.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
      '.onrender.com',
      'localhost',
      '127.0.0.1'
    ]
  },
  preview: {
    port: 5185,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
    allowedHosts: [
      'playmaker-plod-splashing.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
      '.onrender.com',
      'localhost',
      '127.0.0.1'
    ]
  }
});

