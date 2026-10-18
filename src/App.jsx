import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import ExecutiveOverviewSummary from './components/ExecutiveOverviewSummary';
import CommercialFunnelSection from './components/CommercialFunnelSection';
import OperativeAnalysisSection from './components/OperativeAnalysisSection';
import SdrTrackerLeaderboard from './components/SdrTrackerLeaderboard';
import DataSourceSection from './components/DataSourceSection';
import ScheduledLeadsSection from './components/ScheduledLeadsSection';
import SupervisorCallerSection from './components/SupervisorCallerSection';
import OrganicoScorecardSection from './components/OrganicoScorecardSection';
import CloserScorecardSection from './components/CloserScorecardSection';
import UserPortalSection from './components/UserPortalSection';
import ProspectingTable from './components/ProspectingTable';
import ExcelUploadModal from './components/ExcelUploadModal';
import GoogleSheetsModal from './components/GoogleSheetsModal';
import UserManagementModal from './components/UserManagementModal';
import UserProfileModal from './components/UserProfileModal';
import packageJson from '../package.json';

const APP_VERSION = `v${packageJson.version}`;

import { INITIAL_MOCK_REPORTS } from './data/mockData';
import { INITIAL_SUPERVISOR_CALLER, INITIAL_SUPERVISOR_SCORECARD } from './data/mockSupervisorData';
import { fetchGoogleSheetData, fetchSupervisorSheetData } from './utils/googleSheetsParser';
import { fetchOrganicoSheetData, fetchCloserSheetData } from './utils/specializedSheetsParser';
import {
  hashPassword,
  verifyPassword,
  lockNavigationHistoryOnLogout,
  sanitizeInput,
  encryptStoragePayload,
  decryptStoragePayload,
  initializeAntiTamperShield
} from './utils/security';
import {
  AlertTriangle, Trash2, Database, UploadCloud,
  Eye, EyeOff, Filter, ChevronDown, ChevronUp,
  RotateCcw, Layers, ShieldAlert, ShieldCheck, CheckCircle2, X, Sparkles
} from 'lucide-react';


// ── Storage Keys (v22: Zero residual cache, clean sync architecture) ──
const SK = {
  SESSION:       'prd_session_v22',
  USERS:         'prd_users_v22',
  GROUPS:        'prd_groups_data_v22',
  ADMIN_REPS:    'prd_admin_reports_v22',
  ADMIN_SRC:     'prd_admin_source_v22',
  ADMIN_URL:     'prd_admin_sheet_url_v22',
  CALLERS_DATA:  'prd_callers_data_v22',
  ORGANICO_DATA: 'prd_organico_data_v22',
  CLOSER_DATA:   'prd_closer_data_v22',
};

const DEFAULT_USERS = [
  { id: 'usr_admin', fullName: 'Administrador', username: 'Admin', password: 'Neooma@2026', hash: '48b804297c627ef74b89950425177b5fad9318da02f693017fedc4b6cceede75', salt: '55p5lb08ckxmtf84be2', role: 'admin', group: null, callerKey: null, avatar: '👑', createdAt: '2026-08-18' },
  { id: 'usr_s1', fullName: 'Canal A', username: 'SDR', password: 'Neooma#26', hash: '9950d2b1c73f61be8ebdcb3d41c19eedf11a1397d766968cf3999e2d4a85c65a', salt: 'mmiznx8c8zmtf90yeg', role: 'setter', group: 'Setters Oficiales', callerKey: null, avatar: '🎯', createdAt: '2026-08-18' },
  { id: 'usr_s2', fullName: 'Canal B', username: 'Aspirantes', password: 'Setter@2026', hash: '9a0455ebb21b2fe5f356239d4d5c3394dc1138d474c8206454273ff3d2b27088', salt: 'tfnmswpwg4rmtk9m7vz', role: 'setter', group: 'Setters Aspirantes', callerKey: null, avatar: '🚀', createdAt: '2026-08-18' },
  { id: 'usr_c1', fullName: 'Canal C', username: 'Nury', password: 'Neooma_2', hash: 'f7935e4cff692b2e4007677d0598a4540495d7b3ee309084802e001d1aa2b04e', salt: '0xfjvk395zmomthesx88', role: 'gerencia', group: null, callerKey: 'Caller 1', avatar: '📞', createdAt: '2026-08-18' },
  { id: 'usr_c2', fullName: 'Principal', username: 'Director', password: 'Neooma_1', hash: 'de6a42e8ae4e76f17a2f036f61056d755e4f91d4b0f53c9e700d754bb0d7f150', salt: '6ur7sa27wjwmthet4fo', role: 'gerencia', group: null, callerKey: 'Caller 2', avatar: '📞', createdAt: '2026-08-18' },
  { id: 'usr_1788364178077', fullName: 'Luz Cardona', username: 'Luz', password: 'Setter#luz1', hash: '77e2d692b081d1f2162782d70029d0a7c1a71e5efb44c830e1eeb003ee67b94a', salt: 'jokjslm7eomtk9uv8c', role: 'gerencia', group: null, callerKey: null, avatar: '🎯', createdAt: '2/9/2026' },
  { id: 'usr_1788364301519', fullName: 'Claudia Vázquez', username: 'Claudia', password: 'Setter#clau1', hash: '6e407286cd513bd581b39efa4d033c013d13f4033aa21add09fdd89275c4f6d6', salt: 'qh2pbqls0mlmtk9xihb', role: 'gerencia', group: null, callerKey: null, avatar: '🎯', createdAt: '2/9/2026' },
  { id: 'usr_1788365685815', fullName: 'Monica Rodríguez', username: 'Monica', password: 'Setter@monica1', hash: '4ad7cba0a344df9fb45c4d2ef6bd8504500705224726d735176fc5e33a1706cf', salt: 'hj6z2ezgkovmtkar6lz', role: 'setter', group: 'Setters Aspirantes', callerKey: null, avatar: '🎯', createdAt: '2/9/2026' },
  { id: 'usr_1788365752926', fullName: 'Lisbeth Garrido', username: 'Lisbeth', password: 'Setter@lisbeth1', hash: '670acc7980460702746769b14e480fd52d6c7881973597964958b1617d64bd73', salt: 'u9m3t4fhlimtkasme5', role: 'setter', group: 'Setters Aspirantes', callerKey: null, avatar: '🎯', createdAt: '2/9/2026' },
  { id: 'usr_1788365838607', fullName: 'Silvia Corzo', username: 'Silvia', password: 'Setter@silvia1', hash: '70865b6023e460476a7916cd7dacfe3387efa2bd7b465ae2037d986a91cf34e0', salt: '9g89dxi7cf4mtkaugi7', role: 'setter', group: 'Setters Aspirantes', callerKey: null, avatar: '🎯', createdAt: '2/9/2026' },
  { id: 'usr_1788365918491', fullName: 'Ebelin Hernandez', username: 'Ebelin', password: 'Setter@ebelin1', hash: 'dd40141ca1c57edc2ed33db2b0c8f9f38c784d27fa3c5c4d005006cd00852b67', salt: '4nrtmyal7lumtkaw657', role: 'setter', group: 'Setters Aspirantes', callerKey: null, avatar: '🎯', createdAt: '2/9/2026' },
  { id: 'usr_1788365986021', fullName: 'Leydi Lopez', username: 'Leydi', password: 'Setter@leydi1', hash: '0025f62fdb8bef9318f90b37c5e8fc8677c1e0fa94969eb0ea16a15a44b530aa', salt: 'scwlxtj95kmtkaxm91', role: 'setter', group: 'Setters Aspirantes', callerKey: null, avatar: '🎯', createdAt: '2/9/2026' },
  { id: 'usr_1790266050584', fullName: 'Secundario', username: 'Team', password: 'Neooma_3', hash: '8c7d1ac160e43901d43448c695d3b3f420e1ec762d263d009239525529204ddd', salt: 'kqkz94ok02kmufq6lg8', role: 'gerencia', group: null, callerKey: null, avatar: '🏆', createdAt: '24/9/2026' }
];

