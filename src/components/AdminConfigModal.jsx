import React from 'react';
import { X, Settings, Wifi, WifiOff, RefreshCw, Trash2, CheckCircle2, ExternalLink, Shield } from 'lucide-react';

export default function AdminConfigModal({
  isOpen,
  onClose,
  profile1Data,
  profile2Data,
  supervisorSheetUrl,
  onSupervisorUrlChange,
  onClearProfile,
  onSave
}) {
  const [localSupervisorUrl, setLocalSupervisorUrl] = React.useState(supervisorSheetUrl || '');
  const [saved, setSaved] = React.useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSupervisorUrlChange(localSupervisorUrl);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  };

  const p1 = profile1Data || { records: [], url: '', sourceName: '', lastSync: '' };
  const p2 = profile2Data || { records: [], url: '', sourceName: '', lastSync: '' };

  const ProfileStatusCard = ({ label, profileId, data }) => {
    const connected = data.records.length > 0;
    return (
      <div style={{ background: 'rgba(4,8,20,0.85)', border: `1px solid ${connected ? 'rgba(0,255,157,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {connected ? <Wifi size={15} color="#00ff9d" /> : <WifiOff size={15} color="#64748b" />}
            <span style={{ fontWeight: 900, color: '#ffffff', fontSize: '14px' }}>{label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px',
              background: connected ? 'rgba(0,255,157,0.15)' : 'rgba(100,116,139,0.15)',
              color: connected ? '#00ff9d' : '#64748b',
              border: `1px solid ${connected ? 'rgba(0,255,157,0.3)' : 'rgba(100,116,139,0.2)'}`
            }}>
              {connected ? `${data.records.length} registros` : 'Sin datos'}
            </span>
            {connected && (
              <button
                onClick={() => onClearProfile(profileId)}
                style={{ background: 'rgba(255,42,109,0.12)', border: '1px solid rgba(255,42,109,0.3)', color: '#ff2a6d', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={11} /> Limpiar
              </button>
            )}
          </div>
        </div>

        <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', lineHeight: 1.5 }}>
          <div><strong style={{ color: '#94a3b8' }}>Fuente:</strong> {data.sourceName || 'No conectado'}</div>
          {data.url && (
            <div style={{ marginTop: '4px', wordBreak: 'break-all' }}>
              <strong style={{ color: '#94a3b8' }}>URL:</strong>{' '}
              <a href={data.url} target="_blank" rel="noreferrer" style={{ color: '#00f0ff', fontSize: '11px' }}>
                {data.url.length > 60 ? data.url.slice(0, 60) + '...' : data.url}
              </a>
            </div>
          )}
          {data.lastSync && (
            <div style={{ marginTop: '2px' }}><strong style={{ color: '#94a3b8' }}>Última sync:</strong> {data.lastSync}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(0,240,255,0.15)', padding: '8px', borderRadius: '8px', color: '#00f0ff' }}>
              <Settings size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>Panel de Control Administrativo</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Estado de conexión por perfil y configuración del módulo de supervisión</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Estado de conexión por perfil */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} /> Estado de Canales Operativos
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ProfileStatusCard label="👤 Perfil 1 (Operador Canal A)" profileId="profile1" data={p1} />
              <ProfileStatusCard label="👤 Perfil 2 (Operador Canal B)" profileId="profile2" data={p2} />
            </div>
          </div>

          {/* Configuración de Hoja de Supervisión */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#d946ef', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              🎯 Google Sheet de Supervisión (Caller Scorecard)
            </h4>
            <input
              type="text"
              value={localSupervisorUrl}
              onChange={(e) => setLocalSupervisorUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              style={{
                width: '100%',
                background: '#07101e',
                border: '1px solid rgba(217,70,239,0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: '12.5px',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />
            <p style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '6px' }}>
              Este enlace es exclusivo del Supervisor y el Administrador. Los Operadores (Perfil 1 y Perfil 2) no tienen acceso a esta información.
            </p>
          </div>

          {saved && (
            <div style={{ padding: '10px 14px', background: 'rgba(0,255,157,0.12)', border: '1px solid rgba(0,255,157,0.35)', borderRadius: '8px', color: '#00ff9d', fontWeight: 800, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} /> Configuración guardada correctamente.
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave}>Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}
