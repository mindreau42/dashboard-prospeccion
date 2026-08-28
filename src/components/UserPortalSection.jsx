import React, { useState, useEffect } from 'react';
import {
  Link2,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CalendarCheck,
  ShieldCheck,
  Wifi,
  WifiOff,
  ExternalLink,
  Info,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { fetchGoogleSheetData } from '../utils/googleSheetsParser';
import { parseExcelFile } from '../utils/excelParser';

function StatCard({ label, value, color, sub }) {
  return (
    <div className="glass-panel" style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 900, color: color || '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      {sub && (
        <div style={{ fontSize: '11.5px', color: color || '#64748b', fontWeight: 700, marginTop: '3px', opacity: 0.9 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function UserPortalSection({
  userSession,
  groupData,
  onUpdateGroupData
}) {
  const [sheetUrl, setSheetUrl] = useState(groupData?.url || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    setSheetUrl(groupData?.url || '');
  }, [groupData?.url]);


  const records = groupData?.records || [];
  const isConnected = records.length > 0;
  const lastSync = groupData?.lastSync || '';

  const handleSyncSheet = async (e) => {
    e?.preventDefault();
    if (!sheetUrl.trim()) {
      setSyncStatus({ type: 'error', msg: 'Por favor pega el enlace de Google Sheets antes de sincronizar.' });
      return;
    }
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const result = await fetchGoogleSheetData(sheetUrl.trim());
      const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      onUpdateGroupData(result.records, sheetUrl.trim(), `Google Sheet (${result.rowCount} registros únicos)`, now);
      
      const dedupMsg = result.duplicatesRemoved > 0 
        ? `¡Sincronización exitosa! Se cargaron ${result.rowCount} registros únicos (${result.duplicatesRemoved} fila(s) duplicada(s) omitida(s) automáticamente).`
        : `¡Sincronización exitosa! Se cargaron ${result.rowCount} registros verificados (0 duplicados).`;

      setSyncStatus({ type: 'success', msg: dedupMsg });
    } catch (err) {
      setSyncStatus({ type: 'error', msg: err.message || 'No se pudo conectar al Google Sheet. Verifica que el enlace tenga acceso de lectura ("Cualquier persona con el enlace").' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const recs = await parseExcelFile(file);
      const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      onUpdateGroupData(recs, '', `Excel: ${file.name} (${recs.length} registros únicos)`, now);
      
      const dedupMsg = (recs.duplicatesRemoved && recs.duplicatesRemoved > 0)
        ? `¡Archivo cargado! Se ingresaron ${recs.length} registros únicos (${recs.duplicatesRemoved} fila(s) duplicada(s) omitida(s)).`
        : `¡Archivo cargado! ${recs.length} registros únicos ingresados correctamente (0 duplicados).`;

      setSyncStatus({ type: 'success', msg: dedupMsg });
    } catch (err) {
      setSyncStatus({ type: 'error', msg: err.message || 'Error al procesar el archivo Excel.' });
    } finally {
      setIsSyncing(false);
      e.target.value = '';
    }
  };

  // Metrics
  const totalEnviadas = records.reduce((a, r) => a + Number(r.conexionesEnviadasWaalaxy || 0) + Number(r.conexionesEnviadasManual || 0), 0);
  const totalAceptadas = records.reduce((a, r) => a + Number(r.conexionesAceptadasWaalaxy || 0) + Number(r.conexionesAceptadasManual || 0), 0);
  const totalRespuestas = records.reduce((a, r) => a + Number(r.respuestasM1 || 0) + Number(r.respuestasM2 || 0) + Number(r.respuestasM3 || 0), 0);
  const totalAgendamientos = records.reduce((a, r) => a + Number(r.agendamientos || 0), 0);
  const tasaAceptacion = totalEnviadas > 0 ? ((totalAceptadas / totalEnviadas) * 100).toFixed(1) : 0;
  const tasaConversion = totalEnviadas > 0 ? ((totalAgendamientos / totalEnviadas) * 100).toFixed(2) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>

      {/* ─── BIENVENIDA & ESTADO ─── */}
      <div className="glass-panel" style={{ padding: '20px 24px', borderLeft: '4px solid #059669' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 800, color: '#059669', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <ShieldCheck size={13} /> PORTAL DE CARGA DE PROSPECCIÓN
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Bienvenido, {userSession?.fullName || userSession?.username || 'Operador'}
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px', maxWidth: '580px' }}>
              Pega el enlace de Google Sheets compartido o sube tu archivo Excel para actualizar la información.
            </p>
          </div>

          {/* Connection Status */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px', borderRadius: '8px',
              background: isConnected ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${isConnected ? '#a7f3d0' : '#fecaca'}`,
            }}>
              {isConnected ? <Wifi size={15} color="#059669" /> : <WifiOff size={15} color="#dc2626" />}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: isConnected ? '#059669' : '#dc2626' }}>
                  {isConnected ? 'DATOS CONECTADOS' : 'SIN DATOS CARGADOS'}
                </div>
                {isConnected && (
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                    {records.length} registros · última sync {lastSync}
                  </div>
                )}
              </div>
            </div>

            {groupData?.url && (
              <a
                href={groupData.url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '11.5px', color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}
              >
                <ExternalLink size={11} /> Ver Google Sheet conectado
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ─── PANEL DE CARGA ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>

        {/* Google Sheets Sync */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
              <Link2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>Enlazar Google Sheets</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Pega la URL del Sheet de prospección</p>
            </div>
          </div>

          <form onSubmit={handleSyncSheet} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => { setSheetUrl(e.target.value); setSyncStatus(null); }}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '9px 12px',
                color: '#0f172a',
                fontSize: '12.5px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
              <Info size={13} color="#2563eb" />
              <span style={{ fontSize: '11.5px', color: '#1e40af' }}>
                En Google Sheets haz clic en <strong>Compartir → Cualquier persona con el enlace (Lector)</strong>.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn-cyber-emerald"
                disabled={isSyncing}
                style={{ flex: 1, minWidth: '180px', justifyContent: 'center', padding: '10px', fontSize: '13px' }}
              >
                <RefreshCw size={14} className={isSyncing ? 'spin-icon' : ''} />
                {isSyncing ? 'Sincronizando datos...' : 'Sincronizar Google Sheet'}
              </button>

              {sheetUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setSheetUrl('');
                    onUpdateGroupData([], '', 'Sin datos (desvinculado)', '');
                    setSyncStatus({ type: 'success', msg: '🔗 Enlace desvinculado con éxito. Los datos anteriores han sido limpiados para evitar duplicaciones.' });
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 800,
                    background: '#fff7ed',
                    border: '1px solid #fed7aa',
                    color: '#c2410c',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Desvincular y limpiar datos para conectar una nueva hoja desde cero"
                >
                  <Trash2 size={13} /> Desvincular Enlace
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Excel Upload */}
        <div className="glass-panel" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb' }}>
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>Subir Archivo Excel</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Carga tu archivo en formato .xlsx, .xls o .csv</p>
            </div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '14px', border: '1px dashed #cbd5e1', marginBottom: '12px', textAlign: 'center' }}>
            <FileSpreadsheet size={24} color="#64748b" style={{ opacity: 0.7, margin: '0 auto 4px' }} />
            <p style={{ fontSize: '11.5px', color: '#64748b' }}>Selecciona tu archivo de prospección</p>
          </div>

          <label
            className="btn-cyber-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px', cursor: 'pointer', textAlign: 'center' }}
          >
            <FileSpreadsheet size={14} /> Seleccionar Archivo Excel
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleExcelUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* ─── GUÍA DE INSTRUCCIONES PASO A PASO (COLAPSABLE / OCULTA POR DEFECTO) ─── */}
      <div className="glass-panel" style={{ padding: '12px 18px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '5px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', display: 'flex' }}>
              <Info size={14} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
              Guía e Instrucciones de Sincronización y Carga
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowInstructions(prev => !prev)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: 800,
              color: '#2563eb',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            {showInstructions ? <>Ocultar Guía <ChevronUp size={13} /></> : <>Ver Instrucciones <ChevronDown size={13} /></>}
          </button>
        </div>

        {showInstructions && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', fontSize: '12px', color: '#475569', lineHeight: 1.5, marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong style={{ color: '#2563eb' }}>1. Configuración Inicial:</strong>
              <p style={{ margin: '4px 0 0' }}>En Google Sheets haz clic en <em>Compartir</em> → cambiar a <em>"Cualquier persona con el enlace"</em> con rol <strong>Lector</strong>.</p>
            </div>
            <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong style={{ color: '#059669' }}>2. Actualizar en 1 Clic (Sin volver a pegar):</strong>
              <p style={{ margin: '4px 0 0' }}>Si agregaste nuevos prospectos o respuestas en tu Sheet, no vuelvas a pegar la URL; solo presiona <strong>"Sincronizar Google Sheet"</strong> para cargar las novedades.</p>
            </div>
            <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong style={{ color: '#c2410c' }}>3. Cambiar de Hoja:</strong>
              <p style={{ margin: '4px 0 0' }}>Usa el botón <strong>"Desvincular Enlace"</strong> únicamente si vas a conectar una hoja de cálculo totalmente distinta.</p>
            </div>
          </div>
        )}
      </div>

      {/* Sync Status Alert */}
      {syncStatus && (
        <div style={{
          padding: '10px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700,
          background: syncStatus.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: syncStatus.type === 'success' ? '#059669' : '#dc2626',
          border: `1px solid ${syncStatus.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {syncStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {syncStatus.msg}
        </div>
      )}

      {/* ─── MÉTRICAS RESUMEN ─── */}
      {isConnected && (
        <>
          <div>
            <h3 style={{ fontSize: '14.5px', fontWeight: 900, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Sparkles size={14} color="#2563eb" />
              Resumen de Datos Cargados
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>({records.length} registros)</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <StatCard
                label="Total Contactos Enviados"
                value={totalEnviadas.toLocaleString()}
                color="#2563eb"
                sub={`${totalAceptadas} aceptados`}
              />
              <StatCard
                label="Tasa de Aceptación"
                value={`${tasaAceptacion}%`}
                color="#059669"
                sub={`${totalAceptadas} de ${totalEnviadas}`}
              />
              <StatCard
                label="Respuestas Recibidas"
                value={totalRespuestas}
                color="#7c3aed"
                sub="M1 + M2 + M3"
              />
              <StatCard
                label="Demos / Agendamientos"
                value={totalAgendamientos}
                color="#059669"
                sub={`${tasaConversion}% conversión`}
              />
            </div>
          </div>

          {/* Historial de Registros */}
          <div className="glass-panel" style={{ padding: '18px 20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarCheck size={14} color="#059669" />
              Historial de Registros ({records.length} filas)
            </h4>
            <div className="table-responsive">
              <table className="prospecting-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>SDR / Agente</th>
                    <th>W. Enviadas</th>
                    <th>W. Aceptadas</th>
                    <th>M. Enviadas</th>
                    <th>Respuestas</th>
                    <th>Diagnósticos</th>
                    <th>Agendamientos</th>
                    <th>Meta</th>
                    <th>País</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row, i) => (
                    <tr key={row.id || i}>
                      <td style={{ color: '#64748b', fontSize: '12px' }}>{row.timestamp}</td>
                      <td style={{ fontWeight: 800, color: '#0f172a' }}>{row.sdr}</td>
                      <td style={{ color: '#2563eb', fontWeight: 800 }}>{row.conexionesEnviadasWaalaxy || 0}</td>
                      <td style={{ color: '#059669', fontWeight: 800 }}>{row.conexionesAceptadasWaalaxy || 0}</td>
                      <td style={{ color: '#2563eb', fontWeight: 800 }}>{row.conexionesEnviadasManual || 0}</td>
                      <td style={{ color: '#7c3aed', fontWeight: 800 }}>
                        {(Number(row.respuestasM1 || 0) + Number(row.respuestasM2 || 0) + Number(row.respuestasM3 || 0))}
                      </td>
                      <td style={{ color: '#0284c7', fontWeight: 900 }}>{row.diagnosticos || 0}</td>
                      <td style={{ color: '#059669', fontWeight: 900 }}>{row.agendamientos || 0}</td>
                      <td>
                        <span className={`goal-tag ${row.cumplioMeta === 'Sí' ? 'yes' : 'no'}`}>
                          {row.cumplioMeta || 'No'}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '12px' }}>{row.pais || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!isConnected && (
        <div className="glass-panel" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <WifiOff size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
            Aún no has cargado datos
          </h3>
          <p style={{ fontSize: '12.5px', color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
            Pega el enlace de Google Sheets o sube un archivo Excel con la información de prospección.
          </p>
        </div>
      )}
    </div>
  );
}