// ── Real Google Sheet URLs (pre-configured, loaded automatically on startup) ──
const SHEET_URL_SETTERS_OFICIALES  = 'https://docs.google.com/spreadsheets/d/1uPX_UFqe1giECEIOANQ8ihVAxybP-HHTsNKZy2gpqhM/edit?usp=sharing';
const SHEET_URL_SETTERS_ASPIRANTES = 'https://docs.google.com/spreadsheets/d/1Z2CXH0YmaPcTVjQlCCnduRKdM91lrTiAcvqo2nH-E1k/edit?usp=sharing';
const SHEET_URL_CALLERS            = 'https://docs.google.com/spreadsheets/d/1XVwdte_5CKGHSxmeEQo5AT812REs_1YF/edit?usp=sharing&ouid=109702363461847797717&rtpof=true&sd=true';
const SHEET_URL_ORGANICO           = 'https://docs.google.com/spreadsheets/d/1N092h1lIRYKeOtlVkB42_JYR3HR1Nker/edit?gid=1087525007#gid=1087525007';
const SHEET_URL_CLOSER             = 'https://docs.google.com/spreadsheets/d/1U5CyKhgMjvw6djjMiIGiidno41dJC-iM/edit?gid=1981983632#gid=1981983632';

const DEFAULT_GROUPS_DATA = {
  'Setters Aspirantes': {
    records: [],
    url: SHEET_URL_SETTERS_ASPIRANTES,
    sourceName: 'Google Sheets (Setters Aspirantes)',
    lastSync: ''
  },
  'Setters Oficiales': {
    records: [],
    url: SHEET_URL_SETTERS_OFICIALES,
    sourceName: 'Google Sheets (Setters Oficiales)',
    lastSync: ''
  },
};


const DEFAULT_CALLERS_DATA = {
  'Caller 1': {
    name: 'Caller 1 — Nury',
    sheetUrl: SHEET_URL_CALLERS,
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
};

const DEFAULT_ORGANICO_DATA = {
  records: [],
  scorecardReports: [],
  url: SHEET_URL_ORGANICO,
  lastSync: ''
};

const DEFAULT_CLOSER_DATA = {
  reports: [],
  summary: null,
  url: SHEET_URL_CLOSER,
  lastSync: ''
};


const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return decryptStoragePayload(raw, fallback);
  } catch {
    return fallback;
  }
};

const save = (key, data) => {
  try {
    localStorage.setItem(key, encryptStoragePayload(data));
  } catch {
    // ignore
  }
};

const loadSession = () => {
  try {
    const raw = sessionStorage.getItem(SK.SESSION);
    return decryptStoragePayload(raw, null);
  } catch {
    return null;
  }
};

const saveSession = (data) => {
  try {
    if (!data) {
      sessionStorage.removeItem(SK.SESSION);
    } else {
      sessionStorage.setItem(SK.SESSION, encryptStoragePayload(data));
    }
  } catch {
    // ignore
  }
};

