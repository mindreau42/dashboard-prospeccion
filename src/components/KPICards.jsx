import React from 'react';
import { Send, UserCheck, MessageSquare, CalendarCheck, Target, Zap } from 'lucide-react';

export default function KPICards({ reports }) {
  const totalEnviadasWaalaxy = reports.reduce((acc, r) => acc + Number(r.conexionesEnviadasWaalaxy || 0), 0);
  const totalEnviadasManual = reports.reduce((acc, r) => acc + Number(r.conexionesEnviadasManual || 0), 0);
  const totalEnviadas = totalEnviadasWaalaxy + totalEnviadasManual;

  const totalAceptadasWaalaxy = reports.reduce((acc, r) => acc + Number(r.conexionesAceptadasWaalaxy || 0), 0);
  const totalAceptadasManual = reports.reduce((acc, r) => acc + Number(r.conexionesAceptadasManual || 0), 0);
  const totalAceptadas = totalAceptadasWaalaxy + totalAceptadasManual;

  const tasaAceptacion = totalEnviadas > 0 ? Number(((totalAceptadas / totalEnviadas) * 100).toFixed(1)) : 0;

  const totalRespuestasM1 = reports.reduce((acc, r) => acc + Number(r.respuestasM1 || 0), 0);
  const totalRespuestasM2 = reports.reduce((acc, r) => acc + Number(r.respuestasM2 || 0), 0);
  const totalRespuestasM3 = reports.reduce((acc, r) => acc + Number(r.respuestasM3 || 0), 0);
  const totalRespuestas = totalRespuestasM1 + totalRespuestasM2 + totalRespuestasM3;

  const cumplieronMeta = reports.filter(r => r.cumplioMeta === 'Sí').length;
  const tasaCumplimiento = reports.length > 0 ? Number(((cumplieronMeta / reports.length) * 100).toFixed(0)) : 0;

  const leadsAgendadosCount = reports.filter(r =>
    r.cumplioMeta === 'Sí' || (r.nombreLeadAgendado && !r.nombreLeadAgendado.includes('Sin Agendamiento'))
  ).length;

  const cards = [
    {
      title: 'Contactos Enviados',
      value: totalEnviadas.toLocaleString(),
      icon: <Send size={18} />,
      accentColor: '#00f0ff',
      accentGrad: 'var(--grad-cyan-glow)',
      accentBg: 'rgba(0, 240, 255, 0.12)',
      trend: 'Volumen Total',
      sub: `Waalaxy: ${totalEnviadasWaalaxy.toLocaleString()} · Manual: ${totalEnviadasManual.toLocaleString()}`,
      pctBar: 100
    },
    {
      title: 'Conexiones Aceptadas',
      value: totalAceptadas.toLocaleString(),
      icon: <UserCheck size={18} />,
      accentColor: '#3b82f6',
      accentGrad: 'var(--grad-blue)',
      accentBg: 'rgba(59, 130, 246, 0.12)',
      trend: `${tasaAceptacion}%`,
      sub: `${tasaAceptacion}% tasa de conversión de solicitudes`,
      pctBar: Math.min(100, tasaAceptacion * 2.5)
    },
    {
      title: 'Respuestas Recibidas',
      value: totalRespuestas.toLocaleString(),
      icon: <MessageSquare size={18} />,
      accentColor: '#b87cff',
      accentGrad: 'var(--grad-violet-glow)',
      accentBg: 'rgba(184, 124, 255, 0.12)',
      trend: 'Interacción',
      sub: `Mensaje 1: ${totalRespuestasM1} · M2: ${totalRespuestasM2} · M3: ${totalRespuestasM3}`,
      pctBar: totalAceptadas > 0 ? (totalRespuestas / totalAceptadas) * 100 : 50
    },
    {
      title: 'Citas Agendadas',
      value: leadsAgendadosCount.toLocaleString(),
      icon: <CalendarCheck size={18} />,
      accentColor: '#00ff9d',
      accentGrad: 'var(--grad-emerald-glow)',
      accentBg: 'rgba(0, 255, 157, 0.12)',
      trend: 'Demos',
      sub: `Reuniones comerciales agendadas`,
      pctBar: 85
    },
    {
      title: 'Cumplimiento Meta',
      value: `${cumplieronMeta} / ${reports.length}`,
      icon: <Target size={18} />,
      accentColor: '#ffb700',
      accentGrad: 'var(--grad-amber-glow)',
      accentBg: 'rgba(255, 183, 0, 0.12)',
      trend: `${tasaCumplimiento}%`,
      sub: `${tasaCumplimiento}% de ejecuciones semanales logradas`,
      pctBar: tasaCumplimiento
    }
  ];

  return (
    <div className="kpi-grid">
      {cards.map((card) => (
        <div
          key={card.title}
          className="kpi-card-futuristic"
          style={{ '--card-accent-color': card.accentColor }}
        >
          <div className="kpi-laser-line" style={{ background: card.accentGrad, color: card.accentColor }} />

          <div className="kpi-header">
            <span className="kpi-title">{card.title}</span>
            <div
              className="kpi-icon-futuristic"
              style={{ background: card.accentBg, color: card.accentColor }}
            >
              {card.icon}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span className="kpi-value-futuristic">{card.value}</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: card.accentBg,
                  color: card.accentColor,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Zap size={10} /> {card.trend}
              </span>
            </div>
            <div className="kpi-subtext">{card.sub}</div>
          </div>

          <div className="mini-progress-bg">
            <div
              className="mini-progress-fill"
              style={{
                width: `${Math.min(100, Math.max(8, card.pctBar))}%`,
                background: card.accentGrad,
                color: card.accentColor
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
