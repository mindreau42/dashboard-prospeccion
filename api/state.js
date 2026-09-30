const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://onikxoecnkswznbrxkhn.supabase.co').trim().replace(/\/+$/, '');
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uaWt4b2Vjbmtzd3puYnJ4a2huIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzkyNjQ3OCwiZXhwIjoyMTAzNTAyNDc4fQ.MObgF2VSPVPP77MR6istaZmfjiyB3a5XtzCnGeUho-4').trim();

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

async function supabaseFetch(endpoint, options = {}) {
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

async function getPersistedState() {
  const data = await supabaseFetch('/app_state?id=eq.main_state&select=*');
  if (data && Array.isArray(data) && data.length > 0) {
    const row = data[0];
    return {
      groupsData: row.groups_data || DEFAULT_SERVER_STATE.groupsData,
      callersData: row.callers_data || DEFAULT_SERVER_STATE.callersData,
      adminReports: row.admin_reports || DEFAULT_SERVER_STATE.adminReports,
      users: Array.isArray(row.users_data) && row.users_data.length > 0 ? row.users_data : undefined
    };
  }
  return DEFAULT_SERVER_STATE;
}

async function savePersistedState(incoming) {
  const current = await getPersistedState();
  const merged = {
    ...current,
    ...incoming,
    groupsData: incoming.groupsData ? {
      ...current.groupsData,
      ...Object.fromEntries(
        Object.entries(incoming.groupsData).map(([k, v]) => [k, {
          ...current.groupsData[k],
          ...v,
          // Never overwrite a real URL with an empty string
          url: v.url || current.groupsData[k]?.url || ''
        }])
      )
    } : current.groupsData,
    callersData: incoming.callersData ? { ...current.callersData, ...incoming.callersData } : current.callersData,
    adminReports: incoming.adminReports !== undefined ? incoming.adminReports : current.adminReports,
    users: incoming.users !== undefined ? incoming.users : current.users
  };

  // ── STRIP HEAVY RECORDS: Supabase only stores URLs, metadata and users (< 2 KB) ──
  // Google Sheets records are parsed client-side in the browser, NEVER stored in PostgreSQL
  const lightGroups = {};
  if (merged.groupsData) {
    for (const [k, v] of Object.entries(merged.groupsData)) {
      lightGroups[k] = {
        url: v.url || '',
        sourceName: v.sourceName || '',
        lastSync: v.lastSync || ''
      };
    }
  }
  const lightCallers = {};
  if (merged.callersData) {
    for (const [k, v] of Object.entries(merged.callersData)) {
      lightCallers[k] = {
        name: v.name || '',
        sheetUrl: v.sheetUrl || '',
        lastSync: v.lastSync || ''
      };
    }
  }

  await supabaseFetch('/app_state', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates',
    body: JSON.stringify({
      id: 'main_state',
      groups_data: lightGroups,
      callers_data: lightCallers,
      admin_reports: [],
      users_data: merged.users || [],
      updated_at: new Date().toISOString()
    })
  });

  return { ...merged, groupsData: lightGroups, callersData: lightCallers };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Dashboard-Key, X-Session-Token, X-User-Id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      const state = await getPersistedState();

      // ── Strip heavy records from the response ──
      // Records are fetched directly from Google Sheets by the browser.
      // Sending them through Vercel costs Origin Transfer bandwidth (limit: 10 GB/month).
      // We only send lightweight metadata: url, sourceName, lastSync, user list.
      const lightGroupsData = {};
      Object.entries(state.groupsData || {}).forEach(([k, v]) => {
        lightGroupsData[k] = {
          url:        v.url        || '',
          sourceName: v.sourceName || '',
          lastSync:   v.lastSync   || '',
          records:    []   // client fetches from Sheets directly
        };
      });

      const lightCallersData = {};
      Object.entries(state.callersData || {}).forEach(([k, v]) => {
        lightCallersData[k] = {
          name:             v.name       || '',
          sheetUrl:         v.sheetUrl   || '',
          lastSync:         v.lastSync   || '',
          callerRecords:    [],   // client fetches from Sheets directly
          scorecardReports: []
        };
      });

      const lightState = {
        groupsData:   lightGroupsData,
        callersData:  lightCallersData,
        adminReports: [],   // admin reports are loaded via Excel upload, not stored in API
        users:        state.users
      };

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).json(lightState);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const saved = await savePersistedState(body);
      return res.status(200).json({ ok: true, state: saved });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