export default function App() {
  // ── Authentication & Session State (Strict single session per user) ──
  const [users, setUsers] = useState(() => {
    const loaded = load(SK.USERS, null);
    const source = (loaded && Array.isArray(loaded) && loaded.length > 0) ? loaded : DEFAULT_USERS;
    return source.map(u => {
      if (!u.password) {
        const foundDef = DEFAULT_USERS.find(d => d.username?.toLowerCase() === u.username?.toLowerCase());
        if (foundDef?.password) return { ...u, password: foundDef.password };
      }
      return u;
    });
  });
  const [currentSession, setCurrentSession] = useState(() => loadSession());
  const [loginError, setLoginError] = useState('');
  const [sessionAlertMessage, setSessionAlertMessage] = useState('');

  // ── Isolated Groups Data Store (Persistent in LocalStorage + Live State) ──
  const [groupsData, setGroupsData] = useState(() => load(SK.GROUPS, DEFAULT_GROUPS_DATA));

  // ── Admin Global Uploaded Data (In-Memory Live State) ──
  const [adminReports, setAdminReports] = useState([]);
  const [adminSourceInfo, setAdminSourceInfo] = useState({ type: 'sheets', name: 'Google Sheets' });
  const [adminSheetUrl, setAdminSheetUrl] = useState('');

  // ── Callers Data Store (Persistent in LocalStorage + Live State) ──
  const [callersData, setCallersData] = useState(() => load(SK.CALLERS_DATA, DEFAULT_CALLERS_DATA));
  const [selectedCallerKey, setSelectedCallerKey] = useState('Todos');

  // ── Orgánico & Closer Data Stores (Persistent in LocalStorage + Live State) ──
  const [organicoData, setOrganicoData] = useState(() => load(SK.ORGANICO_DATA, DEFAULT_ORGANICO_DATA));
  const [closerData, setCloserData]     = useState(() => load(SK.CLOSER_DATA, DEFAULT_CLOSER_DATA));

  // ── Active Navigation View ──
  const [activeView, setActiveView] = useState(() => {
    if (currentSession?.role === 'caller') return 'supervisor';
    if (currentSession?.role === 'setter') return 'funnel';
    return 'overview'; // admin and gerencia start at overview
  });

  // ── Modals State ──
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // ── Centralized Modal Scroll Lock with Safe Restoration Guarantee ──
  useEffect(() => {
    const isAnyModalActive = Boolean(
      isExcelModalOpen ||
      isGoogleSheetsModalOpen ||
      isUserManagementOpen ||
      isProfileModalOpen ||
      isClearConfirmOpen
    );

    if (isAnyModalActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isExcelModalOpen, isGoogleSheetsModalOpen, isUserManagementOpen, isProfileModalOpen, isClearConfirmOpen]);

  // ── Helper to persist state updates to local central server ──
  const saveStateToServer = useCallback((updatedPartial) => {
    try {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPartial)
      }).catch(() => {});
    } catch (_) {}
  }, []);

  // ── Persistence Effects (Local browser storage is instant and 100% network-free) ──
  useEffect(() => { save(SK.USERS, users); }, [users]);
  useEffect(() => { save(SK.SESSION, currentSession); }, [currentSession]);
  useEffect(() => { save(SK.GROUPS, groupsData); }, [groupsData]);
  useEffect(() => { save(SK.CALLERS_DATA, callersData); }, [callersData]);
  useEffect(() => { save(SK.ORGANICO_DATA, organicoData); }, [organicoData]);
  useEffect(() => { save(SK.CLOSER_DATA, closerData); }, [closerData]);

  useEffect(() => {
    // 1. Fetch persistent server state from central server on PC
    fetch('/api/state')
      .then(res => res.json())
      .then(serverState => {
        if (serverState && typeof serverState === 'object') {
          if (serverState.users && Array.isArray(serverState.users) && serverState.users.length > 0) {
            setUsers(serverState.users.map(({ password, ...u }) => u));
          }
          if (serverState.groupsData) setGroupsData(serverState.groupsData);
          if (serverState.callersData) setCallersData(serverState.callersData);
          if (serverState.organicoData) setOrganicoData(serverState.organicoData);
          if (serverState.closerData) setCloserData(serverState.closerData);
          if (serverState.adminReports) setAdminReports(serverState.adminReports);

          // Si el servidor local aún no tiene registros cargados o los callers tienen registros desactualizados sin nombres, sincronizamos
          const totalRecords = Object.values(serverState.groupsData || {}).reduce((acc, g) => acc + (g.records?.length || 0), 0);
          const totalCallerRecords = Object.values(serverState.callersData || {}).reduce((acc, c) => acc + (c.callerRecords?.length || 0), 0);
          const totalOrganicoRecords = (serverState.organicoData?.records?.length || 0);
          const totalCloserRecords = (serverState.closerData?.reports?.length || 0);
          const callersNeedRefresh = Object.values(serverState.callersData || {}).some(c => {
            const recs = c.callerRecords || [];
            return recs.length > 0 && (
              recs.slice(-30).some(r => !r.nombre || r.nombre === '—') ||
              recs.filter(r => !r.nombre || r.nombre === '—').length > 5
            );
          });

          if (totalRecords === 0 || totalCallerRecords === 0 || totalOrganicoRecords === 0 || totalCloserRecords === 0 || callersNeedRefresh) {
            performLiveSync(true, serverState.groupsData, serverState.callersData, serverState.organicoData, serverState.closerData);
          }
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── State refs to guarantee performLiveSync always inspects current user choices ──
  const groupsDataRef = useRef(groupsData);
  useEffect(() => { groupsDataRef.current = groupsData; }, [groupsData]);

  const callersDataRef = useRef(callersData);
  useEffect(() => { callersDataRef.current = callersData; }, [callersData]);

  const organicoDataRef = useRef(organicoData);
  useEffect(() => { organicoDataRef.current = organicoData; }, [organicoData]);

  const closerDataRef = useRef(closerData);
  useEffect(() => { closerDataRef.current = closerData; }, [closerData]);

  // ── Smart Sync — tracks last fetch time to avoid redundant Sheets calls ──
  const lastSheetsFetchRef = useRef(0);       // timestamp of last Google Sheets fetch
  const lastServerPollRef  = useRef(0);       // timestamp of last /api/state GET
  const SHEETS_INTERVAL_MS = 10 * 60 * 1000; // fetch Sheets every 10 minutes
  const SERVER_POLL_MS     = 60 * 1000;       // poll local /api/state at most once per minute

  // ── Global Live Multi-User Auto-Sync (Centralized Server as Single Source of Truth) ──
  const performLiveSync = useCallback(async (forceSheets = false, customGroups = null, customCallers = null, customOrganico = null, customCloser = null) => {
    const now = Date.now();

    try {
      // 0. Poll state from central server with 304 caching (zero bytes if unchanged)
      fetch('/api/state')
        .then(res => (res.status === 304 ? null : res.json()))
        .then(serverState => {
          if (serverState && typeof serverState === 'object') {
            if (serverState.users && Array.isArray(serverState.users) && serverState.users.length > 0) {
              setUsers(serverState.users.map(u => {
                if (!u.password) {
                  const foundDef = DEFAULT_USERS.find(d => d.username?.toLowerCase() === u.username?.toLowerCase());
                  if (foundDef?.password) return { ...u, password: foundDef.password };
                }
                return u;
              }));
            }
            if (serverState.groupsData) setGroupsData(serverState.groupsData);
            if (serverState.callersData) setCallersData(serverState.callersData);
            if (serverState.organicoData) setOrganicoData(serverState.organicoData);
            if (serverState.closerData) setCloserData(serverState.closerData);
            if (serverState.adminReports) setAdminReports(serverState.adminReports);
          }
        })
        .catch(() => {});

      // SOLO si forceSheets es true, descargamos de Google Sheets
      if (!forceSheets) return;
      lastSheetsFetchRef.current = now;

      const currentGroups   = customGroups   || groupsDataRef.current;
      const currentCallers  = customCallers  || callersDataRef.current;
      const currentOrganico = customOrganico || organicoDataRef.current;
      const currentCloser   = customCloser   || closerDataRef.current;

      // 1. Sync Setters Oficiales ONLY if currently linked
      const oficialesUrl    = (currentGroups?.['Setters Oficiales']?.url || '').trim();
      const oficialesSource = currentGroups?.['Setters Oficiales']?.sourceName || '';
      if (oficialesUrl && !oficialesSource.includes('desvinculado') && !oficialesSource.includes('limpiado')) {
        fetchGoogleSheetData(oficialesUrl)
          .then(res => {
            if (res && Array.isArray(res.records) && res.records.length > 0) {
              const syncTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
              setGroupsData(prev => {
                const currentUrl = (prev?.['Setters Oficiales']?.url || '').trim();
                if (!currentUrl) return prev;
                const next = {
                  ...prev,
                  'Setters Oficiales': {
                    ...prev['Setters Oficiales'],
                    records: res.records,
                    url: oficialesUrl,
                    sourceName: `Google Sheets (${res.rowCount} registros)`,
                    lastSync: syncTime
                  }
                };
                saveStateToServer({ groupsData: next });
                return next;
              });
            }
          })
          .catch(() => {});
      }

      // 2. Sync Setters Aspirantes ONLY if currently linked
      const aspirantesUrl    = (currentGroups?.['Setters Aspirantes']?.url || '').trim();
      const aspirantesSource = currentGroups?.['Setters Aspirantes']?.sourceName || '';
      if (aspirantesUrl && !aspirantesSource.includes('desvinculado') && !aspirantesSource.includes('limpiado')) {
        fetchGoogleSheetData(aspirantesUrl)
          .then(res => {
            if (res && Array.isArray(res.records) && res.records.length > 0) {
              const syncTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
              setGroupsData(prev => {
                const currentUrl = (prev?.['Setters Aspirantes']?.url || '').trim();
                if (!currentUrl) return prev;
                const next = {
                  ...prev,
                  'Setters Aspirantes': {
                    ...prev['Setters Aspirantes'],
                    records: res.records,
                    url: aspirantesUrl,
                    sourceName: `Google Sheets (${res.rowCount} registros)`,
                    lastSync: syncTime
                  }
                };
                saveStateToServer({ groupsData: next });
                return next;
              });
            }
          })
          .catch(() => {});
      }

      // 3. Sync Callers ONLY if currently linked
      Object.entries(currentCallers || {}).forEach(([callerKey, callerObj]) => {
        const callerUrl = (callerObj?.sheetUrl || '').trim();
        if (callerUrl) {
          fetchSupervisorSheetData(callerUrl)
            .then(res => {
              if (res && (Array.isArray(res.callerRecords) || Array.isArray(res.scorecardReports))) {
                const syncTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                setCallersData(prev => {
                  const currentUrl = (prev?.[callerKey]?.sheetUrl || '').trim();
                  if (!currentUrl) return prev;
                  const next = {
                    ...prev,
                    [callerKey]: {
                      ...prev[callerKey],
                      callerRecords: res.callerRecords || [],
                      scorecardReports: res.scorecardReports || [],
                      sheetUrl: callerUrl,
                      lastSync: syncTime
                    }
                  };
                  saveStateToServer({ callersData: next });
                  return next;
                });
              }
            })
            .catch(() => {});
        }
      });

      // 4. Sync Orgánico ONLY if currently linked
      const orgUrl = (currentOrganico?.url || '').trim();
      if (orgUrl) {
        fetchOrganicoSheetData(orgUrl)
          .then(res => {
            if (res && Array.isArray(res.records) && res.records.length > 0) {
              const syncTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
              const next = {
                records: res.records,
                scorecardReports: res.scorecardReports || [],
                url: orgUrl,
                lastSync: syncTime
              };
              setOrganicoData(next);
              saveStateToServer({ organicoData: next });
            }
          })
          .catch(() => {});
      }

      // 5. Sync Closer ONLY if currently linked
      const clsUrl = (currentCloser?.url || '').trim();
      if (clsUrl) {
        fetchCloserSheetData(clsUrl)
          .then(res => {
            if (res && Array.isArray(res.reports) && res.reports.length > 0) {
              const syncTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
              const next = {
                reports: res.reports,
                summary: res.summary || null,
                url: clsUrl,
                lastSync: syncTime
              };
              setCloserData(next);
              saveStateToServer({ closerData: next });
            }
          })
          .catch(() => {});
      }
    } catch (_) {}
  }, [saveStateToServer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // 1. Force full sync on mount (fetches Sheets + server state)
    performLiveSync(true);

    // 2. Control inteligente de actividad (Ahorro de horas en Render Free)
    // Si la pestaña está oculta o el usuario inactivo por > 15 min, pausar pings para que Render entre en reposo
    let lastUserActivity = Date.now();
    const markActivity = () => { lastUserActivity = Date.now(); };
    window.addEventListener('mousemove', markActivity, { passive: true });
    window.addEventListener('keydown', markActivity, { passive: true });
    window.addEventListener('click', markActivity, { passive: true });

    // Background sync cada 10 min SOLO si la pestaña está visible y el usuario activo
    const interval = setInterval(() => {
      if (document.hidden) return; // Pestaña minimizada u oculta: NO enviar pings para que Render duerma
      const idleMinutes = (Date.now() - lastUserActivity) / 60000;
      if (idleMinutes > 8) return; // Usuario inactivo > 8 min: silenciar pings para que Render entre en reposo (0 horas)
      performLiveSync();
    }, SHEETS_INTERVAL_MS);

    // 3. Al volver a la pestaña (focus o visibilitychange): sincronizar datos si es necesario
    const handleVisibilityOrFocus = () => {
      if (document.hidden) return;
      lastUserActivity = Date.now();
      const now = Date.now();
      if (now - lastServerPollRef.current >= 60_000) {
        lastServerPollRef.current = 0;
        performLiveSync();
      }
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // 4. Cross-tab storage sync (localStorage events — zero API calls)
    const handleStorage = (e) => {
      if (e.key === SK.GROUPS)       setGroupsData(load(SK.GROUPS, DEFAULT_GROUPS_DATA));
      if (e.key === SK.CALLERS_DATA) setCallersData(load(SK.CALLERS_DATA, DEFAULT_CALLERS_DATA));
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', markActivity);
      window.removeEventListener('keydown', markActivity);
      window.removeEventListener('click', markActivity);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [performLiveSync]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Login / Logout Handlers with Security Checks ──
  const handleLogin = (userOrUsername, maybePassword) => {
    setLoginError('');
    setSessionAlertMessage('');
    let found = null;
    if (typeof userOrUsername === 'object' && userOrUsername !== null) {
      found = userOrUsername;
    } else {
      found = users.find(
        u => u.username.toLowerCase() === String(userOrUsername).toLowerCase() && (
          (u.hash && verifyPassword(maybePassword, u.hash, u.salt))
        )
      );
    }

    if (found) {
      const sessionData = {
        id: found.id,
        username: found.username,
        fullName: found.fullName,
        role: found.role,
        group: found.group,
        avatar: found.avatar || '👤',
        sessionToken: found.sessionToken || ('sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36)),
        loginTime: Date.now()
      };
      setCurrentSession(sessionData);
      saveSession(sessionData);
      // Route by role: caller → scorecard, setter → funnel, admin/gerencia → overview
      const initialView = found.role === 'caller' ? 'supervisor'
        : found.role === 'setter' ? 'funnel'
        : 'overview';
      setActiveView(initialView);
      setLoginError('');
    } else {
      setLoginError('Usuario o contraseña incorrectos. Verifica tus credenciales.');
    }
  };

  // ── Quick Switch User Handler ──
  const handleSwitchUser = (targetUsername) => {
    const found = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
    if (found) {
      const sessionData = {
        id: found.id,
        username: found.username,
        fullName: found.fullName,
        role: found.role,
        group: found.group,
        avatar: found.avatar || '👤',
        sessionToken: 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
        loginTime: Date.now()
      };
      setCurrentSession(sessionData);
      saveSession(sessionData);
      const initialView = found.role === 'caller' ? 'supervisor'
        : found.role === 'setter' ? 'funnel'
        : 'overview';
      setActiveView(initialView);
    }
  };


  // ── Update Profile Avatar & Full Name Handler ──
  const handleUpdateAvatar = (newAvatar, newFullName) => {
    if (!currentSession) return;
    const updatedSession = {
      ...currentSession,
      avatar: newAvatar,
      fullName: newFullName || currentSession.fullName
    };
    setCurrentSession(updatedSession);
    saveSession(updatedSession);
    const updatedUsers = users.map(u =>
      u.id === currentSession.id
        ? { ...u, avatar: newAvatar, fullName: newFullName || u.fullName }
        : u
    );
    setUsers(updatedUsers);
  };

  const handleLogout = () => {
    if (currentSession?.id && currentSession?.sessionToken) {
      try {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentSession.id, sessionToken: currentSession.sessionToken })
        }).catch(() => {});
      } catch (_) {}
    }
    setCurrentSession(null);
    saveSession(null);
    sessionStorage.clear();
    lockNavigationHistoryOnLogout();
    setLoginError('');
    setActiveView('overview');
  };

  // ── Session Navigation Guard ──
  useEffect(() => {
    if (!currentSession) {
      lockNavigationHistoryOnLogout();
    }
  }, [currentSession]);

  // ── Save Users List ──
  const handleSaveUsers = (updatedUsers) => {
    setUsers(updatedUsers);
    const newGroups = { ...groupsData };
    updatedUsers.forEach(u => {
      if (u.group && !newGroups[u.group]) {
        newGroups[u.group] = { records: [], url: '', sourceName: '', lastSync: '' };
      }
    });
    setGroupsData(newGroups);
    saveStateToServer({ users: updatedUsers, groupsData: newGroups });
  };

  // ── Update Group Data (Setter Portal) ──
  const handleUpdateGroupData = (records, url, sourceName, lastSync) => {
    const userGroup = currentSession?.group || 'Grupo A';
    setGroupsData(prev => {
      const updated = {
        ...prev,
        [userGroup]: { records, url, sourceName, lastSync }
      };
      saveStateToServer({ groupsData: updated });
      return updated;
    });
  };

  // ── Update Specific Group Data (Admin Emergency Upload / Unlink) ──
  const handleUpdateGroupDataForKey = (groupKey, records, url, sourceName, lastSync) => {
    setGroupsData(prev => {
      const updated = {
        ...prev,
        [groupKey]: {
          ...(prev[groupKey] || {}),
          records: records !== undefined ? records : (prev[groupKey]?.records || []),
          url: url !== undefined ? url : (prev[groupKey]?.url || ''),
          sourceName: sourceName || prev[groupKey]?.sourceName || '',
          lastSync: lastSync || prev[groupKey]?.lastSync || ''
        }
      };
      saveStateToServer({ groupsData: updated });
      return updated;
    });
  };

  // ── Admin Global / Channel Upload Handlers ──
  const handleExcelImport = (records, filename, destinationChannel = 'Global') => {
    if (destinationChannel === 'Setters Aspirantes' || destinationChannel === 'Setters Oficiales') {
      const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      handleUpdateGroupDataForKey(destinationChannel, records, '', `Excel: ${filename}`, now);
    } else if (destinationChannel === 'Caller 1' || destinationChannel === 'Caller 2' || destinationChannel === 'Caller 3') {
      const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      handleUpdateCallerData(destinationChannel, records, [], '', undefined);
    } else {
      setAdminReports(records);
      setAdminSourceInfo({ type: 'excel', name: filename || 'Archivo Excel' });
    }
  };

  const handleGoogleSheetsImport = (records, url) => {
    setAdminReports(records);
    setAdminSheetUrl(url);
    setAdminSourceInfo({ type: 'sheets', name: 'Google Sheets' });
  };

  const [adminChannelFilter, setAdminChannelFilter] = useState('ALL');

  const role = currentSession?.role || 'setter';

  // ── Helper to sanitize records so empty rows never contaminate the Show Up denominator ──
  const sanitizeRecord = (r) => {
    if (!r || typeof r !== 'object') return r;
    const leadName = (r.nombreLeadAgendado || '').trim();
    const hasLead = Boolean(leadName && leadName !== '-' && leadName !== '—' && leadName.length > 2);
    const hasAgend = Number(r.agendamientos || 0) > 0 || (r.cumplioMeta && String(r.cumplioMeta).toLowerCase().startsWith('si'));
    const asistRaw = String(r.asistioLead || '').toLowerCase().trim();

    let asistioLead = '';
    if ((asistRaw === 'si' || asistRaw === 'sí' || asistRaw.startsWith('si') || asistRaw.startsWith('sí') || asistRaw === '1') && !asistRaw.startsWith('no')) {
      asistioLead = 'Sí';
    } else if (asistRaw.startsWith('no')) {
      if (hasLead || hasAgend) {
        asistioLead = 'No';
      } else {
        asistioLead = '';
      }
    } else if (asistRaw.includes('pendiente')) {
      asistioLead = 'Pendiente';
    }
    return { ...r, asistioLead };
  };

  // ── SCOPED DATA RESOLUTION ──
  let baseReports = [];

  if (role === 'setter') {
    // Setters: ONLY see their own assigned group
    const userGroup = currentSession?.group || 'Setters Aspirantes';
    const grp = groupsData?.[userGroup];
    baseReports = (grp?.records && Array.isArray(grp.records))
      ? grp.records.map(r => sanitizeRecord({ ...r, _group: userGroup }))
      : [];
  } else if (role === 'admin' || role === 'gerencia') {
    // Admin & Gerencia: full visibility, filtered by adminChannelFilter
    const rawList = [];

    if (adminChannelFilter === 'ALL') {
      Object.entries(groupsData || {}).forEach(([grpName, grpObj]) => {
        if (grpObj?.records && Array.isArray(grpObj.records)) {
          grpObj.records.forEach(r => {
            if (r && typeof r === 'object') rawList.push({ ...r, _group: grpName });
          });
        }
      });
      if (adminReports && Array.isArray(adminReports) && adminReports.length > 0) {
        adminReports.forEach(r => {
          if (r && typeof r === 'object') rawList.push({ ...r, _group: 'Global' });
        });
      }
    } else if (groupsData?.[adminChannelFilter]) {
      const grpObj = groupsData[adminChannelFilter];
      if (grpObj?.records && Array.isArray(grpObj.records)) {
        grpObj.records.forEach(r => {
          if (r && typeof r === 'object') rawList.push({ ...r, _group: adminChannelFilter });
        });
      }
    }

    const seenIds = new Set();
    baseReports = rawList.filter(r => {
      if (!r || typeof r !== 'object') return false;
      const idKey = r.id || `${r.timestamp || ''}|${r.sdr || ''}|${r.respuestasPositivas || 0}|${r.respuestasNegativas || 0}|${r.respuestasGhosting || 0}|${r.diagnosticos || 0}`;
      if (seenIds.has(idKey)) return false;
      seenIds.add(idKey);
      return true;
    }).map(sanitizeRecord);
  }

  // ── Computed available groups for User Management ──
  const availableGroups = Array.from(
    new Set([
      'Setters Aspirantes',
      'Setters Oficiales',
      ...(users || []).map(u => u.group).filter(Boolean),
      ...Object.keys(groupsData || {})
    ])
  );

  // ── Update Caller Data Store ──
  const handleUpdateCallerData = (callerKey, records, scorecard, url, callerName) => {
    setCallersData(prev => {
      const updated = {
        ...prev,
        [callerKey]: {
          ...(prev[callerKey] || {}),
          name: callerName || prev[callerKey]?.name || callerKey,
          callerRecords: records !== undefined ? records : (prev[callerKey]?.callerRecords || []),
          scorecardReports: scorecard !== undefined ? scorecard : (prev[callerKey]?.scorecardReports || []),
          sheetUrl: url !== undefined ? url : (prev[callerKey]?.sheetUrl || ''),
          lastSync: records ? new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : (prev[callerKey]?.lastSync || '')
        }
      };
      saveStateToServer({ callersData: updated });
      return updated;
    });
  };

  // ── Update Orgánico Data Store ──
  const handleUpdateOrganicoData = (records, scorecardReports, url) => {
    const syncTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    setOrganicoData(prev => {
      const updated = {
        ...prev,
        records: records !== undefined ? records : (prev?.records || []),
        scorecardReports: scorecardReports !== undefined ? scorecardReports : (prev?.scorecardReports || []),
        url: url !== undefined ? url : (prev?.url || ''),
        lastSync: syncTime
      };
      saveStateToServer({ organicoData: updated });
      return updated;
    });
  };

  // ── Update Closer Data Store ──
  const handleUpdateCloserData = (reports, summary, url) => {
    const syncTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    setCloserData(prev => {
      const updated = {
        ...prev,
        reports: reports !== undefined ? reports : (prev?.reports || []),
        summary: summary !== undefined ? summary : (prev?.summary || null),
        url: url !== undefined ? url : (prev?.url || ''),
        lastSync: syncTime
      };
      saveStateToServer({ closerData: updated });
      return updated;
    });
  };

  const handleClearChannelData = (targetChannel = adminChannelFilter) => {
    if (targetChannel === 'Setters Oficiales' || targetChannel === 'Setters Aspirantes') {
      setGroupsData(prev => {
        const updated = {
          ...prev,
          [targetChannel]: {
            ...(prev[targetChannel] || {}),
            records: [],
            sourceName: 'Sin datos (limpiado)',
            lastSync: ''
          }
        };
        saveStateToServer({ groupsData: updated });
        return updated;
      });
    } else if (targetChannel === 'Callers') {
      setCallersData(prev => {
        const updated = {
          ...prev,
          'Caller 1': {
            ...(prev['Caller 1'] || {}),
            callerRecords: [],
            scorecardReports: [],
            lastSync: ''
          }
        };
        saveStateToServer({ callersData: updated });
        return updated;
      });
    } else if (targetChannel === 'Organico') {
      const cleared = { records: [], scorecardReports: [], url: organicoData?.url || '', lastSync: '' };
      setOrganicoData(cleared);
      saveStateToServer({ organicoData: cleared });
    } else if (targetChannel === 'Closer') {
      const cleared = { reports: [], summary: null, url: closerData?.url || '', lastSync: '' };
      setCloserData(cleared);
      saveStateToServer({ closerData: cleared });
    } else {
      // Clear ALL
      setAdminReports([]);
      const clearedGroups = {};
      Object.keys(groupsData).forEach(k => {
        clearedGroups[k] = {
          records: [],
          url: groupsData[k]?.url || '',
          sourceName: 'Sin datos (limpiado)',
          lastSync: ''
        };
      });
      setGroupsData(clearedGroups);

      const clearedCallers = {};
      Object.keys(callersData).forEach(k => {
        clearedCallers[k] = {
          ...callersData[k],
          callerRecords: [],
          scorecardReports: [],
          sheetUrl: callersData[k]?.sheetUrl || '',
          lastSync: ''
        };
      });
      setCallersData(clearedCallers);

      const clearedOrganico = { records: [], scorecardReports: [], url: organicoData?.url || '', lastSync: '' };
      setOrganicoData(clearedOrganico);

      const clearedCloser = { reports: [], summary: null, url: closerData?.url || '', lastSync: '' };
      setCloserData(clearedCloser);

      saveStateToServer({
        groupsData: clearedGroups,
        callersData: clearedCallers,
        organicoData: clearedOrganico,
        closerData: clearedCloser,
        adminReports: []
      });
    }
  };

  const handleClearAllData = () => handleClearChannelData('ALL');


  const handleRestoreDemoData = () => {
    setAdminReports([]);
    setGroupsData(DEFAULT_GROUPS_DATA);
    setCallersData(DEFAULT_CALLERS_DATA);
    setOrganicoData(DEFAULT_ORGANICO_DATA);
    setCloserData(DEFAULT_CLOSER_DATA);
    setAdminSourceInfo({ type: 'demo', name: 'Datos de Grupos' });
    setAdminSheetUrl('');
    setIsClearConfirmOpen(false);
  };


  const [isQuickSyncing, setIsQuickSyncing] = useState(false);
  const [quickSyncMsg, setQuickSyncMsg] = useState('');

  const handleQuickSync = async () => {
    // Only admin and gerencia can sync
    if (role !== 'admin' && role !== 'gerencia') return;

    setIsQuickSyncing(true);
    setQuickSyncMsg('Sincronizando...');
    try {
      const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      const syncPromises = [];
      const syncedChannels = [];

      let updatedGroups = { ...groupsData };
      let updatedCallers = { ...callersData };

      // 1. Sync Setters Oficiales only if actively linked
      const ofiUrl = (groupsData?.['Setters Oficiales']?.url || '').trim();
      if (ofiUrl) {
        syncPromises.push(
          fetchGoogleSheetData(ofiUrl)
            .then(res => {
              if (res?.records) {
                updatedGroups['Setters Oficiales'] = {
                  ...updatedGroups['Setters Oficiales'],
                  records: res.records,
                  url: ofiUrl,
                  sourceName: `Google Sheets (${res.rowCount} registros)`,
                  lastSync: now
                };
                syncedChannels.push(`Oficiales (${res.rowCount})`);
              }
            })
            .catch(e => console.warn('Oficiales sync error:', e))
        );
      }

      // 2. Sync Setters Aspirantes only if actively linked
      const aspUrl = (groupsData?.['Setters Aspirantes']?.url || '').trim();
      if (aspUrl) {
        syncPromises.push(
          fetchGoogleSheetData(aspUrl)
            .then(res => {
              if (res?.records) {
                updatedGroups['Setters Aspirantes'] = {
                  ...updatedGroups['Setters Aspirantes'],
                  records: res.records,
                  url: aspUrl,
                  sourceName: `Google Sheets (${res.rowCount} registros)`,
                  lastSync: now
                };
                syncedChannels.push(`Aspirantes (${res.rowCount})`);
              }
            })
            .catch(e => console.warn('Aspirantes sync error:', e))
        );
      }

      // 3. Sync Callers only if actively linked
      const callerUrl = (callersData?.['Caller 1']?.sheetUrl || '').trim();
      if (callerUrl) {
        syncPromises.push(
          fetchSupervisorSheetData(callerUrl)
            .then(res => {
              if (res?.callerRecords) {
                updatedCallers['Caller 1'] = {
                  ...updatedCallers['Caller 1'],
                  callerRecords: res.callerRecords,
                  scorecardReports: res.scorecardReports,
                  sheetUrl: callerUrl,
                  lastSync: now
                };
                syncedChannels.push(`Callers (${res.callerRecords.length})`);
              }
            })
            .catch(e => console.warn('Callers sync error:', e))
        );
      }

      // 4. Sync Orgánico only if actively linked
      let updatedOrganico = { ...organicoData };
      const orgUrl = (organicoData?.url || '').trim();
      if (orgUrl) {
        syncPromises.push(
          fetchOrganicoSheetData(orgUrl)
            .then(res => {
              if (res?.records) {
                updatedOrganico = {
                  records: res.records,
                  scorecardReports: res.scorecardReports || [],
                  url: orgUrl,
                  lastSync: now
                };
                syncedChannels.push(`Orgánico (${res.records.length})`);
              }
            })
            .catch(e => console.warn('Orgánico sync error:', e))
        );
      }

      // 5. Sync Closer only if actively linked
      let updatedCloser = { ...closerData };
      const clsUrl = (closerData?.url || '').trim();
      if (clsUrl) {
        syncPromises.push(
          fetchCloserSheetData(clsUrl)
            .then(res => {
              if (res?.reports) {
                updatedCloser = {
                  reports: res.reports,
                  summary: res.summary || null,
                  url: clsUrl,
                  lastSync: now
                };
                syncedChannels.push(`Closer (${res.reports.length})`);
              }
            })
            .catch(e => console.warn('Closer sync error:', e))
        );
      }

      if (syncPromises.length === 0) {
        setQuickSyncMsg('ℹ️ No hay enlaces activos de Google Sheets vinculados.');
      } else {
        await Promise.all(syncPromises);
        setGroupsData(updatedGroups);
        setCallersData(updatedCallers);
        setOrganicoData(updatedOrganico);
        setCloserData(updatedCloser);
        // Persist synced state to server with full records!
        saveStateToServer({
          groupsData: updatedGroups,
          callersData: updatedCallers,
          organicoData: updatedOrganico,
          closerData: updatedCloser
        });
        // Reset auto-sync timers
        lastSheetsFetchRef.current = Date.now();
        lastServerPollRef.current  = Date.now();
        setQuickSyncMsg(`✅ Sincronización exitosa: ${syncedChannels.join(' · ')} actualizados a las ${now}.`);
      }

      setTimeout(() => setQuickSyncMsg(''), 5500);
    } catch (err) {
      setQuickSyncMsg(`❌ Error: ${err.message}`);
      setTimeout(() => setQuickSyncMsg(''), 6500);
    } finally {
      setIsQuickSyncing(false);
    }
  };

  // ── IF NOT LOGGED IN → SHOW LOGIN PAGE ──
  if (!currentSession) {
    return <LoginPage onLogin={handleLogin} users={users} sessionAlertMessage={sessionAlertMessage} />;
  }

  return (
    <div className="app-container">
      {/* Header with Standard Positions & User Profile Modal Trigger */}
      <Header
        userSession={currentSession}
        users={users}
        onSwitchUser={handleSwitchUser}
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={handleLogout}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
        onClearData={() => setIsClearConfirmOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onQuickSync={handleQuickSync}
        isQuickSyncing={isQuickSyncing}
        quickSyncMsg={quickSyncMsg}
        adminChannelFilter={adminChannelFilter}
        setAdminChannelFilter={setAdminChannelFilter}
        hasActiveSheet={Boolean(adminSheetUrl || (currentSession?.group && groupsData[currentSession.group]?.url) || currentSession?.role === 'caller')}
      />



      {/* Main Content Area with Smooth View Transitions */}
      <main key={activeView} className="view-enter-animation">
        {role === 'caller' && (
          <SupervisorCallerSection
            callersData={callersData}
            onUpdateCallerData={handleUpdateCallerData}
            selectedCallerKey={selectedCallerKey}
            setSelectedCallerKey={setSelectedCallerKey}
            userSession={currentSession}
          />
        )}

        {/* SETTER PORTAL TAB */}
        {role === 'setter' && activeView === 'userportal' && (
          <UserPortalSection
            userSession={currentSession}
            groupData={groupsData[currentSession.group] || { records: [], url: '', sourceName: '', lastSync: '' }}
            onUpdateGroupData={handleUpdateGroupData}
          />
        )}

        {/* 5 FUNCTIONS FOR ADMIN, GERENCIA & SETTERS */}
        {role !== 'caller' && activeView !== 'userportal' && (
          <>
            {activeView === 'overview' && (role === 'admin' || role === 'gerencia') && (
              <ExecutiveOverviewSummary reports={baseReports} callersData={callersData} groupsData={groupsData} />
            )}
            {activeView === 'organico' && (role === 'admin' || role === 'gerencia') && (
              <OrganicoScorecardSection
                organicoData={organicoData}
                onUpdateOrganicoData={handleUpdateOrganicoData}
                userSession={currentSession}
              />
            )}
            {activeView === 'supervisor' && (role === 'admin' || role === 'gerencia') && (
              <SupervisorCallerSection
                callersData={callersData}
                onUpdateCallerData={handleUpdateCallerData}
                selectedCallerKey={selectedCallerKey}
                setSelectedCallerKey={setSelectedCallerKey}
                userSession={currentSession}
              />
            )}
            {activeView === 'closer' && (role === 'admin' || role === 'gerencia') && (
              <CloserScorecardSection
                closerData={closerData}
                onUpdateCloserData={handleUpdateCloserData}
                userSession={currentSession}
                funnelReports={baseReports}
              />
            )}
            {activeView !== 'overview' && activeView !== 'supervisor' && activeView !== 'organico' && activeView !== 'closer' && (
              baseReports.length === 0 ? (
                <div className="glass-panel" style={{ padding: '60px 30px', textAlign: 'center', margin: '20px 0' }}>
                  <Database size={44} color="#2563eb" style={{ margin: '0 auto 14px', opacity: 0.8 }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>No hay datos cargados</h3>
                  <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                    {role === 'setter'
                      ? `Contacta al administrador para que sincronice los datos de tu grupo "${currentSession?.group || ''}".`
                      : 'Usa el botón "Actualizar / Sincronizar Todo" o enlaza un Google Sheet para cargar datos.'}
                  </p>
                  {(role === 'admin' || role === 'gerencia') && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <button className="btn-cyber-primary" onClick={() => setIsGoogleSheetsModalOpen(true)}>Enlazar Google Sheets</button>
                      <button className="btn-cyber-ghost" onClick={() => setIsExcelModalOpen(true)}>Cargar Excel</button>
                      <button className="btn-cyber-ghost" onClick={handleRestoreDemoData}>Restablecer Datos de Muestra</button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {activeView === 'funnel'      && <CommercialFunnelSection reports={baseReports} closerData={closerData} />}
                  {activeView === 'operative'   && <OperativeAnalysisSection reports={baseReports} />}
                  {activeView === 'tracker'     && <SdrTrackerLeaderboard reports={baseReports} />}
                  {activeView === 'scheduled'   && <ScheduledLeadsSection reports={baseReports} />}
                  {activeView === 'datasource'  && <DataSourceSection reports={baseReports} />}
                </>
              )
            )}
          </>
        )}
      </main>

      {/* ── Professional Copyright & Versioning Footer ── */}
      <footer style={{
        marginTop: '32px',
        padding: '16px 24px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <div>
          <span>© {new Date().getFullYear()} Dashboard de Gestión y Prospección Comercial. Todos los derechos reservados.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: '#334155',
            padding: '2px 8px',
            borderRadius: '6px',
            fontWeight: 800,
            fontSize: '11px',
            letterSpacing: '0.02em'
          }}>
            {APP_VERSION}
          </span>
        </div>
      </footer>

      {/* Modals */}
      <ExcelUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onDataImported={handleExcelImport}
        userSession={currentSession}
      />
      <GoogleSheetsModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        activeUrl={adminSheetUrl}
        onDataImported={handleGoogleSheetsImport}
        userSession={currentSession}
        groupsData={groupsData}
        callersData={callersData}
        organicoData={organicoData}
        closerData={closerData}
        onUpdateGroupDataForKey={handleUpdateGroupDataForKey}
        onUpdateCallerData={handleUpdateCallerData}
        onUpdateOrganicoData={handleUpdateOrganicoData}
        onUpdateCloserData={handleUpdateCloserData}
      />

      {/* User Profile & Logo Customization Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userSession={currentSession}
        onUpdateAvatar={handleUpdateAvatar}
      />

      {/* Admin User Management Modal */}
      {role === 'admin' && (
        <UserManagementModal
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          users={users}
          onSaveUsers={handleSaveUsers}
          availableGroups={availableGroups}
        />
      )}

      {/* ─── MODAL DE GESTIÓN Y VACIADO DE DATOS (ESTILO CORPORATIVO ARMONIOSO) ─── */}
      {isClearConfirmOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsClearConfirmOpen(false)}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '540px',
              width: '92%',
              padding: 0,
              overflow: 'hidden',
              borderRadius: '16px'
            }}
          >
            {/* Header consistente con los demás modales */}
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: '9px',
                  borderRadius: '10px',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                    Gestión de Base de Datos
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                    Panel de control exclusivo del Administrador Principal
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsClearConfirmOpen(false)}
                title="Cerrar ventana"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Esta acción te permite reiniciar las tablas de prospección o restablecer la base de datos a sus valores iniciales de prueba.
              </p>

              {/* Tarjetas comparativas con la estética del dashboard */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                
                {/* Tarjeta: Se Purgará */}
                <div style={{
                  background: '#fff5f5',
                  border: '1px solid #fed7d7',
                  borderRadius: '10px',
                  padding: '12px 14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, color: '#c53030', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <Trash2 size={13} /> Registros a vaciar
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '12px', color: '#742a2a', lineHeight: 1.45 }}>
                    <li style={{ marginBottom: '3px' }}>Métricas cargadas por Setters.</li>
                    <li style={{ marginBottom: '3px' }}>Reportes y tablas de prospección.</li>
                    <li>Enlaces vinculados activos.</li>
                  </ul>
                </div>

                {/* Tarjeta: Se Mantiene Seguro */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px 14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, color: '#16a34a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <ShieldCheck size={13} /> Seguridad intacta
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '12px', color: '#14532d', lineHeight: 1.45 }}>
                    <li style={{ marginBottom: '3px' }}>Cuentas de usuario y accesos.</li>
                    <li style={{ marginBottom: '3px' }}>Roles y grupos configurados.</li>
                    <li>Reglas y fórmulas del sistema.</li>
                  </ul>
                </div>

              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {adminChannelFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => handleClearChannelData(adminChannelFilter)}
                    style={{
                      background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '11px 16px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Trash2 size={15} /> Vaciar Solo Registros de: {adminChannelFilter === 'Callers' ? 'Canal C - Call Team' : adminChannelFilter}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClearAllData}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '11px 16px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Trash2 size={15} /> Vaciar Todos los Canales (Consolidado Global)
                </button>

                <button
                  type="button"
                  onClick={handleRestoreDemoData}
                  className="btn-cyber-primary"
                  style={{
                    justifyContent: 'center',
                    padding: '11px 16px',
                    fontSize: '13px',
                    fontWeight: 800
                  }}
                >
                  <RotateCcw size={15} /> Restablecer Datos de Demostración
                </button>
              </div>

            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ padding: '12px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsClearConfirmOpen(false)}
                style={{ padding: '7px 16px', fontSize: '12.5px' }}
              >
                Cancelar y Mantener Datos
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
