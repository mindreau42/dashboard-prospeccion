import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  BarChart2, MessageSquareText, Globe,
  AlertCircle, TrendingUp, CheckCircle2
} from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement,
  Title, Tooltip, Legend
);

const TOOLTIP = {
  backgroundColor: '#07101e',
  borderColor: 'rgba(0,240,255,0.35)',
  borderWidth: 1,
  titleColor: '#fff',
  bodyColor: '#94a3b8',
  padding: 12,
  cornerRadius: 8,
  titleFont: { family: 'Plus Jakarta Sans', weight: '800' },
  bodyFont: { family: 'Plus Jakarta Sans' }
};

const LEGEND = {
  labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' }, boxWidth: 12, padding: 14 }
};

const SCALE_V = {
  x: { ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans', weight: '700', size: 12 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
  y: { ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans', weight: '700', size: 12 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
};

const SCALE_H = {
  x: { ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans', weight: '700', size: 12 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
  y: { ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', weight: '700', size: 12 } }, grid: { color: 'rgba(0,0,0,0)' } }
};

const COUNTRY_COLORS = ['#00f0ff', '#3b82f6', '#00ff9d', '#ffb700', '#ff2a6d', '#d946ef'];
const MOTIVO_COLORS = ['#ff2a6d', '#ffb700', '#00f0ff', '#d946ef'];

function aggregateSdr(reports) {
  const map = {};
  reports.forEach(r => {
    const n = r.sdr || 'Desconocido';
    if (!map[n]) map[n] = { enviadas: 0, aceptadas: 0 };
    map[n].enviadas += Number(r.conexionesEnviadasWaalaxy || 0) + Number(r.conexionesEnviadasManual || 0);
    map[n].aceptadas += Number(r.conexionesAceptadasWaalaxy || 0) + Number(r.conexionesAceptadasManual || 0);
  });
  return map;
}

/* ── Donut with centered text overlay ── */
function DonutWithCenter({ data, opts, centerLabel, centerSub, accentColor }) {
  return (
    <div className="circular-progress-3d-wrap" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 3D Drop-Shadow Filtered Doughnut Canvas */}
      <div style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 10px 16px rgba(15, 23, 42, 0.16)) drop-shadow(0 2px 4px rgba(15, 23, 42, 0.08))' }}>
        <Doughnut data={data} options={opts} />
      </div>
      {/* Pedestal shadow */}
      <div style={{
        position: 'absolute',
        bottom: '2px',
        left: '15%',
        right: '15%',
        height: '14px',
        background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.22) 0%, rgba(15, 23, 42, 0) 72%)',
        filter: 'blur(4px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none',
        lineHeight: 1.2,
        zIndex: 2
      }}>
        <div style={{ fontSize: '26px', fontWeight: 900, color: accentColor, fontFamily: 'Plus Jakarta Sans' }}>
          {centerLabel}
        </div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginTop: '2px', fontFamily: 'Plus Jakarta Sans', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {centerSub}
        </div>
      </div>
    </div>
  );
}

// Custom external HTML tooltip for doughnut charts
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

const doughnutBase = {
  responsive: true, maintainAspectRatio: false, cutout: '74%',
  plugins: { legend: { display: false }, tooltip: { enabled: false, external: customHtmlTooltip } }
};

