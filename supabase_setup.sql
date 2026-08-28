-- ==============================================================================
-- 🚀 DASHBOARD DE PROSPECCIÓN — SCRIPT DE CONFIGURACIÓN PARA SUPABASE
-- ==============================================================================
-- Copia y pega este script en el "SQL Editor" de tu proyecto Supabase y pulsa "RUN".
-- Esto creará las 3 tablas esenciales con persistencia garantizada y anti-pérdida.

-- 1. TABLA: app_state (Guarda todo el estado del dashboard: grupos, callers, reportes)
CREATE TABLE IF NOT EXISTS app_state (
    id TEXT PRIMARY KEY DEFAULT 'main_state',
    groups_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    callers_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    admin_reports JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA: dashboard_users (Guarda usuarios, roles, hashes de contraseñas y permisos)
CREATE TABLE IF NOT EXISTS dashboard_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'setter',
    user_group TEXT,
    caller_key TEXT,
    avatar TEXT DEFAULT '👤',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA: active_sessions (Control estricto de 1 sesión única por usuario)
CREATE TABLE IF NOT EXISTS active_sessions (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) pero permitir acceso con Service Role Key / Backend
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para backend
CREATE POLICY "Permitir todo al backend state" ON app_state FOR ALL USING (true);
CREATE POLICY "Permitir todo al backend users" ON dashboard_users FOR ALL USING (true);
CREATE POLICY "Permitir todo al backend sessions" ON active_sessions FOR ALL USING (true);

-- Insertar estado inicial si no existe
INSERT INTO app_state (id, groups_data, callers_data, admin_reports)
VALUES (
    'main_state',
    '{
      "Setters Aspirantes": {
        "records": [],
        "url": "https://docs.google.com/spreadsheets/d/1Z2CXH0YmaPcTVjQlCCnduRKdM91lrTiAcvqo2nH-E1k/edit?usp=sharing",
        "sourceName": "Google Sheets (Setters Aspirantes)",
        "lastSync": ""
      },
      "Setters Oficiales": {
        "records": [],
        "url": "https://docs.google.com/spreadsheets/d/1uPX_UFqe1giECEIOANQ8ihVAxybP-HHTsNKZy2gpqhM/edit?usp=sharing",
        "sourceName": "Google Sheets (Setters Oficiales)",
        "lastSync": ""
      }
    }'::jsonb,
    '{
      "Caller 1": {
        "name": "Caller 1 — Nury",
        "sheetUrl": "https://docs.google.com/spreadsheets/d/1XVwdte_5CKGHSxmeEQo5AT812REs_1YF/edit?usp=sharing&ouid=109702363461847797717&rtpof=true&sd=true",
        "callerRecords": [],
        "scorecardReports": [],
        "lastSync": ""
      },
      "Caller 2": {
        "name": "Caller 2",
        "sheetUrl": "",
        "callerRecords": [],
        "scorecardReports": [],
        "lastSync": ""
      }
    }'::jsonb,
    '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
