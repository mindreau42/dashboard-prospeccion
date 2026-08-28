import React from 'react';
import { Trophy, ShieldCheck, AlertCircle, PauseCircle, Zap, UserCheck } from 'lucide-react';

export default function SdrLeaderboard({ reports }) {
  // Aggregate stats per SDR
  const sdrStats = {};

  reports.forEach(r => {
    const sdrName = r.sdr || 'Desconocido';
    if (!sdrStats[sdrName]) {
      sdrStats[sdrName] = {
        name: sdrName,
        statusWaalaxy: r.estadoWaalaxy || 'Activa',
        enviadasWaalaxy: 0,
        aceptadasWaalaxy: 0,
        enviadasManual: 0,
        aceptadasManual: 0,
        m1: 0,
        m2: 0,
        m3: 0,
        leadsAgendados: 0,
        metasCumplidas: 0,
        totalReportes: 0
      };
    }

    const s = sdrStats[sdrName];
    s.enviadasWaalaxy += Number(r.conexionesEnviadasWaalaxy || 0);
    s.aceptadasWaalaxy += Number(r.conexionesAceptadasWaalaxy || 0);
    s.enviadasManual += Number(r.conexionesEnviadasManual || 0);
    s.aceptadasManual += Number(r.conexionesAceptadasManual || 0);
    s.m1 += Number(r.respuestasM1 || 0);
    s.m2 += Number(r.respuestasM2 || 0);
    s.m3 += Number(r.respuestasM3 || 0);
    s.totalReportes += 1;

    if (r.cumplioMeta === 'Sí') {
      s.metasCumplidas += 1;
    }

    if (r.nombreLeadAgendado && !r.nombreLeadAgendado.includes('Sin Agendamiento')) {
      s.leadsAgendados += 1;
    }
  });

  const sdrList = Object.values(sdrStats).sort((a, b) => {
    const totalAceptadasA = a.aceptadasWaalaxy + a.aceptadasManual;
    const totalAceptadasB = b.aceptadasWaalaxy + b.aceptadasManual;
    return totalAceptadasB - totalAceptadasA;
  });

  const getInitials = (name) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getWaalaxyBadge = (status) => {
    if (status === 'Activa') {
      return <span className="status-badge active"><ShieldCheck size={12} /> Activa</span>;
    } else if (status === 'Pausada') {
      return <span className="status-badge paused"><PauseCircle size={12} /> Pausada</span>;
    } else {
      return <span className="status-badge limited"><AlertCircle size={12} /> Limitada</span>;
    }
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <div className="section-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={18} color="#ffb700" />
          Ranking de Ejecutivos SDR (Leaderboard Core)
        </h3>
        <span style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>
          Evaluación comparativa individual por volumen y conversión
        </span>
      </div>

      <div className="sdr-grid">
        {sdrList.map((sdr, index) => {
          const totalEnviadas = sdr.enviadasWaalaxy + sdr.enviadasManual;
          const totalAceptadas = sdr.aceptadasWaalaxy + sdr.aceptadasManual;
          const tasaAceptacion = totalEnviadas > 0 ? ((totalAceptadas / totalEnviadas) * 100).toFixed(1) : 0;
          const totalResp = sdr.m1 + sdr.m2 + sdr.m3;
          const pctCumplimiento = sdr.totalReportes > 0 ? ((sdr.metasCumplidas / sdr.totalReportes) * 100).toFixed(0) : 0;

          return (
            <div key={sdr.name} className="glass-panel sdr-card-futuristic">
              {index === 0 && <div className="kpi-laser-line" style={{ background: 'var(--grad-amber-glow)', color: '#ffb700' }} />}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="sdr-avatar-cyber">
                    {getInitials(sdr.name)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>{sdr.name}</h4>
                    <div style={{ marginTop: '2px' }}>{getWaalaxyBadge(sdr.statusWaalaxy)}</div>
                  </div>
                </div>

                <span
                  className="rank-badge-futuristic"
                  style={{
                    background: index === 0 ? 'rgba(255, 183, 0, 0.2)' : 'rgba(0, 240, 255, 0.1)',
                    color: index === 0 ? '#ffb700' : '#00f0ff',
                    border: `1px solid ${index === 0 ? 'rgba(255, 183, 0, 0.4)' : 'rgba(0, 240, 255, 0.3)'}`,
                    boxShadow: index === 0 ? '0 0 12px rgba(255, 183, 0, 0.3)' : 'none'
                  }}
                >
                  <Trophy size={11} color={index === 0 ? '#ffb700' : '#00f0ff'} /> #{index + 1}
                </span>
              </div>

              {/* Acceptance Bar */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Tasa de Aceptación</span>
                  <strong style={{ color: '#00f0ff', fontWeight: 800 }}>{tasaAceptacion}%</strong>
                </div>
                <div className="mini-progress-bg">
                  <div
                    className="mini-progress-fill"
                    style={{ width: `${Math.min(100, tasaAceptacion)}%`, background: 'var(--grad-cyan-glow)', color: '#00f0ff' }}
                  />
                </div>
              </div>

              {/* Grid Data */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                background: 'rgba(3, 7, 18, 0.7)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-cyber)'
              }}>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '11px', fontWeight: 700 }}>Contactos</div>
                  <div style={{ fontWeight: 900, color: '#ffffff', fontSize: '15px' }}>{totalEnviadas}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{totalAceptadas} aceptados</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '11px', fontWeight: 700 }}>Respuestas</div>
                  <div style={{ fontWeight: 900, color: '#b87cff', fontSize: '15px' }}>{totalResp}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>M1: {sdr.m1} · M2: {sdr.m2}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '11px', fontWeight: 700 }}>Demos Agendadas</div>
                  <div style={{ fontWeight: 900, color: '#00ff9d', fontSize: '15px' }}>{sdr.leadsAgendados}</div>
                  <div style={{ fontSize: '11px', color: '#00ff9d' }}>Citas fijadas</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '11px', fontWeight: 700 }}>Meta Semanal</div>
                  <div style={{ fontWeight: 900, color: pctCumplimiento >= 80 ? '#00ff9d' : '#ffb700', fontSize: '15px' }}>
                    {pctCumplimiento}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sdr.metasCumplidas}/{sdr.totalReportes} metas</div>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
