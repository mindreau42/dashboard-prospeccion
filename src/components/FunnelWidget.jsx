import React from 'react';
import { Send, UserCheck, MessageSquare, CalendarCheck, Zap, ArrowRight } from 'lucide-react';

export default function FunnelWidget({ reports }) {
  const totalEnviadas = reports.reduce((acc, r) => acc + Number(r.conexionesEnviadasWaalaxy || 0) + Number(r.conexionesEnviadasManual || 0), 0);
  const totalAceptadas = reports.reduce((acc, r) => acc + Number(r.conexionesAceptadasWaalaxy || 0) + Number(r.conexionesAceptadasManual || 0), 0);
  const totalRespuestas = reports.reduce((acc, r) => acc + Number(r.respuestasM1 || 0) + Number(r.respuestasM2 || 0) + Number(r.respuestasM3 || 0), 0);
  const totalAgendados = reports.filter(r => r.cumplioMeta === 'Sí' || (r.nombreLeadAgendado && !r.nombreLeadAgendado.includes('Sin Agendamiento'))).length;

  const tasaAceptacion = totalEnviadas > 0 ? Number(((totalAceptadas / totalEnviadas) * 100).toFixed(1)) : 0;
  const tasaRespuesta = totalAceptadas > 0 ? Number(((totalRespuestas / totalAceptadas) * 100).toFixed(1)) : 0;
  const tasaAgendamiento = totalRespuestas > 0 ? Number(((totalAgendados / totalRespuestas) * 100).toFixed(1)) : 0;

  const steps = [
    {
      stepNum: '01',
      title: 'Contactos Enviados',
      val: totalEnviadas.toLocaleString(),
      pct: 100,
      badgeText: 'Total Contactado',
      color: '#00f0ff',
      grad: 'var(--grad-cyan-glow)',
      icon: <Send size={16} color="#00f0ff" />
    },
    {
      stepNum: '02',
      title: 'Conexiones Aceptadas',
      val: totalAceptadas.toLocaleString(),
      pct: Math.min(100, tasaAceptacion),
      badgeText: `${tasaAceptacion}% Conversión`,
      color: '#3b82f6',
      grad: 'var(--grad-blue)',
      icon: <UserCheck size={16} color="#3b82f6" />
    },
    {
      stepNum: '03',
      title: 'Respuestas Recibidas',
      val: totalRespuestas.toLocaleString(),
      pct: Math.min(100, tasaRespuesta),
      badgeText: `${tasaRespuesta}% Interacción`,
      color: '#b87cff',
      grad: 'var(--grad-violet-glow)',
      icon: <MessageSquare size={16} color="#b87cff" />
    },
    {
      stepNum: '04',
      title: 'Citas Agendadas',
      val: totalAgendados.toLocaleString(),
      pct: Math.min(100, tasaAgendamiento),
      badgeText: `${tasaAgendamiento}% Citas`,
      color: '#00ff9d',
      grad: 'var(--grad-emerald-glow)',
      icon: <CalendarCheck size={16} color="#00ff9d" />
    }
  ];

  return (
    <div className="funnel-section">
      <div className="section-header">
        <h3>
          <Zap size={18} color="#00f0ff" />
          Embudo de Conversión Comercial (Outreach Pipeline)
        </h3>
        <span style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>
          Flujo de conversión secuencial paso a paso
        </span>
      </div>

      <div className="funnel-grid">
        {steps.map((step) => (
          <div
            key={step.stepNum}
            className="funnel-card-futuristic"
            style={{ '--funnel-color': step.color }}
          >
            <div className="kpi-laser-line" style={{ background: step.grad, color: step.color }} />

            <div className="funnel-step-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {step.icon} PASO {step.stepNum}
              </span>
              <span style={{ color: step.color, fontWeight: 900 }}>{step.pct}%</span>
            </div>

            <div className="funnel-metric-val-futuristic">{step.val}</div>

            <div className="mini-progress-bg" style={{ height: '6px', marginBottom: '14px' }}>
              <div
                className="mini-progress-fill"
                style={{ width: `${Math.max(8, step.pct)}%`, background: step.grad, color: step.color }}
              />
            </div>

            <div
              className="funnel-chip-futuristic"
              style={{
                background: `rgba(${step.color === '#00f0ff' ? '0, 240, 255' : step.color === '#3b82f6' ? '59, 130, 246' : step.color === '#b87cff' ? '184, 124, 255' : '0, 255, 157'}, 0.15)`,
                color: step.color,
                border: `1px solid ${step.color}50`
              }}
            >
              <ArrowRight size={13} /> {step.badgeText}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
