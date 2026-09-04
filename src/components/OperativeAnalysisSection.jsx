import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import {
  Globe,
  PieChart,
  Target,
  Bot,
  MessageSquareText,
  Database,
  Layers,
  Users,
  Tag,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { matchesDateRange, getWeeksFromReports, matchesWeek } from '../utils/security';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const TOOLTIP_CONFIG = {
  backgroundColor: '#0f172a',
  borderColor: '#cbd5e1',
  borderWidth: 1,
  titleColor: '#ffffff',
  bodyColor: '#f8fafc',
  padding: 10,
  cornerRadius: 6,
  titleFont: { family: 'Plus Jakarta Sans', weight: '700' },
  bodyFont: { family: 'Plus Jakarta Sans' }
};

const PALETTE_LIGHT = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#dc2626', '#0284c7', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#6366f1', '#14b8a6'];

function AnimatedBar({ width, background, height = 7, borderRadius = 9999 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setW(width), 40);
    return () => clearTimeout(timer);
  }, [width]);

  return (
    <div className="mini-progress-bg" style={{ height, borderRadius, marginTop: '3px' }}>
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

// Custom external tooltip to guarantee rendering OVER all badges, orbs and containers
const customHtmlTooltip = (context) => {
  let tooltipEl = document.getElementById('chartjs-donut-tooltip');

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chartjs-donut-tooltip';
    tooltipEl.style.background = 'rgba(15, 23, 42, 0.94)';
    tooltipEl.style.backdropFilter = 'blur(6px)';
    tooltipEl.style.WebkitBackdropFilter = 'blur(6px)';
    tooltipEl.style.borderRadius = '8px';
    tooltipEl.style.color = '#ffffff';
    tooltipEl.style.opacity = '0';
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.position = 'fixed';
    tooltipEl.style.transform = 'translate(-50%, -115%)';
    tooltipEl.style.transition = 'opacity 0.12s ease, transform 0.12s ease';
    tooltipEl.style.padding = '8px 12px';
    tooltipEl.style.zIndex = '999999';
    tooltipEl.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15)';
    tooltipEl.style.fontFamily = 'Plus Jakarta Sans, sans-serif';
    tooltipEl.style.fontSize = '12px';
    tooltipEl.style.whiteSpace = 'nowrap';
    document.body.appendChild(tooltipEl);
  }

  const tooltipModel = context.tooltip;
  if (tooltipModel.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  if (tooltipModel.body) {
    const titleLines = tooltipModel.title || [];
    const bodyLines = tooltipModel.body.map(b => b.lines);

    let innerHtml = '';
    titleLines.forEach(title => {
      innerHtml += `<div style="font-weight: 800; font-size: 12px; margin-bottom: 4px; color: #ffffff;">${title}</div>`;
    });
    bodyLines.forEach((body, i) => {
      const colors = tooltipModel.labelColors[i] || {};
      const bg = colors.backgroundColor || '#38bdf8';
      innerHtml += `<div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 11.5px; color: #f1f5f9;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${bg}; display: inline-block; flex-shrink: 0;"></span>
        <span>${body}</span>
      </div>`;
    });

    tooltipEl.innerHTML = innerHtml;
  }

  const rect = context.chart.canvas.getBoundingClientRect();
  tooltipEl.style.opacity = '1';
  tooltipEl.style.left = `${rect.left + tooltipModel.caretX}px`;
  tooltipEl.style.top = `${rect.top + tooltipModel.caretY}px`;
};

