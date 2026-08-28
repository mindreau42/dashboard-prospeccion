import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  TrendingUp,
  Send,
  UserCheck,
  MessageSquare,
  Sparkles,
  Bot,
  User,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  BarChart3,
  Info,
  Mail,
  Users,
  Tag,
  Globe,
  Calendar,
  RotateCcw,
  Filter,
  Eye,
  X,
  FileSpreadsheet,
  Search
} from 'lucide-react';
import { useAnimatedNumber } from '../utils/useAnimatedNumber';
import { matchesDateRange, getWeeksFromReports, matchesWeek } from '../utils/security';

function AnimatedBar({ width, background, height = 7, borderRadius = 9999, style = {} }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setW(width), 40);
    return () => clearTimeout(timer);
  }, [width]);

  return (
    <div className="mini-progress-bg" style={{ height, borderRadius, marginTop: '8px', ...style }}>
      <div
        className="mini-progress-fill"
        style={{
          width: `${w}%`,
          background,
          borderRadius
        }}
      />
    </div>
  );
}

/* ── Anillo 3D con Gradiente (mismo efecto que ExecutiveOverviewSummary) ── */
function GradientRing({ pct, color = '#059669', size = 56, stroke = 7, children }) {
  const [animatedPct, setAnimatedPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimatedPct(pct), 60);
    return () => clearTimeout(t);
  }, [pct]);

  const idRef = useRef(`cfring-${color.replace(/[^a-zA-Z0-9]/g, '')}-${size}-${Math.floor(Math.random() * 90000)}`);
  const uid = idRef.current;

  const getTheme = (c) => {
    const s = (c || '').toLowerCase();
    if (s.includes('059669') || s.includes('10b981') || s.includes('34d399')) {
      return { g1: '#34d399', g2: '#059669', g3: '#047857' };
    }
    if (s.includes('dc2626') || s.includes('ef4444')) {
      return { g1: '#f87171', g2: '#dc2626', g3: '#991b1b' };
    }
    return { g1: '#60a5fa', g2: '#2563eb', g3: '#1e40af' };
  };

  const t = getTheme(color);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, animatedPct)) / 100) * circ;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`${uid}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={t.g1} />
            <stop offset="60%" stopColor={t.g2} />
            <stop offset="100%" stopColor={t.g3} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        {/* Glow layer */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={`url(#${uid}-g)`} strokeWidth={stroke + 2.5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" opacity={0.25}
          style={{ transition: 'stroke-dasharray 0.95s cubic-bezier(0.16,1,0.3,1)' }} />
        {/* Main stroke */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={`url(#${uid}-g)`} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.95s cubic-bezier(0.16,1,0.3,1)' }} />
        {/* Highlight */}
        <circle cx={size/2} cy={size/2} r={r - stroke/3.8} fill="none"
          stroke="#ffffff" strokeWidth={1.2}
          strokeDasharray={`${Math.max(0, dash - 8)} ${circ}`} strokeLinecap="round" opacity={0.7}
          style={{ transition: 'stroke-dasharray 0.95s cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      {/* Center orb */}
      <div style={{
        position: 'absolute',
        width: `${size - stroke * 2.4}px`,
        height: `${size - stroke * 2.4}px`,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #f8fafc 55%, #e2e8f0 100%)',
        boxShadow: '0 2px 5px rgba(15,23,42,0.12), inset 0 1.5px 2px #ffffff, inset 0 -1.5px 2px rgba(15,23,42,0.08)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', pointerEvents: 'none', zIndex: 2
      }}>
        {children}
      </div>
    </div>
  );
}

export default function CommercialFunnelSection({ reports = [] }) {
  // ── Filters State (Semana, SDR, Rango de Fechas) ──
  const [selectedWeek, setSelectedWeek] = useState('Todos');
  const [selectedSdr, setSelectedSdr] = useState('Todos');
  const [selectedDateFrom, setSelectedDateFrom] = useState('');
  const [selectedDateTo, setSelectedDateTo] = useState('');
  const [showSentimentAuditModal, setShowSentimentAuditModal] = useState(false);
  const [auditFilterSdr, setAuditFilterSdr] = useState('Todos');
  const [auditFilterOnlyActive, setAuditFilterOnlyActive] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // Bloquear scroll del fondo cuando el modal esté abierto
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

  const uniqueSdrs = ['Todos', ...Array.from(new Set(reports.map(r => r.sdr).filter(Boolean)))];
  const availableWeeks = getWeeksFromReports(reports);

  const isFiltered = selectedWeek !== 'Todos' || selectedSdr !== 'Todos' || selectedDateFrom !== '' || selectedDateTo !== '';

  const resetFilters = () => {
    setSelectedWeek('Todos');
    setSelectedSdr('Todos');
    setSelectedDateFrom('');
    setSelectedDateTo('');
  };

  // Filtered reports
  const filteredReports = reports.filter(r => {
    const weekMatch = matchesWeek(r.timestamp, selectedWeek);
    const sdrMatch = selectedSdr === 'Todos' || r.sdr === selectedSdr;
    const dateMatch = matchesDateRange(r.timestamp, selectedDateFrom, selectedDateTo);
    return weekMatch && sdrMatch && dateMatch;
  });

  // Aggregate Metrics on filtered reports
  const envWaalaxy = filteredReports.reduce((a, r) => a + Number(r.conexionesEnviadasWaalaxy || 0), 0);
  const envManual = filteredReports.reduce((a, r) => a + Number(r.conexionesEnviadasManual || 0), 0);
  const totalEnviadas = envWaalaxy + envManual;

  const acepWaalaxy = filteredReports.reduce((a, r) => a + Number(r.conexionesAceptadasWaalaxy || 0), 0);
  const acepManual = filteredReports.reduce((a, r) => a + Number(r.conexionesAceptadasManual || 0), 0);
  const totalAceptadas = acepWaalaxy + acepManual;

  // Mensajes Waalaxy vs Manual (Suma exacta de columnas del sheet)
  const msgWaalaxy = filteredReports.reduce((a, r) => a + Number(r.mensajesWaalaxy || r.mensajesEnviadosWaalaxy || 0), 0);
  const msgManual = filteredReports.reduce((a, r) => a + Number(r.mensajesManual || r.mensajesEnviadosManual || 0), 0);
  const totalMensajes = msgWaalaxy + msgManual;

  const m1 = filteredReports.reduce((a, r) => a + Number(r.respuestasM1 || 0), 0);
  const m2 = filteredReports.reduce((a, r) => a + Number(r.respuestasM2 || 0), 0);
  const m3 = filteredReports.reduce((a, r) => a + Number(r.respuestasM3 || 0), 0);
  const totalRespuestas = m1 + m2 + m3;

  const totalDiagnosticos = filteredReports.reduce((a, r) => a + Number(r.diagnosticos || 0), 0);
  
  // Agendamientos estrictos desde la celda de la hoja
  const totalAgendamientos = filteredReports.reduce((a, r) => a + Number(r.agendamientos || 0), 0);

  // Conversion Rates
  const tasaAceptacion = totalEnviadas > 0 ? ((totalAceptadas / totalEnviadas) * 100).toFixed(1) : '0';
  const tasaRespuesta = totalAceptadas > 0 ? ((totalRespuestas / totalAceptadas) * 100).toFixed(1) : '0';
  
  // Diagnósticos rates
  const tasaDiagSobreRespuestas = totalRespuestas > 0 ? ((totalDiagnosticos / totalRespuestas) * 100).toFixed(1) : '0';
  const tasaDiagSobreContactos = totalAceptadas > 0 ? ((totalDiagnosticos / totalAceptadas) * 100).toFixed(1) : '0';

  // Agendamientos rates
  const tasaAgendSobreDiag = totalDiagnosticos > 0 ? ((totalAgendamientos / totalDiagnosticos) * 100).toFixed(1) : '0';
  const tasaAgendSobreContactos = totalAceptadas > 0 ? ((totalAgendamientos / totalAceptadas) * 100).toFixed(1) : '0';

  // Global Final Rate
  const tasaFinalGlobal = totalEnviadas > 0 ? ((totalAgendamientos / totalEnviadas) * 100).toFixed(2) : '0';

  // ── CÁLCULO DE ASISTENCIA (SHOW UP) ──
  const totalAgendados = totalAgendamientos;

  const totalAsistieronBooking = filteredReports.filter(r => {
    const st = (r.asistioLead || '').toLowerCase().trim();
    return (st === 'sí' || st === 'si' || st.startsWith('si') || st.startsWith('sí') || st === '1' || st === 'true') && !st.startsWith('no') && !st.includes('pendiente');
  }).length;
  
  const showUpRateCalc = totalAgendados > 0
    ? Math.round((totalAsistieronBooking / totalAgendados) * 100)
    : (totalAsistieronBooking > 0 ? 100 : 0);

  // ── CÁLCULO DE SALUD OPERATIVA ──
  const totalCuentas = filteredReports.length;
  const cuentasSaludables = filteredReports.filter(r => {
    const estado = (r.estadoWaalaxy || '').toLowerCase();
    return !estado.includes('restricci') && !estado.includes('restringid') && !estado.includes('bloquead');
  }).length;

  const saludOperativaRate = totalCuentas > 0
    ? Math.round((cuentasSaludables / totalCuentas) * 100)
    : (filteredReports.length === 0 ? 100 : 0);

  // ── CLASIFICACIÓN DE RESPUESTAS (SUMA EXACTA DEL GOOGLE SHEET: 525 - 130 - 1405) ──
  const sumPositivas = filteredReports.reduce((a, r) => a + Number(r.respuestasPositivas || 0), 0);
  const sumNegativas = filteredReports.reduce((a, r) => a + Number(r.respuestasNegativas || 0), 0);
  const sumGhosting = filteredReports.reduce((a, r) => a + Number(r.respuestasGhosting || 0), 0);

  const positivas = sumPositivas;
  const negativas = sumNegativas;
  const ghosting = sumGhosting;
  const totalSent = positivas + negativas + ghosting || 1;

  const pctPositivas = Math.round((positivas / totalSent) * 100);
  const pctNegativas = Math.round((negativas / totalSent) * 100);
  const pctGhosting = Math.round((ghosting / totalSent) * 100);

  // ── Smooth count-up animations ──
  const animEnviadas = useAnimatedNumber(totalEnviadas, 800);
  const animAceptadas = useAnimatedNumber(totalAceptadas, 900);
  const animRespuestas = useAnimatedNumber(totalRespuestas, 950);
  const animDiagnosticos = useAnimatedNumber(totalDiagnosticos, 1000);
  const animAgendamientos = useAnimatedNumber(totalAgendamientos, 1050);
  const animPositivas = useAnimatedNumber(positivas, 850);
  const animNegativas = useAnimatedNumber(negativas, 900);
  const animGhosting = useAnimatedNumber(ghosting, 950);

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isDiagInfoOpen, setIsDiagInfoOpen] = useState(false);
  const [isAgendInfoOpen, setIsAgendInfoOpen] = useState(false);
  const infoRef = useRef(null);
  const diagInfoRef = useRef(null);
  const agendInfoRef = useRef(null);

  // Styles for unified controls
  const selectStyle = {
    background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a',
    padding: '6px 10px', borderRadius: '6px', fontSize: '12px',
    fontWeight: 600, outline: 'none', cursor: 'pointer'
  };

  const dateInputStyle = {
    background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a',
    padding: '6px 8px', borderRadius: '6px', fontFamily: 'inherit',
    fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer', width: '125px'
  };

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setIsInfoOpen(false);
      }
      if (diagInfoRef.current && !diagInfoRef.current.contains(event.target)) {
        setIsDiagInfoOpen(false);
      }
      if (agendInfoRef.current && !agendInfoRef.current.contains(event.target)) {
        setIsAgendInfoOpen(false);
      }
    }
    if (isInfoOpen || isDiagInfoOpen || isAgendInfoOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isInfoOpen, isDiagInfoOpen, isAgendInfoOpen]);

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
      
      {/* ─── 1. PIPELINE DE CONVERSIÓN EN 5 PASOS CON FILTROS INTEGRADAS ─── */}
      <div className="glass-panel" style={{ padding: '24px 26px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        {/* Title — badges are now inside each KPI card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '5px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} />
              </div>
              Pipeline
            </h3>
          </div>
        </div>

        {/* ── BARRA DE FILTROS (SEMANA, SDR, RANGO, LIMPIAR) ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Filtro por Semana */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={13} color="#2563eb" />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>SEMANA:</span>
              <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} style={selectStyle}>
                {availableWeeks.map(w => (
                  <option key={w.key} value={w.key}>{w.label}</option>
                ))}
              </select>
            </div>

            {/* Filtro por SDR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={13} color="#059669" />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>SDR:</span>
              <select value={selectedSdr} onChange={(e) => setSelectedSdr(e.target.value)} style={selectStyle}>
                {uniqueSdrs.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Rango de Fechas */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={13} color="#7c3aed" />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>RANGO:</span>
              <input type="date" value={selectedDateFrom} onChange={(e) => setSelectedDateFrom(e.target.value)} style={dateInputStyle} />
              <span style={{ fontSize: '11px', color: '#64748b' }}>→</span>
              <input type="date" value={selectedDateTo} onChange={(e) => setSelectedDateTo(e.target.value)} style={dateInputStyle} />
            </div>
          </div>

          <button
            onClick={resetFilters}
            style={{
              visibility: isFiltered ? 'visible' : 'hidden',
              background: 'transparent',
              border: 'none',
              color: '#2563eb',
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 800,
              textDecoration: 'underline',
              padding: '6px 0',
              whiteSpace: 'nowrap'
            }}
          >
            <RotateCcw size={12} /> Limpiar
          </button>
        </div>

        {/* 5 STEPS VISUAL GRID - CUADROS MÁS GRANDES Y DETALLADOS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px'
        }}>
          
          {/* STEP 1: CONEXIONES */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderTop: '4px solid #2563eb',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '140px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  1. Conexiones
                </span>
                <div style={{ padding: '5px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb' }}>
                  <Send size={14} />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, margin: '4px 0' }}>
                {animEnviadas.toLocaleString()}
              </div>
            </div>
            <AnimatedBar width={100} background="linear-gradient(90deg, #60a5fa, #2563eb)" height={7} />
          </div>

          {/* STEP 2: ACEPTADAS */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderTop: '4px solid #0284c7',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '140px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  2. Aceptadas
                </span>
                <div style={{ padding: '5px', borderRadius: '6px', background: '#e0f2fe', color: '#0284c7' }}>
                  <UserCheck size={14} />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#0284c7', lineHeight: 1.1, margin: '4px 0' }}>
                {animAceptadas.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 800 }}>
                {tasaAceptacion}% de aceptación
              </div>
            </div>
            <AnimatedBar width={Number(tasaAceptacion)} background="linear-gradient(90deg, #38bdf8, #0284c7)" height={7} />
          </div>

          {/* STEP 3: RESPUESTAS */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderTop: '4px solid #7c3aed',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '140px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  3. Respuestas
                </span>
                <div style={{ padding: '5px', borderRadius: '6px', background: '#f5f3ff', color: '#7c3aed' }}>
                  <MessageSquare size={14} />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#7c3aed', lineHeight: 1.1, margin: '4px 0' }}>
                {animRespuestas.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 800 }}>
                {tasaRespuesta}% sobre aceptadas
              </div>
            </div>
            <AnimatedBar width={Number(tasaRespuesta)} background="linear-gradient(90deg, #a78bfa, #7c3aed)" height={7} />
          </div>

          {/* STEP 4: DIAGNÓSTICOS */}
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderTop: '4px solid #d97706',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '140px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  4. Diagnósticos
                </span>
                <div style={{ padding: '5px', borderRadius: '6px', background: '#ffffff', color: '#d97706' }}>
                  <Target size={14} />
                </div>
              </div>

              <div style={{ fontSize: '28px', fontWeight: 900, color: '#d97706', lineHeight: 1.1, margin: '4px 0' }}>
                {animDiagnosticos.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 800 }}>
                {tasaDiagSobreRespuestas}% sobre respuestas
              </div>
              {/* Badge Diag./Contactos — cerca del dato, con popover */}
              <div style={{ marginTop: '8px', position: 'relative' }} ref={diagInfoRef}>
                <button
                  onClick={() => { setIsDiagInfoOpen(prev => !prev); setIsAgendInfoOpen(false); setIsInfoOpen(false); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: '#fef3c7', border: '1px solid #fde68a',
                    color: '#b45309', borderRadius: '6px', padding: '3px 8px',
                    fontSize: '10.5px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: isDiagInfoOpen ? '0 0 0 2px #fde68a' : 'none'
                  }}
                  title="Haz clic para ver el detalle de Diagnósticos sobre Contactos"
                >
                  Diag. / Contactos: {tasaDiagSobreContactos}%
                  <Info size={11} color="#b45309" />
                </button>
                {isDiagInfoOpen && (
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
                    zIndex: 60, width: '260px', background: '#ffffff',
                    border: '1px solid #cbd5e1', borderRadius: '10px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)', padding: '14px',
                    animation: 'fadeIn 0.15s ease', textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#b45309', fontWeight: 800, fontSize: '12px' }}>
                      <Info size={13} color="#b45309" />
                      <span>Diagnósticos sobre Contactos</span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4, margin: '0 0 8px' }}>
                      % de conexiones aceptadas que avanzaron a llamada de diagnóstico.
                    </p>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 10px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#78350f' }}>Contactos Aceptados:</span>
                        <strong>{totalAceptadas.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#78350f' }}>Diagnósticos Totales:</span>
                        <strong style={{ color: '#b45309' }}>{totalDiagnosticos.toLocaleString()}</strong>
                      </div>
                      <div style={{ borderTop: '1px solid #fde68a', paddingTop: '5px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#b45309' }}>
                        <span>Tasa:</span>
                        <span>{tasaDiagSobreContactos}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <AnimatedBar width={Number(tasaDiagSobreRespuestas)} background="linear-gradient(90deg, #fbbf24, #d97706)" height={7} />
          </div>

          {/* STEP 5: AGENDADOS */}
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderTop: '4px solid #059669',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '140px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  5. Agendados
                </span>
                <div style={{ padding: '5px', borderRadius: '6px', background: '#ffffff', color: '#059669' }}>
                  <Sparkles size={14} />
                </div>
              </div>

              <div style={{ fontSize: '28px', fontWeight: 900, color: '#059669', lineHeight: 1.1, margin: '4px 0' }}>
                {animAgendamientos.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#047857', fontWeight: 800 }}>
                {tasaAgendSobreDiag}% sobre diagnósticos
              </div>
              {/* Badge Agend./Contactos — cerca del dato, con popover */}
              <div style={{ marginTop: '8px', position: 'relative' }} ref={agendInfoRef}>
                <button
                  onClick={() => { setIsAgendInfoOpen(prev => !prev); setIsDiagInfoOpen(false); setIsInfoOpen(false); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: '#d1fae5', border: '1px solid #a7f3d0',
                    color: '#047857', borderRadius: '6px', padding: '3px 8px',
                    fontSize: '10.5px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: isAgendInfoOpen ? '0 0 0 2px #a7f3d0' : 'none'
                  }}
                  title="Haz clic para ver el detalle de Agendados sobre Contactos"
                >
                  Agend. / Contactos: {tasaAgendSobreContactos}%
                  <Info size={11} color="#047857" />
                </button>
                {isAgendInfoOpen && (
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
                    zIndex: 60, width: '260px', background: '#ffffff',
                    border: '1px solid #cbd5e1', borderRadius: '10px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)', padding: '14px',
                    animation: 'fadeIn 0.15s ease', textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#047857', fontWeight: 800, fontSize: '12px' }}>
                      <Info size={13} color="#047857" />
                      <span>Agendados sobre Contactos</span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4, margin: '0 0 8px' }}>
                      % de conexiones aceptadas que se convirtieron en una cita agendada.
                    </p>
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '8px 10px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#065f46' }}>Contactos Aceptados:</span>
                        <strong>{totalAceptadas.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#065f46' }}>Citas Agendadas:</span>
                        <strong style={{ color: '#059669' }}>{totalAgendamientos.toLocaleString()}</strong>
                      </div>
                      <div style={{ borderTop: '1px solid #a7f3d0', paddingTop: '5px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#047857' }}>
                        <span>Tasa:</span>
                        <span>{tasaAgendSobreContactos}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <AnimatedBar width={Number(tasaAgendSobreDiag)} background="linear-gradient(90deg, #34d399, #059669)" height={7} />
          </div>

        </div>
      </div>

      {/* ─── 2. BLOQUE DE CANALES: WAALAXY VS MANUAL CON CANTIDAD DE MENSAJES & SECUENCIA M1/M2/M3 ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
        
        {/* TARJETA CANALES (AUTOMATIZADO VS MANUAL CON MENSAJES) */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '14.5px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Bot size={16} color="#2563eb" />
              Canales: Automatización vs Prospección Manual
            </h4>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Comparativa</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            
            {/* Waalaxy */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Bot size={15} color="#2563eb" />
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#1d4ed8' }}>Waalaxy (Auto)</span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#1e40af', lineHeight: 1 }}>{envWaalaxy}</div>
              <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 700, marginBottom: '12px' }}>Conexiones Enviadas</div>

              {/* Solo Mensajes — número grande */}
              <div style={{ background: '#dbeafe', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                  <Mail size={13} color="#2563eb" /> Mensajes
                </span>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#1e40af' }}>{msgWaalaxy}</span>
              </div>
            </div>

            {/* Manual */}
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <User size={15} color="#059669" />
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#047857' }}>Manual (SDR)</span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#065f46', lineHeight: 1 }}>{envManual}</div>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, marginBottom: '12px' }}>Conexiones Enviadas</div>

              {/* Solo Mensajes — número grande */}
              <div style={{ background: '#a7f3d0', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#065f46', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                  <Mail size={13} color="#059669" /> Mensajes
                </span>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#065f46' }}>{msgManual}</span>
              </div>
            </div>

          </div>
        </div>

        {/* TARJETA SECUENCIA DE MENSAJES (M1, M2, M3) */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '14.5px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Flame size={16} color="#d97706" />
              Efectividad de Mensajes
            </h4>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '12px' }}>
              {totalRespuestas} Respuestas
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(() => {
              const maxMsg = Math.max(m1, m2, m3);
              const msgs = [
                { id: 'm1', label: '● Mensaje 1 (Inicio / Presentación)', count: m1, color: '#2563eb', barGradient: 'linear-gradient(90deg, #60a5fa, #2563eb)', bg: '#eff6ff', border: '#bfdbfe' },
                { id: 'm2', label: '● Mensaje 2 (Seguimiento / Valor)', count: m2, color: '#7c3aed', barGradient: 'linear-gradient(90deg, #a78bfa, #7c3aed)', bg: '#f5f3ff', border: '#ddd6fe' },
                { id: 'm3', label: '● Mensaje 3 (Cierre / Urgencia)', count: m3, color: '#059669', barGradient: 'linear-gradient(90deg, #34d399, #059669)', bg: '#ecfdf5', border: '#a7f3d0' }
              ];
              return msgs.map(m => {
                const isTop = m.count === maxMsg && maxMsg > 0;
                const pct = totalRespuestas > 0 ? ((m.count / totalRespuestas) * 100).toFixed(0) : 0;
                return (
                  <div key={m.id} style={{ background: isTop ? m.bg : '#f8fafc', border: `1px solid ${isTop ? m.border : '#e2e8f0'}`, borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>
                      <span style={{ color: m.color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {m.label}
                        {isTop && (
                          <span style={{ fontSize: '10px', background: m.color, color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                            🔥 Top
                          </span>
                        )}
                      </span>
                      <span style={{ color: isTop ? m.color : '#0f172a' }}>{m.count} ({pct}%)</span>
                    </div>
                    <AnimatedBar width={pct} background={m.barGradient} height={7} />
                  </div>
                );
              });
            })()}
          </div>
        </div>

      </div>

      {/* ─── 3. TARJETAS RESCATADAS DE VISTA GENERAL (SHOW UP & SALUD OPERATIVA) + CLASIFICACIÓN DE RESPUESTAS CON EMOTICONES ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1.4fr)', gap: '18px', alignItems: 'stretch' }}>
        
        {/* TARJETA: ASISTENCIA (SHOW UP) */}
        <div className="glass-panel" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '14.5px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '7px', margin: 0 }}>
              <TrendingUp size={16} color="#d97706" />
              Rendimiento Operativo
            </h4>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Monitoreo</span>
          </div>

          {/* TARJETA: ASISTENCIA (SHOW UP) — Verde >= 60%, Rojo < 60% */}
          {(() => {
            const isGoodShowUp = showUpRateCalc >= 60;
            const suColor = isGoodShowUp ? '#059669' : '#dc2626';
            const suBorder = isGoodShowUp ? '#a7f3d0' : '#fecaca';
            return (
              <div style={{ background: '#ffffff', border: `1px solid ${suBorder}`, borderRadius: '12px', padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', flex: 1 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
                    <GradientRing pct={showUpRateCalc} color={suColor} size={64} stroke={6}>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: suColor }}>{showUpRateCalc}%</span>
                    </GradientRing>
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Asistencia (Show Up)
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: suColor, lineHeight: 1.1 }}>
                        {showUpRateCalc}%
                      </div>
                      <div style={{ fontSize: '11px', color: suColor, fontWeight: 700, marginTop: '2px' }}>
                        {totalAsistieronBooking} de {totalAgendados} asistidos
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mini-progress-bg" style={{ height: '5px', background: '#f1f5f9', marginTop: '8px' }}>
                  <div className="mini-progress-fill" style={{ width: `${Math.min(100, showUpRateCalc)}%`, background: suColor }} />
                </div>
              </div>
            );
          })()}
        </div>

        {/* CLASIFICACIÓN DE RESPUESTAS CON EMOTICONES DE ALTA CALIDAD */}
        <div className="glass-panel" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '14.5px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '7px', margin: 0 }}>
              <BarChart3 size={16} color="#059669" />
              Clasificación de Respuestas
            </h4>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Sentimiento de Prospectos</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
            
            {/* Positivas */}
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#047857', fontSize: '12px', fontWeight: 800 }}>
                  <CheckCircle2 size={14} /> Positivas
                </div>
                <div style={{ fontSize: '11px', color: '#065f46', marginTop: '1px' }}>Interés confirmado</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Emoticon de alta calidad Positivo */}
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '1.5px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(5,150,105,0.1)',
                  overflow: 'hidden'
                }}>
                  <img src="/Emogis/Positivo.png" alt="Positivo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#047857', lineHeight: 1 }}>{positivas}</div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669' }}>{pctPositivas}%</div>
                </div>

                {/* Botón ⓘ */}
                <button
                  type="button"
                  onClick={() => setShowSentimentAuditModal('positivas')}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    border: '1.5px solid #a7f3d0', background: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#059669', flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(5,150,105,0.15)'
                  }}
                  title="Ver detalle de Positivas por SDR"
                >
                  <Info size={14} />
                </button>
              </div>
            </div>

            {/* Negativas */}
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#dc2626', fontSize: '12px', fontWeight: 800 }}>
                  <XCircle size={14} /> Negativas
                </div>
                <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '1px' }}>Rechazo o descarte</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Emoticon de alta calidad Negativo */}
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '1.5px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(220,38,38,0.1)',
                  overflow: 'hidden'
                }}>
                  <img src="/Emogis/Negativo.png" alt="Negativo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>{negativas}</div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#b91c1c' }}>{pctNegativas}%</div>
                </div>

                {/* Botón ⓘ */}
                <button
                  type="button"
                  onClick={() => setShowSentimentAuditModal('negativas')}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    border: '1.5px solid #fecaca', background: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#dc2626', flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(220,38,38,0.15)'
                  }}
                  title="Ver detalle de Negativas por SDR"
                >
                  <Info size={14} />
                </button>
              </div>
            </div>

            {/* Ghosting */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#d97706', fontSize: '12px', fontWeight: 800 }}>
                  <Clock size={14} /> Ghosting
                </div>
                <div style={{ fontSize: '11px', color: '#92400e', marginTop: '1px' }}>Sin respuesta</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Emoticon de alta calidad Ghosting */}
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '1.5px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(217,119,6,0.1)',
                  overflow: 'hidden'
                }}>
                  <img src="/Emogis/Ghosting.png" alt="Ghosting" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#d97706', lineHeight: 1 }}>{ghosting}</div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#b45309' }}>{pctGhosting}%</div>
                </div>

                {/* Botón ⓘ */}
                <button
                  type="button"
                  onClick={() => setShowSentimentAuditModal('ghosting')}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    border: '1.5px solid #fde68a', background: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#d97706', flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(217,119,6,0.15)'
                  }}
                  title="Ver detalle de Ghosting por SDR"
                >
                  <Info size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>

      {/* ─── MODAL AUDITORÍA CLASIFICACIÓN DE RESPUESTAS (por categoría) ─── */}
      {showSentimentAuditModal && (() => {
        const cat = showSentimentAuditModal; // 'positivas' | 'negativas' | 'ghosting'
        const catConfig = {
          positivas: {
            label: 'Positivas',
            colName: 'Positivas Extraídas',
            total: positivas,
            pct: pctPositivas,
            badgeBg: '#ecfdf5',
            badgeBorder: '#a7f3d0',
            badgeText: '#065f46',
            iconColor: '#059669',
            imgSrc: '/Emogis/Positivo.png',
            desc: 'Interés confirmado por prospectos',
            formulaDesc: 'Suma del 1º valor de la celda "Resultados de prospección" (formato: [Positivas]-[Negativas]-[Ghosting])',
            getValue: (r) => Number(r.respuestasPositivas || 0)
          },
          negativas: {
            label: 'Negativas',
            colName: 'Negativas Extraídas',
            total: negativas,
            pct: pctNegativas,
            badgeBg: '#fef2f2',
            badgeBorder: '#fecaca',
            badgeText: '#991b1b',
            iconColor: '#dc2626',
            imgSrc: '/Emogis/Negativo.png',
            desc: 'Rechazos o prospectos descartados',
            formulaDesc: 'Suma del 2º valor de la celda "Resultados de prospección" (formato: [Positivas]-[Negativas]-[Ghosting])',
            getValue: (r) => Number(r.respuestasNegativas || 0)
          },
          ghosting: {
            label: 'Ghosting',
            colName: 'Ghosting Extraído',
            total: ghosting,
            pct: pctGhosting,
            badgeBg: '#fffbeb',
            badgeBorder: '#fde68a',
            badgeText: '#92400e',
            iconColor: '#d97706',
            imgSrc: '/Emogis/Ghosting.png',
            desc: 'Mensajes enviados sin respuesta recibida',
            formulaDesc: 'Suma del 3º valor de la celda "Resultados de prospección" (formato: [Positivas]-[Negativas]-[Ghosting])',
            getValue: (r) => Number(r.respuestasGhosting || 0)
          }
        };

        const cfg = catConfig[cat];
        if (!cfg) return null;

        const totalRows = filteredReports.length;
        const activeRows = filteredReports.filter(r => cfg.getValue(r) > 0).length;
        const modalUniqueSdrs = ['Todos', ...Array.from(new Set(filteredReports.map(r => r.sdr).filter(Boolean)))];

        const displayRows = filteredReports.filter(r => {
          if (auditFilterSdr !== 'Todos' && r.sdr !== auditFilterSdr) return false;
          if (auditFilterOnlyActive && cfg.getValue(r) <= 0) return false;
          if (auditSearchQuery.trim()) {
            const q = auditSearchQuery.toLowerCase().trim();
            const sdr = (r.sdr || '').toLowerCase();
            const date = (r.timestamp || '').toLowerCase();
            const pos = String(r.respuestasPositivas || '');
            const neg = String(r.respuestasNegativas || '');
            const ghost = String(r.respuestasGhosting || '');
            const raw = `${pos}-${neg}-${ghost}`;
            if (!sdr.includes(q) && !date.includes(q) && !raw.includes(q)) return false;
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

    </>
  );
}

