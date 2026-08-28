import React from 'react';
import { Bot, MessageSquare, CheckCircle2, Zap } from 'lucide-react';

export default function InsightBanner({ reports }) {
  const totalEnviadas = reports.reduce((acc, r) => acc + Number(r.conexionesEnviadasWaalaxy || 0) + Number(r.conexionesEnviadasManual || 0), 0);
  const totalWaalaxy = reports.reduce((acc, r) => acc + Number(r.conexionesEnviadasWaalaxy || 0), 0);
  const pctWaalaxy = totalEnviadas > 0 ? ((totalWaalaxy / totalEnviadas) * 100).toFixed(0) : 0;

  const totalM1 = reports.reduce((acc, r) => acc + Number(r.respuestasM1 || 0), 0);
  const totalResp = reports.reduce((acc, r) =>
    acc + Number(r.respuestasM1 || 0) + Number(r.respuestasM2 || 0) + Number(r.respuestasM3 || 0), 0);
  const pctM1 = totalResp > 0 ? ((totalM1 / totalResp) * 100).toFixed(0) : 0;

  const cumplieron = reports.filter(r => r.cumplioMeta === 'Sí').length;
  const pctCumplimiento = reports.length > 0 ? ((cumplieron / reports.length) * 100).toFixed(0) : 0;

  const insights = [
    {
      label: 'Canal Automatizado Waalaxy',
      stat: `${pctWaalaxy}%`,
      desc: 'del volumen total via automatización',
      icon: <Bot size={20} color="#00f0ff" />,
      iconBg: 'rgba(0, 240, 255, 0.15)',
      laserGrad: 'var(--grad-cyan-blue)',
      accentColor: '#00f0ff',
      pct: Number(pctWaalaxy)
    },
    {
      label: 'Efectividad Mensaje 1 (M1)',
      stat: `${pctM1}%`,
      desc: 'de respuestas captadas en el primer mensaje',
      icon: <MessageSquare size={20} color="#d946ef" />,
      iconBg: 'rgba(217, 70, 239, 0.15)',
      laserGrad: 'var(--grad-violet-pink)',
      accentColor: '#d946ef',
      pct: Number(pctM1)
    },
    {
      label: 'Meta Semanal de Agendamiento',
      stat: `${pctCumplimiento}%`,
      desc: 'de SDRs alcanzaron el objetivo semanal',
      icon: <CheckCircle2 size={20} color="#00ff9d" />,
      iconBg: 'rgba(0, 255, 157, 0.15)',
      laserGrad: 'var(--grad-emerald-teal)',
      accentColor: '#00ff9d',
      pct: Number(pctCumplimiento)
    }
  ];

  return (
    <div className="insight-banner-futuristic-grid">
      {insights.map((ins) => (
        <div key={ins.label} className="executive-insight-card">
          {/* Laser top bar */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '3px',
              background: ins.laserGrad,
              boxShadow: `0 0 10px ${ins.accentColor}`,
              borderRadius: '14px 14px 0 0'
            }}
          />

          <div
            className="insight-icon-halo"
            style={{ background: ins.iconBg, color: ins.accentColor }}
          >
            {ins.icon}
          </div>

          <div className="insight-card-body" style={{ flex: 1 }}>
            <h5>{ins.label}</h5>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span className="insight-stat-val" style={{ color: ins.accentColor }}>
                {ins.stat}
              </span>
            </div>
            <p>{ins.desc}</p>

            {/* Mini inline progress bar */}
            <div className="mini-progress-bg" style={{ marginTop: '10px', height: '4px' }}>
              <div
                className="mini-progress-fill"
                style={{
                  width: `${Math.min(100, Math.max(6, ins.pct))}%`,
                  background: ins.laserGrad
                }}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: ins.iconBg,
            border: `1px solid ${ins.accentColor}40`,
            borderRadius: '10px',
            padding: '8px 12px',
            flexShrink: 0
          }}>
            <Zap size={14} color={ins.accentColor} />
            <span style={{ color: ins.accentColor, fontWeight: 900, fontSize: '14px', marginLeft: '4px' }}>
              {ins.stat}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