function DonutCenter({ data, centerVal, centerLabel, accentColor = '#2563eb' }) {
  const [isHovered, setIsHovered] = useState(false);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '66%',
    spacing: 3,
    borderRadius: 4,
    animation: {
      duration: 750,
      easing: 'easeOutQuart',
      animateRotate: true,
      animateScale: false
    },
    transitions: {
      active: {
        animation: {
          duration: 200
        }
      }
    },
    onHover: (event, chartElements) => {
      setIsHovered(chartElements && chartElements.length > 0);
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: customHtmlTooltip
      }
    }
  };

  return (
    <div className="circular-progress-3d-wrap" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Dynamic 3D Pedestal Shadow */}
      <div style={{
        position: 'absolute',
        bottom: '2px',
        left: '15%',
        right: '15%',
        height: '14px',
        background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.28) 0%, rgba(15, 23, 42, 0) 72%)',
        filter: 'blur(4px)',
        pointerEvents: 'none'
      }} />

      {/* 3D Drop-Shadow Filtered Doughnut Canvas */}
      <div style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 10px 16px rgba(15, 23, 42, 0.18)) drop-shadow(0 2px 4px rgba(15, 23, 42, 0.1))' }}>
        <Doughnut data={data} options={options} />
      </div>

      {/* Floating 3D Orb Badge in Center */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '58px',
        height: '58px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #f8fafc 55%, #e2e8f0 100%)',
        boxShadow: '0 4px 10px rgba(15, 23, 42, 0.16), inset 0 2px 3px #ffffff, inset 0 -2px 3px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 2
      }}>
        <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{centerVal}</div>
        <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.04em' }}>{centerLabel}</div>
      </div>
    </div>
  );
}