export default function ChartsSection({ reports, mode = 'all' }) {
  /* ── SDR data ── */
  const sdrMap = aggregateSdr(reports);
  const sdrNames = Object.keys(sdrMap);
  const envValues = sdrNames.map(n => sdrMap[n].enviadas);
  const aceValues = sdrNames.map(n => sdrMap[n].aceptadas);
  const tasaValues = sdrNames.map(n =>
    sdrMap[n].enviadas > 0 ? Number(((sdrMap[n].aceptadas / sdrMap[n].enviadas) * 100).toFixed(1)) : 0
  );

  const sdrVolumeData = {
    labels: sdrNames,
    datasets: [
      { label: 'Contactos Enviados', data: envValues, backgroundColor: '#2563eb', hoverBackgroundColor: '#3b82f6', borderRadius: { topLeft: 7, topRight: 7 }, maxBarThickness: 38 },
      { label: 'Conexiones Aceptadas', data: aceValues, backgroundColor: '#00f0ff', hoverBackgroundColor: '#6dfeff', borderRadius: { topLeft: 7, topRight: 7 }, maxBarThickness: 38 }
    ]
  };

  const sdrRateData = {
    labels: sdrNames,
    datasets: [{
      label: 'Tasa de Aceptación (%)',
      data: tasaValues,
      backgroundColor: sdrNames.map((_, i) => ['#00ff9d', '#00f0ff', '#d946ef', '#ffb700', '#ff2a6d'][i % 5]),
      borderRadius: { topRight: 7, bottomRight: 7 },
      maxBarThickness: 20
    }]
  };

  /* ── Mensajes ── */
  const totalM1 = reports.reduce((a, r) => a + Number(r.respuestasM1 || 0), 0);
  const totalM2 = reports.reduce((a, r) => a + Number(r.respuestasM2 || 0), 0);
  const totalM3 = reports.reduce((a, r) => a + Number(r.respuestasM3 || 0), 0);
  const totalMsgs = totalM1 + totalM2 + totalM3;
  const pctOf = v => totalMsgs > 0 ? ((v / totalMsgs) * 100).toFixed(0) : 0;

  const messagesData = {
    labels: [`M1 – Inicio (${pctOf(totalM1)}%)`, `M2 – Seguimiento (${pctOf(totalM2)}%)`, `M3 – Cierre (${pctOf(totalM3)}%)`],
    datasets: [{
      label: 'Respuestas',
      data: [totalM1, totalM2, totalM3],
      backgroundColor: ['#00f0ff', '#d946ef', '#00ff9d'],
      borderRadius: { topLeft: 7, topRight: 7 },
      maxBarThickness: 54
    }]
  };

  /* ── País Normalizado ── */
  const normalizeCountry = (c) => {
    if (!c) return '';
    const s = String(c).trim();
    const l = s.toLowerCase();
    if (['todos', 'general', 'n/a', 'ninguno', 'ninguna', '—', '-', '0', 'pais', 'país'].includes(l)) return '';
    if (l.includes('colombia')) return 'Colombia';
    if (l.includes('mexic') || l.includes('méxic')) return 'México';
    if (l.includes('usa') || l.includes('estados unidos') || l.includes('eeuu') || l.includes('united states')) return 'USA';
    if (l.includes('venezuela')) return 'Venezuela';
    if (l.includes('ecuador')) return 'Ecuador';
    if (l.includes('peru') || l.includes('perú')) return 'Perú';
    if (l.includes('chile')) return 'Chile';
    if (l.includes('argentina')) return 'Argentina';
    if (l.includes('panama') || l.includes('panamá')) return 'Panamá';
    if (l.includes('espana') || l.includes('españa') || l.includes('spain')) return 'España';
    if (l.includes('costa rica')) return 'Costa Rica';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const countryCounts = {};
  reports.forEach(r => {
    const raw = r.pais || r.agendamientoPorPais || '';
    const parts = String(raw).split(/[,/&|+\n]+|\s+y\s+/i);
    const seen = [];
    parts.forEach(p => {
      const n = normalizeCountry(p);
      if (n && !seen.includes(n)) seen.push(n);
    });
    const finalCountries = seen.length > 0 ? seen : ['Colombia'];
    finalCountries.forEach(c => {
      countryCounts[c] = (countryCounts[c] || 0) + 1;
    });
  });

  const totalPaises = Object.values(countryCounts).reduce((a, b) => a + b, 0);

  const countryData = {
    labels: Object.keys(countryCounts),
    datasets: [{
      data: Object.values(countryCounts),
      backgroundColor: COUNTRY_COLORS,
      borderWidth: 3,
      borderColor: '#0a1420'
    }]
  };

  /* ── Motivos ── */
  const motivoCounts = {};
  reports.filter(r => r.cumplioMeta === 'No').forEach(r => {
    const m = r.motivoNoCumplimiento || 'No especificado';
    motivoCounts[m] = (motivoCounts[m] || 0) + 1;
  });
  const totalNoCumplieron = Object.values(motivoCounts).reduce((a, b) => a + b, 0);

  const motivosData = {
    labels: Object.keys(motivoCounts).length ? Object.keys(motivoCounts) : ['Metas cumplidas'],
    datasets: [{
      data: Object.keys(motivoCounts).length ? Object.values(motivoCounts) : [1],
      backgroundColor: Object.keys(motivoCounts).length ? MOTIVO_COLORS : ['#00ff9d'],
      borderWidth: 3,
      borderColor: '#0a1420'
    }]
  };

  const vertOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { ...LEGEND, position: 'top' }, tooltip: TOOLTIP }, scales: SCALE_V };
  const horzOpts = { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: TOOLTIP }, scales: SCALE_H };

  /* ─── SDR ONLY ─── */
  if (mode === 'sdr_only') {
    return (
      <div className="charts-grid">
        <div className="glass-panel chart-card col-7">
          <div className="chart-header" style={{ marginBottom: 18 }}>
            <h3><BarChart2 size={17} color="#00f0ff" /> Volumen: Envíos vs. Aceptaciones por SDR</h3>
            <p>Cantidad de contactos enviados y conexiones aceptadas por ejecutivo comercial.</p>
          </div>
          <div className="chart-container" style={{ minHeight: 290 }}>
            <Bar data={sdrVolumeData} options={vertOpts} />
          </div>
        </div>

        <div className="glass-panel chart-card col-5">
          <div className="chart-header" style={{ marginBottom: 18 }}>
            <h3><TrendingUp size={17} color="#00ff9d" /> Tasa de Aceptación por SDR (%)</h3>
            <p>Porcentaje de conexiones aceptadas sobre el total de solicitudes enviadas.</p>
          </div>
          <div className="chart-container" style={{ minHeight: 290 }}>
            <Bar data={sdrRateData} options={horzOpts} />
          </div>
        </div>
      </div>
    );
  }

  /* ─── ANALYTICS ─── */
  return (
    <div className="charts-grid">

      {/* Row 1 — Mensajes + País (two equal halves) */}
      <div className="glass-panel chart-card col-6">
        <div className="chart-header" style={{ marginBottom: 18 }}>
          <h3><MessageSquareText size={17} color="#d946ef" /> Efectividad por Etapa de Mensaje</h3>
          <p>Respuestas capturadas en M1 (inicio), M2 (seguimiento) y M3 (cierre).</p>
        </div>
        <div className="chart-container" style={{ minHeight: 260 }}>
          <Bar data={messagesData} options={vertOpts} />
        </div>
      </div>

      <div className="glass-panel chart-card col-6">
        <div className="chart-header" style={{ marginBottom: 18 }}>
          <h3><Globe size={17} color="#00f0ff" /> Distribución Geográfica por País</h3>
          <p>Proporción del esfuerzo comercial por región objetivo.</p>
        </div>
        {/* Two equal columns: donut + legend bars */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center', flex: 1 }}>
          <div style={{ position: 'relative', height: 230 }}>
            <DonutWithCenter
              data={countryData}
              opts={doughnutBase}
              centerLabel={totalPaises}
              centerSub="Reportes"
              accentColor="#00f0ff"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {Object.entries(countryCounts).map(([country, count], i) => {
              const pctC = totalPaises > 0 ? ((count / totalPaises) * 100).toFixed(0) : 0;
              const color = COUNTRY_COLORS[i % COUNTRY_COLORS.length];
              return (
                <div key={country} style={{ background: 'rgba(4,8,20,0.7)', border: `1px solid ${color}35`, borderRadius: 8, padding: '9px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#e2e8f0' }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
                      {country}
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 900, color }}>{count} ({pctC}%)</span>
                  </div>
                  <div className="mini-progress-bg" style={{ height: 4 }}>
                    <div className="mini-progress-fill" style={{ width: `${pctC}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2 — Causas unified card (full width, 2 symmetric halves) */}
      <div className="glass-panel chart-card col-12">
        <div className="chart-header" style={{ marginBottom: 22 }}>
          <h3><AlertCircle size={17} color="#ff2a6d" /> Análisis de Causas de No Cumplimiento de Meta Semanal</h3>
          <p>Motivos reportados por los ejecutivos SDRs al no concretar los objetivos de agendamiento del período.</p>
        </div>

        {/* Two perfectly symmetric halves */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>

          {/* LEFT — donut with center label */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', height: 240, width: '100%', maxWidth: 280, margin: '0 auto' }}>
              <DonutWithCenter
                data={motivosData}
                opts={doughnutBase}
                centerLabel={totalNoCumplieron || '✓'}
                centerSub={totalNoCumplieron > 0 ? 'SDR sin meta' : 'Todos en meta'}
                accentColor={totalNoCumplieron > 0 ? '#ff2a6d' : '#00ff9d'}
              />
            </div>

            {/* Donut legend pills below the chart */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {motivosData.labels.map((label, i) => {
                const color = Object.keys(motivoCounts).length ? MOTIVO_COLORS[i % MOTIVO_COLORS.length] : '#00ff9d';
                return (
                  <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: `${color}18`, border: `1px solid ${color}50`, borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    {label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* RIGHT — motivo breakdown bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.keys(motivoCounts).length > 0 ? (
              Object.entries(motivoCounts).map(([reason, count], i) => {
                const color = MOTIVO_COLORS[i % MOTIVO_COLORS.length];
                const maxCount = Math.max(...Object.values(motivoCounts));
                const pctBar = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const totalReports = reports.length;
                const pctTotal = totalReports > 0 ? ((count / totalReports) * 100).toFixed(0) : 0;
                return (
                  <div key={reason} style={{ padding: '16px 20px', background: 'rgba(4,8,20,0.75)', border: `1px solid ${color}35`, borderLeft: `3px solid ${color}`, borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: '#f1f5f9' }}>{reason}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>{pctTotal}% del total</span>
                        <span style={{ fontSize: 12.5, fontWeight: 900, color, padding: '3px 10px', background: `${color}20`, borderRadius: 12, border: `1px solid ${color}50` }}>
                          {count} SDR{count > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="mini-progress-bg" style={{ height: 6 }}>
                      <div className="mini-progress-fill" style={{ width: `${pctBar}%`, background: color, boxShadow: `0 0 10px ${color}` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '28px 24px', background: 'rgba(0,255,157,0.07)', border: '1px solid rgba(0,255,157,0.35)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
                <CheckCircle2 size={28} color="#00ff9d" />
                <div>
                  <div style={{ fontWeight: 900, color: '#00ff9d', fontSize: 15 }}>Sin incidencias reportadas</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Todas las metas semanales del período fueron cumplidas satisfactoriamente.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
