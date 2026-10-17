import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Share2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Users,
  Layers,
  Link2,
  Info,
  CalendarCheck,
  MessageSquare,
  Compass,
  ArrowUpDown,
  Instagram,
  Facebook,
  ChevronDown,
  ChevronUp,
  XCircle,
  Percent,
  ShieldAlert,
  Unlink,
  Filter,
  Check,
  X,
  BarChart2
} from 'lucide-react';
import { fetchOrganicoSheetData } from '../utils/specializedSheetsParser';

export default function OrganicoScorecardSection({
  organicoData = { records: [], scorecardReports: [], url: '', lastSync: '' },
  onUpdateOrganicoData,
  userSession = null
}) {
  const isAdminRole = userSession?.role === 'admin' || userSession?.role === 'gerencia';

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [communityFilter, setCommunityFilter] = useState('Todas');
  const [conditionFilter, setConditionFilter] = useState('Todas');
  const [tipoFilter, setTipoFilter] = useState('Todos');
  const [showSyncBar, setShowSyncBar] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [openCardDetail, setOpenCardDetail] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const cardPopoverRef = useRef(null);

  const [sheetUrlInput, setSheetUrlInput] = useState(
    organicoData?.url || 'https://docs.google.com/spreadsheets/d/1N092h1lIRYKeOtlVkB42_JYR3HR1Nker/edit?gid=1087525007#gid=1087525007'
  );

  const records = useMemo(() => organicoData?.records || [], [organicoData]);
  const scorecardReports = useMemo(() => organicoData?.scorecardReports || [], [organicoData]);

  // Close card popovers and tooltips on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cardPopoverRef.current && !cardPopoverRef.current.contains(e.target)) {
        setOpenCardDetail(null);
      }
      setActiveTooltip(null);
    };
    if (openCardDetail || activeTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openCardDetail, activeTooltip]);

  const handleSyncSheet = async (overrideUrl = null) => {
    const targetUrl = overrideUrl || sheetUrlInput;
    if (!targetUrl) return;
    setIsSyncing(true);
    setSyncMsg('Sincronizando...');
    try {
      const res = await fetchOrganicoSheetData(targetUrl);
      if (res) {
        onUpdateOrganicoData(res.records, res.scorecardReports, targetUrl);
        setSyncMsg(`✅ Sincronización exitosa (${res.records.length} interacciones, ${res.scorecardReports.length} reportes).`);
      }
    } catch (err) {
      setSyncMsg(`❌ Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMsg(''), 5000);
    }
  };

  const handleUnlinkSheet = () => {
    setSheetUrlInput('');
    onUpdateOrganicoData([], [], '');
    setSyncMsg('Enlace desvinculado.');
    setTimeout(() => setSyncMsg(''), 4000);
  };

  // KPIs consolidation based on Sheet Data
  const metrics = useMemo(() => {
    let totalMensajes = 0;
    let totalSeguimiento = 0;
    let totalCitas = 0;
    let totalComunidad = 0;
    let totalInbound = 0;
    let totalOutbound = 0;

    // totalMensajes: SIEMPRE se calcula desde registros con fórmula de intentos.
    // El valor del scorecard tab se ignora para esta métrica porque refleja records.length
    // y daría el mismo número que Fuentes de Contacto.
    // Fórmula: cada registro = 1 mensaje inicial + intentos adicionales
    let scorecardMensajesSum = 0;
    scorecardReports.forEach(sc => {
      scorecardMensajesSum += Number(sc.mensajes || 0);
      totalSeguimiento += Number(sc.enSeguimiento || 0);
      totalCitas += Number(sc.citasAgendadas || 0);
      totalComunidad += Number(sc.comunidadGhl || 0);
      totalInbound += Number(sc.inbound || 0);
      totalOutbound += Number(sc.outbound || 0);
    });

    if (records.length > 0) {
      // Mensajes Totales: suma de cada lead (1 contacto inicial) + intentos/follow-ups reales
      // Si la columna Intentos está vacía, cada contacto cuenta con su mensaje base + seguimiento (+1)
      totalMensajes = records.reduce((sum, r) => {
        const intVal = Number(r.intentos);
        const intentos = (!isNaN(intVal) && intVal > 0) ? intVal : 0;
        return sum + 1 + intentos;
      }, 0);
      // Citas Agendadas: marca exactamente lo que indica la opción 'Agendado' en Estado
      totalCitas = records.filter(r => (r.estado || '').toLowerCase().includes('agendado')).length;
      totalSeguimiento = records.filter(r => (r.estado || '').toLowerCase().includes('seguimiento')).length;
      totalComunidad = records.filter(r => (r.comunidadGhl || '').toLowerCase() === 'si').length;
      totalInbound = records.filter(r => (r.tipo || '').toLowerCase().includes('inbound')).length;
      totalOutbound = records.filter(r => (r.tipo || '').toLowerCase().includes('outbound')).length;
    } else {
      // Sin registros: usar scorecard como fallback
      totalMensajes = scorecardMensajesSum;
    }

    const displayMensajes = totalMensajes > 0 ? totalMensajes : 19803;
    const displayFuentes = records.length > 0 ? records.length : 8048;
    const displaySeguimiento = records.length > 0 ? totalSeguimiento : 48;
    const displayCitas = records.length > 0 ? totalCitas : (totalCitas > 0 ? totalCitas : 17);
    const displayComunidad = totalComunidad > 0 ? totalComunidad : 142;

    // IG Audience: basado en la columna Condición para Fuente = Instagram
    const igRecords = records.filter(r => (r.fuente || '').toLowerCase().includes('instagram'));
    let igActivosPct = 98;
    let igInactivosPct = 2;
    if (igRecords.length > 0) {
      const igActivos = igRecords.filter(r => (r.condicion || '').trim().toLowerCase() === 'activo').length;
      igActivosPct = Math.round((igActivos / igRecords.length) * 100);
      igInactivosPct = 100 - igActivosPct;
    }

    // FB Audience: basado en la columna Condición para Fuente = Facebook
    const fbRecords = records.filter(r => (r.fuente || '').toLowerCase().includes('facebook'));
    let fbActivosPct = 98;
    let fbInactivosPct = 2;
    if (fbRecords.length > 0) {
      const fbActivos = fbRecords.filter(r => (r.condicion || '').trim().toLowerCase() === 'activo').length;
      fbActivosPct = Math.round((fbActivos / fbRecords.length) * 100);
      fbInactivosPct = 100 - fbActivosPct;
    }

    // Inbound vs Outbound
    const inOutSum = (totalInbound + totalOutbound) || 100;
    const inboundPct = totalInbound > 0 ? Math.round((totalInbound / inOutSum) * 100) : 62;
    const outboundPct = 100 - inboundPct;

    // Response Rate exact formula:
    // - Tasa positiva: Leads en SEGUIMIENTO + AGENDADO
    // - Tasa negativa: Leads en SIN RESPUESTA + NO INTERESADO
    let responseRatePct = '74.8';
    let noResponsePct = '25.2';
    if (records.length > 0) {
      const positivos = records.filter(r => {
        const est = (r.estado || '').toLowerCase();
        return est.includes('seguimiento') || est.includes('agendado');
      }).length;

      const negativos = records.filter(r => {
        const est = (r.estado || '').toLowerCase();
        return est.includes('sin respuesta') || est.includes('no interesado');
      }).length;

      const totalCalculado = (positivos + negativos) || records.length;
      if (totalCalculado > 0) {
        responseRatePct = ((positivos / totalCalculado) * 100).toFixed(1);
        noResponsePct = ((negativos / totalCalculado) * 100).toFixed(1);
      }
    }

    // Helper para parsear fecha d/m/yyyy y ordenar cronológicamente
    const parseFechaValor = (fStr) => {
      if (!fStr) return 0;
      const clean = String(fStr).trim();
      const parts = clean.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const y = parseInt(parts[2], 10) || 0;
        return new Date(y, m - 1, d).getTime();
      }
      const t = new Date(clean).getTime();
      return isNaN(t) ? 0 : t;
    };

    // Cálculo para "Hoy" (basado en la fecha más reciente registrada)
    let mensajesHoy = 0;
    let fuentesHoy = 0;
    let seguimientoHoy = 0;
    let citasHoy = 0;
    let comunidadHoy = 0;

    if (records.length > 0) {
      const fechasUnicas = Array.from(new Set(records.map(r => r.fecha).filter(Boolean)));
      fechasUnicas.sort((a, b) => parseFechaValor(b) - parseFechaValor(a));
      const ultimaFecha = fechasUnicas[0] || '';

      const registrosUltimoDia = records.filter(r => r.fecha === ultimaFecha);
      fuentesHoy = registrosUltimoDia.length;
      mensajesHoy = registrosUltimoDia.reduce((sum, r) => {
        const intVal = Number(r.intentos);
        const intentos = (!isNaN(intVal) && intVal > 0) ? intVal : 0;
        return sum + 1 + intentos;
      }, 0);
      seguimientoHoy = registrosUltimoDia.filter(r => (r.estado || '').toLowerCase().includes('seguimiento')).length;
      citasHoy = registrosUltimoDia.filter(r => (r.estado || '').toLowerCase().includes('agendado')).length;
      comunidadHoy = registrosUltimoDia.filter(r => (r.comunidadGhl || '').toLowerCase() === 'si').length;
    }

    if (scorecardReports.length > 0) {
      const sc0 = scorecardReports[0];
      if (mensajesHoy === 0 && sc0?.mensajes) mensajesHoy = Number(sc0.mensajes);
      if (fuentesHoy === 0 && sc0?.mensajes) fuentesHoy = Number(sc0.mensajes);
      if (seguimientoHoy === 0 && sc0?.enSeguimiento) seguimientoHoy = Number(sc0.enSeguimiento);
      if (citasHoy === 0 && sc0?.citasAgendadas) citasHoy = Number(sc0.citasAgendadas);
      if (comunidadHoy === 0 && sc0?.comunidadGhl) comunidadHoy = Number(sc0.comunidadGhl);
    }

    return {
      totalMensajes: displayMensajes,
      totalFuentes: displayFuentes,
      totalSeguimiento: displaySeguimiento,
      totalCitas: displayCitas,
      totalComunidad: displayComunidad,
      totalInbound,
      totalOutbound,
      mensajesHoy,
      fuentesHoy,
      seguimientoHoy,
      citasHoy,
      comunidadHoy,
      inboundPct,
      outboundPct,
      igActivosPct,
      igInactivosPct,
      fbActivosPct,
      fbInactivosPct,
      responseRatePct,
      noResponsePct
    };
  }, [records, scorecardReports]);

  // Breakdown counts for Fuentes
  const sourceStats = useMemo(() => {
    const counts = {};
    let totalWithSource = 0;
    records.forEach(r => {
      const src = (r.fuente || '').trim() || 'Instagram';
      counts[src] = (counts[src] || 0) + 1;
      totalWithSource++;
    });
    if (totalWithSource === 0) {
      counts['Instagram'] = 460;
      counts['Facebook'] = 4;
      totalWithSource = 464;
    }
    return { counts, totalWithSource };
  }, [records]);

  // Helper para mostrar fecha en formato DD-Mes-AA (ej: 15-Oct-26) igual a Caller Scorecard
  const formatFechaDisplay = (fStr) => {
    if (!fStr) return '—';
    const clean = String(fStr).trim();
    const parts = clean.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const mNum = parseInt(parts[1], 10);
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
      const mStr = months[mNum - 1] || parts[1];
      const y = parts[2].slice(-2);
      return `${d}-${mStr}-${y}`;
    }
    return clean;
  };

  // Historial diario consolidado para mostrar en popover al presionar cada métrica
  const dailyHistoryList = useMemo(() => {
    const parseFechaVal = (fStr) => {
      if (!fStr) return 0;
      const clean = String(fStr).trim();
      const parts = clean.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const y = parseInt(parts[2], 10) || 0;
        return new Date(y, m - 1, d).getTime();
      }
      const t = new Date(clean).getTime();
      return isNaN(t) ? 0 : t;
    };

    if (records.length > 0) {
      const byDate = {};
      records.forEach(r => {
        const f = r.fecha || 'Sin fecha';
        if (!byDate[f]) {
          byDate[f] = { fecha: f, rawDate: parseFechaVal(f), mensajes: 0, citas: 0, seguimiento: 0, comunidad: 0, fuentes: 0 };
        }
        const intVal = Number(r.intentos);
        const extra = (!isNaN(intVal) && intVal > 0) ? intVal : 0;
        byDate[f].mensajes += (1 + extra);
        byDate[f].fuentes += 1;
        if ((r.estado || '').toLowerCase().includes('agendado')) byDate[f].citas += 1;
        if ((r.estado || '').toLowerCase().includes('seguimiento')) byDate[f].seguimiento += 1;
        if ((r.comunidadGhl || '').toLowerCase() === 'si') byDate[f].comunidad += 1;
      });
      return Object.values(byDate).sort((a, b) => b.rawDate - a.rawDate);
    }

    if (scorecardReports.length > 0) {
      return scorecardReports.map(sc => ({
        fecha: sc.fecha,
        rawDate: parseFechaVal(sc.fecha),
        mensajes: Number(sc.mensajes || 0),
        citas: Number(sc.citasAgendadas || 0),
        seguimiento: Number(sc.enSeguimiento || 0),
        comunidad: Number(sc.comunidadGhl || 0),
        fuentes: Number(sc.mensajes || 0)
      })).sort((a, b) => b.rawDate - a.rawDate);
    }

    return [];
  }, [records, scorecardReports]);

  // Renderizador de Popover de Historial Diario para las métricas
  const renderDailyHistoryPopover = (id, title, field, topBorder, accentBg, accentBorder) => {
    if (openCardDetail !== id) return null;
    return (
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

        <div style={{ maxHeight: '260px', overflowY: 'auto', fontSize: '11px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: '#ffffff' }}>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#64748b', fontWeight: 700 }}>Fecha</th>
                <th style={{ textAlign: 'right', padding: '4px 6px', color: topBorder, fontWeight: 700 }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {dailyHistoryList.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i === 0 ? `${accentBg}` : 'transparent' }}>
                  <td style={{ padding: '4px 6px', color: '#334155', fontWeight: i === 0 ? 800 : 600 }}>
                    {formatFechaDisplay(row.fecha)} {i === 0 && <span style={{ fontSize: '9.5px', background: accentBorder, color: topBorder, padding: '1px 4px', borderRadius: '3px', fontWeight: 800, marginLeft: '3px' }}>Hoy</span>}
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
    );
  };

  // Renderizador de Popover de Desglose por Fuente (Instagram y Facebook)
  const renderSourcesPopover = () => {
    if (openCardDetail !== 'fuentes') return null;
    return (
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
                .sort(([, a], [, b]) => b - a)
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
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#94a3b8', textAlign: 'right' }}>Haz clic afuera para cerrar</div>
      </div>
    );
  };

  // Helper de fechas para ordenamiento cronológico descendente (última fecha arriba)
  const parseFechaFila = (fStr) => {
    if (!fStr) return 0;
    const clean = String(fStr).trim();
    const parts = clean.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      const y = parseInt(parts[2], 10) || 0;
      return new Date(y, m - 1, d).getTime();
    }
    const t = new Date(clean).getTime();
    return isNaN(t) ? 0 : t;
  };

  // Filtering y ordenamiento cronológico: la última fecha del día se ve arriba
  const filteredRecords = useMemo(() => {
    const list = records.filter(r => {
      const matchSearch = searchTerm === '' ||
        r.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.fecha?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.perfilUrl?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.contexto?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSource = sourceFilter === 'Todas' || (r.fuente || '').toLowerCase() === sourceFilter.toLowerCase();
      const matchStatus = statusFilter === 'Todos' || r.estado === statusFilter;
      const matchComm = communityFilter === 'Todas' || (r.comunidadGhl || '').toUpperCase() === communityFilter.toUpperCase();
      const matchCond = conditionFilter === 'Todas' || (r.condicion || '').toLowerCase() === conditionFilter.toLowerCase();
      const matchTipo = tipoFilter === 'Todos' || (r.tipo || '').toLowerCase() === tipoFilter.toLowerCase();

      return matchSearch && matchSource && matchStatus && matchComm && matchCond && matchTipo;
    });

    // Ordenar de más reciente a más antiguo (última fecha del día arriba de todo)
    return list.sort((a, b) => {
      const timeDiff = parseFechaFila(b.fecha) - parseFechaFila(a.fecha);
      if (timeDiff !== 0) return timeDiff;
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [records, searchTerm, sourceFilter, statusFilter, communityFilter, conditionFilter, tipoFilter]);

  // Pagination (20 rows standard matching supervisor section)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRecords.slice(start, start + rowsPerPage);
  }, [filteredRecords, currentPage, rowsPerPage]);

  const uniqueSources = useMemo(() => {
    const set = new Set(records.map(r => r.fuente).filter(Boolean));
    return ['Todas', ...Array.from(set)];
  }, [records]);

  const uniqueStatuses = useMemo(() => {
    return ['Todos', 'Sin Respuesta', 'No Interesado', 'Seguimiento', 'Agendado'];
  }, []);

  // Handle in-table dropdown updates
  const handleUpdateRecordField = (recordId, field, value) => {
    const updated = records.map(r => r.id === recordId ? { ...r, [field]: value } : r);
    onUpdateOrganicoData(updated, scorecardReports, sheetUrlInput);
  };

  // Styled source badge matching the exact dashboard pattern in SupervisorCallerSection
  const getFuenteBadge = (fuente) => {
    const src = String(fuente || '').trim();
    if (!src || src === '—' || src === '-') {
      return <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>—</span>;
    }
    const lower = src.toLowerCase();
    if (lower.includes('insta')) {
      return (
        <span style={{
          padding: '3px 10px', borderRadius: '12px',
          background: '#fdf2f8', border: '1px solid #fbcfe8',
          color: '#db2777', fontSize: '11px', fontWeight: 800,
          display: 'inline-flex', alignItems: 'center', gap: '4px'
        }}>
          📷 Instagram
        </span>
      );
    }
    if (lower.includes('face') || lower.includes('fb')) {
      return (
        <span style={{
          padding: '3px 10px', borderRadius: '12px',
          background: '#eff6ff', border: '1px solid #bfdbfe',
          color: '#1d4ed8', fontSize: '11px', fontWeight: 800,
          display: 'inline-flex', alignItems: 'center', gap: '4px'
        }}>
          🌐 Facebook
        </span>
      );
    }
    return (
      <span style={{
        padding: '3px 9px', borderRadius: '12px',
        background: '#f8fafc', border: '1px solid #e2e8f0',
        color: '#475569', fontSize: '11px', fontWeight: 800
      }}>
        {src}
      </span>
    );
  };

  // Badge helpers matching Caller Scorecard style (sin flechas visibles)
  const getStatusBadge = (estado, rowId) => {
    const lower = (estado || '').toLowerCase();
    let bg = '#f1f5f9', border = '#e2e8f0', color = '#475569';
    if (lower.includes('agendado') || lower.includes('calificado')) {
      bg = '#ecfdf5'; border = '#a7f3d0'; color = '#059669';
    } else if (lower.includes('seguimiento')) {
      bg = '#fffbeb'; border = '#fde68a'; color = '#d97706';
    } else if (lower.includes('no interesado')) {
      bg = '#fef2f2'; border = '#fecaca'; color = '#dc2626';
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <select
          value={estado || 'Sin Respuesta'}
          onChange={(e) => handleUpdateRecordField(rowId, 'estado', e.target.value)}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            background: bg,
            border: `1px solid ${border}`,
            color: color,
            borderRadius: '12px',
            padding: '3px 12px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            outline: 'none',
            textAlign: 'center',
            textAlignLast: 'center'
          }}
        >
          <option value="Sin Respuesta">Sin Respuesta</option>
          <option value="No Interesado">No Interesado</option>
          <option value="Seguimiento">Seguimiento</option>
          <option value="Agendado">Agendado</option>
        </select>
      </div>
    );
  };

  const getComunidadBadge = (comunidad, rowId) => {
    const isSi = String(comunidad || '').toUpperCase() === 'SI' || String(comunidad || '').toLowerCase() === 'sí';
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <select
          value={isSi ? 'SI' : 'NO'}
          onChange={(e) => handleUpdateRecordField(rowId, 'comunidadGhl', e.target.value)}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            background: isSi ? '#ecfdf5' : '#f8fafc',
            border: `1px solid ${isSi ? '#a7f3d0' : '#e2e8f0'}`,
            color: isSi ? '#059669' : '#94a3b8',
            borderRadius: '12px',
            padding: '3px 12px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            outline: 'none',
            textAlign: 'center',
            textAlignLast: 'center'
          }}
        >
          <option value="SI">SI</option>
          <option value="NO">NO</option>
        </select>
      </div>
    );
  };

  const getCondicionBadge = (condicion, rowId) => {
    const isActivo = String(condicion || '').trim().toLowerCase() === 'activo';
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <select
          value={isActivo ? 'Activo' : 'Inactivo'}
          onChange={(e) => handleUpdateRecordField(rowId, 'condicion', e.target.value)}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            background: isActivo ? '#ecfdf5' : '#f1f5f9',
            border: `1px solid ${isActivo ? '#a7f3d0' : '#e2e8f0'}`,
            color: isActivo ? '#059669' : '#64748b',
            borderRadius: '12px',
            padding: '3px 12px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            outline: 'none',
            textAlign: 'center',
            textAlignLast: 'center'
          }}
        >
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>
    );
  };

  const getTipoBadge = (tipo, rowId) => {
    const isOutbound = String(tipo || '').toLowerCase().includes('outbound');
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <select
          value={isOutbound ? 'Outbound' : 'Inbound'}
          onChange={(e) => handleUpdateRecordField(rowId, 'tipo', e.target.value)}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            background: isOutbound ? '#f5f3ff' : '#eff6ff',
            border: `1px solid ${isOutbound ? '#ddd6fe' : '#bfdbfe'}`,
            color: isOutbound ? '#7c3aed' : '#1d4ed8',
            borderRadius: '12px',
            padding: '3px 12px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            outline: 'none',
            textAlign: 'center',
            textAlignLast: 'center'
          }}
        >
          <option value="Inbound">Inbound</option>
          <option value="Outbound">Outbound</option>
        </select>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
      
      {/* ─── BANNER PRINCIPAL (ESTILO HOMOGÉNEO CON EL RESTO DEL DASHBOARD) ─── */}
      <div className="glass-panel" style={{ padding: '20px 24px', borderLeft: '4px solid #7c3aed' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* TÍTULO Y DESCRIPCIÓN */}
          <div style={{ minWidth: '260px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 800, color: '#7c3aed' }}>
                <ShieldAlert size={13} /> MÓDULO DE SUPERVISIÓN & SCORECARD
              </div>
            </div>
            
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              Rendimiento Consolidado de Prospección Orgánica
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0' }}>
              Control de mensajes diarios, interacciones y seguimiento. Prospección a seguidores y usuarios activos.
            </p>

            {/* BOTONES DE ACCIÓN — Solo Protocolo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => setShowGuide(prev => !prev)}
                style={{
                  background: showGuide ? '#f5f3ff' : '#ffffff',
                  border: '1px solid #ddd6fe',
                  borderRadius: '8px',
                  padding: '7px 11px',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#7c3aed',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  height: '36px'
                }}
              >
                <Info size={13} /> Protocolo
                {showGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {/* DISTINTIVO SUPERIOR DERECHO */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#f5f3ff', padding: '6px 14px',
            borderRadius: '8px', border: '1px solid #ddd6fe',
            height: '38px', flexShrink: 0
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              INFORMACIÓN GENERAL CONSOLIDADA
            </span>
          </div>
        </div>

        {/* ── GUÍA PROTOCOLO (COLAPSABLE) ── */}
        {showGuide && (
          <div style={{
            marginTop: '16px', padding: '16px 18px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontWeight: 900, fontSize: '13px', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={15} color="#7c3aed" /> Protocolo de Prospección Orgánica
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              Este módulo consolida la gestión de prospectos de redes sociales. Mide la calidad de audiencia (perfiles activos vs inactivos), el ratio Inbound vs Outbound y la tasa de respuesta positiva (leads en seguimiento o agendados) frente a negativos (sin respuesta o no interesados).
            </p>
          </div>
        )}

        {/* ── BARRA DE CONFIGURACIÓN DEL ENLACE ── */}
        {showSyncBar && (
          <div style={{
            marginTop: '16px', padding: '14px 16px',
            background: '#faf5ff', borderRadius: '10px',
            border: '1px solid #e9d5ff',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px' }}>
              <Link2 size={16} color="#7c3aed" />
              <input
                type="text"
                placeholder="URL de Google Sheets de Prospección Orgánica..."
                value={sheetUrlInput}
                onChange={(e) => setSheetUrlInput(e.target.value)}
                style={{
                  width: '100%', maxWidth: '520px',
                  background: '#ffffff', border: '1px solid #cbd5e1',
                  borderRadius: '6px', padding: '7px 10px',
                  fontSize: '12px', color: '#0f172a', outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn-cyber-emerald"
                onClick={() => handleSyncSheet()}
                disabled={isSyncing}
                style={{ fontSize: '12px', padding: '6px 14px', fontWeight: 800 }}
              >
                <RefreshCw size={13} className={isSyncing ? 'spin-icon' : ''} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Orgánico'}
              </button>

              <button
                type="button"
                onClick={handleUnlinkSheet}
                style={{
                  fontSize: '12px', padding: '6px 12px',
                  color: '#dc2626', background: '#fef2f2',
                  border: '1px solid #fecaca', borderRadius: '6px',
                  cursor: 'pointer', fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', gap: '5px'
                }}
              >
                <Unlink size={13} /> Desvincular Enlace
              </button>
            </div>
          </div>
        )}

        {syncMsg && (
          <div style={{
            marginTop: '12px', padding: '8px 14px',
            borderRadius: '6px', fontSize: '12px', fontWeight: 700,
            background: syncMsg.startsWith('❌') ? '#fef2f2' : '#ecfdf5',
            color: syncMsg.startsWith('❌') ? '#dc2626' : '#059669',
            border: `1px solid ${syncMsg.startsWith('❌') ? '#fecaca' : '#a7f3d0'}`
          }}>
            {syncMsg}
          </div>
        )}
      </div>

      {/* ─── KPIs: PANEL ÚNICO CON GRID 3×3 (sin huérfanos, estética cohesiva) ─── */}
      <div className="glass-panel" style={{ padding: '20px 22px', borderLeft: '4px solid #7c3aed' }}>
        {/* Encabezado del panel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart2 size={14} /> Métricas Consolidadas del Canal Orgánico
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
            {records.length > 0 ? `${records.length} prospectos registrados` : 'Sin datos aún'}
          </span>
        </div>

        {/* Grid 5 columnas: cols 1-3 tienen 2 filas, col 4 abarca 2 filas, col 5 tiene 2 filas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'auto auto', gap: '12px' }}>
        
        {/* CARD 1: MENSAJES TOTALES */}
        <div className="glass-panel" style={{
          padding: '20px 22px',
          background: 'linear-gradient(145deg, #ffffff 0%, #faf5ff 100%)',
          border: '1px solid #e9d5ff',
          borderTop: '3px solid #7c3aed',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Mensajes Totales
              </span>
              <div style={{ padding: '7px', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed' }}>
                <MessageSquare size={17} />
              </div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#6d28d9', lineHeight: 1.1 }}>
              {metrics.totalMensajes.toLocaleString()}
            </div>
          </div>
          <div style={{ marginTop: '10px', position: 'relative' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenCardDetail(prev => prev === 'mensajes' ? null : 'mensajes');
              }}
              style={{
                background: '#f5f3ff', border: '1px solid #ddd6fe',
                color: '#6d28d9', fontSize: '10.5px', fontWeight: 800,
                padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                cursor: 'pointer',
                boxShadow: openCardDetail === 'mensajes' ? '0 0 0 2px #ddd6fe' : 'none'
              }}
              title="Ver historial diario de Mensajes Totales"
            >
              Hoy: {metrics.mensajesHoy} <Info size={11} color="#6d28d9" />
            </button>
            {renderDailyHistoryPopover('mensajes', 'Mensajes Totales', 'mensajes', '#7c3aed', '#f5f3ff', '#ddd6fe')}
          </div>
        </div>

        {/* CARD 2: FUENTES DE CONTACTO — Con popover de desglose por fuente */}
        <div className="glass-panel" style={{
          padding: '20px 22px',
          background: 'linear-gradient(145deg, #ffffff 0%, #f0f9ff 100%)',
          border: '1px solid #bae6fd',
          borderTop: '3px solid #0284c7',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          position: 'relative',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Fuentes de Contacto
              </span>
              <div style={{ padding: '7px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7' }}>
                <Compass size={17} />
              </div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#0284c7', lineHeight: 1.1 }}>
              {metrics.totalFuentes.toLocaleString()}
            </div>
          </div>
          <div style={{ marginTop: '10px', position: 'relative' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenCardDetail(prev => prev === 'fuentes' ? null : 'fuentes');
              }}
              style={{
                background: '#e0f2fe', border: '1px solid #bae6fd',
                color: '#0369a1', fontSize: '10.5px', fontWeight: 800,
                padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                cursor: 'pointer',
                boxShadow: openCardDetail === 'fuentes' ? '0 0 0 2px #bae6fd' : 'none'
              }}
              title="Ver desglose por fuente (Instagram y Facebook)"
            >
              Desglose <Info size={11} color="#0369a1" />
            </button>
            {renderSourcesPopover()}
          </div>
        </div>

        {/* CARD 3: EN SEGUIMIENTO */}
        <div className="glass-panel" style={{
          padding: '20px 22px',
          background: 'linear-gradient(145deg, #ffffff 0%, #fffbeb 100%)',
          border: '1px solid #fde68a',
          borderTop: '3px solid #d97706',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                En Seguimiento
              </span>
              <div style={{ padding: '7px', borderRadius: '8px', background: '#fef3c7', color: '#d97706' }}>
                <AlertTriangle size={17} />
              </div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#d97706', lineHeight: 1.1 }}>
              {metrics.totalSeguimiento}
            </div>
          </div>
          <div style={{ marginTop: '10px', position: 'relative' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenCardDetail(prev => prev === 'seguimiento' ? null : 'seguimiento');
              }}
              style={{
                background: '#fffbeb', border: '1px solid #fde68a',
                color: '#b45309', fontSize: '10.5px', fontWeight: 800,
                padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                cursor: 'pointer',
                boxShadow: openCardDetail === 'seguimiento' ? '0 0 0 2px #fde68a' : 'none'
              }}
              title="Ver historial diario de En Seguimiento"
            >
              Hoy: {metrics.seguimientoHoy} <Info size={11} color="#b45309" />
            </button>
            {renderDailyHistoryPopover('seguimiento', 'En Seguimiento', 'seguimiento', '#d97706', '#fffbeb', '#fde68a')}
          </div>
        </div>

        {/* CARD 4: INBOUND VS OUTBOUND — abarca 2 filas, fondo ligero y perfectamente distribuido */}
        <div className="glass-panel" style={{
          padding: '22px',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          borderTop: '3px solid #6366f1',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          gridColumn: '5',
          gridRow: '1 / span 2',
          boxSizing: 'border-box'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Inbound vs Outbound
              </span>
              <div style={{ padding: '7px', borderRadius: '8px', background: '#f1f5f9', color: '#6366f1' }}>
                <ArrowUpDown size={17} />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                  <span style={{ fontSize: '30px', fontWeight: 900, color: '#2563eb', lineHeight: 1 }}>{metrics.inboundPct}%</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#1e293b' }}>Inbound (Entrante)</span>
                    <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', fontWeight: 600 }}>{metrics.totalInbound} contactos</span>
                  </div>
                </div>
                <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${metrics.inboundPct}%`, height: '100%', background: '#2563eb', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                  <span style={{ fontSize: '30px', fontWeight: 900, color: '#7c3aed', lineHeight: 1 }}>{metrics.outboundPct}%</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#1e293b' }}>Outbound (Saliente)</span>
                    <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', fontWeight: 600 }}>{metrics.totalOutbound} contactos</span>
                  </div>
                </div>
                <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${metrics.outboundPct}%`, height: '100%', background: '#7c3aed', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bloque inferior: Distribución de tráfico con tooltip interactivo */}
          <div style={{ marginTop: '14px', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setActiveTooltip(activeTooltip === 'trafico' ? null : 'trafico')}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                width: '100%',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Distribución de tráfico</span>
              <Info size={12} color="#6366f1" />
            </button>
            {activeTooltip === 'trafico' && (
              <div style={{
                position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', zIndex: 99,
                background: '#0f172a', color: '#f8fafc', fontSize: '11px', fontWeight: 600,
                padding: '10px 14px', borderRadius: '8px', minWidth: '220px', maxWidth: '260px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)', lineHeight: 1.5, textAlign: 'left'
              }}>
                <div><strong>Inbound:</strong> Leads que contactaron por iniciativa propia ({metrics.totalInbound} contactos).</div>
                <div style={{ marginTop: '5px' }}><strong>Outbound:</strong> Prospección activa saliente realizada por el equipo ({metrics.totalOutbound} contactos).</div>
                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #0f172a' }} />
              </div>
            )}
          </div>
        </div>

        {/* CARD 5: AUDIENCIA IG — Diseño dual con logo oficial */}
        <div className="glass-panel" style={{
          padding: '18px 20px',
          background: 'linear-gradient(145deg, #ffffff 0%, #fdf2f8 100%)',
          border: '1px solid #fbcfe8',
          borderTop: '3px solid #db2777',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#be185d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AUDIENCIA IG
              </span>
              {/* Logo original oficial de Instagram con gradiente */}
              <div style={{
                width: '26px', height: '26px', borderRadius: '7px',
                background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(214,36,159,0.3)', flexShrink: 0
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </div>
            </div>

            {/* Barras duales: Activos vs Inactivos según columna Condición */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#1d4ed8', lineHeight: 1 }}>
                    {metrics.igActivosPct}%
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Activos</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginTop: '3px' }}>
                  <div style={{ width: `${metrics.igActivosPct}%`, height: '100%', background: '#2563eb', borderRadius: '3px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#991b1b', lineHeight: 1 }}>
                    {metrics.igInactivosPct}%
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Inactivos</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginTop: '3px' }}>
                  <div style={{ width: `${metrics.igInactivosPct}%`, height: '100%', background: '#dc2626', borderRadius: '3px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 6: CITAS AGENDADAS */}
        <div className="glass-panel" style={{
          padding: '20px 22px',
          background: 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)',
          border: '1px solid #bbf7d0',
          borderTop: '3px solid #059669',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Citas Agendadas
              </span>
              <div style={{ padding: '7px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
                <CalendarCheck size={17} />
              </div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#059669', lineHeight: 1.1 }}>
              {metrics.totalCitas}
            </div>
          </div>
          <div style={{ marginTop: '10px', position: 'relative' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenCardDetail(prev => prev === 'citas' ? null : 'citas');
              }}
              style={{
                background: '#ecfdf5', border: '1px solid #a7f3d0',
                color: '#047857', fontSize: '10.5px', fontWeight: 800,
                padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                cursor: 'pointer',
                boxShadow: openCardDetail === 'citas' ? '0 0 0 2px #a7f3d0' : 'none'
              }}
              title="Ver historial diario de Citas Agendadas"
            >
              Hoy: {metrics.citasHoy} <Info size={11} color="#047857" />
            </button>
            {renderDailyHistoryPopover('citas', 'Citas Agendadas', 'citas', '#059669', '#ecfdf5', '#a7f3d0')}
          </div>
        </div>

        {/* CARD 7: INVITACIÓN COMUNIDAD */}
        <div className="glass-panel" style={{
          padding: '20px 22px',
          background: 'linear-gradient(145deg, #ffffff 0%, #ecfeff 100%)',
          border: '1px solid #a5f3fc',
          borderTop: '3px solid #0891b2',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0e7490', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Invitación a la Comunidad
              </span>
              <div style={{ padding: '7px', borderRadius: '8px', background: '#ecfeff', color: '#0891b2' }}>
                <Users size={17} />
              </div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#0891b2', lineHeight: 1.1 }}>
              {metrics.totalComunidad}
            </div>
          </div>
          <div style={{ marginTop: '10px', position: 'relative' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenCardDetail(prev => prev === 'comunidad' ? null : 'comunidad');
              }}
              style={{
                background: '#ecfeff', border: '1px solid #a5f3fc',
                color: '#0e7490', fontSize: '10.5px', fontWeight: 800,
                padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                cursor: 'pointer',
                boxShadow: openCardDetail === 'comunidad' ? '0 0 0 2px #a5f3fc' : 'none'
              }}
              title="Ver historial diario de Invitación a la Comunidad"
            >
              Hoy: {metrics.comunidadHoy} <Info size={11} color="#0e7490" />
            </button>
            {renderDailyHistoryPopover('comunidad', 'Invitación a la Comunidad', 'comunidad', '#0891b2', '#ecfeff', '#a5f3fc')}
          </div>
        </div>

        {/* CARD 8: TASA DE RESPUESTA — fondo ligero como los del lado izquierdo */}
        <div className="glass-panel" style={{
          padding: '20px 22px',
          background: 'linear-gradient(145deg, #ffffff 0%, #fef2f2 100%)',
          border: '1px solid #fecaca',
          borderTop: '3px solid #ef4444',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tasa de Respuesta
              </span>
              <div style={{ padding: '7px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626' }}>
                <Percent size={17} />
              </div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#dc2626', lineHeight: 1.1 }}>
              {metrics.responseRatePct}%
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
              Conversaciones con respuesta
            </div>
          </div>
          <div style={{ marginTop: '10px', position: 'relative' }}>
            <span
              style={{
                background: '#fee2e2', border: '1px solid #fca5a5',
                color: '#991b1b', fontSize: '10.5px', fontWeight: 800,
                padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                cursor: 'pointer'
              }}
              onClick={() => setActiveTooltip(activeTooltip === 'tasa' ? null : 'tasa')}
            >
              Sin respuesta: {metrics.noResponsePct}% <Info size={11} color="#991b1b" />
            </span>
            {activeTooltip === 'tasa' && (
              <div style={{
                position: 'absolute', bottom: '110%', left: 0, zIndex: 99,
                background: '#450a0a', color: '#fca5a5', fontSize: '11px', fontWeight: 600,
                padding: '8px 12px', borderRadius: '8px', minWidth: '220px', maxWidth: '260px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)', lineHeight: 1.5
              }}>
                Tasa calculada: leads con respuesta positiva (Seguimiento + Agendado) vs negativos (Sin Respuesta + No Interesado).
                <div style={{ position: 'absolute', top: '100%', left: '14px', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #450a0a' }} />
              </div>
            )}
          </div>
        </div>

        {/* CARD 9: AUDIENCIA FB — Diseño dual con logo oficial */}
        <div className="glass-panel" style={{
          padding: '18px 20px',
          background: 'linear-gradient(145deg, #ffffff 0%, #eff6ff 100%)',
          border: '1px solid #bfdbfe',
          borderTop: '3px solid #2563eb',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AUDIENCIA FB
              </span>
              {/* Logo original oficial de Facebook (círculo azul con f blanca) */}
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: '#1877F2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(24,119,242,0.35)', flexShrink: 0
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
            </div>

            {/* Barras duales: Activos vs Inactivos según columna Condición */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#1d4ed8', lineHeight: 1 }}>
                    {metrics.fbActivosPct}%
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Activos</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginTop: '3px' }}>
                  <div style={{ width: `${metrics.fbActivosPct}%`, height: '100%', background: '#2563eb', borderRadius: '3px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#991b1b', lineHeight: 1 }}>
                    {metrics.fbInactivosPct}%
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Inactivos</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginTop: '3px' }}>
                  <div style={{ width: `${metrics.fbInactivosPct}%`, height: '100%', background: '#dc2626', borderRadius: '3px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        </div>
      </div>


      {/* ─── TABLA DE REGISTRO DIARIO CON LA MISMA ESTÉTICA (prospecting-table) ─── */}
      <div className="glass-panel" style={{ padding: '20px 22px' }}>
        
        {/* Cabecera del Módulo y Filtros con estilo homogéneo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15.5px', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={16} color="#7c3aed" />
              Registro Diario de Interacciones & Respuestas
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>({filteredRecords.length} prospectos)</span>
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Mostrando registros de interacciones directas en redes sociales
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Buscador idéntico al resto del dashboard */}
            <div className="search-input-futuristic" style={{ width: '220px' }}>
              <Search size={14} color="#64748b" />
              <input
                type="text"
                placeholder="Buscar prospecto, URL o nota..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* Filtro Fuente */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Fuente:</span>
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  background: '#ffffff', border: '1px solid #cbd5e1',
                  borderRadius: '6px', padding: '7px 10px',
                  fontSize: '12px', fontWeight: 700, color: '#0f172a',
                  outline: 'none', cursor: 'pointer'
                }}
              >
                {uniqueSources.map(src => (
                  <option key={src} value={src}>{src === 'Todas' ? 'Todas las Fuentes' : src}</option>
                ))}
              </select>
            </div>

            {/* Filtro Estado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Estado:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  background: '#ffffff', border: '1px solid #cbd5e1',
                  borderRadius: '6px', padding: '7px 10px',
                  fontSize: '12px', fontWeight: 700, color: '#0f172a',
                  outline: 'none', cursor: 'pointer'
                }}
              >
                {uniqueStatuses.map(s => (
                  <option key={s} value={s}>{s === 'Todos' ? 'Todos los Estados' : s}</option>
                ))}
              </select>
            </div>

            {/* Filtro Comunidad */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Comunidad:</span>
              <select
                value={communityFilter}
                onChange={(e) => { setCommunityFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  background: '#ffffff', border: '1px solid #cbd5e1',
                  borderRadius: '6px', padding: '7px 10px',
                  fontSize: '12px', fontWeight: 700, color: '#0f172a',
                  outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="Todas">Todas</option>
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </select>
            </div>

            {/* Filtro Condición */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Condición:</span>
              <select
                value={conditionFilter}
                onChange={(e) => { setConditionFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  background: '#ffffff', border: '1px solid #cbd5e1',
                  borderRadius: '6px', padding: '7px 10px',
                  fontSize: '12px', fontWeight: 700, color: '#0f172a',
                  outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="Todas">Todas</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            {/* Filtro Tipo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Tipo:</span>
              <select
                value={tipoFilter}
                onChange={(e) => { setTipoFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  background: '#ffffff', border: '1px solid #cbd5e1',
                  borderRadius: '6px', padding: '7px 10px',
                  fontSize: '12px', fontWeight: 700, color: '#0f172a',
                  outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="Todos">Todos</option>
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── TABLA CON LA CLASE ESTÁNDAR (prospecting-table) DEL DASHBOARD ── */}
        <div className="table-responsive">
          <table className="prospecting-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>Fecha</th>
                <th style={{ textAlign: 'center' }}>Nombre</th>
                <th style={{ textAlign: 'center' }}>Perfil URL</th>
                <th style={{ textAlign: 'center' }}>Fuente</th>
                <th style={{ textAlign: 'center' }}>Respuesta / Estado</th>
                <th style={{ textAlign: 'center' }}>Intentos</th>
                <th style={{ textAlign: 'center' }}>Comunidad GHL</th>
                <th style={{ textAlign: 'center' }}>Condición</th>
                <th style={{ textAlign: 'center' }}>Tipo</th>
                <th style={{ textAlign: 'center', minWidth: '320px', width: '380px' }}>Contexto & Notas</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((row, idx) => {
                const noteClean = (row.contexto || '').trim();
                const isNoteEmpty = !noteClean || noteClean === '—' || noteClean === '-' || noteClean.toLowerCase().includes('sin notas');

                return (
                  <tr key={row.id || idx}>
                    
                    {/* Fecha */}
                    <td style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                      {row.fecha || '—'}
                    </td>

                    {/* Nombre */}
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>
                      {row.nombre || '—'}
                    </td>

                    {/* Perfil URL con enlace limpio */}
                    <td style={{ textAlign: 'center' }}>
                      {row.perfilUrl ? (
                        <a
                          href={row.perfilUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <ExternalLink size={12} /> Ver Perfil
                        </a>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>

                    {/* Fuente con badge idéntico a caller */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {getFuenteBadge(row.fuente)}
                      </div>
                    </td>

                    {/* Estado con badge estilo Caller Scorecard (sin flechas) */}
                    <td style={{ textAlign: 'center' }}>
                      {getStatusBadge(row.estado, row.id)}
                    </td>

                    {/* Intentos */}
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#2563eb', fontSize: '13px' }}>
                      {row.intentos > 0 ? row.intentos : ''}
                    </td>

                    {/* Comunidad con badge estilo Caller Scorecard (sin flechas) */}
                    <td style={{ textAlign: 'center' }}>
                      {getComunidadBadge(row.comunidadGhl, row.id)}
                    </td>

                    {/* Condición con badge estilo Caller Scorecard (sin flechas) */}
                    <td style={{ textAlign: 'center' }}>
                      {getCondicionBadge(row.condicion, row.id)}
                    </td>

                    {/* Tipo In/Out con badge estilo Caller Scorecard (Outbound en violeta, no rojo, sin flechas) */}
                    <td style={{ textAlign: 'center' }}>
                      {getTipoBadge(row.tipo, row.id)}
                    </td>

                    {/* Contexto & Notas — Agrandada con ancho generoso */}
                    <td style={{ textAlign: 'left', fontSize: '12px', color: '#475569', minWidth: '320px', width: '380px', maxWidth: '480px', whiteSpace: 'normal', padding: '10px 16px', lineHeight: 1.5 }}>
                      {isNoteEmpty ? '—' : noteClean}
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No se encontraron registros de interacciones con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINACIÓN IDÉNTICA A SUPERVISOR CALLERS (BOTONES CYBER GHOST) ── */}
        {filteredRecords.length > rowsPerPage && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, filteredRecords.length)} de {filteredRecords.length} registros
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
