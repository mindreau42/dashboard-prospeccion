import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  RefreshCw,
  Search,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  CalendarCheck,
  UserCheck,
  Link2,
  Percent,
  XCircle,
  Award,
  Package,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { fetchCloserSheetData } from '../utils/specializedSheetsParser';
import EquivalenteInversionCard from './EquivalenteInversionCard';

export default function CloserScorecardSection({
  closerData = { reports: [], summary: null, url: '', lastSync: '' },
  onUpdateCloserData,
  userSession = null,
  funnelReports = []
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCloser, setSelectedCloser] = useState('Todos');
  const [showSyncBar, setShowSyncBar] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [sheetUrlInput, setSheetUrlInput] = useState(closerData?.url || 'https://docs.google.com/spreadsheets/d/1U5CyKhgMjvw6djjMiIGiidno41dJC-iM/edit?gid=1981983632#gid=1981983632');

  const reports = useMemo(() => closerData?.reports || [], [closerData]);
  const summary = useMemo(() => closerData?.summary || null, [closerData]);

  const totalDiagnosticos = useMemo(() => {
    if (!funnelReports || !Array.isArray(funnelReports)) return 0;
    return funnelReports.reduce((a, r) => a + Number(r.diagnosticos || 0), 0);
  }, [funnelReports]);

  const totalAgendamientos = useMemo(() => {
    if (!funnelReports || !Array.isArray(funnelReports)) return 0;
    return funnelReports.reduce((a, r) => a + Number(r.agendamientos || 0), 0);
  }, [funnelReports]);

  const handleSyncSheet = async (overrideUrl = null) => {
    const targetUrl = overrideUrl || sheetUrlInput;
    if (!targetUrl) return;
    setIsSyncing(true);
    setSyncMsg('Sincronizando Closer...');
    try {
      const res = await fetchCloserSheetData(targetUrl);
      if (res) {
        onUpdateCloserData(res.reports, res.summary, targetUrl);
        setSyncMsg(`✅ Sincronizado: ${res.reports.length} filas diarias.`);
      }
    } catch (err) {
      setSyncMsg(`❌ Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMsg(''), 5000);
    }
  };

  // KPIs consolidation matching exact user reference layout
  const metrics = useMemo(() => {
    let citasAsignadas = 0;
    let asistenciasEfectivas = 0;
    let ventasCerradas = 0;
    let enSeguimiento = 0;
    let facturacion = 0;
    let cashCollected = 0;
    let menteGlobal = 0;
    let neuroState = 0;
    let activate = 0;
    let catalizador = 0;

    reports.forEach(r => {
      citasAsignadas += Number(r.citasAsignadas || 0);
      asistenciasEfectivas += Number(r.asistenciasEfectivas || 0);
      ventasCerradas += Number(r.ventasCerradas || 0);
      enSeguimiento += Number(r.enSeguimiento || 0);
      facturacion += Number(r.facturacion || 0);
      cashCollected += Number(r.cashCollected || 0);
      menteGlobal += Number(r.prod1 || 0);
      neuroState += Number(r.prod2 || 0);
      activate += Number(r.prod3 || 0);
      catalizador += Number(r.prod4 || 0);
    });

    if (summary) {
      if (summary.citasAsignadas) citasAsignadas = summary.citasAsignadas;
      if (summary.asistenciasEfectivas) asistenciasEfectivas = summary.asistenciasEfectivas;
      if (summary.ventasCerradas) ventasCerradas = summary.ventasCerradas;
      if (summary.enSeguimiento) enSeguimiento = summary.enSeguimiento;
      if (summary.facturacion) facturacion = summary.facturacion;
      if (summary.cashCollected) cashCollected = summary.cashCollected;
      if (summary.menteGlobal) menteGlobal = summary.menteGlobal;
      if (summary.neuroState) neuroState = summary.neuroState;
      if (summary.activate) activate = summary.activate;
      if (summary.catalizador) catalizador = summary.catalizador;
    }

    // No fallback demo data — show real values only (0 if sheet is blank)
    const tasaAsistencia = citasAsignadas > 0 ? `${Math.round((asistenciasEfectivas / citasAsignadas) * 100)}%` : '0%';
    const tasaConversion = asistenciasEfectivas > 0 ? `${Math.round((ventasCerradas / asistenciasEfectivas) * 100)}%` : '0%';
    const ticketPromedio = ventasCerradas > 0 ? Math.round(facturacion / ventasCerradas) : 0;
    const tasaRecaudo = facturacion > 0 ? `${Math.round((cashCollected / facturacion) * 100)}%` : '0%';

    return {
      citasAsignadas,
      asistenciasEfectivas,
      ventasCerradas,
      enSeguimiento,
      facturacion,
      cashCollected,
      tasaAsistencia,
      tasaConversion,
      ticketPromedio,
      tasaRecaudo,
      menteGlobal,
      neuroState,
      activate,
      catalizador
    };
  }, [reports, summary]);

  const uniqueClosers = useMemo(() => {
    const list = Array.from(new Set(reports.map(r => r.closer).filter(Boolean)));
    return ['Todos', ...list];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchCloser = selectedCloser === 'Todos' || r.closer === selectedCloser;
      const matchSearch = searchTerm === '' ||
        r.fecha?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.closer?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCloser && matchSearch;
    });
  }, [reports, selectedCloser, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* Banner Superior Closer */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(79,70,229,0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.18)',
            padding: '14px',
            borderRadius: '14px',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Briefcase size={32} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 3px 0' }}>
              Closer Scorecard
            </h1>
            <p style={{ margin: 0, fontSize: '12.5px', opacity: 0.85 }}>
              Desempeño de Cierres de Ventas, Facturación, Cash Collected y Catálogo de Productos
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#ffffff',
              padding: '7px 13px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Info size={14} /> Protocolo Closer
            {showGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Guía Protocolo Closer (Colapsable) */}
      {showGuide && (
        <div className="glass-panel" style={{
          padding: '16px 18px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px'
        }}>
          <div style={{ fontWeight: 900, fontSize: '13px', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={15} color="#4f46e5" /> Protocolo y Gestión del Equipo de Cierre (Closers)
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
            Este módulo monitorea la efectividad de llamadas de venta asignadas, ratio de asistencia, conversión a ventas cerradas, cash collected y facturación global. Los datos provienen de la hoja de cálculo de gestión y se actualizan con el botón principal del sistema.
          </p>
        </div>
      )}

      {/* Sync bar expandible */}
      {showSyncBar && (
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link2 size={18} color="#7c3aed" />
          <input
            type="text"
            value={sheetUrlInput}
            onChange={(e) => setSheetUrlInput(e.target.value)}
            placeholder="Pega la URL de Google Sheets del Closer Scorecard..."
            style={{
              flex: 1,
              minWidth: '280px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px'
            }}
          />
          <button
            onClick={() => handleSyncSheet()}
            disabled={isSyncing}
            className="btn-cyber-primary"
            style={{ padding: '8px 16px', fontSize: '13px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            {isSyncing ? 'Sincronizando...' : 'Vincular y Sincronizar'}
          </button>
        </div>
      )}

      {syncMsg && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 700,
          background: syncMsg.startsWith('✅') ? '#ecfdf5' : '#fef2f2',
          color: syncMsg.startsWith('✅') ? '#047857' : '#b91c1c',
          border: `1px solid ${syncMsg.startsWith('✅') ? '#a7f3d0' : '#fecaca'}`
        }}>
          {syncMsg}
        </div>
      )}

      {/* ─── GRID DE KPIS + CUADRO DE PRODUCTOS (COMPACTO PARA QUE ENTRE TODO EL BLOQUE) ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) minmax(180px, 1.05fr)',
        gridTemplateRows: 'auto auto',
        gap: '10px'
      }}>
        
        {/* FILA 1 - COL 1: CITAS ASIGNADAS */}
        <div className="glass-panel" style={{
          padding: '12px 14px', borderRadius: '12px',
          background: 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)',
          border: '1px solid #bbf7d0', borderTop: '3px solid #059669',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              CITAS ASIGNADAS
            </span>
            <div style={{ padding: '5px', borderRadius: '6px', background: '#ecfdf5', color: '#059669' }}>
              <CalendarCheck size={14} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
            {metrics.citasAsignadas}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px' }}>Total citas en agenda</div>
        </div>

        {/* FILA 1 - COL 2: VENTAS CERRADAS */}
        <div className="glass-panel" style={{
          padding: '12px 14px', borderRadius: '12px',
          background: 'linear-gradient(145deg, #ffffff 0%, #ecfeff 100%)',
          border: '1px solid #a5f3fc', borderTop: '3px solid #0891b2',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#0e7490', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              VENTAS CERRADAS
            </span>
            <div style={{ padding: '5px', borderRadius: '6px', background: '#ecfeff', color: '#0891b2' }}>
              <Award size={14} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
            {metrics.ventasCerradas}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px' }}>Cierres confirmados</div>
        </div>

        {/* FILA 1 - COL 3: TASA CONVERSIÓN */}
        <div className="glass-panel" style={{
          padding: '12px 14px', borderRadius: '12px',
          background: 'linear-gradient(145deg, #ffffff 0%, #fffbeb 100%)',
          border: '1px solid #fde68a', borderTop: '3px solid #d97706',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              TASA CONVERSIÓN
            </span>
            <div style={{ padding: '5px', borderRadius: '6px', background: '#fffbeb', color: '#d97706' }}>
              <TrendingUp size={14} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#d97706', lineHeight: 1 }}>
            {metrics.tasaConversion}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px' }}>Ventas / Asistencias</div>
        </div>

        {/* COL 4: CUADRO DE PRODUCTOS — 4 PRODUCTOS EN GRID 2x2 */}
        <div className="glass-panel" style={{
          gridColumn: '4',
          gridRow: '1 / span 2',
          padding: '12px 14px',
          borderRadius: '14px',
          background: '#ffffff',
          border: '1.5px solid #0f172a',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 900,
            color: '#0f172a',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            PRODUCTOS
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            flex: 1
          }}>
            {/* Mente Global */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '8px 6px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>Mente Global</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {metrics.menteGlobal != null ? metrics.menteGlobal : '—'}
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>Vendidos</div>
            </div>

            {/* NeuroState™ */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '8px 6px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>NeuroState™</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {metrics.neuroState != null ? metrics.neuroState : '—'}
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>Vendidos</div>
            </div>

            {/* Activate */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '8px 6px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>Activate</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {metrics.activate != null ? metrics.activate : '—'}
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>Vendidos</div>
            </div>

            {/* Catalizador */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '8px 6px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>Catalizador</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {metrics.catalizador != null ? metrics.catalizador : '—'}
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>Vendidos</div>
            </div>
          </div>
        </div>

        {/* FILA 2 - COL 1: EN SEGUIMIENTO */}
        <div className="glass-panel" style={{
          padding: '12px 14px', borderRadius: '12px',
          background: 'linear-gradient(145deg, #ffffff 0%, #fff7ed 100%)',
          border: '1px solid #fed7aa', borderTop: '3px solid #ea580c',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              EN SEGUIMIENTO
            </span>
            <div style={{ padding: '5px', borderRadius: '6px', background: '#fff7ed', color: '#ea580c' }}>
              <Clock size={14} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
            {metrics.enSeguimiento}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px' }}>Leads en proceso de decisión</div>
        </div>

        {/* FILA 2 - COL 2: TASA ASISTENCIA */}
        <div className="glass-panel" style={{
          padding: '12px 14px', borderRadius: '12px',
          background: 'linear-gradient(145deg, #ffffff 0%, #eff6ff 100%)',
          border: '1px solid #bfdbfe', borderTop: '3px solid #2563eb',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              TASA ASISTENCIA
            </span>
            <div style={{ padding: '5px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb' }}>
              <Percent size={14} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#2563eb', lineHeight: 1 }}>
            {metrics.tasaAsistencia}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px' }}>{metrics.asistenciasEfectivas} de {metrics.citasAsignadas} citas</div>
        </div>

        {/* FILA 2 - COL 3: TOTAL FACTURACIÓN */}
        <div className="glass-panel" style={{
          padding: '12px 14px', borderRadius: '12px',
          background: 'linear-gradient(145deg, #ffffff 0%, #faf5ff 100%)',
          border: '1px solid #e9d5ff', borderTop: '3px solid #7c3aed',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              TOTAL FACTURACIÓN
            </span>
            <div style={{ padding: '5px', borderRadius: '6px', background: '#faf5ff', color: '#7c3aed' }}>
              <DollarSign size={14} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#7c3aed', lineHeight: 1 }}>
            ${metrics.facturacion.toLocaleString()}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px' }}>Monto total cerrado</div>
        </div>
      </div>

      {/* ─── EQUIVALENTE EN INVERSIÓN PUBLICITARIA (CPL $3.50 · CPA $30 · CAC $80) ─── */}
      <EquivalenteInversionCard
        diagnosticos={totalDiagnosticos}
        agendados={totalAgendamientos}
        cierres={metrics.activate + metrics.catalizador}
        style={{ marginBottom: '16px' }}
      />

      {/* ─── TABLA COMPLETA GESTIÓN DIARIA POR CLOSER (EXACTA A LA IMAGEN 3) ─── */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              Gestión Diaria por Closer
            </h3>
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              Mostrando {filteredReports.length} registros
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Buscar fecha, closer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '7px 10px 7px 30px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px'
                }}
              />
            </div>

            <select
              value={selectedCloser}
              onChange={(e) => setSelectedCloser(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12.5px',
                fontWeight: 600
              }}
            >
              {uniqueClosers.map(cl => <option key={cl} value={cl}>Closer: {cl}</option>)}
            </select>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
            No hay registros de gestión de Closer disponibles.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="prospecting-table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>Fecha</th>
                  <th style={{ textAlign: 'center' }}>Closer</th>
                  <th style={{ textAlign: 'center' }}>Citas Asignadas</th>
                  <th style={{ textAlign: 'center' }}>Asistencias</th>
                  <th style={{ textAlign: 'center' }}>Ventas</th>
                  <th style={{ textAlign: 'center' }}>En Seguimiento</th>
                  <th style={{ textAlign: 'center' }}>Tasa Asistencia</th>
                  <th style={{ textAlign: 'center' }}>Tasa Conv.</th>
                  <th style={{ textAlign: 'center' }}>Tasa Recaudo</th>
                  <th style={{ textAlign: 'center' }}>Cash Collected</th>
                  <th style={{ textAlign: 'center' }}>Facturación</th>
                  <th style={{ textAlign: 'center' }}>Duración Llamada (min)</th>
                  <th style={{ textAlign: 'center' }}>Ciclo de Cierre (dias)</th>
                  <th style={{ textAlign: 'center' }}>Mente Global</th>
                  <th style={{ textAlign: 'center' }}>NeuroState</th>
                  <th style={{ textAlign: 'center' }}>Activate</th>
                  <th style={{ textAlign: 'center' }}>Catalizador</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => (
                  <tr key={r.id}>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>{r.fecha}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#4f46e5' }}>{r.closer}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.citasAsignadas}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#2563eb' }}>{r.asistenciasEfectivas}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#059669' }}>{r.ventasCerradas}</td>
                    <td style={{ textAlign: 'center', color: '#d97706', fontWeight: 600 }}>{r.enSeguimiento}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.tasaAsistencia}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#16a34a' }}>{r.tasaConversion}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#475569' }}>{r.tasaRecaudo}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#059669' }}>${r.cashCollected.toLocaleString()}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#4f46e5' }}>${r.facturacion.toLocaleString()}</td>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>{r.duracionPromedio > 0 ? `${r.duracionPromedio} min` : '-'}</td>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>{r.cicloCierre > 0 ? `${r.cicloCierre} dias` : '-'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>{r.prod1 ?? 0}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>{r.prod2 ?? 0}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>{r.prod3 ?? 0}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>{r.prod4 ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