export default function OperativeAnalysisSection({ reports = [] }) {
  // Solo 2 pestañas solicitadas: Diagnósticos y Agendamientos (eliminada Prosp.)
  const [countryMetricTab, setCountryMetricTab] = useState('diagnosticos');

  // ── Filters State (Semana, SDR, Rango) ──
  const [selectedWeek, setSelectedWeek] = useState('Todos');
  const [selectedSdr, setSelectedSdr] = useState('Todos');
  const [selectedDateFrom, setSelectedDateFrom] = useState('');
  const [selectedDateTo, setSelectedDateTo] = useState('');

  const uniqueSdrs = ['Todos', ...Array.from(new Set(reports.map(r => r.sdr).filter(Boolean)))];
  const availableWeeks = getWeeksFromReports(reports);

  const isFiltered = selectedWeek !== 'Todos' || selectedSdr !== 'Todos' || selectedDateFrom !== '' || selectedDateTo !== '';

  const resetFilters = () => {
    setSelectedWeek('Todos');
    setSelectedSdr('Todos');
    setSelectedDateFrom('');
    setSelectedDateTo('');
  };

  const filteredReports = reports.filter(r => {
    const weekMatch = matchesWeek(r.timestamp, selectedWeek);
    const sdrMatch = selectedSdr === 'Todos' || r.sdr === selectedSdr;
    const dateMatch = matchesDateRange(r.timestamp, selectedDateFrom, selectedDateTo);
    return weekMatch && sdrMatch && dateMatch;
  });

  // ── 1. CÁLCULO DINÁMICO DE PAÍSES (DIAG Y AGEND) ──
  const normalizeCountry = (str) => {
    if (!str) return 'Otros';
    const s = str.trim();
    const l = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (l === 'mexico') return 'México';
    if (l === 'colombia') return 'Colombia';
    if (l === 'usa' || l === 'estados unidos' || l === 'eeuu') return 'USA';
    if (l === 'espana') return 'España';
    if (l === 'peru') return 'Perú';
    if (l === 'chile') return 'Chile';
    if (l === 'ecuador') return 'Ecuador';
    if (l === 'panama') return 'Panamá';
    if (l === 'argentina') return 'Argentina';
    if (l === 'bolivia') return 'Bolivia';
    if (l === 'venezuela') return 'Venezuela';
    if (l === 'nicaragua') return 'Nicaragua';
    if (l === 'costa rica') return 'Costa Rica';
    if (l.includes('dominicana')) return 'República Dominicana';
    if (l === 'todos' || l === 'general') return 'Otros';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const countryMetrics = {
    diagnosticos: {},
    agendamientos: {}
  };

  filteredReports.forEach(r => {
    // Diagnósticos por país (lee el desglose detallado "México: 16, Colombia: 2" o r.pais)
    const diagRaw = r.diagnosticosPorPais || '';
    if (diagRaw && (diagRaw.includes(':') || diagRaw.includes(','))) {
      const parts = diagRaw.split(/[,;\n]+/);
      let parsedAny = false;
      parts.forEach(part => {
        const item = part.trim();
        if (!item) return;
        const pairRegex = /([a-zA-ZáéíóúÁÉÍÓÚñÑ.\s]+?)(?::\s*|\s+)(\d+)/g;
        let m;
        while ((m = pairRegex.exec(item)) !== null) {
          const rawC = m[1].trim().replace(/^[,\s]+|[,\s]+$/g, '');
          if (rawC && rawC.length >= 2) {
            const cNorm = normalizeCountry(rawC);
            const val = parseInt(m[2], 10) || 0;
            if (val > 0) {
              countryMetrics.diagnosticos[cNorm] = (countryMetrics.diagnosticos[cNorm] || 0) + val;
              parsedAny = true;
            }
          }
        }
      });
      if (!parsedAny) {
        const cNorm = normalizeCountry(r.pais);
        countryMetrics.diagnosticos[cNorm] = (countryMetrics.diagnosticos[cNorm] || 0) + Number(r.diagnosticos || 0);
      }
    } else {
      const cNorm = normalizeCountry(r.pais);
      countryMetrics.diagnosticos[cNorm] = (countryMetrics.diagnosticos[cNorm] || 0) + Number(r.diagnosticos || 0);
    }

    // Agendamientos por país (estricto de la columna agendamientos)
    const agendVal = Number(r.agendamientos || 0);
    if (agendVal > 0) {
      const agendCountryRaw = r.agendamientoPorPais || r.pais || 'Colombia';
      const aCountry = normalizeCountry(agendCountryRaw);
      countryMetrics.agendamientos[aCountry] = (countryMetrics.agendamientos[aCountry] || 0) + agendVal;
    }
  });

  const activeMap = countryMetrics[countryMetricTab] || countryMetrics.diagnosticos;
  const activeEntries = Object.entries(activeMap).filter(([_, val]) => val > 0);

  // Ordenar países de mayor a menor (sin descartar ningún país)
  const sortedCountryEntries = activeEntries.sort((a, b) => b[1] - a[1]);

  const countryKeys = sortedCountryEntries.map(([c]) => c);
  const activeCountryValues = sortedCountryEntries.map(([_, v]) => v);
  const totalActiveCountryVal = activeCountryValues.reduce((a, b) => a + b, 0);

  const countryChartData = {
    labels: countryKeys,
    datasets: [{
      data: activeCountryValues,
      backgroundColor: PALETTE_LIGHT.slice(0, countryKeys.length),
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // ── 2. SECTOR / CATEGORÍA (ORDENADOS DE MAYOR A MENOR) ──
  const categoryCounts = {};
  filteredReports.forEach(r => {
    const rawCat = (r.categoria || '').trim();
    let c = 'Otros';
    const low = rawCat.toLowerCase();
    if (low.includes('recursos')) c = 'Recursos Humanos';
    else if (low.includes('desarrollo')) c = 'Desarrollo Personal';
    else if (low.includes('direcci') || low.includes('dirección')) c = 'Dirección';
    else if (low.includes('bienestar') || low.includes('salud')) c = 'Bienestar & Salud';
    else if (low.includes('admin')) c = 'Administrativo';
    else if (rawCat) c = rawCat;
    else c = 'Recursos Humanos';
    categoryCounts[c] = (categoryCounts[c] || 0) + 1;
  });

  // Ordenar de mayor a menor
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const categoryLabels = sortedCategories.map(([cat]) => cat);
  const categoryValues = sortedCategories.map(([_, val]) => val);
  const totalCategoriesCount = categoryValues.reduce((a, b) => a + b, 0) || filteredReports.length || 1;
  const numSectores = sortedCategories.length;

  const CATEGORY_COLORS = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#dc2626'];

  const categoryChartData = {
    labels: categoryLabels,
    datasets: [{
      data: categoryValues,
      backgroundColor: CATEGORY_COLORS.slice(0, categoryLabels.length),
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // ── 3. CUMPLIMIENTO DE META & MOTIVOS (ORDENADOS DE MAYOR A MENOR) ──
  const cumplioSi = filteredReports.filter(r => (r.cumplioMeta && (
    String(r.cumplioMeta).toLowerCase() === 'sí' ||
    String(r.cumplioMeta).toLowerCase() === 'si' ||
    String(r.cumplioMeta).toLowerCase().startsWith('si') ||
    String(r.cumplioMeta).toLowerCase().startsWith('sí') ||
    String(r.cumplioMeta) === '1'
  ) && !String(r.cumplioMeta).toLowerCase().startsWith('no'))).length;

  const rawMotivoCounts = {};
  filteredReports.forEach(r => {
    const raw = (r.motivoNoCumplimiento || r.motivoNo || '').trim();
    if (!raw || raw.toLowerCase() === 'undefined' || raw === '-' || raw === '—' || raw.toLowerCase() === 'n/a') return;

    const low = raw.toLowerCase();
    let m = '';
    if (low.includes('segmentaci')) m = 'Mala Segmentación';
    else if (low.includes('tope') || low.includes('conexiones')) m = 'Tope de Conexiones';
    else if (low.includes('personal') || low.includes('motivos')) m = 'Motivos Personales';
    else if (low.includes('seguimiento') || low.includes('falta')) m = 'Falta de Seguimiento';
    else if (raw.length > 2) m = raw;

    if (m) {
      rawMotivoCounts[m] = (rawMotivoCounts[m] || 0) + 1;
    }
  });

  // Ordenar motivos de mayor a menor
  const sortedMotivos = Object.entries(rawMotivoCounts).sort((a, b) => b[1] - a[1]);

  const metaLabels = ['Sí, cumplió la meta', ...sortedMotivos.map(([m]) => m)];
  const metaValues = [cumplioSi, ...sortedMotivos.map(([_, val]) => val)];
  const totalMeta = metaValues.reduce((a, b) => a + b, 0) || filteredReports.length || 1;
  const efectividadPct = totalMeta > 0 ? Math.round((cumplioSi / totalMeta) * 100) : 0;
  const metaColors = ['#059669', '#dc2626', '#d97706', '#7c3aed', '#2563eb', '#0284c7'];

  const metaChartData = {
    labels: metaLabels,
    datasets: [{
      data: metaValues,
      backgroundColor: metaColors.slice(0, metaLabels.length),
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // ── 4. ESTATUS | AUTOMATIZACIÓN (Estado actual por SDR / Cuenta única) ──
  const statusCounts = { 'Activa': 0, 'Bajo SSI': 0, 'Restringida': 0 };
  
  const normalizeSdrName = (name) => {
    if (!name) return '';
    return String(name).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  // Agrupamos por SDR para tomar el reporte más reciente de cada cuenta única
  const latestBySdr = {};
  filteredReports.forEach((r, idx) => {
    const sdrName = r.sdr || r.nombre || '';
    const norm = normalizeSdrName(sdrName);
    if (!norm || norm.length < 3 || norm.includes('agendad') || norm.includes('desconocid')) return;
    
    if (r.estadoWaalaxy && String(r.estadoWaalaxy).trim().length > 0) {
      latestBySdr[norm] = {
        sdr: sdrName,
        estadoWaalaxy: r.estadoWaalaxy,
        idx
      };
    } else if (!latestBySdr[norm]) {
      latestBySdr[norm] = {
        sdr: sdrName,
        estadoWaalaxy: 'Activo',
        idx
      };
    }
  });

  Object.values(latestBySdr).forEach(r => {
    const rawSt = (r.estadoWaalaxy || '').toLowerCase();
    if (rawSt.includes('restring') || rawSt.includes('restricci') || rawSt.includes('bloq') || rawSt.includes('paus')) {
      statusCounts['Restringida']++;
    } else if (rawSt.includes('ssi') || rawSt.includes('bajo')) {
      statusCounts['Bajo SSI']++;
    } else {
      statusCounts['Activa']++;
    }
  });

  const totalWaalaxy = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const statusChartData = {
    labels: ['Activa', 'Bajo SSI', 'Restringida'],
    datasets: [{
      data: [statusCounts['Activa'], statusCounts['Bajo SSI'], statusCounts['Restringida']],
      backgroundColor: ['#059669', '#d97706', '#dc2626'],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // ── 5. EFECTIVIDAD DE MENSAJES (M1, M2, M3) ──
  const totalM1 = filteredReports.reduce((a, r) => a + Number(r.respuestasM1 || 0), 0);
  const totalM2 = filteredReports.reduce((a, r) => a + Number(r.respuestasM2 || 0), 0);
  const totalM3 = filteredReports.reduce((a, r) => a + Number(r.respuestasM3 || 0), 0);
  const totalMsgs = totalM1 + totalM2 + totalM3;

  // ── 6. ORIGEN DE PROSPECCIÓN (BASE DE DATOS: 10, OUTBOUND: 10, SCRAPING: 5) ──
  const originCounts = {
    'Base de Datos': 0,
    'Outbound': 0,
    'Scraping': 0
  };

  filteredReports.forEach((r) => {
    const orig = (r.origenProspeccion || r.origen || '').trim().toLowerCase();
    if (orig.includes('base') || orig.includes('datos') || orig.includes('bd')) {
      originCounts['Base de Datos']++;
    } else if (orig.includes('outbound')) {
      originCounts['Outbound']++;
    } else if (orig.includes('scraping') || orig.includes('scrap')) {
      originCounts['Scraping']++;
    }
  });

  const targetOriginOrder = ['Base de Datos', 'Outbound', 'Scraping'];
  const totalOrigins = (originCounts['Base de Datos'] || 0) + (originCounts['Outbound'] || 0) + (originCounts['Scraping'] || 0) || 1;

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

  return (
    <div style={{ marginBottom: '32px' }}>
      
      {/* ─── TÍTULO DISTRIBUCIÓN & SEGMENTACIÓN Y BARRA DE FILTROS ─── */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.02em', margin: 0 }}>
              <Layers size={19} color="#2563eb" />
              Distribución &amp; Segmentación
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px', margin: '3px 0 0' }}>
              Desempeño geográfico, sectorial y de automatización ({filteredReports.length} registros)
            </p>
          </div>

          {/* Filter Toolbar */}
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
        </div>
      </div>

      {/* ─── GRID: 4 TARJETAS A LA IZQUIERDA Y MÉTRICAS POR PAÍS ALTA A LA DERECHA ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.15fr)',
        gap: '16px',
        alignItems: 'stretch'
      }}>

        {/* ── COLUMNA IZQUIERDA (FILA 1: 2 TORTAS, FILA 2: 2 BARRAS) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* FILA 1: 2 GRÁFICAS DE TORTA / DONUT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* ── TARJETA 1: SECTOR | CATEGORÍA ── */}
            <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <PieChart size={15} color="#7c3aed" />
                  Sector | Categoría
                </h4>
                <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 800, background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '2px 8px', borderRadius: '12px' }}>
                  Segmentos
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '115px 1fr', gap: '12px', alignItems: 'center', flex: 1 }}>
                <div style={{ height: '125px' }}>
                  <DonutCenter
                    data={categoryChartData}
                    centerVal={numSectores}
                    centerLabel="Sectores"
                    accentColor="#2563eb"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 }}>
                  {sortedCategories.map(([cat, count], i) => {
                    const pct = totalCategoriesCount > 0 ? ((count / totalCategoriesCount) * 100).toFixed(0) : 0;
                    const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                    return (
                      <div key={cat} style={{ background: '#f8fafc', padding: '5px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 800, marginBottom: '2px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                            {cat}
                          </span>
                          <span style={{ color, fontSize: '11px', fontWeight: 900 }}>{pct}%</span>
                        </div>
                        <AnimatedBar width={pct} background={color} height={6} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── TARJETA 2: CUMPLIMIENTO DE META ── */}
            <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Target size={15} color="#059669" />
                  Cumplimiento de Meta
                </h4>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 800, background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '12px' }}>
                  Agendamientos
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '115px 1fr', gap: '12px', alignItems: 'center', flex: 1 }}>
                <div style={{ height: '125px' }}>
                  <DonutCenter
                    data={metaChartData}
                    centerVal={`${efectividadPct}%`}
                    centerLabel="Efectividad"
                    accentColor="#059669"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 }}>
                  {metaLabels.map((lbl, i) => {
                    const val = metaValues[i];
                    const pct = totalMeta > 0 ? ((val / totalMeta) * 100).toFixed(0) : 0;
                    const color = metaColors[i % metaColors.length];
                    return (
                      <div key={lbl} style={{ background: '#f8fafc', padding: '5px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 800, marginBottom: '2px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                            {lbl}
                          </span>
                          <span style={{ color, fontSize: '11px', fontWeight: 900 }}>{val} ({pct}%)</span>
                        </div>
                        <AnimatedBar width={pct} background={color} height={6} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* FILA 2: 2 GRÁFICAS DE BARRAS HORIZONTALES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* ── TARJETA 3: ESTATUS | AUTOMATIZACIÓN ── */}
            <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <Bot size={15} color="#059669" />
                    Estatus | Automatización
                  </h4>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 800, background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '12px' }}>
                    {totalWaalaxy} Cuentas
                  </span>
                </div>

                {/* Barra segmentada global superior */}
                <div style={{ height: '8px', borderRadius: '6px', background: '#e2e8f0', display: 'flex', overflow: 'hidden', marginBottom: '14px' }}>
                  <div style={{ width: `${totalWaalaxy > 0 ? (statusCounts['Activa'] / totalWaalaxy) * 100 : 0}%`, background: '#10b981' }} title="Activa" />
                  <div style={{ width: `${totalWaalaxy > 0 ? (statusCounts['Bajo SSI'] / totalWaalaxy) * 100 : 0}%`, background: '#f59e0b' }} title="Bajo SSI" />
                  <div style={{ width: `${totalWaalaxy > 0 ? (statusCounts['Restringida'] / totalWaalaxy) * 100 : 0}%`, background: '#ef4444' }} title="Restringida" />
                </div>

                {/* Barras de datos individuales */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'Activa', count: statusCounts['Activa'] || 0, color: '#059669', barGradient: 'linear-gradient(90deg, #34d399, #059669)', bg: '#f0fdf4', border: '#bbf7d0' },
                    { label: 'Bajo SSI', count: statusCounts['Bajo SSI'] || 0, color: '#d97706', barGradient: 'linear-gradient(90deg, #fbbf24, #d97706)', bg: '#fffbeb', border: '#fde68a' },
                    { label: 'Restringida', count: statusCounts['Restringida'] || 0, color: '#dc2626', barGradient: 'linear-gradient(90deg, #f87171, #dc2626)', bg: '#fef2f2', border: '#fecaca' }
                  ].map(item => {
                    const pct = totalWaalaxy > 0 ? ((item.count / totalWaalaxy) * 100).toFixed(0) : 0;
                    return (
                      <div key={item.label} style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 800, color: item.color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color }} />
                            {item.label}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>
                            {item.count} <strong style={{ color: item.color, fontSize: '11px', fontWeight: 800 }}>({pct}%)</strong>
                          </span>
                        </div>
                        <AnimatedBar width={pct} background={item.barGradient} height={7} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── TARJETA 4: ORIGEN DE PROSPECCIÓN (SCRAPING - BASE DE DATOS - OUTBOUND) ── */}
            <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <Database size={15} color="#0284c7" />
                    Origen de Prospección
                  </h4>
                  <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 800, background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '12px' }}>
                    {totalOrigins} Registros
                  </span>
                </div>

                {/* Barra segmentada global superior */}
                <div style={{ height: '8px', borderRadius: '6px', background: '#e2e8f0', display: 'flex', overflow: 'hidden', marginBottom: '14px' }}>
                  <div style={{ width: `${totalOrigins > 0 ? (originCounts['Base de Datos'] / totalOrigins) * 100 : 0}%`, background: '#059669' }} title="Base de Datos" />
                  <div style={{ width: `${totalOrigins > 0 ? (originCounts['Outbound'] / totalOrigins) * 100 : 0}%`, background: '#2563eb' }} title="Outbound" />
                  <div style={{ width: `${totalOrigins > 0 ? (originCounts['Scraping'] / totalOrigins) * 100 : 0}%`, background: '#d97706' }} title="Scraping" />
                </div>

                {/* Barras de datos individuales en orden exacto */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { name: 'Base de Datos', count: originCounts['Base de Datos'] || 0, color: '#059669', barGradient: 'linear-gradient(90deg, #34d399, #059669)', bg: '#f0fdf4', border: '#bbf7d0' },
                    { name: 'Outbound', count: originCounts['Outbound'] || 0, color: '#2563eb', barGradient: 'linear-gradient(90deg, #60a5fa, #2563eb)', bg: '#eff6ff', border: '#bfdbfe' },
                    { name: 'Scraping', count: originCounts['Scraping'] || 0, color: '#d97706', barGradient: 'linear-gradient(90deg, #fbbf24, #d97706)', bg: '#fffbeb', border: '#fde68a' }
                  ].map(item => {
                    const pct = totalOrigins > 0 ? ((item.count / totalOrigins) * 100).toFixed(0) : 0;
                    return (
                      <div key={item.name} style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 800, color: item.color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color }} />
                            {item.name}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>
                            {item.count} <strong style={{ color: item.color, fontSize: '11px', fontWeight: 800 }}>({pct}%)</strong>
                          </span>
                        </div>
                        <AnimatedBar width={pct} background={item.barGradient} height={7} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ── COLUMNA DERECHA: MÉTRICAS POR PAÍS (ALTA CON ESPACIO AMPLIO) ── */}
        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Globe size={15} color="#2563eb" />
              Métricas por País
            </h4>
            
            {/* Selector de Pestaña Diag / Agend */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              {[
                { id: 'diagnosticos', label: 'Diag.' },
                { id: 'agendamientos', label: 'Agend.' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCountryMetricTab(tab.id)}
                  style={{
                    background: countryMetricTab === tab.id ? '#2563eb' : 'transparent',
                    color: countryMetricTab === tab.id ? '#ffffff' : '#64748b',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: '140px', marginBottom: '14px' }}>
            <DonutCenter
              data={countryChartData}
              centerVal={totalActiveCountryVal.toLocaleString()}
              centerLabel={countryMetricTab === 'diagnosticos' ? 'Diagnósticos' : 'Agendados'}
              accentColor="#2563eb"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto', maxHeight: '330px', paddingRight: '4px' }}>
            {countryKeys.map((country, i) => {
              const val = activeMap[country] || 0;
              const pct = totalActiveCountryVal > 0 ? ((val / totalActiveCountryVal) * 100).toFixed(0) : 0;
              const color = PALETTE_LIGHT[i % PALETTE_LIGHT.length];
              return (
                <div key={country} style={{ background: '#f8fafc', padding: '6px 9px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 800, marginBottom: '3px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0f172a' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                      {country}
                    </span>
                    <span style={{ color }}>{val.toLocaleString()} ({pct}%)</span>
                  </div>
                  <AnimatedBar width={pct} background={color} height={6} />
                </div>
              );
            })}
            {countryKeys.length === 0 && (
              <div style={{ fontSize: '11.5px', color: '#94a3b8', textAlign: 'center', padding: '16px' }}>
                Sin registros de países para esta métrica
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
