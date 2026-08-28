import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Zap, TrendingUp, Award, CalendarCheck, Globe, Bot,
  Flame, ShieldAlert, ShieldCheck, CheckCircle2, Sparkles, PhoneCall,
  Target, Users, MessageSquare, Activity, Tag, Calendar, RotateCcw,
  Phone, UserCheck, MessageCircle, Share2, HelpCircle, Info, Compass,
  ChevronDown, ChevronUp, Eye, X, FileSpreadsheet, Search, Filter
} from 'lucide-react';
import { matchesDateRange } from '../utils/security';
import { useAnimatedNumber } from '../utils/useAnimatedNumber';

/* ── Anillo Circular 3D Ultra Vistoso con Efecto de Carga Animado (ProgressRing3D) ── */
function ProgressRing({ pct, color = '#2563eb', size = 68, stroke = 7.5, children }) {
  const [animatedPct, setAnimatedPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimatedPct(pct), 60);
    return () => clearTimeout(t);
  }, [pct]);

  // Stable ID using useRef so it doesn't change on re-render
  const idRef = useRef(`ring-${color.replace(/[^a-zA-Z0-9]/g, '')}-${size}-${Math.floor(Math.random() * 90000) + 10000}`);
  const uniqueId = idRef.current;
  
  // Dynamic gradient configurations for ultra vibrant 3D look
  const getTheme = (cStr) => {
    const c = (cStr || '').toLowerCase();
    if (c.includes('059669') || c.includes('emerald') || c.includes('green') || c.includes('10b981') || c.includes('34d399')) {
      return {
        grad1: '#34d399',
        grad2: '#059669',
        grad3: '#047857',
        glowColor: 'rgba(5, 150, 105, 0.55)',
        headDot: '#6ee7b7',
        trackBg: '#e2e8f0',
        textColor: '#047857'
      };
    }
    if (c.includes('d97706') || c.includes('amber') || c.includes('f59e0b') || c.includes('fbbf24')) {
      return {
        grad1: '#fde68a',
        grad2: '#d97706',
        grad3: '#b45309',
        glowColor: 'rgba(217, 119, 6, 0.5)',
        headDot: '#fde68a',
        trackBg: '#fef3c7',
        textColor: '#b45309'
      };
    }
    if (c.includes('7c3aed') || c.includes('violet') || c.includes('purple') || c.includes('8b5cf6')) {
      return {
        grad1: '#c4b5fd',
        grad2: '#7c3aed',
        grad3: '#5b21b6',
        glowColor: 'rgba(124, 58, 237, 0.5)',
        headDot: '#ddd6fe',
        trackBg: '#f5f3ff',
        textColor: '#7c3aed'
      };
    }
    if (c.includes('dc2626') || c.includes('red') || c.includes('ef4444') || c.includes('f87171')) {
      return {
        grad1: '#fca5a5',
        grad2: '#dc2626',
        grad3: '#991b1b',
        glowColor: 'rgba(220, 38, 38, 0.55)',
        headDot: '#fecaca',
        trackBg: '#fee2e2',
        textColor: '#dc2626'
      };
    }
    // Default Cyber Blue
    return {
      grad1: '#60a5fa',
      grad2: '#2563eb',
      grad3: '#1e40af',
      glowColor: 'rgba(37, 99, 235, 0.55)',
      headDot: '#93c5fd',
      trackBg: '#dbeafe',
      textColor: '#2563eb'
    };
  };

  const theme = getTheme(color);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, animatedPct)) / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`${uniqueId}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.grad1} />
            <stop offset="60%" stopColor={theme.grad2} />
            <stop offset="100%" stopColor={theme.grad3} />
          </linearGradient>
        </defs>
        
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.trackBg}
          strokeWidth={stroke}
        />
        
        {/* Outer ambient glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${uniqueId}-grad)`}
          strokeWidth={stroke + 3}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          opacity={0.25}
          style={{ transition: 'stroke-dashoffset 0.95s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />

        {/* Main Progress Stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${uniqueId}-grad)`}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.95s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />

        {/* 3D Specular Highlight Line */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - stroke / 3.8}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.2}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          opacity={0.55}
          style={{ transition: 'stroke-dashoffset 0.95s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      
      {/* Centered Value */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          inset: 0
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Barra de carga moderna ── */
function LaserBar({ pct, color, height = 7 }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimatedWidth(pct), 50);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="mini-progress-bg" style={{ width: '100%', height, marginTop: '6px' }}>
      <div
        className="mini-progress-fill"
        style={{
          width: `${Math.min(100, Math.max(0, animatedWidth))}%`,
          background: color
        }}
      />
    </div>
  );
}

export default function ExecutiveOverviewSummary({ reports = [], callersData = {}, groupsData = {} }) {
  const [showAdminGuide, setShowAdminGuide] = useState(false);
  const [insightPopover, setInsightPopover] = useState(null); // 'diag' | 'agend' | 'msg' | 'nicho' | null
  const [showSentimentAuditModal, setShowSentimentAuditModal] = useState(false);

  // ── Filtros dedicados para el modal de auditoría de celdas ──
  const [auditFilterSdr, setAuditFilterSdr] = useState('Todos');
  const [auditFilterOnlyActive, setAuditFilterOnlyActive] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // ── Bloquear scroll del fondo cuando el modal esté abierto ──
  useEffect(() => {
    if (showSentimentAuditModal) {
      const prevBody = document.body.style.overflow;
      const prevHtml = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBody;
        document.documentElement.style.overflow = prevHtml;
      };
    }
  }, [showSentimentAuditModal]);


  /* ── 1. CÁLCULOS MACRO TOTALES (DATOS REALES CARGADOS DESDE EL SHEET) ── */
  const totalEnviadas = reports.reduce((a, r) =>
    a + Number(r.conexionesEnviadasWaalaxy || 0) + Number(r.conexionesEnviadasManual || 0), 0);
  const totalAceptadas = reports.reduce((a, r) =>
    a + Number(r.conexionesAceptadasWaalaxy || 0) + Number(r.conexionesAceptadasManual || 0), 0);
  
  // Total de mensajes enviados Auto + Manual (real)
  const msgWaalaxy = reports.reduce((a, r) => a + Number(r.mensajesWaalaxy || r.mensajesEnviadosWaalaxy || 0), 0);
  const msgManual = reports.reduce((a, r) => a + Number(r.mensajesManual || r.mensajesEnviadosManual || 0), 0);
  const totalMensajesEnviados = msgWaalaxy + msgManual > 0 ? (msgWaalaxy + msgManual) : totalEnviadas;

  const totalRespuestas = reports.reduce((a, r) =>
    a + Number(r.respuestasM1 || 0) + Number(r.respuestasM2 || 0) + Number(r.respuestasM3 || 0), 0);
  const totalDiagnosticos = reports.reduce((a, r) => a + Number(r.diagnosticos || 0), 0);
  const totalAgendamientos = reports.reduce((a, r) => a + Number(r.agendamientos || 0), 0);

  // Show Up: numerador = filas con asistioLead = Sí (17)
  // Denominador = suma de Sí (17) + No (10) de la pregunta "¿Asistió al Booking?" (los Pendientes no cuentan)
  const totalAsistieronBooking = reports.filter(r => {
    const st = (r.asistioLead || '').toLowerCase().trim();
    return (st === 'sí' || st === 'si' || st.startsWith('si') || st.startsWith('sí') || st === '1' || st === 'true') && !st.startsWith('no') && !st.includes('pendiente');
  }).length;

  const totalAsistidosNo = reports.filter(r => {
    const st = (r.asistioLead || '').toLowerCase().trim();
    return st.startsWith('no') && !st.includes('pendiente');
  }).length;

  // Denominador: suma de Sí y No de "¿Asistió al Booking?"
  const totalAgendados = totalAsistieronBooking + totalAsistidosNo;

  const tasaAceptacion = totalEnviadas > 0 ? ((totalAceptadas / totalEnviadas) * 100).toFixed(1) : '0.0';
  const tasaRespuesta = totalAceptadas > 0 ? ((totalRespuestas / totalAceptadas) * 100).toFixed(1) : '0.0';
  const tasaDiagSobreRespuestas = totalRespuestas > 0 ? ((totalDiagnosticos / totalRespuestas) * 100).toFixed(1) : '0.0';
  const tasaAgendSobreDiag = totalDiagnosticos > 0 ? ((totalAgendamientos / totalDiagnosticos) * 100).toFixed(1) : '0.0';

  const showUpPct = totalAgendados > 0
    ? Math.round((totalAsistieronBooking / totalAgendados) * 100)
    : (totalAsistieronBooking > 0 ? 100 : 0);
  const showUpColor = showUpPct >= 50 ? '#059669' : '#dc2626';
  const showUpBorder = showUpPct >= 50 ? '#a7f3d0' : '#fecaca';

  /* ── ESTADO ACTUAL DE CUENTAS LINKEDIN (10 Cuentas Únicas: Último Estado Reportado por SDR) ── */
  const normalizeSdrName = (name) => {
    if (!name) return '';
    return String(name).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const sdrLatestAccountMap = {};
  reports.forEach(r => {
    const sdrName = r.sdr || r.nombre || '';
    const norm = normalizeSdrName(sdrName);
    if (!norm || norm.length < 3 || norm.includes('agendad') || norm.includes('desconocid')) return;

    if (!sdrLatestAccountMap[norm]) {
      sdrLatestAccountMap[norm] = r;
    } else {
      const prevDate = sdrLatestAccountMap[norm].timestamp || '';
      const currDate = r.timestamp || '';
      // Si el registro actual tiene estado de Waalaxy explícito, actualizamos
      if (r.estadoWaalaxy) {
        if (!sdrLatestAccountMap[norm].estadoWaalaxy || currDate >= prevDate) {
          sdrLatestAccountMap[norm] = r;
        }
      } else if (!sdrLatestAccountMap[norm].estadoWaalaxy && currDate >= prevDate) {
        sdrLatestAccountMap[norm] = r;
      }
    }
  });

  const accountsToMeasure = Object.values(sdrLatestAccountMap);

  // SOLO se cuenta como activa las que tienen la palabra Activo / Activa (NO Bajo SSI, NO Restricción)
  const activas = accountsToMeasure.filter(r => {
    const st = (r.estadoWaalaxy || '').toLowerCase();
    return (st.includes('activo') || st.includes('activa')) && !st.includes('bajo') && !st.includes('ssi') && !st.includes('restr');
  }).length;

  const bajoSSI = accountsToMeasure.filter(r => {
    const st = (r.estadoWaalaxy || '').toLowerCase();
    return st.includes('bajo ssi') || st.includes('ssi');
  }).length;

  const restringidas = accountsToMeasure.filter(r => {
    const st = (r.estadoWaalaxy || '').toLowerCase();
    return st.includes('restr') || st.includes('bloq') || st.includes('paus');
  }).length;

  const totalCuentas = accountsToMeasure.length;
  const saludPct = totalCuentas > 0 ? Math.round((activas / totalCuentas) * 100) : 0;

  /* ── Clasificación de Respuestas ── */
  const sumPos = reports.reduce((a, r) => a + Number(r.respuestasPositivas || 0), 0);
  const sumNeg = reports.reduce((a, r) => a + Number(r.respuestasNegativas || 0), 0);
  const sumGhost = reports.reduce((a, r) => a + Number(r.respuestasGhosting || 0), 0);
  const positivas = sumPos;
  const negativas = sumNeg;
  const ghosting = sumGhost;
  const totalClasif = positivas + negativas + ghosting || 1;

  /* ── Top SDRs (Ordenado por mayor puntaje) ── */
  const sdrStats = {};
  reports.forEach(r => {
    const s = r.sdr || 'Desconocido';
    if (!sdrStats[s]) sdrStats[s] = { name: s, agendamientos: 0, score: 0, diag: 0, asist: 0, env: 0, acep: 0 };
    
    const diag = Number(r.diagnosticos || 0);
    const agend = Number(r.agendamientos || (r.cumplioMeta === 'Sí' ? 1 : 0));
    const asist = Number(r.asistidos !== undefined ? r.asistidos : (r.asistioLead === 'Sí' ? 1 : 0));
    const cumplio = Boolean(r.cumplioMeta && String(r.cumplioMeta).toLowerCase().includes('si'));
    // Opción A: +1 pt diag, +5 pts por reporte diario enviado, +10 pts asistido
    const calcScore = (diag * 1) + 5 + (asist * 10);

    sdrStats[s].diag += diag;
    sdrStats[s].agendamientos += agend;
    sdrStats[s].asist += asist;
    sdrStats[s].score += calcScore;
    sdrStats[s].env += Number(r.conexionesEnviadasWaalaxy || 0) + Number(r.conexionesEnviadasManual || 0);
    sdrStats[s].acep += Number(r.conexionesAceptadasWaalaxy || 0) + Number(r.conexionesAceptadasManual || 0);
  });

  Object.values(sdrStats).forEach(s => {
    s.tasa = s.env > 0 ? ((s.acep / s.env) * 100).toFixed(1) : '0.0';
  });

  // Ordenar estrictamente por mayor puntaje arriba
  const topSdrs = Object.values(sdrStats).sort((a, b) => b.score - a.score || b.agendamientos - a.agendamientos).slice(0, 3);
  const maxScore = Math.max(...topSdrs.map(s => s.score), 1);

  /* ── Normalización de Países para evitar duplicados y repeticiones ── */
  const normalizeCountry = (c) => {
    if (!c) return '';
    const s = String(c).trim();
    const l = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (['todos', 'general', 'n/a', 'ninguno', 'ninguna', '—', '-', '0', 'pais', 'país'].includes(l)) return '';
    if (l.includes('colombia')) return 'Colombia';
    if (l.includes('mexic')) return 'México';
    if (l.includes('usa') || l.includes('estados unidos') || l.includes('eeuu') || l.includes('united states')) return 'USA';
    if (l.includes('venezuela')) return 'Venezuela';
    if (l.includes('ecuador')) return 'Ecuador';
    if (l.includes('peru')) return 'Perú';
    if (l.includes('chile')) return 'Chile';
    if (l.includes('argentina')) return 'Argentina';
    if (l.includes('panama')) return 'Panamá';
    if (l.includes('espana') || l.includes('spain')) return 'España';
    if (l.includes('costa rica')) return 'Costa Rica';
    if (l.includes('guatemala')) return 'Guatemala';
    if (l.includes('bolivia')) return 'Bolivia';
    if (l.includes('dominicana')) return 'Rep. Dominicana';
    if (l.includes('uruguay')) return 'Uruguay';
    if (l.includes('paraguay')) return 'Paraguay';
    if (l.includes('nicaragua')) return 'Nicaragua';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const parseCountryCounts = (rawText, fallbackCount, fallbackCountry) => {
    const result = {};
    if (!rawText || String(rawText).trim() === '') {
      if (fallbackCountry && fallbackCount > 0) {
        const nc = normalizeCountry(fallbackCountry);
        if (nc) result[nc] = fallbackCount;
      }
      return result;
    }

    const str = String(rawText).trim();
    if (!isNaN(Number(str))) {
      const nc = normalizeCountry(fallbackCountry);
      if (nc) result[nc] = Number(str);
      return result;
    }

    const chunks = str.split(/[,;\n/]+|\s+y\s+/i);
    let parsedAny = false;

    chunks.forEach(chunk => {
      const c = chunk.trim();
      if (!c) return;

      // Use global regex to extract ALL country-number pairs in this chunk
      // Handles both "Colombia: 3" and "Colombia: 3 Panamá: 1" (no comma between them)
      const pairRegex = /([a-zA-ZáéíóúÁÉÍÓÚñÑ.\s]+?)(?::\s*|[\s\-–—(]+)(\d+)\)?/g;
      let m;
      let foundInChunk = false;
      while ((m = pairRegex.exec(c)) !== null) {
        const rawC = m[1].trim().replace(/^[,\s]+|[,\s]+$/g, '');
        if (rawC && rawC.length >= 2) {
          const country = normalizeCountry(rawC);
          const qty = parseInt(m[2], 10) || 0;
          if (qty > 0) {
            result[country] = (result[country] || 0) + qty;
            parsedAny = true;
            foundInChunk = true;
          }
        }
      }

      if (!foundInChunk) {
        // Pattern: Number Country e.g. "2 Argentina"
        const numFirst = c.match(/^(\d+)[\s:\-–—]+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s.]+)$/);
        if (numFirst) {
          const qty = parseInt(numFirst[1], 10);
          const country = normalizeCountry(numFirst[2]);
          if (country && qty > 0) {
            result[country] = (result[country] || 0) + qty;
            parsedAny = true;
          }
        }
      }
    });

    if (!parsedAny && fallbackCountry && fallbackCount > 0) {
      const nc = normalizeCountry(fallbackCountry);
      if (nc) result[nc] = fallbackCount;
    }

    return result;
  };

  const diagByCountry = {};
  const agendByCountry = {};
  const categoryCounts = {};

  reports.forEach(r => {
    // 1. Diagnósticos por País (extraído de la columna 'Diagnósticos por país')
    const rawDiag = r.diagnosticosPorPais || '';
    const diagCount = Number(r.diagnosticos || 0);
    const diagParsed = parseCountryCounts(rawDiag, diagCount, r.pais);
    Object.entries(diagParsed).forEach(([c, q]) => {
      diagByCountry[c] = (diagByCountry[c] || 0) + q;
    });

    // 2. Agendamiento por País (extraído de la columna 'Agendamiento por país')
    const rawAgend = r.agendamientoPorPais || '';
    const agendCount = Number(r.agendamientos || (r.asistioLead === 'Sí' ? 1 : 0) || 1);
    const agendParsed = parseCountryCounts(rawAgend, agendCount, r.pais);
    Object.entries(agendParsed).forEach(([c, q]) => {
      agendByCountry[c] = (agendByCountry[c] || 0) + q;
    });

    const cat = r.categoria || 'Recursos Humanos';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // Top 3 países de diagnósticos ordenados por volumen real
  const topDiagCountries = Object.entries(diagByCountry)
    .filter(([c, cnt]) => cnt > 0 && c && c !== 'Todos')
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0]);
  const bestDiagCountry = topDiagCountries.slice(0, 3).join(', ') || 'Sin datos de país';

  // Top 3 países de agendamientos ordenados por volumen real
  const topAgendCountries = Object.entries(agendByCountry)
    .filter(([c, cnt]) => cnt > 0 && c && c !== 'Todos')
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0]);
  const bestAgendCountry = topAgendCountries.slice(0, 3).join(', ') || 'Sin datos de país';
  
  const bestCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Recursos Humanos';

  const m1t = reports.reduce((a, r) => a + Number(r.respuestasM1 || 0), 0);
  const m2t = reports.reduce((a, r) => a + Number(r.respuestasM2 || 0), 0);
  const m3t = reports.reduce((a, r) => a + Number(r.respuestasM3 || 0), 0);
  // Mensaje más efectivo sin (M1)/(M2)/(M3)
  const bestMsg = m1t >= m2t && m1t >= m3t ? 'Mensaje 1' : m2t >= m3t ? 'Mensaje 2' : 'Mensaje 3';
  const bestMsgPct = totalRespuestas > 0 ? ((Math.max(m1t, m2t, m3t) / totalRespuestas) * 100).toFixed(0) : '0';

  const eficienciaGlobal = totalEnviadas > 0 ? ((totalAgendamientos / totalEnviadas) * 100).toFixed(2) : '0.00';

  /* ── 2. CONSOLIDADO DE CALLERS (Sincronizado con Reporte General y Registro Diario) ── */
  const allScorecards = [];
  const allCallerRecs = [];
  Object.values(callersData || {}).forEach(proc => {
    if (Array.isArray(proc?.scorecardReports)) allScorecards.push(...proc.scorecardReports);
    if (Array.isArray(proc?.callerRecords)) allCallerRecs.push(...proc.callerRecords);
  });

  const finalLlamadas = allScorecards.length > 0
    ? allScorecards.reduce((a, s) => a + Number(s.llamadasDiarias || 0), 0)
    : allCallerRecs.reduce((a, r) => a + Number(r.intentos || 1), 0);

  const finalContactos = allScorecards.length > 0
    ? allScorecards.reduce((a, s) => a + Number(s.contactosUnicos || 0), 0)
    : allCallerRecs.length;

  const validSources = allCallerRecs.filter(r => {
    const f = String(r.fuente || '').trim().toLowerCase();
    return f && !['—', '-', 'n/a', 'ninguno', 'ninguna', '0', 'sin fuente'].includes(f);
  });
  const finalFuentes = validSources.length;

  const finalMensajes11 = allScorecards.length > 0
    ? allScorecards.reduce((a, s) => a + Number(s.mensajesEnviados || 0), 0)
    : allCallerRecs.filter(r => r.mensajes1a1 === 'Sí' || r.mensajes11 === 'Sí').length;

  const finalSkool = allScorecards.length > 0
    ? allScorecards.reduce((a, s) => a + Number(s.comunidadSkool || 0), 0)
    : allCallerRecs.filter(r => r.comunidadSkool === 'Sí').length;

  const finalSeguimiento = allScorecards.length > 0
    ? allScorecards.reduce((a, s) => a + Number(s.enSeguimiento || 0), 0)
    : allCallerRecs.filter(r => (r.respuesta || '').toLowerCase().includes('seguimiento')).length;

  const finalAgendados = allScorecards.length > 0
    ? allScorecards.reduce((a, s) => a + Number(s.citasAgendadas || 0), 0)
    : allCallerRecs.filter(r => (r.respuesta || '').toLowerCase().includes('agendado')).length;

  // ── Smooth count-up animations ──
  const animMensajesTotal = useAnimatedNumber(totalMensajesEnviados, 850);
  const animEnviadas = useAnimatedNumber(totalEnviadas, 800);
  const animAceptadas = useAnimatedNumber(totalAceptadas, 900);
  const animDiagnosticos = useAnimatedNumber(totalDiagnosticos, 850);
  const animAgendamientos = useAnimatedNumber(totalAgendamientos, 850);
  const animPositivas = useAnimatedNumber(positivas, 750);
  const animNegativas = useAnimatedNumber(negativas, 800);
  const animGhosting = useAnimatedNumber(ghosting, 850);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>

      {/* ─── FILA 1: VOLUMEN TOTAL ENVIADO Y RENDIMIENTO OPERATIVO ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>

        {/* TARJETA 1: TOTAL CONEXIONES ENVIADAS (AUTO + MANUAL) */}
        <div className="glass-panel" style={{ padding: '20px 22px', display: 'flex', gap: '18px', alignItems: 'center' }}>
          <ProgressRing pct={Number(tasaAceptacion)} color="#2563eb" size={72} stroke={6}>
            <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#2563eb' }}>{tasaAceptacion}%</span>
          </ProgressRing>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
              Total Conexiones Enviadas (Auto + Manual)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {animEnviadas.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700, marginTop: '4px' }}>
              {animAceptadas.toLocaleString()} aceptadas ({tasaAceptacion}%)
            </div>
            <LaserBar pct={Number(tasaAceptacion)} color="#2563eb" />
          </div>
        </div>

        {/* TARJETA 2: RENDIMIENTO OPERATIVO (SHOW UP + CUENTAS SALUDABLES LINKEDIN) */}
        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          {/* Header with Title and Monitoreo badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '7px', margin: 0 }}>
              <TrendingUp size={15} color="#d97706" />
              Rendimiento Operativo
            </h4>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
              Monitoreo
            </span>
          </div>

          {/* 2 Sub-Cards en paralelo: Asistencia (Show Up) y Cuentas Saludables */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
            
            {/* Sub-Card 1: Asistencia (Show Up) */}
            <div style={{
              background: '#ffffff',
              border: `1px solid ${showUpBorder}`,
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: `0 1px 3px ${showUpPct >= 50 ? 'rgba(5, 150, 105, 0.05)' : 'rgba(220, 38, 38, 0.05)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <ProgressRing pct={showUpPct} color={showUpColor} size={52} stroke={5}>
                  <span style={{ fontSize: '10.5px', fontWeight: 900, color: showUpColor }}>{showUpPct}%</span>
                </ProgressRing>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ASISTENCIA (SHOW UP)
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: showUpColor, lineHeight: 1.1 }}>
                    {showUpPct}%
                  </div>
                  <div style={{ fontSize: '10.5px', color: showUpColor, fontWeight: 700, marginTop: '2px' }}>
                    {totalAsistieronBooking} de {totalAgendados} asistidos
                  </div>
                </div>
              </div>
              <LaserBar pct={showUpPct} color={showUpColor} height={4} />
            </div>

            {/* Sub-Card 2: Cuentas Automatizadas (Waalaxy) */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <ProgressRing pct={saludPct} color="#2563eb" size={52} stroke={5}>
                  <span style={{ fontSize: '10.5px', fontWeight: 900, color: '#2563eb' }}>{saludPct}%</span>
                </ProgressRing>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    CUENTAS AUTOMATIZADAS LINKEDIN
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#2563eb', lineHeight: 1.1 }}>
                    {activas} / {totalCuentas}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#2563eb', fontWeight: 700, marginTop: '2px' }}>
                    Waalaxy ({activas} activas{restringidas > 0 ? `, ${restringidas} restr.` : ''}{bajoSSI > 0 ? `, ${bajoSSI} bajo SSI` : ''})
                  </div>
                </div>
              </div>
              <LaserBar pct={saludPct} color="#2563eb" height={4} />
            </div>

          </div>

        </div>

      </div>

      {/* ─── FILA 2: EMBUDO DE CONVERSIÓN + CLASIFICACIÓN DE RESPUESTAS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>

        {/* Embudo de Conversión */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '7px', margin: 0 }}>
              <TrendingUp size={15} color="#2563eb" />
              Embudo de Conversión
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            {/* Diagnósticos */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>4. Diagnósticos</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#b45309', margin: '4px 0 2px' }}>{animDiagnosticos}</div>
              <div style={{ fontSize: '11.5px', color: '#b45309', fontWeight: 700 }}>{tasaDiagSobreRespuestas}% sobre respuestas</div>
              <LaserBar pct={Number(tasaDiagSobreRespuestas)} color="#d97706" height={4} />
            </div>

            {/* Agendados */}
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>5. Agendados</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#059669', margin: '4px 0 2px' }}>{animAgendamientos}</div>
              <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700 }}>{tasaAgendSobreDiag}% sobre diagnósticos</div>
              <LaserBar pct={Number(tasaAgendSobreDiag)} color="#059669" height={4} />
            </div>
          </div>

          {/* Ratios Inferiores con Cuadros */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            {/* 1. Tasa Aceptación */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Tasa Aceptación</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#2563eb', margin: '2px 0' }}>{tasaAceptacion}%</div>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>{animAceptadas} de {animEnviadas}</div>
            </div>

            {/* 2. Tasa Respuesta */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Tasa Respuesta</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#7c3aed', margin: '2px 0' }}>{tasaRespuesta}%</div>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>{totalRespuestas} de {animAceptadas}</div>
            </div>

            {/* 3. Tasa Agendamiento */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Tasa Agendamiento</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#059669', margin: '2px 0' }}>{tasaAgendSobreDiag}%</div>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>{animAgendamientos} de {animDiagnosticos}</div>
            </div>
          </div>
        </div>

        {/* Clasificación de Respuestas */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '7px', margin: 0 }}>
              <Activity size={15} color="#7c3aed" />
              Clasificación de Respuestas
            </h4>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Sentimiento de Prospectos</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Positivas */}
            <div style={{ padding: '10px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%', background: '#ffffff',
                  border: '1.5px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(5,150,105,0.1)', overflow: 'hidden'
                }}>
                  <img src="/Emogis/Positivo.png" alt="Positivo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#047857' }}>Positivas</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Interés confirmado</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#047857' }}>{animPositivas}</div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>{((positivas / totalClasif) * 100).toFixed(0)}%</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSentimentAuditModal('positivas')}
                  style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    border: '1.5px solid #a7f3d0', background: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#059669', flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(5,150,105,0.15)'
                  }}
                  title="Ver detalle y celdas del Sheet de Positivas"
                >
                  <Info size={13} />
                </button>
              </div>
            </div>

            {/* Negativas */}
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%', background: '#ffffff',
                  border: '1.5px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(220,38,38,0.1)', overflow: 'hidden'
                }}>
                  <img src="/Emogis/Negativo.png" alt="Negativo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#dc2626' }}>Negativas</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Rechazo o descarte</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#dc2626' }}>{animNegativas}</div>
                  <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>{((negativas / totalClasif) * 100).toFixed(0)}%</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSentimentAuditModal('negativas')}
                  style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    border: '1.5px solid #fecaca', background: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#dc2626', flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(220,38,38,0.15)'
                  }}
                  title="Ver detalle y celdas del Sheet de Negativas"
                >
                  <Info size={13} />
                </button>
              </div>
            </div>

            {/* Ghosting */}
            <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%', background: '#ffffff',
                  border: '1.5px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(217,119,6,0.1)', overflow: 'hidden'
                }}>
                  <img src="/Emogis/Ghosting.png" alt="Ghosting" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#d97706' }}>Ghosting</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Sin respuesta</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#d97706' }}>{animGhosting}</div>
                  <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 700 }}>{((ghosting / totalClasif) * 100).toFixed(0)}%</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSentimentAuditModal('ghosting')}
                  style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    border: '1.5px solid #fde68a', background: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#d97706', flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(217,119,6,0.15)'
                  }}
                  title="Ver detalle y celdas del Sheet de Ghosting"
                >
                  <Info size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ─── FILA 3: PODIO DE SDRS + INTELIGENCIA DE MERCADO & NICHOS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>

        {/* Podio Top SDRs (Mayor puntaje arriba y sin la palabra demos) */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '7px', margin: 0 }}>
              <Award size={15} color="#d97706" />
              Ranking Top Performers (SDRs)
            </h4>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', padding: '2px 8px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fde68a' }}>
              Activo
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {topSdrs.map((sdr, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              const barColors = ['#d97706', '#2563eb', '#059669'];
              const barW = (sdr.score / maxScore) * 100;
              return (
                <div key={sdr.name} style={{
                  padding: '10px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{medals[i]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>{sdr.name}</span>
                      <span style={{ fontSize: '11.5px', fontWeight: 900, color: barColors[i] }}>
                        {sdr.agendamientos} agendados · {sdr.tasa}% tasa
                      </span>
                    </div>
                    <LaserBar pct={barW} color={barColors[i]} height={4} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748b' }}>{sdr.env} env. · {sdr.acep} acep.</span>
                      <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 800 }}>⭐ {sdr.score} pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inteligencia de Mercado & Nicho (4 Bloques Separados con Máximo 3 Países Únicos) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>

          {/* ── Shared popover helper ── */}
          {insightPopover && (
            <div
              onClick={() => setInsightPopover(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            />
          )}

          {/* Bloque 1: Mercado Principal (Diagnósticos) - Máx 3 países únicos */}
          <div className="glass-panel" style={{ padding: '12px 16px', borderLeft: '3px solid #2563eb', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', flexShrink: 0 }}>
              <Globe size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Mercado Principal (Diagnósticos)
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                {bestDiagCountry}
              </div>
              <div style={{ fontSize: '10.5px', color: '#2563eb', fontWeight: 700, marginTop: '1px' }}>
                Mayor volumen de diagnósticos enviados
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setInsightPopover(insightPopover === 'diag' ? null : 'diag'); }}
              style={{ background: insightPopover === 'diag' ? '#eff6ff' : 'transparent', border: '1px solid #bfdbfe', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#2563eb', padding: 0 }}
              title="Ver desglose"
            >
              <Info size={13} />
            </button>
            {insightPopover === 'diag' && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, background: '#fff', border: '1px solid #bfdbfe', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.13)', padding: '14px 16px', minWidth: '240px', marginTop: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#2563eb', marginBottom: '10px', textTransform: 'uppercase' }}>📊 Diagnósticos por País</div>
                {Object.entries(diagByCountry).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]).slice(0, 8).map(([pais, cnt]) => {
                  const maxVal = Math.max(...Object.values(diagByCountry));
                  return (
                    <div key={pais} style={{ marginBottom: '7px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>{pais}</span>
                        <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#2563eb' }}>{cnt}</span>
                      </div>
                      <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '4px' }}>
                        <div style={{ height: '100%', width: `${maxVal > 0 ? (cnt/maxVal)*100 : 0}%`, background: '#2563eb', borderRadius: '4px', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  );
                })}
                {Object.values(diagByCountry).every(v => v === 0) && (
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Sin datos de país en los reportes cargados.</div>
                )}
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>
                  Total reportes con país: {Object.values(diagByCountry).filter(v => v > 0).length} países · {reports.length} reportes
                </div>
              </div>
            )}
          </div>

          {/* Bloque 2: Más Agendamientos - Máx 3 países únicos */}
          <div className="glass-panel" style={{ padding: '12px 16px', borderLeft: '3px solid #059669', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', flexShrink: 0 }}>
              <CalendarCheck size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Más Agendamientos
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                {bestAgendCountry}
              </div>
              <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: 700, marginTop: '1px' }}>
                País líder en citas y reuniones agendadas
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setInsightPopover(insightPopover === 'agend' ? null : 'agend'); }}
              style={{ background: insightPopover === 'agend' ? '#ecfdf5' : 'transparent', border: '1px solid #a7f3d0', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#059669', padding: 0 }}
              title="Ver desglose"
            >
              <Info size={13} />
            </button>
            {insightPopover === 'agend' && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, background: '#fff', border: '1px solid #a7f3d0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.13)', padding: '14px 16px', minWidth: '240px', marginTop: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#059669', marginBottom: '10px', textTransform: 'uppercase' }}>📅 Agendamientos por País</div>
                {Object.entries(agendByCountry).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]).slice(0, 8).map(([pais, cnt]) => {
                  const maxVal = Math.max(...Object.values(agendByCountry));
                  return (
                    <div key={pais} style={{ marginBottom: '7px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>{pais}</span>
                        <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#059669' }}>{cnt}</span>
                      </div>
                      <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '4px' }}>
                        <div style={{ height: '100%', width: `${maxVal > 0 ? (cnt/maxVal)*100 : 0}%`, background: '#059669', borderRadius: '4px', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  );
                })}
                {Object.values(agendByCountry).every(v => v === 0) && (
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Sin agendamientos registrados con país asignado.</div>
                )}
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>
                  Total agendamientos: {totalAgendamientos} · Países únicos: {Object.values(agendByCountry).filter(v => v > 0).length}
                </div>
              </div>
            )}
          </div>

          {/* Bloque 3: Mensaje más Efectivo - Solo Mensaje 1 / 2 / 3 sin M1 */}
          <div className="glass-panel" style={{ padding: '12px 16px', borderLeft: '3px solid #d97706', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#fffbeb', color: '#d97706', flexShrink: 0 }}>
              <Flame size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Mensaje más Efectivo
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                {bestMsg} — {bestMsgPct}% resp.
              </div>
              <div style={{ fontSize: '10.5px', color: '#d97706', fontWeight: 700, marginTop: '1px' }}>
                Secuencia con mayor tasa de respuesta
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setInsightPopover(insightPopover === 'msg' ? null : 'msg'); }}
              style={{ background: insightPopover === 'msg' ? '#fffbeb' : 'transparent', border: '1px solid #fde68a', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#d97706', padding: 0 }}
              title="Ver desglose"
            >
              <Info size={13} />
            </button>
            {insightPopover === 'msg' && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, background: '#fff', border: '1px solid #fde68a', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.13)', padding: '14px 16px', minWidth: '230px', marginTop: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#d97706', marginBottom: '10px', textTransform: 'uppercase' }}>🔥 Respuestas por Secuencia</div>
                {[{ label: 'Mensaje 1', val: m1t }, { label: 'Mensaje 2', val: m2t }, { label: 'Mensaje 3', val: m3t }].map(({ label, val }) => {
                  const maxVal = Math.max(m1t, m2t, m3t, 1);
                  const pct = totalRespuestas > 0 ? ((val / totalRespuestas) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={label} style={{ marginBottom: '9px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>{label}</span>
                        <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#d97706' }}>{val} resp. ({pct}%)</span>
                      </div>
                      <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '4px' }}>
                        <div style={{ height: '100%', width: `${(val/maxVal)*100}%`, background: val === Math.max(m1t, m2t, m3t) ? '#d97706' : '#fbbf24', borderRadius: '4px', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #fde68a', fontSize: '10px', color: '#64748b' }}>
                  Total respuestas acumuladas: {totalRespuestas} · Reportes: {reports.length}
                </div>
              </div>
            )}
          </div>

          {/* Bloque 4: Nicho más Prospectado */}
          <div className="glass-panel" style={{ padding: '12px 16px', borderLeft: '3px solid #7c3aed', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed', flexShrink: 0 }}>
              <Users size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Nicho más Prospectado
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                {bestCategory}
              </div>
              <div style={{ fontSize: '10.5px', color: '#7c3aed', fontWeight: 700, marginTop: '1px' }}>
                Segmento profesional con mayor alcance
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setInsightPopover(insightPopover === 'nicho' ? null : 'nicho'); }}
              style={{ background: insightPopover === 'nicho' ? '#f5f3ff' : 'transparent', border: '1px solid #ddd6fe', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#7c3aed', padding: 0 }}
              title="Ver desglose"
            >
              <Info size={13} />
            </button>
            {insightPopover === 'nicho' && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, background: '#fff', border: '1px solid #ddd6fe', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.13)', padding: '14px 16px', minWidth: '240px', marginTop: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#7c3aed', marginBottom: '10px', textTransform: 'uppercase' }}>👥 Nichos / Categorías</div>
                {Object.entries(categoryCounts).sort((a,b) => b[1]-a[1]).slice(0, 8).map(([cat, cnt]) => {
                  const maxVal = Math.max(...Object.values(categoryCounts), 1);
                  return (
                    <div key={cat} style={{ marginBottom: '7px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                        <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#7c3aed' }}>{cnt}</span>
                      </div>
                      <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '4px' }}>
                        <div style={{ height: '100%', width: `${(cnt/maxVal)*100}%`, background: cat === bestCategory ? '#7c3aed' : '#c4b5fd', borderRadius: '4px', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #ddd6fe', fontSize: '10px', color: '#64748b' }}>
                  Nichos únicos: {Object.keys(categoryCounts).length} · Reportes: {reports.length}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ─── FILA 4: MÓDULO DE SUPERVISIÓN & SCORECARD — RENDIMIENTO CONSOLIDADO DE CALLERS ─── */}
      <div className="glass-panel" style={{ padding: '20px 24px', borderTop: '3px solid #7c3aed' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '12px', background: '#f5f3ff', border: '1px solid #ddd6fe', marginBottom: '6px' }}>
            <PhoneCall size={12} color="#7c3aed" />
            <span style={{ fontSize: '10.5px', fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase' }}>
              Módulo de Supervisión &amp; Scorecard
            </span>
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '2px 0 3px' }}>
            Rendimiento Consolidado de Callers
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            Control de llamadas diarias, respuestas de prospectos, derivaciones y agenda de re-contactos.
          </p>
        </div>

        {/* 7 Indicadores Consolidados de Callers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {/* 1. Llamadas Totales */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Llamadas Totales</span>
              <div style={{ padding: '5px', borderRadius: '6px', background: '#dbeafe', color: '#2563eb' }}>
                <Phone size={14} />
              </div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e40af', lineHeight: 1.1 }}>{finalLlamadas.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Intentos realizados</div>
          </div>

          {/* 2. Contactos Únicos */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: '3px solid #059669', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Contactos Únicos</span>
              <div style={{ padding: '5px', borderRadius: '6px', background: '#ecfdf5', color: '#059669' }}>
                <UserCheck size={14} />
              </div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#047857', lineHeight: 1.1 }}>{finalContactos.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Primer Contacto</div>
          </div>

          {/* 3. Fuentes de Contacto (Tarjeta que faltaba) */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: '3px solid #0284c7', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Fuentes de Contacto</span>
              <div style={{ padding: '5px', borderRadius: '6px', background: '#e0f2fe', color: '#0284c7' }}>
                <Compass size={14} />
              </div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#0284c7', lineHeight: 1.1 }}>{finalFuentes.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Registros con fuente</div>
          </div>

          {/* 4. Mensajes 1-1 */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: '3px solid #7c3aed', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Mensajes 1-1</span>
              <div style={{ padding: '5px', borderRadius: '6px', background: '#f5f3ff', color: '#7c3aed' }}>
                <MessageCircle size={14} />
              </div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#6d28d9', lineHeight: 1.1 }}>{finalMensajes11.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Vía WhatsApp</div>
          </div>

          {/* 5. Comunidad Skool */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: '3px solid #0284c7', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Comunidad Skool</span>
              <div style={{ padding: '5px', borderRadius: '6px', background: '#e0f2fe', color: '#0284c7' }}>
                <Share2 size={14} />
              </div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#0284c7', lineHeight: 1.1 }}>{finalSkool.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Invitaciones</div>
          </div>

          {/* 6. En Seguimiento */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: '3px solid #d97706', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.03em' }}>En Seguimiento</span>
              <div style={{ padding: '5px', borderRadius: '6px', background: '#fef3c7', color: '#d97706' }}>
                <ShieldAlert size={14} />
              </div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#b45309', lineHeight: 1.1 }}>{finalSeguimiento.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Mostraron Interés</div>
          </div>

          {/* 7. Citas Agendadas */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: '3px solid #059669', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Citas Agendadas</span>
              <div style={{ padding: '5px', borderRadius: '6px', background: '#ecfdf5', color: '#059669' }}>
                <CalendarCheck size={14} />
              </div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#047857', lineHeight: 1.1 }}>{finalAgendados.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Reuniones confirmadas</div>
          </div>
        </div>
      </div>

      {/* ─── MODAL AUDITORÍA DE CLASIFICACIÓN DE RESPUESTAS (POR CATEGORÍA INDIVIDUAL) ─── */}
      {showSentimentAuditModal && (() => {
        const cat = showSentimentAuditModal; // 'positivas' | 'negativas' | 'ghosting'
        const catConfigs = {
          positivas: {
            label: 'Positivas',
            iconColor: '#059669',
            badgeBg: '#ecfdf5',
            badgeBorder: '#a7f3d0',
            badgeText: '#047857',
            total: sumPos,
            pct: ((positivas / totalClasif) * 100).toFixed(0),
            colName: 'Positivas Extraídas',
            formulaDesc: 'Suma del 1° valor de la celda "Resultados de prospección" (formato: [Positivas]-[Negativas]-[Ghosting])',
            getValue: (r) => Number(r.respuestasPositivas || 0),
            imgSrc: '/Emogis/Positivo.png',
            desc: 'Interés confirmado por prospectos'
          },
          negativas: {
            label: 'Negativas',
            iconColor: '#dc2626',
            badgeBg: '#fef2f2',
            badgeBorder: '#fecaca',
            badgeText: '#dc2626',
            total: sumNeg,
            pct: ((negativas / totalClasif) * 100).toFixed(0),
            colName: 'Negativas Extraídas',
            formulaDesc: 'Suma del 2° valor de la celda "Resultados de prospección" (formato: [Positivas]-[Negativas]-[Ghosting])',
            getValue: (r) => Number(r.respuestasNegativas || 0),
            imgSrc: '/Emogis/Negativo.png',
            desc: 'Rechazo o descarte explícito'
          },
          ghosting: {
            label: 'Ghosting',
            iconColor: '#d97706',
            badgeBg: '#fffbeb',
            badgeBorder: '#fde68a',
            badgeText: '#d97706',
            total: sumGhost,
            pct: ((ghosting / totalClasif) * 100).toFixed(0),
            colName: 'Ghosting Extraído',
            formulaDesc: 'Suma del 3° valor de la celda "Resultados de prospección" (formato: [Positivas]-[Negativas]-[Ghosting])',
            getValue: (r) => Number(r.respuestasGhosting || 0),
            imgSrc: '/Emogis/Ghosting.png',
            desc: 'Sin respuesta tras seguimiento'
          }
        };

        const cfg = catConfigs[cat] || catConfigs.positivas;
        const totalRows = reports.length;
        const activeRows = reports.filter(r => cfg.getValue(r) > 0).length;
        const modalUniqueSdrs = ['Todos', ...Array.from(new Set(reports.map(r => r.sdr).filter(Boolean)))];

        // Filtrado dinámico de filas
        const displayRows = reports.filter((r) => {
          const val = cfg.getValue(r);
          if (auditFilterOnlyActive && val <= 0) return false;
          if (auditFilterSdr !== 'Todos' && r.sdr !== auditFilterSdr) return false;
          if (auditSearchQuery.trim()) {
            const q = auditSearchQuery.toLowerCase().trim();
            const sdrMatch = (r.sdr || '').toLowerCase().includes(q);
            const dateMatch = (r.timestamp || '').toLowerCase().includes(q);
            const pos = Number(r.respuestasPositivas || 0);
            const neg = Number(r.respuestasNegativas || 0);
            const ghost = Number(r.respuestasGhosting || 0);
            const rawMatch = `${pos}-${neg}-${ghost}`.includes(q);
            if (!sdrMatch && !dateMatch && !rawMatch) return false;
          }
          return true;
        });

        const filteredSum = displayRows.reduce((acc, r) => acc + cfg.getValue(r), 0);
        const hasActiveFilters = auditFilterSdr !== 'Todos' || auditFilterOnlyActive || auditSearchQuery.trim() !== '';

        return createPortal(
          <div
            className="modal-overlay"
            onClick={() => setShowSentimentAuditModal(false)}
            onWheel={(e) => e.stopPropagation()}
            style={{ zIndex: 9999999 }}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              style={{ maxWidth: '900px', width: '96%', maxHeight: '86vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)', margin: 'auto' }}
            >
              {/* Modal Header */}
              <div style={{ padding: '16px 22px', borderBottom: `2px solid ${cfg.badgeBorder}`, background: cfg.badgeBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%', background: '#ffffff',
                    border: `1.5px solid ${cfg.badgeBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.08)', overflow: 'hidden', flexShrink: 0
                  }}>
                    <img src={cfg.imgSrc} alt={cfg.label} style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      Auditoría de Celdas: {cfg.label}
                      <span style={{ fontSize: '13px', padding: '2px 10px', borderRadius: '12px', background: '#ffffff', border: `1px solid ${cfg.badgeBorder}`, color: cfg.badgeText, fontWeight: 900 }}>
                        Total Sheet: {cfg.total.toLocaleString()} ({cfg.pct}%)
                      </span>
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                      {cfg.formulaDesc}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowSentimentAuditModal(false)}
                  aria-label="Cerrar"
                  style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Top Stat Summary Cards */}
              <div style={{ padding: '12px 22px', background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: cfg.badgeBg, border: `1px solid ${cfg.badgeBorder}`, borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 800, color: cfg.badgeText, textTransform: 'uppercase' }}>
                      Total {cfg.label} ({hasActiveFilters ? 'Filtrado' : 'Consolidado'})
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: cfg.iconColor, lineHeight: 1.2 }}>
                      {filteredSum.toLocaleString()} {hasActiveFilters && <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>/ {cfg.total.toLocaleString()}</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{cfg.desc}</div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      Filas Mostradas
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                      {displayRows.length} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>de {totalRows} filas</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Google Sheet oficial (Setters Aspirantes)</div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      Filas con {cfg.label} {'>'} 0
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                      {activeRows} filas
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Aportan directamente a la suma</div>
                  </div>
                </div>
              </div>

              {/* ── BARRA DE FILTROS RÁPIDOS ── */}
              <div style={{ padding: '10px 22px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
                  {/* Buscador de texto */}
                  <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
                    <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Buscar SDR, fecha..."
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      style={{
                        width: '100%', padding: '6px 10px 6px 30px', fontSize: '12px',
                        border: '1px solid #cbd5e1', borderRadius: '8px', background: '#ffffff',
                        color: '#0f172a', outline: 'none'
                      }}
                    />
                  </div>

                  {/* Selector de SDR */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Filter size={13} color="#64748b" />
                    <select
                      value={auditFilterSdr}
                      onChange={(e) => setAuditFilterSdr(e.target.value)}
                      style={{
                        padding: '6px 10px', fontSize: '12px', fontWeight: 700,
                        border: '1px solid #cbd5e1', borderRadius: '8px', background: '#ffffff',
                        color: '#0f172a', cursor: 'pointer', outline: 'none'
                      }}
                    >
                      <option value="Todos">Todos los SDRs ({modalUniqueSdrs.length - 1})</option>
                      {modalUniqueSdrs.filter(s => s !== 'Todos').map(sdr => (
                        <option key={sdr} value={sdr}>{sdr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Botones de alternancia rápida */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setAuditFilterOnlyActive(false)}
                    style={{
                      padding: '5px 10px', fontSize: '11px', fontWeight: 800, borderRadius: '6px',
                      border: '1px solid', cursor: 'pointer',
                      background: !auditFilterOnlyActive ? '#0f172a' : '#ffffff',
                      color: !auditFilterOnlyActive ? '#ffffff' : '#475569',
                      borderColor: !auditFilterOnlyActive ? '#0f172a' : '#cbd5e1'
                    }}
                  >
                    Todas ({totalRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditFilterOnlyActive(true)}
                    style={{
                      padding: '5px 10px', fontSize: '11px', fontWeight: 800, borderRadius: '6px',
                      border: '1px solid', cursor: 'pointer',
                      background: auditFilterOnlyActive ? cfg.badgeBg : '#ffffff',
                      color: auditFilterOnlyActive ? cfg.badgeText : '#475569',
                      borderColor: auditFilterOnlyActive ? cfg.badgeBorder : '#cbd5e1'
                    }}
                  >
                    Solo con {cfg.label} &gt; 0 ({activeRows})
                  </button>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuditFilterSdr('Todos');
                        setAuditFilterOnlyActive(false);
                        setAuditSearchQuery('');
                      }}
                      style={{
                        padding: '5px 9px', fontSize: '11px', fontWeight: 700, borderRadius: '6px',
                        border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                      title="Restablecer filtros"
                    >
                      <RotateCcw size={11} /> Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Body: Tabla con cabeceras fijas (Sticky) y desplazamiento suave */}
              <div
                style={{ padding: '14px 22px', overflowY: 'auto', overflowX: 'auto', flex: 1, maxHeight: '45vh', overscrollBehavior: 'contain' }}
                onWheel={(e) => e.stopPropagation()}
              >
                <div style={{ width: '100%', minWidth: '700px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table className="prospecting-table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ width: '8%', textAlign: 'center', padding: '10px 8px', position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}># Fila</th>
                        <th style={{ width: '15%', textAlign: 'left', padding: '10px 12px', position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>Fecha</th>
                        <th style={{ width: '22%', textAlign: 'left', padding: '10px 12px', position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>SDR</th>
                        <th style={{ width: '35%', textAlign: 'left', padding: '10px 12px', position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
                          Celda en Sheet <em>"Resultados de prospección"</em>
                        </th>
                        <th style={{ width: '20%', textAlign: 'center', padding: '10px 12px', position: 'sticky', top: 0, zIndex: 10, background: cfg.badgeBg, color: cfg.badgeText }}>
                          {cfg.colName}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                            <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '4px' }}>No se encontraron filas con los filtros seleccionados</div>
                            <div style={{ fontSize: '11px' }}>Prueba cambiando el SDR o quitando el filtro de búsqueda.</div>
                          </td>
                        </tr>
                      ) : (
                        displayRows.map((r, idx) => {
                          const val = cfg.getValue(r);
                          const pos = Number(r.respuestasPositivas || 0);
                          const neg = Number(r.respuestasNegativas || 0);
                          const ghost = Number(r.respuestasGhosting || 0);
                          const raw = (pos > 0 || neg > 0 || ghost > 0) ? `${pos}-${neg}-${ghost}` : '';

                          return (
                            <tr key={r.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: val > 0 ? '#ffffff' : '#fafafa' }}>
                              <td style={{ textAlign: 'center', fontWeight: 800, color: '#64748b', padding: '9px 8px' }}>
                                {idx + 1}
                              </td>
                              <td style={{ textAlign: 'left', color: '#0f172a', padding: '9px 12px' }}>
                                {r.timestamp || '—'}
                              </td>
                              <td style={{ textAlign: 'left', fontWeight: 700, color: '#0f172a', padding: '9px 12px' }}>
                                {r.sdr || '—'}
                              </td>
                              <td style={{ textAlign: 'left', padding: '9px 12px' }}>
                                {raw ? (
                                  <span style={{ fontFamily: 'monospace', fontWeight: 800, background: '#f1f5f9', padding: '3px 9px', borderRadius: '6px', color: '#0f172a', border: '1px solid #e2e8f0' }}>
                                    "{raw}"
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Celda vacía (0-0-0)</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center', padding: '9px 12px', background: val > 0 ? cfg.badgeBg : 'transparent' }}>
                                {val > 0 ? (
                                  <span style={{ fontWeight: 900, color: cfg.iconColor, fontSize: '13.5px', padding: '2px 8px', borderRadius: '6px', background: '#ffffff', border: `1px solid ${cfg.badgeBorder}` }}>
                                    +{val}
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>0</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f8fafc', fontWeight: 900, borderTop: '2px solid #cbd5e1' }}>
                        <td colSpan="4" style={{ textAlign: 'right', padding: '12px 16px', fontSize: '13px', color: '#0f172a' }}>
                          SUMA TOTAL {hasActiveFilters ? 'FILTRADA' : 'CONSOLIDADA'}:
                        </td>
                        <td style={{ textAlign: 'center', color: cfg.iconColor, fontSize: '16px', padding: '12px 12px', background: cfg.badgeBg, borderLeft: `1px solid ${cfg.badgeBorder}` }}>
                          {filteredSum.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '12px 22px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Mostrando {displayRows.length} de {totalRows} filas totales del Google Sheet.
                </div>
                <button
                  type="button"
                  onClick={() => setShowSentimentAuditModal(false)}
                  className="btn-cyber-primary"
                  style={{ padding: '7px 20px', fontSize: '12px', fontWeight: 800, background: cfg.iconColor, borderColor: cfg.iconColor }}
                >
                  Entendido / Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

    </div>
  );
}
