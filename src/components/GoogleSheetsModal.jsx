import React, { useState, useEffect } from 'react';
import {
  X, Link2, RefreshCw, CheckCircle2, AlertCircle, HelpCircle,
  Info, ChevronDown, ChevronUp, Layers, Users, PhoneCall, Trash2, Unlink
} from 'lucide-react';
import { fetchGoogleSheetData, fetchSupervisorSheetData } from '../utils/googleSheetsParser';

export default function GoogleSheetsModal({
  isOpen,
  onClose,
  activeUrl,
  onDataImported,
  userSession,
  groupsData = {},
  callersData = {},
  onUpdateGroupDataForKey,
  onUpdateCallerData
}) {
  const isAdmin = userSession?.role === 'admin';
  const isCaller = userSession?.role === 'caller';
  const userGroup = userSession?.group || (isCaller ? 'Callers' : 'Setters Aspirantes');

  const [aspirantesUrl, setAspirantesUrl] = useState(groupsData?.['Setters Aspirantes']?.url || '');
  const [oficialesUrl,  setOficialesUrl]  = useState(groupsData?.['Setters Oficiales']?.url || '');
  const [callersUrl,    setCallersUrl]    = useState(callersData?.['Caller 1']?.sheetUrl || '');

  const [singleUrlInput, setSingleUrlInput] = useState(
    isCaller
      ? (callersData?.['Caller 1']?.sheetUrl || activeUrl || '')
      : ((groupsData?.[userGroup]?.url) || activeUrl || '')
  );

  const [syncingChannel, setSyncingChannel] = useState(null);
  const [channelStatusMsg, setChannelStatusMsg] = useState({});
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    setAspirantesUrl(groupsData?.['Setters Aspirantes']?.url || '');
    setOficialesUrl(groupsData?.['Setters Oficiales']?.url || '');
    setCallersUrl(callersData?.['Caller 1']?.sheetUrl || '');
    if (isCaller) {
      setSingleUrlInput(callersData?.['Caller 1']?.sheetUrl || '');
    } else {
      setSingleUrlInput(groupsData?.[userGroup]?.url || '');
    }
  }, [groupsData, callersData, userGroup, isCaller]);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnlinkSpecificChannel = (channelKey) => {
    if (channelKey === 'oficiales') {
      setOficialesUrl('');
      if (onUpdateGroupDataForKey) {
        onUpdateGroupDataForKey('Setters Oficiales', [], '', 'Sin datos (desvinculado)', '');
      }
      setChannelStatusMsg(prev => ({ ...prev, oficiales: { type: 'info', text: '🔗 Canal A desvinculado y datos vaciados.' } }));
    } else if (channelKey === 'aspirantes') {
      setAspirantesUrl('');
      if (onUpdateGroupDataForKey) {
        onUpdateGroupDataForKey('Setters Aspirantes', [], '', 'Sin datos (desvinculado)', '');
      }
      setChannelStatusMsg(prev => ({ ...prev, aspirantes: { type: 'info', text: '🔗 Canal B desvinculado y datos vaciados.' } }));
    } else if (channelKey === 'callers') {
      setCallersUrl('');
      if (onUpdateCallerData) {
        onUpdateCallerData('Caller 1', [], [], '', 'Caller 1 — Nury');
      }
      setChannelStatusMsg(prev => ({ ...prev, callers: { type: 'info', text: '🔗 Canal C desvinculado y datos vaciados.' } }));
    }
  };

  const handleSingleUnlink = () => {
    setSingleUrlInput('');
    if (isCaller) {
      if (onUpdateCallerData) {
        onUpdateCallerData('Caller 1', [], [], '', 'Caller 1 — Nury');
      }
      setChannelStatusMsg({ single: { type: 'info', text: '🔗 Enlace de Call Team desvinculado y datos vaciados con éxito.' } });
    } else {
      if (onUpdateGroupDataForKey) {
        onUpdateGroupDataForKey(userGroup, [], '', 'Sin datos (desvinculado)', '');
      }
      setChannelStatusMsg({ single: { type: 'info', text: `🔗 Enlace de ${userGroup} desvinculado y datos vaciados con éxito.` } });
    }
  };

  const handleSyncSpecificChannel = async (channelKey) => {
    setSyncingChannel(channelKey);
    setChannelStatusMsg(prev => ({ ...prev, [channelKey]: { type: 'info', text: 'Sincronizando...' } }));
    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    try {
      if (channelKey === 'aspirantes') {
        const url = aspirantesUrl.trim();
        if (!url) throw new Error('Ingresa la URL del Google Sheet de Setters Aspirantes.');
        const res = await fetchGoogleSheetData(url);
        if (onUpdateGroupDataForKey) {
          onUpdateGroupDataForKey('Setters Aspirantes', res.records, url, `Google Sheets (${res.rowCount} registros)`, now);
        }
        setChannelStatusMsg(prev => ({ ...prev, aspirantes: { type: 'success', text: `${res.rowCount} registros sincronizados con éxito (${now})` } }));
      } else if (channelKey === 'oficiales') {
        const url = oficialesUrl.trim();
        if (!url) throw new Error('Ingresa la URL del Google Sheet de Setters Oficiales.');
        const res = await fetchGoogleSheetData(url);
        if (onUpdateGroupDataForKey) {
          onUpdateGroupDataForKey('Setters Oficiales', res.records, url, `Google Sheets (${res.rowCount} registros)`, now);
        }
        setChannelStatusMsg(prev => ({ ...prev, oficiales: { type: 'success', text: `${res.rowCount} registros sincronizados con éxito (${now})` } }));
      } else if (channelKey === 'callers') {
        const url = callersUrl.trim();
        if (!url) throw new Error('Ingresa la URL del Google Sheet de Callers.');
        const res = await fetchSupervisorSheetData(url);
        if (onUpdateCallerData) {
          onUpdateCallerData('Caller 1', res.callerRecords, res.scorecardReports, url, 'Caller 1 — Nury');
        }
        setChannelStatusMsg(prev => ({ ...prev, callers: { type: 'success', text: `${res.callerRecords.length} llamadas sincronizadas con éxito (${now})` } }));
      }
    } catch (err) {
      setChannelStatusMsg(prev => ({ ...prev, [channelKey]: { type: 'error', text: `Error: ${err.message}` } }));
    } finally {
      setSyncingChannel(null);
    }
  };

  const handleSyncAllChannels = async () => {
    setSyncingChannel('all');
    setChannelStatusMsg({ all: { type: 'info', text: 'Sincronizando los 3 canales...' } });
    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    const results = [];
    try {
      if (aspirantesUrl.trim()) {
        try {
          const res = await fetchGoogleSheetData(aspirantesUrl.trim());
          if (onUpdateGroupDataForKey) onUpdateGroupDataForKey('Setters Aspirantes', res.records, aspirantesUrl.trim(), `Google Sheets (${res.rowCount} registros)`, now);
          results.push(`Aspirantes: ${res.rowCount} registros`);
        } catch (e) { results.push(`Aspirantes: Error (${e.message})`); }
      }
      if (oficialesUrl.trim()) {
        try {
          const res = await fetchGoogleSheetData(oficialesUrl.trim());
          if (onUpdateGroupDataForKey) onUpdateGroupDataForKey('Setters Oficiales', res.records, oficialesUrl.trim(), `Google Sheets (${res.rowCount} registros)`, now);
          results.push(`Oficiales: ${res.rowCount} registros`);
        } catch (e) { results.push(`Oficiales: Error (${e.message})`); }
      }
      if (callersUrl.trim()) {
        try {
          const res = await fetchSupervisorSheetData(callersUrl.trim());
          if (onUpdateCallerData) onUpdateCallerData('Caller 1', res.callerRecords, res.scorecardReports, callersUrl.trim(), 'Caller 1 — Nury');
          results.push(`Callers: ${res.callerRecords.length} llamadas`);
        } catch (e) { results.push(`Callers: Error (${e.message})`); }
      }

      setChannelStatusMsg({ all: { type: 'success', text: `Sincronización completa: ${results.join(' · ')} (${now})` } });
    } catch (err) {
      setChannelStatusMsg({ all: { type: 'error', text: `Error: ${err.message}` } });
    } finally {
      setSyncingChannel(null);
    }
  };

  const handleSingleFetch = async (e) => {
    if (e) e.preventDefault();
    if (!singleUrlInput.trim()) {
      setChannelStatusMsg({ single: { type: 'error', text: 'Por favor ingresa o pega el enlace de tu Google Sheet.' } });
      return;
    }
    setSyncingChannel('single');
    setChannelStatusMsg({ single: { type: 'info', text: 'Sincronizando...' } });

    try {
      const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      if (isCaller) {
        const result = await fetchSupervisorSheetData(singleUrlInput.trim());
        if (onUpdateCallerData) {
          onUpdateCallerData('Caller 1', result.callerRecords, result.scorecardReports, singleUrlInput.trim(), 'Caller 1 — Nury');
        }
        setChannelStatusMsg({ single: { type: 'success', text: `${result.callerRecords.length} llamadas sincronizadas con éxito` } });
      } else {
        const result = await fetchGoogleSheetData(singleUrlInput.trim());
        if (onUpdateGroupDataForKey) {
          onUpdateGroupDataForKey(userGroup, result.records, singleUrlInput.trim(), `Google Sheet (${result.rowCount} registros)`, now);
        } else if (onDataImported) {
          onDataImported(result.records, result.url);
        }
        setChannelStatusMsg({ single: { type: 'success', text: `${result.rowCount} registros sincronizados con éxito` } });
      }
      setTimeout(() => {
        setSyncingChannel(null);
        onClose();
      }, 1200);
    } catch (err) {
      setSyncingChannel(null);
      setChannelStatusMsg({ single: { type: 'error', text: `Error: ${err.message || 'Error al enlazar el Google Sheet.'}` } });
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '95%', padding: 0, overflow: 'hidden', borderRadius: '16px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* HEADER */}
        <div className="modal-header" style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#eff6ff',
              padding: '9px',
              borderRadius: '10px',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Link2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {isAdmin ? 'Gestión y Enlace de Google Sheets (3 Canales)' : 'Enlazar Google Sheets'}
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                {isAdmin
                  ? 'Configura y sincroniza las hojas de Setters Aspirantes, Setters Oficiales y Callers'
                  : 'Sincroniza tus registros de prospección desde tu hoja de Google Sheets'}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

          {/* INSTRUCCIONES */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setShowInstructions(p => !p)}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', fontWeight: 800, color: '#2563eb' }}>
                <Info size={15} /> ¿Cómo maneja el Dashboard los Google Sheets?
              </div>
              <ChevronDown size={14} style={{ color: '#2563eb', transform: showInstructions ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {showInstructions && (
              <div style={{ padding: '4px 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  El equipo opera con <strong>3 hojas de cálculo independientes</strong> para evitar cruces de datos y facilitar el seguimiento:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div style={{ background: '#fef3c7', borderRadius: '8px', padding: '10px 12px', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#92400e' }}>1. Setters Aspirantes</div>
                    <div style={{ fontSize: '11.5px', color: '#b45309', lineHeight: 1.45 }}>Métricas de Waalaxy, mensajes y prospectos agendados de aspirantes.</div>
                  </div>
                  <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '10px 12px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e40af' }}>2. Setters Oficiales</div>
                    <div style={{ fontSize: '11.5px', color: '#1d4ed8', lineHeight: 1.45 }}>Métricas consolidadas de prospección del canal oficial.</div>
                  </div>
                  <div style={{ background: '#faf5ff', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#6d28d9' }}>3. Call Team / Callers</div>
                    <div style={{ fontSize: '11.5px', color: '#7c3aed', lineHeight: 1.45 }}>Registro diario de llamadas, respuestas y derivaciones de prospectos.</div>
                  </div>
                </div>
                <div style={{ fontSize: '11.5px', color: '#475569', background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', lineHeight: 1.45 }}>
                  <strong>Permisos requeridos:</strong> En cada documento de Google Sheets ve a <em>Compartir → Acceso general → Cualquier persona con el enlace (Lector)</em>.
                </div>
              </div>
            )}
          </div>

          {/* VISTA ADMINISTRADOR */}
          {isAdmin ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* CANAL 1: SETTERS OFICIALES */}
              <div style={{ background: '#ffffff', border: '1.5px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#1e40af' }}>1. Hoja Setters Oficiales (Canal A)</span>
                    {groupsData?.['Setters Oficiales']?.records?.length > 0 && (
                      <span style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '2px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>
                        {groupsData['Setters Oficiales'].records.length} registros
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(oficialesUrl || groupsData?.['Setters Oficiales']?.records?.length > 0) && (
                      <button
                        type="button"
                        onClick={() => handleUnlinkSpecificChannel('oficiales')}
                        disabled={syncingChannel === 'oficiales'}
                        className="btn-cyber-ghost"
                        style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 800, color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
                        title="Desvincular enlace y vaciar registros de Setters Oficiales"
                      >
                        <Trash2 size={12} /> Desvincular
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSyncSpecificChannel('oficiales')}
                      disabled={syncingChannel === 'oficiales' || !oficialesUrl.trim()}
                      className="btn-cyber-primary"
                      style={{ padding: '4px 10px', fontSize: '11.5px', fontWeight: 800 }}
                    >
                      <RefreshCw size={12} className={syncingChannel === 'oficiales' ? 'spin-icon' : ''} />
                      {syncingChannel === 'oficiales' ? 'Sincronizando...' : 'Sincronizar'}
                    </button>
                  </div>
                </div>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={oficialesUrl}
                  onChange={(e) => setOficialesUrl(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                />
                {channelStatusMsg.oficiales && (
                  <div style={{ fontSize: '11.5px', marginTop: '4px', fontWeight: 700, color: channelStatusMsg.oficiales.type === 'error' ? '#dc2626' : (channelStatusMsg.oficiales.type === 'info' ? '#2563eb' : '#059669') }}>
                    {channelStatusMsg.oficiales.text}
                  </div>
                )}
              </div>

              {/* CANAL 2: SETTERS ASPIRANTES */}
              <div style={{ background: '#ffffff', border: '1.5px solid #fde68a', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#92400e' }}>2. Hoja Setters Aspirantes (Canal B)</span>
                    {groupsData?.['Setters Aspirantes']?.records?.length > 0 && (
                      <span style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '2px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>
                        {groupsData['Setters Aspirantes'].records.length} registros
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(aspirantesUrl || groupsData?.['Setters Aspirantes']?.records?.length > 0) && (
                      <button
                        type="button"
                        onClick={() => handleUnlinkSpecificChannel('aspirantes')}
                        disabled={syncingChannel === 'aspirantes'}
                        className="btn-cyber-ghost"
                        style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 800, color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
                        title="Desvincular enlace y vaciar registros de Setters Aspirantes"
                      >
                        <Trash2 size={12} /> Desvincular
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSyncSpecificChannel('aspirantes')}
                      disabled={syncingChannel === 'aspirantes' || !aspirantesUrl.trim()}
                      className="btn-cyber-primary"
                      style={{ padding: '4px 10px', fontSize: '11.5px', fontWeight: 800, background: '#d97706', borderColor: '#d97706' }}
                    >
                      <RefreshCw size={12} className={syncingChannel === 'aspirantes' ? 'spin-icon' : ''} />
                      {syncingChannel === 'aspirantes' ? 'Sincronizando...' : 'Sincronizar'}
                    </button>
                  </div>
                </div>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={aspirantesUrl}
                  onChange={(e) => setAspirantesUrl(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                />
                {channelStatusMsg.aspirantes && (
                  <div style={{ fontSize: '11.5px', marginTop: '4px', fontWeight: 700, color: channelStatusMsg.aspirantes.type === 'error' ? '#dc2626' : (channelStatusMsg.aspirantes.type === 'info' ? '#2563eb' : '#059669') }}>
                    {channelStatusMsg.aspirantes.text}
                  </div>
                )}
              </div>

              {/* CANAL 3: CALL TEAM */}
              <div style={{ background: '#ffffff', border: '1.5px solid #e9d5ff', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#6d28d9' }}>3. Hoja Call Team (Callers / Supervisión)</span>
                    {callersData?.['Caller 1']?.callerRecords?.length > 0 && (
                      <span style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed', padding: '2px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>
                        {callersData['Caller 1'].callerRecords.length} llamadas
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(callersUrl || callersData?.['Caller 1']?.callerRecords?.length > 0) && (
                      <button
                        type="button"
                        onClick={() => handleUnlinkSpecificChannel('callers')}
                        disabled={syncingChannel === 'callers'}
                        className="btn-cyber-ghost"
                        style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 800, color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
                        title="Desvincular enlace y vaciar registros de Call Team"
                      >
                        <Trash2 size={12} /> Desvincular
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSyncSpecificChannel('callers')}
                      disabled={syncingChannel === 'callers' || !callersUrl.trim()}
                      className="btn-cyber-primary"
                      style={{ padding: '4px 10px', fontSize: '11.5px', fontWeight: 800, background: '#7c3aed', borderColor: '#7c3aed' }}
                    >
                      <RefreshCw size={12} className={syncingChannel === 'callers' ? 'spin-icon' : ''} />
                      {syncingChannel === 'callers' ? 'Sincronizando...' : 'Sincronizar'}
                    </button>
                  </div>
                </div>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={callersUrl}
                  onChange={(e) => setCallersUrl(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                />
                {channelStatusMsg.callers && (
                  <div style={{ fontSize: '11.5px', marginTop: '4px', fontWeight: 700, color: channelStatusMsg.callers.type === 'error' ? '#dc2626' : (channelStatusMsg.callers.type === 'info' ? '#2563eb' : '#059669') }}>
                    {channelStatusMsg.callers.text}
                  </div>
                )}
              </div>

              {channelStatusMsg.all && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                  background: channelStatusMsg.all.type === 'error' ? '#fef2f2' : '#ecfdf5',
                  border: `1px solid ${channelStatusMsg.all.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
                  color: channelStatusMsg.all.type === 'error' ? '#dc2626' : '#059669'
                }}>
                  {channelStatusMsg.all.text}
                </div>
              )}

            </div>
          ) : (
            <form onSubmit={handleSingleFetch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                  Enlace de Google Sheets para {userGroup}:
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={singleUrlInput}
                  onChange={(e) => setSingleUrlInput(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {channelStatusMsg.single && (
                <div style={{
                  padding: '9px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                  background: channelStatusMsg.single.type === 'error' ? '#fef2f2' : (channelStatusMsg.single.type === 'info' ? '#eff6ff' : '#ecfdf5'),
                  border: `1px solid ${channelStatusMsg.single.type === 'error' ? '#fecaca' : (channelStatusMsg.single.type === 'info' ? '#bfdbfe' : '#a7f3d0')}`,
                  color: channelStatusMsg.single.type === 'error' ? '#dc2626' : (channelStatusMsg.single.type === 'info' ? '#1e40af' : '#059669')
                }}>
                  {channelStatusMsg.single.text}
                </div>
              )}
            </form>
          )}

        </div>

        {/* FOOTER */}
        <div className="modal-footer" style={{ padding: '14px 22px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {isAdmin ? (
            <button
              type="button"
              onClick={handleSyncAllChannels}
              disabled={syncingChannel === 'all'}
              className="btn-cyber-emerald"
              style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={syncingChannel === 'all' ? 'spin-icon' : ''} />
              {syncingChannel === 'all' ? 'Sincronizando 3 canales...' : 'Sincronizar Todas las Hojas'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSingleFetch}
                disabled={syncingChannel === 'single' || !singleUrlInput.trim()}
                className="btn-cyber-primary"
                style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 800 }}
              >
                <RefreshCw size={13} className={syncingChannel === 'single' ? 'spin-icon' : ''} />
                {syncingChannel === 'single' ? 'Sincronizando...' : 'Sincronizar Datos'}
              </button>
              {singleUrlInput && (
                <button
                  type="button"
                  onClick={handleSingleUnlink}
                  className="btn-cyber-ghost"
                  style={{ padding: '8px 14px', fontSize: '12px', color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
                  title="Desvincular enlace y vaciar datos"
                >
                  <Trash2 size={13} /> Desvincular
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '7px 16px', fontSize: '12.5px' }}
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
