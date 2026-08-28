import React from 'react';
import {
  FileSpreadsheet, Link2, Trash2,
  Sparkles, TrendingUp, Trophy, CalendarCheck, Database, Layers,
  Crown, Users, LogOut, UploadCloud, PhoneCall, Target, UserCheck, ChevronDown,
  RefreshCw, Filter, Zap
} from 'lucide-react';

export default function Header({
  userSession,
  users = [],
  onSwitchUser,
  activeView,
  setActiveView,
  onLogout,
  onOpenUserManagement,
  onOpenExcelModal,
  onOpenGoogleSheetsModal,
  onClearData,
  onOpenProfileModal,
  onQuickSync,
  isQuickSyncing,
  quickSyncMsg,
  adminChannelFilter = 'ALL',
  setAdminChannelFilter,
  hasActiveSheet
}) {
  const role = userSession?.role || 'setter';
  const fullName = userSession?.fullName || userSession?.username || 'Usuario';
  const avatar = userSession?.avatar || '👤';
  const isImageAvatar = avatar && avatar.startsWith('data:image');

  return (
    <div style={{ marginBottom: '20px' }}>
      
      {/* ─── HEADER PRINCIPAL CON POSICIÓN ESTÁNDAR ─── */}
      <header className="dashboard-header" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 22px' }}>
        
        {/* FILA 1: IDENTIFICADOR DE MARCA A LA IZQUIERDA Y CONTROLES DE USUARIO FIJOS A LA DERECHA */}
        <div className="header-row-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* Marca y Rol */}
          <div>
            <h1 style={{ margin: 0, lineHeight: 1.2, fontSize: '21px', fontWeight: 900, color: '#0f172a' }}>
              Dashboard de Prospección
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
              Reporte de Actividad: Métricas y KPIs
            </p>
          </div>

          {/* CONTROLES FIJOS A LA DERECHA (POSICIÓN ESTÁNDAR SIEMPRE IDÉNTICA) */}
          <div className="header-user-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* Selector de Visualización / Auditoría por Canal (Exclusivo Administrador) */}
            {role === 'admin' && setAdminChannelFilter && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                padding: '4px 10px',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Filter size={13} /> Visualizar Canal:
                </span>
                <select
                  value={adminChannelFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAdminChannelFilter(val);
                    if (val === 'Callers') {
                      setActiveView('supervisor');
                    } else if (val === 'ALL') {
                      setActiveView('overview');
                    } else {
                      if (activeView === 'overview' || activeView === 'supervisor') {
                        setActiveView('funnel');
                      }
                    }
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #2563eb',
                    color: '#1e40af',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  title="Filtra para auditar los datos de un canal específico o ver el consolidado global"
                >
                  <option value="ALL">Administrador Principal (ADMIN)</option>
                  <option value="Setters Oficiales">Canal A - Setters Oficiales</option>
                  <option value="Setters Aspirantes">Canal B - Setters Aspirantes</option>
                  <option value="Callers">Canal C - Call Team</option>
                </select>
              </div>
            )}

            {/* IDENTIFICADOR DE USUARIO CON VENTANA DESPLEGABLE DE PERFIL */}
            <button
              type="button"
              onClick={onOpenProfileModal}
              title="Haz clic para ver tu información o cambiar tu logo de perfil"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '4px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              {/* Avatar Box (Estándar 1:1) */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: isImageAvatar ? 'transparent' : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {isImageAvatar ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>{avatar}</span>
                )}
              </div>

              {/* Info Text Box */}
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  {fullName}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {role} {userSession?.group ? `· ${userSession.group}` : ''}
                </span>
              </div>
            </button>

            {/* BOTÓN CERRAR SESIÓN (SIEMPRE VISIBLE Y POSICIÓN ESTÁNDAR) */}
            <button
              onClick={onLogout}
              className="btn-cyber-ghost"
              style={{
                color: '#dc2626',
                borderColor: '#fecaca',
                background: '#ffffff',
                padding: '6px 12px',
                fontSize: '12px'
              }}
              title="Cerrar sesión segura"
            >
              <LogOut size={13} /> Salir
            </button>
          </div>
        </div>

        {/* FILA 2: BARRA DE HERRAMIENTAS EXCLUSIVA PARA ADMINISTRADOR */}
        {role === 'admin' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '10px',
            borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginRight: '4px' }}>
                Herramientas de Administración:
              </span>
              <button
                className="btn-cyber-emerald"
                onClick={onQuickSync}
                disabled={isQuickSyncing}
                style={{ padding: '5px 13px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
                title="Actualizar y sincronizar todos los Google Sheets activos"
              >
                <RefreshCw size={13} className={isQuickSyncing ? 'spin-icon' : ''} />
                {isQuickSyncing ? 'Sincronizando...' : '🔄 Actualizar / Sincronizar Todo'}
              </button>
              <button
                className="btn-cyber-ghost"
                onClick={onOpenUserManagement}
                style={{ background: '#ffffff', color: '#2563eb', borderColor: '#bfdbfe', padding: '5px 12px', fontSize: '12px' }}
              >
                <Users size={13} /> Gestión de Usuarios
              </button>
              <button
                className="btn-cyber-primary"
                onClick={onOpenGoogleSheetsModal}
                style={{ padding: '5px 12px', fontSize: '12px' }}
              >
                <Link2 size={13} /> Enlazar Google Sheets
              </button>
              <button
                className="btn-cyber-ghost"
                onClick={onOpenExcelModal}
                style={{ padding: '5px 12px', fontSize: '12px' }}
              >
                <FileSpreadsheet size={13} /> Cargar Excel
              </button>
            </div>
          </div>
        )}

        {/* FILA 2: BARRA DE ACCIÓN PARA CALLERS */}
        {role === 'caller' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '10px',
            borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Panel del Call Team:
              </span>
              <button
                className="btn-cyber-emerald"
                onClick={onQuickSync}
                disabled={isQuickSyncing}
                style={{ padding: '5px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
              >
                <RefreshCw size={13} className={isQuickSyncing ? 'spin-icon' : ''} />
                {isQuickSyncing ? 'Sincronizando...' : '🔄 Sincronizar Google Sheet (Callers)'}
              </button>
            </div>
          </div>
        )}

        {/* FLOATING TOAST NOTIFICATION (NO LAYOUT SHIFTS) */}
        {quickSyncMsg && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            background: quickSyncMsg.startsWith('✅') ? '#ecfdf5' : '#fef2f2',
            border: `1.5px solid ${quickSyncMsg.startsWith('✅') ? '#a7f3d0' : '#fecaca'}`,
            color: quickSyncMsg.startsWith('✅') ? '#065f46' : '#991b1b',
            borderRadius: '10px',
            padding: '12px 18px',
            fontSize: '12.5px',
            fontWeight: 800,
            boxShadow: '0 10px 25px -3px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease'
          }}>
            {quickSyncMsg}
          </div>
        )}

      </header>

      {/* ─── PESTAÑAS DE VISTAS (ALTURA Y POSICIÓN ESTÁNDAR) ─── */}
      <div className="view-tabs-cyber">
        
        {/* TAB VISIÓN GENERAL (EXCLUSIVO ADMINISTRADOR EN CONSOLIDADO GLOBAL) */}
        {role === 'admin' && adminChannelFilter === 'ALL' && (
          <button
            className="view-tab-btn-cyber"
            onClick={() => setActiveView('overview')}
            style={activeView === 'overview'
              ? { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', borderColor: 'transparent', boxShadow: '0 3px 10px rgba(37,99,235,0.4)' }
              : { background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)', color: '#1d4ed8', borderColor: '#bfdbfe' }}
          >
            <Sparkles size={14} /> Visión General
          </button>
        )}

        {/* VISTAS DE SETTERS (EMBUDO, OPERATIVO, TRACKER, AGENDADOS, FUENTE DE DATOS) */}
        {(role === 'setter' || (role === 'admin' && adminChannelFilter !== 'Callers')) && (
          <>
            {/* Embudo Comercial — Naranja ámbar */}
            <button
              className="view-tab-btn-cyber"
              onClick={() => setActiveView('funnel')}
              style={activeView === 'funnel'
                ? { background: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)', color: '#fff', borderColor: 'transparent', boxShadow: '0 3px 10px rgba(217,119,6,0.4)' }
                : { background: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)', color: '#b45309', borderColor: '#fde68a' }}
            >
              <TrendingUp size={14} /> 1. Embudo Comercial
            </button>

            {/* Análisis Operativo — Violeta */}
            <button
              className="view-tab-btn-cyber"
              onClick={() => setActiveView('operative')}
              style={activeView === 'operative'
                ? { background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: '#fff', borderColor: 'transparent', boxShadow: '0 3px 10px rgba(124,58,237,0.4)' }
                : { background: 'linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%)', color: '#6d28d9', borderColor: '#ddd6fe' }}
            >
              <Layers size={14} /> 2. Análisis Operativo
            </button>

            {/* Tracker Leaderboard — Dorado */}
            <button
              className="view-tab-btn-cyber"
              onClick={() => setActiveView('tracker')}
              style={activeView === 'tracker'
                ? { background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fff', borderColor: 'transparent', boxShadow: '0 3px 10px rgba(217,119,6,0.4)' }
                : { background: 'linear-gradient(135deg, #fffbeb 0%, #fef9c3 100%)', color: '#92400e', borderColor: '#fcd34d' }}
            >
              <Trophy size={14} /> 3. Tracker Leaderboard
            </button>

            {/* Lista de Agendados — Esmeralda */}
            <button
              className="view-tab-btn-cyber"
              onClick={() => setActiveView('scheduled')}
              style={activeView === 'scheduled'
                ? { background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)', color: '#fff', borderColor: 'transparent', boxShadow: '0 3px 10px rgba(5,150,105,0.4)' }
                : { background: 'linear-gradient(135deg, #ecfdf5 0%, #ecfeff 100%)', color: '#047857', borderColor: '#99f6e4' }}
            >
              <CalendarCheck size={14} /> 4. Lista de Agendados
            </button>

            {/* Fuente de Datos — Azul acero */}
            <button
              className="view-tab-btn-cyber"
              onClick={() => setActiveView('datasource')}
              style={activeView === 'datasource'
                ? { background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', borderColor: 'transparent', boxShadow: '0 3px 10px rgba(2,132,199,0.4)' }
                : { background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', color: '#0369a1', borderColor: '#7dd3fc' }}
            >
              <Database size={14} /> 5. Fuente de Datos
            </button>

            {/* TAB DE CARGA PARA SETTER (Al final después de Fuente de Datos) */}
            {role === 'setter' && (
              <button
                className="view-tab-btn-cyber"
                onClick={() => setActiveView('userportal')}
                style={activeView === 'userportal'
                  ? { background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)', color: '#ffffff', borderColor: 'transparent', boxShadow: '0 3px 10px rgba(5,150,105,0.4)' }
                  : { background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)', color: '#059669', borderColor: '#a7f3d0' }}
              >
                <UploadCloud size={14} /> ⚡ Carga & Sincronización
              </button>
            )}
          </>
        )}

        {/* 6. CALLER SCORECARD — Rosa violeta (Visible para Callers, o Admin en Consolidado Global o Canal C - Call Team) */}
        {(role === 'caller' || (role === 'admin' && (adminChannelFilter === 'ALL' || adminChannelFilter === 'Callers'))) && (
          <button
            className="view-tab-btn-cyber"
            onClick={() => setActiveView('supervisor')}
            style={activeView === 'supervisor'
              ? { background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)', color: '#ffffff', borderColor: 'transparent', boxShadow: '0 3px 10px rgba(124,58,237,0.4)' }
              : { background: 'linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 100%)', color: '#7c3aed', borderColor: '#ddd6fe' }}
          >
            <PhoneCall size={14} /> 6. Caller Scorecard
          </button>
        )}
      </div>
    </div>
  );
}
