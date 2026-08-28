import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  UserCheck,
  CalendarCheck,
  MessageSquare,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Users,
  Layers,
  Link2,
  Trash2,
  Unlink,
  Info,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  Edit2,
  Check,
  X,
  Filter,
  Compass
} from 'lucide-react';
import { fetchSupervisorSheetData } from '../utils/googleSheetsParser';

export default function SupervisorCallerSection({
  callersData = {},
  onUpdateCallerData,
  selectedCallerKey = 'Todos',
  setSelectedCallerKey,
  userSession = null
}) {
  const isCallerRole = userSession?.role === 'caller';
  const isAdminRole = userSession?.role === 'admin';
  const defaultCallerKey = isCallerRole
    ? (userSession?.callerKey || (userSession?.username === 'caller2' ? 'Caller 2' : 'Caller 1'))
    : 'Todos';

  const [activeCaller, setActiveCaller] = useState(defaultCallerKey);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [sourceFilter, setSourceFilter] = useState('Todas');
  const [showSyncBar, setShowSyncBar] = useState(false);
  const [isEditingCallerName, setIsEditingCallerName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [openCardDetail, setOpenCardDetail] = useState(null);
  const cardPopoverRef = useRef(null);

  useEffect(() => {
    if (isCallerRole) {
      const key = userSession?.callerKey || (userSession?.username === 'caller2' ? 'Caller 2' : 'Caller 1');
      setActiveCaller(key);
    } else if (isAdminRole) {
      setActiveCaller('Todos');
    }
  }, [userSession, isCallerRole, isAdminRole]);

  // Close card popovers on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (cardPopoverRef.current && !cardPopoverRef.current.contains(event.target)) {
        setOpenCardDetail(null);
      }
    }
    if (openCardDetail) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openCardDetail]);

  // Available Caller keys — only show Caller slots, not Proceso slots
  const callerKeys = (Object.keys(callersData).length > 0
    ? Object.keys(callersData)
    : ['Caller 1', 'Caller 2']
  ).filter(key => {
    const name = (callersData[key]?.name || key).toLowerCase();
    return !name.startsWith('proceso') && !key.toLowerCase().startsWith('proceso');
  });

  // Current active caller object or fallback
  const targetCallerKey = activeCaller === 'Todos' ? 'Caller 1' : activeCaller;
  const currentCallerObj = callersData[targetCallerKey] || null;
  const [sheetUrlInput, setSheetUrlInput] = useState(currentCallerObj?.sheetUrl || '');

  // Keep input synchronized with callersData state
  useEffect(() => {
    const activeKey = activeCaller === 'Todos' ? 'Caller 1' : activeCaller;
    setSheetUrlInput(callersData[activeKey]?.sheetUrl || '');
  }, [activeCaller, callersData]);

  // Update input when process changes
  const handleSelectCaller = (key) => {
    setActiveCaller(key);
    setIsEditingCallerName(false);
    if (setSelectedCallerKey) setSelectedCallerKey(key);
    const target = key === 'Todos' ? 'Caller 1' : key;
    setSheetUrlInput(callersData[target]?.sheetUrl || '');
  };

  const handleStartEditName = () => {
    if (activeCaller === 'Todos') return;
    setEditingNameValue(callersData[activeCaller]?.name || activeCaller);
    setIsEditingCallerName(true);
  };

  const handleSaveCallerName = () => {
    if (!editingNameValue.trim() || activeCaller === 'Todos') return;
    if (onUpdateCallerData) {
      onUpdateCallerData(activeCaller, undefined, undefined, undefined, editingNameValue.trim());
    }
    setIsEditingCallerName(false);
  };

  // Compile records depending on selected caller
  let displayCallerRecords = [];
  let displayScorecardReports = [];

  if (activeCaller === 'Todos') {
    Object.entries(callersData).forEach(([cKey, cObj]) => {
      if (cObj?.callerRecords && Array.isArray(cObj.callerRecords)) {
        cObj.callerRecords.forEach(r => {
          displayCallerRecords.push({ ...r, _caller: cObj.name || cKey });
        });
      }
      if (cObj?.scorecardReports && Array.isArray(cObj.scorecardReports)) {
        cObj.scorecardReports.forEach(sc => {
          displayScorecardReports.push({ ...sc, _caller: cObj.name || cKey });
        });
      }
    });
  } else {
    const safeObj = callersData[activeCaller] || {};
    displayCallerRecords = Array.isArray(safeObj.callerRecords)
      ? safeObj.callerRecords.map(r => ({ ...r, _caller: safeObj.name || activeCaller }))
      : [];
    displayScorecardReports = Array.isArray(safeObj.scorecardReports)
      ? safeObj.scorecardReports.map(sc => ({ ...sc, _caller: safeObj.name || activeCaller }))
      : [];
  }

  const handleSyncSheet = async () => {
    const targetKey = activeCaller === 'Todos' ? 'Caller 1' : activeCaller;
    const urlToFetch = sheetUrlInput.trim() || callersData[targetKey]?.sheetUrl || '';

    setIsSyncing(true);
    setSyncMsg('');
    try {
      const data = await fetchSupervisorSheetData(urlToFetch);
      if (onUpdateCallerData) {
        onUpdateCallerData(targetKey, data.callerRecords, data.scorecardReports, urlToFetch);
      }
      setSyncMsg(`¡Sincronizado con éxito! (${data.callerRecords.length} registros y ${data.scorecardReports.length} reportes de Scorecard)`);
      setTimeout(() => setSyncMsg(''), 4500);
    } catch (err) {
      setSyncMsg(`Error: ${err.message || 'No se pudo sincronizar el Google Sheet de supervisión.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUnlinkSheet = () => {
    if (activeCaller === 'Todos') {
      Object.keys(callersData).forEach(key => {
        if (onUpdateCallerData) {
          onUpdateCallerData(key, [], [], '');
        }
      });
      setSheetUrlInput('');
      setSyncMsg('🔗 Enlace desvinculado con éxito. Ahora puedes pegar un nuevo enlace de Google Sheets y presionar "Sincronizar Callers".');
    } else {
      if (onUpdateCallerData) {
        onUpdateCallerData(activeCaller, [], [], '');
      }
      setSheetUrlInput('');
      setSyncMsg(`🔗 Enlace de ${callersData[activeCaller]?.name || activeCaller} desvinculado con éxito. Pega el nuevo enlace y presiona "Sincronizar".`);
    }
    setTimeout(() => setSyncMsg(''), 5500);
  };

  // Spanish date parser for exact chronological ordering (newest first)
  const monthsMap = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };
  const parseSpanishDate = (dateStr) => {
    if (!dateStr) return 0;
    const str = String(dateStr).trim().toLowerCase();
    const dmyMatch = str.match(/^(\d{1,2})[-/]([a-z]{3}|\d{1,2})[-/](\d{2,4})$/i);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const mStr = dmyMatch[2].toLowerCase();
      const month = monthsMap[mStr] !== undefined ? monthsMap[mStr] : (parseInt(mStr, 10) - 1);
      let year = parseInt(dmyMatch[3], 10);
      if (year < 100) year += 2000;
      return new Date(year, month, day).getTime();
    }
    const isoDate = Date.parse(str);
    return isNaN(isoDate) ? 0 : isoDate;
  };

  // Aggregated Scorecard KPIs — always derived directly from raw caller records or official Scorecard report
  const totalLlamadas = useMemo(() => {
    if (displayScorecardReports.length > 0) {
      const sum = displayScorecardReports.reduce((a, s) => a + Number(s.llamadasDiarias || 0), 0);
      if (sum > 0) return sum;
    }
    return displayCallerRecords.reduce((a, r) => a + Number(r.intentos || 1), 0);
  }, [displayScorecardReports, displayCallerRecords]);

  const totalContactosUnicos = useMemo(() => {
    if (displayScorecardReports.length > 0) {
      const sum = displayScorecardReports.reduce((a, s) => a + Number(s.contactosUnicos || 0), 0);
      if (sum > 0) return sum;
    }
    return displayCallerRecords.length;
  }, [displayScorecardReports, displayCallerRecords]);

  const totalMensajes1a1 = useMemo(() => {
    if (displayScorecardReports.length > 0) {
      const sum = displayScorecardReports.reduce((a, s) => a + Number(s.mensajesEnviados || 0), 0);
      if (sum > 0) return sum;
    }
    return displayCallerRecords.filter(r => r.mensajes1a1 === 'Sí').length;
  }, [displayScorecardReports, displayCallerRecords]);

  const totalNoCalifican = useMemo(() => {
    if (displayScorecardReports.length > 0) {
      const sum = displayScorecardReports.reduce((a, s) => a + Number(s.noCalificanFC || 0), 0);
      if (sum > 0) return sum;
    }
    return displayCallerRecords.filter(r => (r.respuesta || '').toLowerCase().includes('no califica')).length;
  }, [displayScorecardReports, displayCallerRecords]);

  const totalSeguimiento = useMemo(() => {
    if (displayScorecardReports.length > 0) {
      const sum = displayScorecardReports.reduce((a, s) => a + Number(s.enSeguimiento || 0), 0);
      if (sum > 0) return sum;
    }
    return displayCallerRecords.filter(r => (r.respuesta || '').toLowerCase().includes('seguimiento')).length;
  }, [displayScorecardReports, displayCallerRecords]);

  const totalCitas = useMemo(() => {
    if (displayScorecardReports.length > 0) {
      const sum = displayScorecardReports.reduce((a, s) => a + Number(s.citasAgendadas || 0), 0);
      if (sum > 0) return sum;
    }
    return displayCallerRecords.filter(r => (r.respuesta || '').toLowerCase().includes('agendado')).length;
  }, [displayScorecardReports, displayCallerRecords]);

  const totalComunidadSkool = useMemo(() => {
    if (displayScorecardReports.length > 0) {
      const sum = displayScorecardReports.reduce((a, s) => a + Number(s.comunidadSkool || 0), 0);
      if (sum > 0) return sum;
    }
    return displayCallerRecords.filter(r => r.comunidadSkool === 'Sí').length;
  }, [displayScorecardReports, displayCallerRecords]);

  // ── Calculation of exact daily history directly from Scorecard reports or caller records ──
  // Excludes the in-progress current date (most recent date) to measure strictly completed history up to yesterday (Ayer)
  const allDailyList = useMemo(() => {
    if (displayScorecardReports.length > 0) {
      const valid = displayScorecardReports.filter(s => Number(s.llamadasDiarias || 0) > 0 || Number(s.contactosUnicos || 0) > 0);
      if (valid.length > 0) {
        return [...valid].sort((a, b) => parseSpanishDate(b.fecha) - parseSpanishDate(a.fecha));
      }
    }

    const groups = {};
    displayCallerRecords.forEach(r => {
      if (!r.fecha) return;
      const dateKey = r.fecha.trim();
      if (!groups[dateKey]) {
        groups[dateKey] = {
          fecha: dateKey,
          llamadasDiarias: 0,
          contactosUnicos: 0,
          fuentesConteo: 0,
          mensajesEnviados: 0,
          comunidadSkool: 0,
          enSeguimiento: 0,
          citasAgendadas: 0
        };
      }
      groups[dateKey].llamadasDiarias += Number(r.intentos || 1);
      groups[dateKey].contactosUnicos += 1;
      if (r.fuente && r.fuente !== '—' && r.fuente !== '-') groups[dateKey].fuentesConteo += 1;
      if (r.mensajes1a1 === 'Sí') groups[dateKey].mensajesEnviados += 1;
      if (r.comunidadSkool === 'Sí') groups[dateKey].comunidadSkool += 1;
      if ((r.respuesta || '').toLowerCase().includes('seguimiento')) groups[dateKey].enSeguimiento += 1;
      if ((r.respuesta || '').toLowerCase().includes('agendado')) groups[dateKey].citasAgendadas += 1;
    });

    return Object.values(groups).sort((a, b) => parseSpanishDate(b.fecha) - parseSpanishDate(a.fecha));
  }, [displayScorecardReports, displayCallerRecords]);

  // Si hay más de 1 fecha, omitimos la fecha actual más reciente (ej. 25-ago) para medir exactamente "Ayer" (ej. 24-ago) y días completados anteriores
  const dailyHistoryList = useMemo(() => {
    if (allDailyList.length <= 1) return allDailyList;
    return allDailyList.slice(1);
  }, [allDailyList]);

  const yesterdayDateLabel = dailyHistoryList[0]?.fecha || '';
  const yesterdayDaily = dailyHistoryList[0] || { llamadasDiarias: 0, contactosUnicos: 0, fuentesConteo: 0, mensajesEnviados: 0, comunidadSkool: 0, enSeguimiento: 0, citasAgendadas: 0 };

  // Ordenar registros de más reciente a más antiguo (fecha descendente)
  const sortedCallerRecords = useMemo(() => {
    return [...displayCallerRecords].sort((a, b) => {
      const timeDiff = parseSpanishDate(b.fecha) - parseSpanishDate(a.fecha);
      if (timeDiff !== 0) return timeDiff;
      return 0;
    });
  }, [displayCallerRecords]);

  // Filtered Caller Records by Search, Status and Source
  const filteredCaller = sortedCallerRecords.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (r.nombre || '').toLowerCase().includes(term) ||
      (r.fuente || '').toLowerCase().includes(term) ||
      (r.contexto || '').toLowerCase().includes(term) ||
      (r.respuesta || '').toLowerCase().includes(term) ||
      (r._caller || '').toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'Todos' || r.respuesta === statusFilter;
    const matchesSource = sourceFilter === 'Todas' || (r.fuente || '').trim().toLowerCase() === sourceFilter.trim().toLowerCase();
    return matchesSearch && matchesStatus && matchesSource;
  });

  const uniqueStatuses = ['Todos', ...Array.from(new Set(displayCallerRecords.map(r => r.respuesta).filter(Boolean)))];
  
  // Dynamic Sources List & Statistics (counts of real sources from data)
  const sourceStats = useMemo(() => {
    const counts = {};
    let totalWithSource = 0;
    displayCallerRecords.forEach(r => {
      const src = (r.fuente || '').trim();
      if (src && src !== '—' && src !== '-') {
        counts[src] = (counts[src] || 0) + 1;
        totalWithSource++;
      }
    });
    return { counts, totalWithSource, distinctCount: Object.keys(counts).length };
  }, [displayCallerRecords]);

  const rawSources = Object.keys(sourceStats.counts);
  const allDistinctSources = ['Todas', ...rawSources];

  // Pagination state: limit to 20 records
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;
  const totalPages = Math.ceil(filteredCaller.length / rowsPerPage) || 1;
  const paginatedCallerRecords = filteredCaller.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const getStatusBadge = (resp) => {
    const lower = (resp || '').toLowerCase();
    if (lower.includes('no califica')) {
      return (
        <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '11px', fontWeight: 800 }}>
          <XCircle size={11} style={{ display: 'inline', marginRight: 4 }} /> No Califica (FC)
        </span>
      );
    } else if (lower.includes('seguimiento')) {
      return (
        <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706', fontSize: '11px', fontWeight: 800 }}>
          <AlertTriangle size={11} style={{ display: 'inline', marginRight: 4 }} /> En Seguimiento
        </span>
      );
    } else if (lower.includes('agendado') || lower.includes('calificado')) {
      return (
        <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', fontSize: '11px', fontWeight: 800 }}>
          <CheckCircle2 size={11} style={{ display: 'inline', marginRight: 4 }} /> Agendado / Calificado
        </span>
      );
    }
    return (
      <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', fontSize: '11px', fontWeight: 700 }}>
        {resp || 'Sin Respuesta'}
      </span>
    );
  };

  // Format short caller name for compact table display
  const formatShortCallerName = (rawName) => {
    if (!rawName) return 'Caller 1';
    const str = String(rawName).trim();
    if (str.includes('Proceso 1') || str.includes('Caller 1')) {
      if (str.toLowerCase().includes('nury')) return 'Caller 1 (Nury)';
      return 'Caller 1';
    }
    if (str.includes('Proceso 2') || str.includes('Caller 2')) return 'Caller 2';
    if (str.includes('Proceso 3') || str.includes('Caller 3')) return 'Caller 3';
    return str.length > 15 ? str.substring(0, 13) + '...' : str;
  };

  // Styled source badge (clean dash if empty without false assumptions)
  const getFuenteBadge = (fuente) => {
    const src = String(fuente || '').trim();
    if (!src || src === '—' || src === '-') {
      return <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>—</span>;
    }

    const lower = src.toLowerCase();
    if (lower.includes('link')) {
      return (
        <span style={{
          padding: '3px 9px', borderRadius: '12px',
          background: '#eff6ff', border: '1px solid #bfdbfe',
          color: '#0284c7', fontSize: '11px', fontWeight: 800,
          display: 'inline-flex', alignItems: 'center', gap: '3px'
        }}>
          🌐 Linkedin
        </span>
      );
    }
    if (lower.includes('pauta')) {
      return (
        <span style={{
          padding: '3px 9px', borderRadius: '12px',
          background: '#fffbeb', border: '1px solid #fde68a',
          color: '#d97706', fontSize: '11px', fontWeight: 800,
          display: 'inline-flex', alignItems: 'center', gap: '3px'
        }}>
          🎯 Pauta
        </span>
      );
    }
    if (lower.includes('org')) {
      return (
        <span style={{
          padding: '3px 9px', borderRadius: '12px',
          background: '#ecfdf5', border: '1px solid #a7f3d0',
          color: '#059669', fontSize: '11px', fontWeight: 800,
          display: 'inline-flex', alignItems: 'center', gap: '3px'
        }}>
          🌱 Orgánico
        </span>
      );
    }
    return (
      <span style={{
        padding: '3px 9px', borderRadius: '12px',
        background: '#f8fafc', border: '1px solid #e2e8f0',
        fontSize: '11px', fontWeight: 700, color: '#475569'
      }}>
        {src}
      </span>
    );
  };

  const [showGuide, setShowGuide] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
      
      {/* ─── BANNER EJECUTIVO CON CONTROLES ALINEADOS Y BOTÓN DE GUÍA / SINCRONIZACIÓN ─── */}
      <div className="glass-panel" style={{ padding: '20px 24px', borderLeft: '4px solid #7c3aed' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* TÍTULO Y DESCRIPCIÓN (IZQUIERDA) */}
          <div style={{ minWidth: '260px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 800, color: '#7c3aed' }}>
                <ShieldAlert size={13} /> MÓDULO DE SUPERVISIÓN & SCORECARD
              </div>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              Rendimiento Consolidado de Callers
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0' }}>
              Control de llamadas diarias, respuestas de prospectos, derivaciones y agenda de re-contactos.
            </p>

            {/* BOTONES DE ACCIÓN BAJO EL TÍTULO (SOLO PARA CALLERS / NO ADMIN) */}
            {!isAdminRole && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleSyncSheet}
                  disabled={isSyncing}
                  className="btn-cyber-emerald"
                  style={{ fontSize: '12px', padding: '7px 13px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, height: '36px', boxShadow: '0 2px 8px rgba(5,150,105,0.25)' }}
                  title="Actualizar y sincronizar datos de Google Sheets en 1 clic"
                >
                  <RefreshCw size={13} className={isSyncing ? 'spin-icon' : ''} />
                  {isSyncing ? 'Sincronizando...' : '🔄 Actualizar Datos'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowSyncBar(prev => !prev)}
                  className="btn-cyber-ghost"
                  style={{ fontSize: '12px', padding: '7px 11px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, height: '36px', background: showSyncBar ? '#faf5ff' : '#ffffff', borderColor: showSyncBar ? '#7c3aed' : '#cbd5e1', color: showSyncBar ? '#7c3aed' : '#475569' }}
                  title="Ver o cambiar enlace de Google Sheets"
                >
                  <Link2 size={13} /> Enlace & Config
                  {showSyncBar ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowGuide(prev => !prev)}
                  style={{ background: showGuide ? '#f5f3ff' : '#ffffff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '7px 11px', fontSize: '12px', fontWeight: 800, color: '#7c3aed', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s ease', height: '36px' }}
                  title="Ver guía de operación"
                >
                  <Info size={13} /> Guía
                  {showGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            )}
          </div>

          {/* SELECTOR O DISTINTIVO CALL TEAM (EXTREMO DERECHO SEGÚN ROL) */}
          {isAdminRole ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f5f3ff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd6fe', height: '38px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                CALL TEAM: Información General Consolidada
              </span>
            </div>
          ) : isCallerRole ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f5f3ff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd6fe', height: '38px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                CALL TEAM: {callersData[activeCaller]?.name || activeCaller}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', height: '38px', flexShrink: 0 }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                CALL TEAM:
              </span>

              {isEditingCallerName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="text"
                    value={editingNameValue}
                    onChange={(e) => setEditingNameValue(e.target.value)}
                    placeholder="Nombre del Caller..."
                    autoFocus
                    style={{
                      background: '#ffffff',
                      border: '2px solid #7c3aed',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#0f172a',
                      outline: 'none',
                      width: '140px'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveCallerName();
                      if (e.key === 'Escape') setIsEditingCallerName(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveCallerName}
                    style={{
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Guardar nombre"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCallerName(false)}
                    style={{
                      background: '#f1f5f9',
                      color: '#64748b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '5px',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Cancelar"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <select
                    value={activeCaller}
                    onChange={(e) => handleSelectCaller(e.target.value)}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #7c3aed',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="Todos">Todos los Callers (Consolidado)</option>
                    {callerKeys.map(key => (
                      <option key={key} value={key}>
                        {callersData[key]?.name || key}
                      </option>
                    ))}
                  </select>

                  {activeCaller !== 'Todos' && (
                    <button
                      type="button"
                      onClick={handleStartEditName}
                      style={{
                        background: '#f5f3ff',
                        border: '1px solid #ddd6fe',
                        borderRadius: '5px',
                        padding: '4px 6px',
                        color: '#7c3aed',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '11px',
                        fontWeight: 800
                      }}
                      title="Editar el nombre del asesor seleccionado"
                    >
                      <Edit2 size={11} /> Editar
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── GUÍA PROFESIONAL DE OPERACIÓN (COLAPSABLE) ── */}
        {showGuide && (
          <div style={{
            marginTop: '16px',
            padding: '16px 18px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontWeight: 900, fontSize: '13px', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={15} color="#7c3aed" />
              Guía de Flujo Operativo & Protocolo de Supervisión de Callers
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              
              {/* Tarjeta 1 */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#7c3aed', marginBottom: '4px' }}>
                  1. Conexión & Acceso al Sheet
                </div>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#475569', lineHeight: 1.45 }}>
                  Asegúrate de que la hoja de Google Sheets tenga permisos de lectura habilitados en <em>"Cualquier persona con el enlace"</em> para una sincronización fluida.
                </p>
              </div>

              {/* Tarjeta 2 */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#059669', marginBottom: '4px' }}>
                  2. Sincronización en 1 Clic
                </div>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#475569', lineHeight: 1.45 }}>
                  Cuando el equipo ingrese nuevas llamadas, estados o derivaciones, solo haz clic en <strong>"Sincronizar Callers"</strong> para actualizar métricas y KPIs al instante.
                </p>
              </div>

              {/* Tarjeta 3 */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#d97706', marginBottom: '4px' }}>
                  3. Rotación & Gestión de Nombres
                </div>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#475569', lineHeight: 1.45 }}>
                  Si rota un asesor de llamadas, selecciona su perfil en <em>CALL TEAM</em> y pulsa <strong>"Editar"</strong> para actualizar su nombre inmediatamente.
                </p>
              </div>

              {/* Tarjeta 4 */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#dc2626', marginBottom: '4px' }}>
                  4. Desvinculación de Archivo
                </div>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#475569', lineHeight: 1.45 }}>
                  Utiliza <strong>"Desvincular Enlace"</strong> únicamente cuando vayas a conectar una base o campaña telefónica totalmente nueva.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ── PANEL COLAPSABLE DE ENLACE Y BOTONES DE SINCRONIZACIÓN ── */}
        {showSyncBar && (
          <div style={{
            marginTop: '16px',
            padding: '14px 16px',
            background: '#faf5ff',
            borderRadius: '10px',
            border: '1px solid #e9d5ff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px', position: 'relative' }}>
              <Link2 size={16} color="#7c3aed" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder={activeCaller === 'Todos' ? "URL de Google Sheets de Callers / Supervisión" : `URL de Google Sheet para ${callersData[activeCaller]?.name || activeCaller}`}
                value={sheetUrlInput}
                onChange={(e) => setSheetUrlInput(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  fontSize: '12px',
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
              {sheetUrlInput && (
                <button
                  type="button"
                  onClick={() => setSheetUrlInput('')}
                  title="Limpiar casilla de enlace"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {sheetUrlInput && (
                <a
                  href={sheetUrlInput}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-cyber-ghost"
                  style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none' }}
                >
                  <ExternalLink size={13} /> Abrir Sheet
                </a>
              )}

              <button
                className="btn-cyber-emerald"
                onClick={handleSyncSheet}
                disabled={isSyncing}
                style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
              >
                <RefreshCw size={13} className={isSyncing ? 'spin-icon' : ''} />
                {isSyncing ? 'Sincronizando...' : (activeCaller === 'Todos' ? '🔄 Sincronizar Callers' : `Sincronizar ${callersData[activeCaller]?.name || activeCaller}`)}
              </button>

              <button
                type="button"
                onClick={handleUnlinkSheet}
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  color: '#dc2626',
                  borderColor: '#fecaca',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
                title="Desvincular el enlace actual para conectar una nueva hoja de Google Sheets"
              >
                <Unlink size={13} /> Desvincular Enlace
              </button>
            </div>
          </div>
        )}

        {syncMsg && (
          <div style={{
            marginTop: '10px',
            fontSize: '12px',
            fontWeight: 700,
            color: syncMsg.startsWith('Error') ? '#dc2626' : '#059669',
            background: syncMsg.startsWith('Error') ? '#fef2f2' : '#ecfdf5',
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${syncMsg.startsWith('Error') ? '#fecaca' : '#a7f3d0'}`
          }}>
            {syncMsg}
          </div>
        )}
      </div>

      {/* ─── 7 KPIS GENERALES DE SUPERVISIÓN CALLERS (TOTAL ACUMULADO + BOTÓN DIARIO CON POPOVER) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>

        {/* Helper: build pill button for a card */}
        {(() => {
          const makeCard = ({ id, title, icon, bg, border, topBorder, color, accentBg, accentBorder, value, subtitle, label, field, extra }) => {
            const isRightSide = ['skool', 'seguimiento', 'citas'].includes(id);
            const isOpen = openCardDetail === id;

            return (
              <div key={id} className="glass-panel" style={{
                padding: '20px 22px',
                background: bg,
                border: `1px solid ${border}`,
                borderTop: `3px solid ${topBorder}`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {title}
                  </span>
                  <div style={{ padding: '7px', borderRadius: '8px', background: accentBg, color: topBorder }}>
                    {icon}
                  </div>
                </div>
                <div style={{ fontSize: '30px', fontWeight: 900, color: topBorder, lineHeight: 1.1 }}>
                  {value}
                </div>

                {/* Pill button + Popover */}
                {dailyHistoryList.length > 0 && (
                  <div style={{ marginTop: '8px', position: 'relative' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenCardDetail(prev => prev === id ? null : id);
                      }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        background: accentBg,
                        border: `1px solid ${accentBorder}`,
                        color: color,
                        borderRadius: '6px', padding: '3px 8px',
                        fontSize: '10.5px', fontWeight: 800, cursor: 'pointer',
                        boxShadow: isOpen ? `0 0 0 2px ${accentBorder}` : 'none'
                      }}
                      title={`Ver historial diario de ${title}`}
                    >
                      {label}: {Number(dailyHistoryList[0]?.[field] || 0).toLocaleString()}
                      <Info size={11} color={color} />
                    </button>

                    {isOpen && (
                      <div
                        ref={cardPopoverRef}
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 8px)',
                          ...(isRightSide ? { right: 0 } : { left: 0 }),
                          zIndex: 100,
                          width: '275px',
                          maxWidth: '85vw',
                          background: '#ffffff',
                          border: `1.5px solid ${accentBorder}`,
                          borderRadius: '12px',
                          boxShadow: '0 12px 30px -5px rgba(0,0,0,0.18)',
                          padding: '14px',
                          boxSizing: 'border-box',
                          animation: 'fadeIn 0.15s ease',
                          textAlign: 'left'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', color: topBorder, fontWeight: 800, fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Info size={13} color={topBorder} />
                            <span>Historial Diario — {title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOpenCardDetail(null)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', fontWeight: 800, padding: '0 4px' }}
                          >
                            ✕
                          </button>
                        </div>

                        <div style={{ maxHeight: '180px', overflowY: 'auto', fontSize: '11px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#64748b', fontWeight: 700 }}>Fecha</th>
                                <th style={{ textAlign: 'right', padding: '4px 6px', color: topBorder, fontWeight: 700 }}>Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dailyHistoryList.slice(0, 14).map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i === 0 ? `${accentBg}` : 'transparent' }}>
                                  <td style={{ padding: '4px 6px', color: '#334155', fontWeight: i === 0 ? 800 : 600 }}>
                                    {row.fecha} {i === 0 && <span style={{ fontSize: '9.5px', background: accentBorder, color, padding: '1px 4px', borderRadius: '3px', fontWeight: 800, marginLeft: '3px' }}>Ayer</span>}
                                  </td>
                                  <td style={{ padding: '4px 6px', textAlign: 'right', color: topBorder, fontWeight: i === 0 ? 900 : 700 }}>
                                    {Number(row[field] || 0).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '10px', color: '#94a3b8', textAlign: 'right' }}>Haz clic afuera para cerrar</div>
                      </div>
                    )}
                  </div>
                )}

                {extra && (
                  <div style={{ fontSize: '12px', color: color, fontWeight: 700, marginTop: '4px' }}>
                    {extra}
                  </div>
                )}
                {subtitle && !dailyHistoryList.length && (
                  <div style={{ fontSize: '12px', color: color, fontWeight: 700, marginTop: '4px' }}>
                    {subtitle}
                  </div>
                )}
              </div>
            );
          };

          return [
            makeCard({
              id: 'llamadas', title: 'Llamadas Totales', icon: <PhoneCall size={18} />,
              bg: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              border: '#e2e8f0', topBorder: '#2563eb', color: '#1e3a8a',
              accentBg: '#eff6ff', accentBorder: '#bfdbfe',
              value: totalLlamadas.toLocaleString(),
              label: 'Ayer', field: 'llamadasDiarias',
              subtitle: 'Intentos realizados',
              extra: null
            }),
            makeCard({
              id: 'contactos', title: 'Contactos Únicos', icon: <UserCheck size={18} />,
              bg: 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)',
              border: '#bbf7d0', topBorder: '#059669', color: '#047857',
              accentBg: '#ecfdf5', accentBorder: '#a7f3d0',
              value: totalContactosUnicos.toLocaleString(),
              label: 'Ayer', field: 'contactosUnicos',
              subtitle: 'Primer Contacto',
              extra: null
            }),
            /* Fuentes — botón pill con popover de desglose por fuente */
            <div key="fuentes" className="glass-panel" style={{
              padding: '20px 22px',
              background: 'linear-gradient(145deg, #ffffff 0%, #f0f9ff 100%)',
              border: '1px solid #bae6fd',
              borderTop: '3px solid #0284c7',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Fuentes de Contacto
                </span>
                <div style={{ padding: '7px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7' }}>
                  <Compass size={18} />
                </div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: 900, color: '#0284c7', lineHeight: 1.1 }}>
                {sourceStats.totalWithSource.toLocaleString()}
              </div>

              {/* Pill button — shows source breakdown popover */}
              {Object.keys(sourceStats.counts).length > 0 && (
                <div style={{ marginTop: '8px', position: 'relative' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenCardDetail(prev => prev === 'fuentes' ? null : 'fuentes');
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      background: '#e0f2fe', border: '1px solid #bae6fd',
                      color: '#0369a1', borderRadius: '6px', padding: '3px 8px',
                      fontSize: '10.5px', fontWeight: 800, cursor: 'pointer',
                      boxShadow: openCardDetail === 'fuentes' ? '0 0 0 2px #bae6fd' : 'none'
                    }}
                    title="Ver desglose por fuente"
                  >
                    Desglose <Info size={11} color="#0369a1" />
                  </button>

                  {openCardDetail === 'fuentes' && (
                    <div
                      ref={cardPopoverRef}
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        left: 0,
                        zIndex: 100,
                        width: '275px',
                        maxWidth: '85vw',
                        background: '#ffffff',
                        border: '1.5px solid #bae6fd',
                        borderRadius: '12px',
                        boxShadow: '0 12px 30px -5px rgba(0,0,0,0.18)',
                        padding: '14px',
                        boxSizing: 'border-box',
                        animation: 'fadeIn 0.15s ease',
                        textAlign: 'left'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', color: '#0284c7', fontWeight: 800, fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Info size={13} color="#0284c7" />
                          <span>Desglose por Fuente</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpenCardDetail(null)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', fontWeight: 800, padding: '0 4px' }}
                        >
                          ✕
                        </button>
                      </div>

                      {Object.keys(sourceStats.counts).length === 0 ? (
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Sin datos de fuentes</p>
                      ) : (
                        <div style={{ fontSize: '11px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#64748b', fontWeight: 700 }}>Fuente</th>
                                <th style={{ textAlign: 'right', padding: '4px 6px', color: '#0284c7', fontWeight: 700 }}>Contactos</th>
                                <th style={{ textAlign: 'right', padding: '4px 6px', color: '#64748b', fontWeight: 700 }}>%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(sourceStats.counts)
                                .sort(([,a],[,b]) => b - a)
                                .map(([srcName, count], i) => {
                                  const pct = sourceStats.totalWithSource > 0 ? Math.round((count / sourceStats.totalWithSource) * 100) : 0;
                                  const isTop = i === 0;
                                  return (
                                    <tr key={srcName} style={{ borderBottom: '1px solid #f1f5f9', background: isTop ? '#e0f2fe50' : 'transparent' }}>
                                      <td style={{ padding: '4px 6px', color: '#334155', fontWeight: isTop ? 800 : 600 }}>{srcName}</td>
                                      <td style={{ padding: '4px 6px', textAlign: 'right', color: '#0284c7', fontWeight: isTop ? 900 : 700 }}>{count.toLocaleString()}</td>
                                      <td style={{ padding: '4px 6px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>{pct}%</td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                          <div style={{ marginTop: '8px', fontSize: '10px', color: '#64748b', fontWeight: 700, textAlign: 'right' }}>
                            Total: {sourceStats.totalWithSource.toLocaleString()} contactos con fuente
                          </div>
                        </div>
                      )}
                      <div style={{ marginTop: '8px', fontSize: '10px', color: '#94a3b8', textAlign: 'right' }}>Haz clic afuera para cerrar</div>
                    </div>
                  )}
                </div>
              )}
            </div>,
            makeCard({
              id: 'mensajes', title: 'Mensajes 1-1', icon: <MessageSquare size={18} />,
              bg: 'linear-gradient(145deg, #ffffff 0%, #faf5ff 100%)',
              border: '#e9d5ff', topBorder: '#7c3aed', color: '#6d28d9',
              accentBg: '#f5f3ff', accentBorder: '#ddd6fe',
              value: totalMensajes1a1.toLocaleString(),
              label: 'Ayer', field: 'mensajesEnviados',
              subtitle: 'Vía WhatsApp',
              extra: null
            }),
            makeCard({
              id: 'skool', title: 'Comunidad Skool', icon: <Users size={18} />,
              bg: 'linear-gradient(145deg, #ffffff 0%, #ecfeff 100%)',
              border: '#a5f3fc', topBorder: '#0891b2', color: '#0e7490',
              accentBg: '#ecfeff', accentBorder: '#a5f3fc',
              value: totalComunidadSkool.toLocaleString(),
              label: 'Ayer', field: 'comunidadSkool',
              subtitle: 'Invitaciones',
              extra: null
            }),
            makeCard({
              id: 'seguimiento', title: 'En Seguimiento', icon: <AlertTriangle size={18} />,
              bg: 'linear-gradient(145deg, #ffffff 0%, #fffbeb 100%)',
              border: '#fde68a', topBorder: '#d97706', color: '#b45309',
              accentBg: '#fffbeb', accentBorder: '#fde68a',
              value: totalSeguimiento.toLocaleString(),
              label: 'Ayer', field: 'enSeguimiento',
              subtitle: 'Mostraron Interés',
              extra: null
            }),
            makeCard({
              id: 'citas', title: 'Citas Agendadas', icon: <CalendarCheck size={18} />,
              bg: 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)',
              border: '#86efac', topBorder: '#16a34a', color: '#15803d',
              accentBg: '#f0fdf4', accentBorder: '#86efac',
              value: totalCitas.toLocaleString(),
              label: 'Ayer', field: 'citasAgendadas',
              subtitle: 'Reuniones confirmadas',
              extra: null
            }),
          ];
        })()}

      </div>

      {/* ─── TABLA DE REGISTROS DIARIOS DE CALLERS (LÍMITE 20 CON FILTRO POR FUENTE Y ESTADO) ─── */}
      <div className="glass-panel" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15.5px', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PhoneCall size={16} color="#7c3aed" />
              Registro Diario de Llamadas & Respuestas
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>({filteredCaller.length} prospectos)</span>
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {activeCaller === 'Todos' ? 'Mostrando registros combinados de todos los Callers' : `Mostrando registros asignados a ${callersData[activeCaller]?.name || activeCaller}`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Buscador */}
            <div className="search-input-futuristic" style={{ width: '220px' }}>
              <Search size={14} color="#64748b" />
              <input
                type="text"
                placeholder="Buscar prospecto, fuente o nota..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* Filtro de Fuente (Pauta, Orgánico, Linkedin, etc.) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Fuente:</span>
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {allDistinctSources.map(src => (
                  <option key={src} value={src}>
                    {src === 'Todas' ? 'Todas las Fuentes' : src}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Estado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Estado:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="prospecting-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>Caller</th>
                <th style={{ textAlign: 'center' }}>Fecha</th>
                <th style={{ textAlign: 'center' }}>Nombre del Prospecto</th>
                <th style={{ textAlign: 'center' }}>Fuente</th>
                <th style={{ textAlign: 'center' }}>Respuesta / Estado</th>
                <th style={{ textAlign: 'center' }}>Intentos</th>
                <th style={{ textAlign: 'center' }}>Mensajes 1-1</th>
                <th style={{ textAlign: 'center' }}>Comunidad Skool</th>
                <th style={{ textAlign: 'center' }}>Contexto & Notas</th>
                <th style={{ textAlign: 'center' }}>Re-contactar</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCallerRecords.map((row, idx) => {
                const noteClean = (row.contexto || '').trim();
                const isNoteEmpty = !noteClean || noteClean.toLowerCase().includes('sin notas') || noteClean === '—';

                return (
                  <tr key={row.id || idx}>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#7c3aed', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed', fontWeight: 800 }}>
                          {formatShortCallerName(row._caller)}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>{row.fecha || '18-ago-26'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>{row.nombre || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {getFuenteBadge(row.fuente, row.nombre)}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {getStatusBadge(row.respuesta)}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#2563eb', fontSize: '13px' }}>{row.intentos || 1}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 800, color: row.mensajes1a1 === 'Sí' ? '#059669' : '#94a3b8' }}>
                        {row.mensajes1a1 || 'No'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 800, color: row.comunidadSkool === 'Sí' ? '#059669' : '#94a3b8' }}>
                        {row.comunidadSkool || 'No'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '12px', color: '#475569', maxWidth: '280px', whiteSpace: 'normal' }}>
                      {isNoteEmpty ? '' : noteClean}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: row.fechaRecontactar ? '#d97706' : '#94a3b8' }}>
                      {row.fechaRecontactar || '—'}
                    </td>
                  </tr>
                );
              })}
              {filteredCaller.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No se encontraron registros de llamadas con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación de 20 registros */}
        {filteredCaller.length > rowsPerPage && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, filteredCaller.length)} de {filteredCaller.length} registros
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-cyber-ghost"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                Anterior
              </button>
              <span style={{ fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', padding: '0 8px', color: '#0f172a' }}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                className="btn-cyber-ghost"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
