import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Trophy,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Users,
  Calendar,
  RotateCcw,
  Layers,
  Filter,
  ListFilter,
  UserCheck,
  Eye,
  X,
  FileSpreadsheet,
  ExternalLink,
  HelpCircle,
  Info,
  Search
} from 'lucide-react';
import { matchesDateRange, getWeeksFromReports, matchesWeek } from '../utils/security';

export default function SdrTrackerLeaderboard({ reports = [] }) {
  const [selectedWeek, setSelectedWeek] = useState('Todos');
  const [selectedSdr, setSelectedSdr] = useState('Todos');
  const [selectedGroup, setSelectedGroup] = useState('Todos');
  const [selectedDateFrom, setSelectedDateFrom] = useState('');
  const [selectedDateTo, setSelectedDateTo] = useState('');
  const [viewMode, setViewMode] = useState('consolidated'); // 'consolidated' (1 fila por SDR) vs 'breakdown' (todas las filas)
  const [auditModalTarget, setAuditModalTarget] = useState(null); // SDR name or 'ALL' or null

  const uniqueSdrs = ['Todos', ...Array.from(new Set(reports.map(r => r.sdr).filter(Boolean)))];
  const uniqueGroups = ['Todos', ...Array.from(new Set(reports.map(r => r._group).filter(Boolean)))];
  const availableWeeks = getWeeksFromReports(reports);

  const isFiltered = selectedWeek !== 'Todos' || selectedSdr !== 'Todos' || selectedGroup !== 'Todos' || selectedDateFrom !== '' || selectedDateTo !== '';

  const resetFilters = () => {
    setSelectedWeek('Todos');
    setSelectedSdr('Todos');
    setSelectedGroup('Todos');
    setSelectedDateFrom('');
    setSelectedDateTo('');
  };

  const filteredReports = reports.filter(r => {
    const weekMatch = matchesWeek(r.timestamp, selectedWeek);
    const sdrMatch = selectedSdr === 'Todos' || r.sdr === selectedSdr;
    const groupMatch = selectedGroup === 'Todos' || r._group === selectedGroup;
    const dateMatch = matchesDateRange(r.timestamp, selectedDateFrom, selectedDateTo);
    return weekMatch && sdrMatch && groupMatch && dateMatch;
  });

  // ── Bloquear scroll del fondo cuando el modal esté abierto ──
  useEffect(() => {
    if (auditModalTarget) {
      const prevBody = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBody;
      };
    }
  }, [auditModalTarget]);

  // Fórmula de puntaje correcta:
  // +1 pt por diagnóstico
  // +5 pts por agendamiento (meta cumplida = Sí)
  // +10 pts por lead asistido al booking
  const calculateRowStats = (r) => {
    const diag = Number(r.diagnosticos || 0);
    const asistRaw = (r.asistioLead || '').toLowerCase().trim();
    const isAsistSi = (asistRaw === 'sí' || asistRaw === 'si' || asistRaw.startsWith('si') || asistRaw.startsWith('sí') || asistRaw === '1' || asistRaw === 'true') && !asistRaw.startsWith('no') && !asistRaw.includes('pendiente');

    const cumplio = Boolean(
      r.cumplioMeta && (
        String(r.cumplioMeta).toLowerCase() === 'sí' ||
        String(r.cumplioMeta).toLowerCase() === 'si' ||
        String(r.cumplioMeta).toLowerCase().startsWith('si') ||
        String(r.cumplioMeta).toLowerCase().startsWith('sí') ||
        String(r.cumplioMeta) === '1'
      ) &&
      !String(r.cumplioMeta).toLowerCase().startsWith('no')
    );
    // Agendamientos estrictos desde la celda de la hoja
    const agend = Number(r.agendamientos || 0);
    const asist = Number(r.asistidos !== undefined && r.asistidos !== '' ? r.asistidos : (isAsistSi ? 1 : 0));
    const showUp = agend > 0 ? Math.round((asist / agend) * 100) : (asist > 0 ? 100 : 0);

    // Fórmula: diag×1 + agendamientos×5 + asistidos×10
    const pts = (diag * 1) + (agend * 5) + (asist * 10);
    return { diag, cumplio, agend, asist, showUp, pts };
  };

  const getGroupBadge = (group) => {
    const g = String(group || '').toLowerCase();
    if (g.includes('oficial')) {
      return (
        <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          🚀 Oficiales
        </span>
      );
    } else if (g.includes('aspirante')) {
      return (
        <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          🎯 Aspirantes
        </span>
      );
    }
    return (
      <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
        🌐 Global
      </span>
    );
  };

  // Aggregate stats per SDR for Consolidated view and Podium
  const sdrMap = {};
  filteredReports.forEach(r => {
    const s = r.sdr || 'Desconocido';
    const stats = calculateRowStats(r);
    if (!sdrMap[s]) {
      sdrMap[s] = {
        name: s,
        agend: 0,
        diag: 0,
        asist: 0,
        pts: 0,
        metasCumplidas: 0,
        totalReportes: 0,
        estadoWaalaxy: r.estadoWaalaxy || 'Activo',
        lastTimestamp: r.timestamp || '',
        groups: new Set()
      };
    } else {
      if ((r.timestamp || '') >= (sdrMap[s].lastTimestamp || '')) {
        sdrMap[s].estadoWaalaxy = r.estadoWaalaxy || sdrMap[s].estadoWaalaxy;
        sdrMap[s].lastTimestamp = r.timestamp || sdrMap[s].lastTimestamp;
      }
    }
    sdrMap[s].agend += stats.agend;
    sdrMap[s].diag += stats.diag;
    sdrMap[s].asist += stats.asist;
    sdrMap[s].pts += stats.pts;
    if (stats.cumplio) sdrMap[s].metasCumplidas += 1;
    sdrMap[s].totalReportes += 1;
    if (r._group) sdrMap[s].groups.add(r._group);
  });

  const consolidatedList = Object.values(sdrMap).map(s => {
    const showUp = s.agend > 0 ? Math.round((s.asist / s.agend) * 100) : (s.asist > 0 ? 100 : 0);
    return { ...s, showUp };
  });

  const rankedSdrs = [...consolidatedList].sort((a, b) => b.pts - a.pts || b.diag - a.diag);
  const topPodium = rankedSdrs.slice(0, 3);

  const getInitials = (name) => {
    if (!name) return 'SD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getWaalaxyBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('RESTR') || s.includes('BLOQ') || s.includes('PAUS')) {
      return (
        <span className="status-badge limited" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={11} /> Restricción
        </span>
      );
    } else if (s.includes('SSI') || s.includes('BAJO')) {
      return (
        <span className="status-badge paused" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={11} /> Bajo SSI
        </span>
      );
    } else {
      return (
        <span className="status-badge active" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={11} /> Activo
        </span>
      );
    }
  };

  const selectStyle = {
    background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a',
    padding: '6px 10px', borderRadius: '6px', fontSize: '12px',
    fontWeight: 600, outline: 'none', cursor: 'pointer'
  };

  const dateInputStyle = {
    background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a',
    padding: '6px 8px', borderRadius: '6px', fontFamily: 'inherit',
    fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer', width: '130px'
  };

  // Sorting state: default sort by PUNTAJE descending
  const [sortConfig, setSortConfig] = useState({ key: 'pts', direction: 'desc' });

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'desc' ? 'asc' : 'desc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const sortedConsolidated = useMemo(() => {
    return [...consolidatedList].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      switch (sortConfig.key) {
        case 'sdr':
          return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        case 'group':
          valA = Array.from(a.groups).join(', ');
          valB = Array.from(b.groups).join(', ');
          return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'waalaxy':
          valA = (a.estadoWaalaxy || '').toLowerCase();
          valB = (b.estadoWaalaxy || '').toLowerCase();
          return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'meta':
          valA = a.metasCumplidas;
          valB = b.metasCumplidas;
          break;
        case 'diag':
          valA = a.diag;
          valB = b.diag;
          break;
        case 'agend':
          valA = a.agend;
          valB = b.agend;
          break;
        case 'asist':
          valA = a.asist;
          valB = b.asist;
          break;
        case 'showUp':
          valA = a.showUp;
          valB = b.showUp;
          break;
        case 'pts':
        default:
          valA = a.pts;
          valB = b.pts;
          break;
      }
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });
  }, [consolidatedList, sortConfig]);

  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      const statsA = calculateRowStats(a);
      const statsB = calculateRowStats(b);

      let valA = 0;
      let valB = 0;

      switch (sortConfig.key) {
        case 'sdr':
          return sortConfig.direction === 'asc'
            ? (a.sdr || '').localeCompare(b.sdr || '')
            : (b.sdr || '').localeCompare(a.sdr || '');
        case 'group':
          valA = (a._group || '').toLowerCase();
          valB = (b._group || '').toLowerCase();
          return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'waalaxy':
          valA = (a.estadoWaalaxy || '').toLowerCase();
          valB = (b.estadoWaalaxy || '').toLowerCase();
          return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'meta':
          valA = statsA.cumplio ? 1 : 0;
          valB = statsB.cumplio ? 1 : 0;
          break;
        case 'diag':
          valA = statsA.diag;
          valB = statsB.diag;
          break;
        case 'agend':
          valA = statsA.agend;
          valB = statsB.agend;
          break;
        case 'asist':
          valA = statsA.asist;
          valB = statsB.asist;
          break;
        case 'showUp':
          valA = statsA.showUp;
          valB = statsB.showUp;
          break;
        case 'pts':
        default:
          valA = statsA.pts;
          valB = statsB.pts;
          break;
      }

      if (valA !== valB) {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
      return sortConfig.direction === 'asc' ? statsA.diag - statsB.diag : statsB.diag - statsA.diag;
    });
  }, [filteredReports, sortConfig]);

  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <span style={{ opacity: 0.3, fontSize: '10px', marginLeft: '4px' }}>⇅</span>;
    }
    return (
      <span style={{ color: '#2563eb', fontSize: '11px', marginLeft: '4px', fontWeight: 900 }}>
        {sortConfig.direction === 'desc' ? '▼' : '▲'}
      </span>
    );
  };

  const headerThStyle = (key, align = 'center') => ({
    textAlign: align,
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background 0.15s ease',
    background: sortConfig.key === key ? 'rgba(37, 99, 235, 0.06)' : 'transparent',
    color: sortConfig.key === key ? '#2563eb' : '#475569'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
      
      {/* ─── PODIO VISUAL DE TOP SDRS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        {topPodium.map((s, idx) => {
          const medals = ['🥇 1er Lugar', '🥈 2do Lugar', '🥉 3er Lugar'];
          const borders = ['#d97706', '#2563eb', '#059669'];
          const bgPills = ['#fffbeb', '#eff6ff', '#ecfdf5'];
          const textColors = ['#b45309', '#1d4ed8', '#047857'];
          return (
            <div key={s.name} className="glass-panel" style={{ padding: '16px 18px', borderTop: `3px solid ${borders[idx]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, color: textColors[idx], background: bgPills[idx], padding: '3px 8px', borderRadius: '12px', border: `1px solid ${borders[idx]}` }}>
                  {medals[idx]}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#d97706' }}>⭐ {s.pts} pts</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: bgPills[idx], border: `1px solid ${borders[idx]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: textColors[idx], fontSize: '13.5px' }}>
                  {getInitials(s.name)}
                </div>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 900, color: '#0f172a' }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                    {Array.from(s.groups).map(g => (
                      <span key={g}>{getGroupBadge(g)}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── TABLA DE SEGUIMIENTO SDRS ─── */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        {/* Header with Title and Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '14px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={17} color="#d97706" />
              Tracker | Leaderboard (Desempeño de SDRs)
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {viewMode === 'consolidated'
                ? 'Vista Consolidada por SDR: 1 fila por asesor sumando sus reportes acumulados y equipo asignado.'
                : 'Desglose Detallado por Reporte: Cada entrega individual con su fecha y canal/equipo correspondiente.'}
            </p>
          </div>

          {/* Toggle de Modo de Visualización (Consolidado vs Desglose) */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setViewMode('consolidated')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'consolidated' ? '#ffffff' : 'transparent',
                color: viewMode === 'consolidated' ? '#2563eb' : '#64748b',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: viewMode === 'consolidated' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <UserCheck size={13} /> Consolidado por SDR ({consolidatedList.length})
            </button>
            <button
              onClick={() => setViewMode('breakdown')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'breakdown' ? '#ffffff' : 'transparent',
                color: viewMode === 'breakdown' ? '#2563eb' : '#64748b',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: viewMode === 'breakdown' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <ListFilter size={13} /> Desglose por Reporte ({filteredReports.length})
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Equipo / Canal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Layers size={13} color="#7c3aed" />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>EQUIPO:</span>
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} style={selectStyle}>
                {uniqueGroups.map(g => (
                  <option key={g} value={g}>{g === 'Todos' ? 'Todos los Equipos' : g}</option>
                ))}
              </select>
            </div>

            {/* SDR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={13} color="#059669" />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>SDR:</span>
              <select value={selectedSdr} onChange={(e) => setSelectedSdr(e.target.value)} style={selectStyle}>
                {uniqueSdrs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Semana */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={13} color="#2563eb" />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>SEMANA:</span>
              <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} style={selectStyle}>
                {availableWeeks.map(w => <option key={w.key} value={w.key}>{w.label}</option>)}
              </select>
            </div>

            {/* Rango de Fechas */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={13} color="#7c3aed" />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>RANGO:</span>
              <input type="date" value={selectedDateFrom} onChange={(e) => setSelectedDateFrom(e.target.value)} style={dateInputStyle} />
              <span style={{ fontSize: '11px', color: '#64748b' }}>→</span>
              <input type="date" value={selectedDateTo} onChange={(e) => setSelectedDateTo(e.target.value)} style={dateInputStyle} />
            </div>

          </div>

          {/* Limpiar */}
          <button
            onClick={resetFilters}
            style={{
              visibility: isFiltered ? 'visible' : 'hidden',
              background: 'transparent', border: 'none', color: '#2563eb',
              fontSize: '11.5px', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontWeight: 800, textDecoration: 'underline', padding: '6px 0', whiteSpace: 'nowrap'
            }}
          >
            <RotateCcw size={12} /> Limpiar
          </button>
        </div>

        {/* Table Rendering */}
        <div className="table-responsive">
          <table className="prospecting-table" style={{ width: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th onClick={() => handleSort('sdr')} style={{ textAlign: 'left', paddingLeft: '20px', width: '20%', cursor: 'pointer', userSelect: 'none' }}>
                  SDR {renderSortIndicator('sdr')}
                </th>
                <th onClick={() => handleSort('group')} style={{ ...headerThStyle('group', 'left'), width: '13%' }}>
                  Equipo / Canal {renderSortIndicator('group')}
                </th>
                <th onClick={() => handleSort('waalaxy')} style={{ ...headerThStyle('waalaxy'), width: '10%' }}>
                  Waalaxy {renderSortIndicator('waalaxy')}
                </th>
                <th onClick={() => handleSort('meta')} style={{ ...headerThStyle('meta'), width: '11%' }}>
                  {viewMode === 'consolidated' ? 'Metas Cumplidas' : 'Meta Semanal'} {renderSortIndicator('meta')}
                </th>
                <th onClick={() => handleSort('diag')} style={{ ...headerThStyle('diag'), width: '9%' }}>
                  Diagnósticos {renderSortIndicator('diag')}
                </th>
                <th onClick={() => handleSort('agend')} style={{ ...headerThStyle('agend'), width: '10%' }}>
                  Agendamientos {renderSortIndicator('agend')}
                </th>
                <th onClick={() => handleSort('asist')} style={{ ...headerThStyle('asist'), width: '8%' }}>
                  Asistidos {renderSortIndicator('asist')}
                </th>
                <th onClick={() => handleSort('showUp')} style={{ ...headerThStyle('showUp'), width: '8%' }}>
                  Show Up {renderSortIndicator('showUp')}
                </th>
                <th onClick={() => handleSort('pts')} style={{ ...headerThStyle('pts'), width: '10%' }}>
                  Puntaje {renderSortIndicator('pts')}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* ── MODO 1: CONSOLIDADO POR SDR (1 FILA POR ASESOR) ── */}
              {viewMode === 'consolidated' && sortedConsolidated.map((s, idx) => (
                <tr key={s.name || idx}>
                  <td style={{ textAlign: 'left', paddingLeft: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: '#eff6ff', border: '1px solid #bfdbfe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11.5px', fontWeight: 900, color: '#2563eb', flexShrink: 0
                      }}>
                        {getInitials(s.name)}
                      </div>
                      <div>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px', display: 'block' }}>{s.name}</span>
                        <span style={{ fontSize: '10.5px', color: '#64748b' }}>{s.totalReportes} reporte(s)</span>
                      </div>
                    </div>
                  </td>

                  <td style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {Array.from(s.groups).map(g => (
                        <span key={g}>{getGroupBadge(g)}</span>
                      ))}
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {getWaalaxyBadge(s.estadoWaalaxy)}
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '12px',
                      background: s.metasCumplidas > 0 ? '#ecfdf5' : '#fef2f2',
                      border: `1px solid ${s.metasCumplidas > 0 ? '#a7f3d0' : '#fecaca'}`,
                      color: s.metasCumplidas > 0 ? '#059669' : '#dc2626',
                      fontSize: '11.5px', fontWeight: 800
                    }}>
                      {s.metasCumplidas} de {s.totalReportes}
                    </span>
                  </td>

                  <td style={{ textAlign: 'center', color: '#2563eb', fontWeight: 800, fontSize: '13.5px' }}>
                    {s.diag}
                  </td>

                  <td style={{ textAlign: 'center', color: '#059669', fontWeight: 800, fontSize: '13.5px' }}>
                    {s.agend}
                  </td>

                  <td style={{ textAlign: 'center', color: '#0f172a', fontWeight: 800, fontSize: '13.5px' }}>
                    {s.asist}
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <span style={{ fontWeight: 800, fontSize: '12px', color: s.showUp >= 60 ? '#059669' : '#dc2626' }}>
                        {s.showUp}%
                      </span>
                      <div className="mini-progress-bg" style={{ width: '56px', height: '5px', margin: 0 }}>
                        <div className="mini-progress-fill" style={{
                          width: `${s.showUp}%`,
                          background: s.showUp >= 60 ? 'linear-gradient(90deg, #34d399, #059669)' : 'linear-gradient(90deg, #f87171, #dc2626)'
                        }} />
                      </div>
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: '12px',
                        background: '#fffbeb', border: '1px solid #fde68a',
                        color: '#d97706', fontWeight: 800, fontSize: '12px'
                      }}>
                        <Sparkles size={11} /> {s.pts} pts
                      </span>
                    </div>
                  </td>

                </tr>
              ))}

              {/* ── MODO 2: DESGLOSE POR REPORTE (TODAS LAS FILAS CON FECHA) ── */}
              {viewMode === 'breakdown' && sortedReports.map((row, idx) => {
                const stats = calculateRowStats(row);
                return (
                  <tr key={row.id || idx}>
                    <td style={{ textAlign: 'left', paddingLeft: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>{row.sdr || 'Desconocido'}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>({row.timestamp || 'Sin fecha'})</span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'left' }}>
                      {getGroupBadge(row._group)}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {getWaalaxyBadge(row.estadoWaalaxy)}
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span className={`goal-tag ${stats.cumplio ? 'yes' : 'no'}`}>
                          {stats.cumplio ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          {stats.cumplio ? 'Sí' : 'No'}
                        </span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center', color: '#2563eb', fontWeight: 800, fontSize: '13.5px' }}>
                      {stats.diag}
                    </td>

                    <td style={{ textAlign: 'center', color: '#059669', fontWeight: 800, fontSize: '13.5px' }}>
                      {stats.agend}
                    </td>

                    <td style={{ textAlign: 'center', color: '#0f172a', fontWeight: 800, fontSize: '13.5px' }}>
                      {stats.asist}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontWeight: 800, fontSize: '12px', color: stats.showUp >= 60 ? '#059669' : '#dc2626' }}>
                          {stats.showUp}%
                        </span>
                        <div className="mini-progress-bg" style={{ width: '56px', height: '5px', margin: 0 }}>
                          <div className="mini-progress-fill" style={{
                            width: `${stats.showUp}%`,
                            background: stats.showUp >= 60 ? 'linear-gradient(90deg, #34d399, #059669)' : 'linear-gradient(90deg, #f87171, #dc2626)'
                          }} />
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '3px 10px', borderRadius: '12px',
                          background: '#fffbeb', border: '1px solid #fde68a',
                          color: '#d97706', fontWeight: 800, fontSize: '12px'
                        }}>
                          <Sparkles size={11} /> {stats.pts} pts
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {((viewMode === 'consolidated' && sortedConsolidated.length === 0) || (viewMode === 'breakdown' && sortedReports.length === 0)) && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No se encontraron registros para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL DE AUDITORÍA Y TRAZABILIDAD DEL GOOGLE SHEET ─── */}
      {auditModalTarget && createPortal(
        <div
          className="modal-overlay"
          onClick={() => setAuditModalTarget(null)}
          style={{ zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '980px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              borderRadius: '16px',
              margin: 'auto',
              background: '#ffffff',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '10px', color: '#2563eb', display: 'flex' }}>
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    Auditoría de Celdas: {auditModalTarget === 'ALL' ? 'Todos los Reportes (Google Sheet)' : auditModalTarget}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                    Muestra el texto original de cada celda del Sheet para comprobar de dónde sale cada valor calculado.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setAuditModalTarget(null)}
                aria-label="Cerrar"
                style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Formula Explanation Banner */}
            <div style={{ padding: '10px 22px', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#92400e', fontWeight: 700, flexShrink: 0 }}>
              <Info size={15} color="#d97706" />
              <span>
                <strong>Regla de cálculo aplicada:</strong> Puntaje = (Diagnósticos extraídos × 1 pt) + (Agendamientos × 5 pts) + (Asistidos al Booking × 10 pts)
              </span>
            </div>

            {/* Modal Body: Table of Raw Cell Values */}
            <div
              style={{
                padding: '16px 22px 0 22px',
                overflowY: 'auto',
                flex: 1,
                minHeight: 0,
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {(() => {
                const targetReports = auditModalTarget === 'ALL'
                  ? reports
                  : reports.filter(r => (r.sdr || '').toLowerCase() === auditModalTarget.toLowerCase());

                const totalDiagExt = targetReports.reduce((a, r) => a + Number(calculateRowStats(r).diag || 0), 0);
                const totalAgendExt = targetReports.reduce((a, r) => a + Number(calculateRowStats(r).agend || 0), 0);
                const totalAsistExt = targetReports.reduce((a, r) => a + Number(calculateRowStats(r).asist || 0), 0);
                const totalPtsExt = targetReports.reduce((a, r) => a + Number(calculateRowStats(r).pts || 0), 0);

                return (
                  <div style={{ paddingBottom: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>Diagnósticos (+1 pt)</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#2563eb' }}>{totalDiagExt} ({totalDiagExt} pts)</div>
                      </div>
                      <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '8px 12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>Citas Agendadas (+5 pts)</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669' }}>{totalAgendExt} ({totalAgendExt * 5} pts)</div>
                      </div>
                      <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '8px 12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>Asistidos (+10 pts)</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#7c3aed' }}>{totalAsistExt} ({totalAsistExt * 10} pts)</div>
                      </div>
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>Puntaje Total</div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#d97706' }}>{totalPtsExt} pts</div>
                      </div>
                    </div>

                    <div
                      style={{ width: '100%', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    >
                      <table className="prospecting-table" style={{ width: '100%', minWidth: '820px', fontSize: '12px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ width: '6%', textAlign: 'center', padding: '10px 8px', position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>#</th>
                            <th style={{ width: '11%', textAlign: 'left', padding: '10px 10px', position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>Fecha</th>
                            <th style={{ width: '15%', textAlign: 'left', padding: '10px 10px', position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>SDR</th>
                            <th style={{ width: '26%', textAlign: 'left', padding: '10px 10px', position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>Celda "Diagnósticos por país"</th>
                            <th style={{ width: '20%', textAlign: 'left', padding: '10px 10px', position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>Celda "Meta" / Lead Agendado</th>
                            <th style={{ width: '11%', textAlign: 'center', padding: '10px 8px', position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>Asistió Booking</th>
                            <th style={{ width: '11%', textAlign: 'center', padding: '10px 8px', position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>Puntaje Fila</th>
                          </tr>
                        </thead>
                        <tbody>
                          {targetReports.map((r, idx) => {
                            const rStats = calculateRowStats(r);
                            return (
                              <tr key={r.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ textAlign: 'center', fontWeight: 800, color: '#64748b', padding: '9px 8px' }}>
                                  {idx + 1}
                                </td>
                                <td style={{ textAlign: 'left', fontWeight: 600, color: '#0f172a', padding: '9px 10px' }}>
                                  {r.timestamp || '—'}
                                </td>
                                <td style={{ textAlign: 'left', fontWeight: 700, color: '#0f172a', padding: '9px 10px' }}>
                                  {r.sdr || '—'}
                                </td>
                                <td style={{ textAlign: 'left', padding: '9px 10px' }}>
                                  <div style={{ fontSize: '11.5px', color: '#0f172a', fontWeight: 600 }}>
                                    {r.diagnosticosPorPais ? `"${r.diagnosticosPorPais}"` : <span style={{ color: '#94a3b8' }}>Vacía (0)</span>}
                                  </div>
                                  <div style={{ fontSize: '10.5px', color: '#2563eb', fontWeight: 800, marginTop: '2px' }}>
                                    ➜ Extraído: <strong>{rStats.diag} diag.</strong> (+{rStats.diag} pts)
                                  </div>
                                </td>
                                <td style={{ textAlign: 'left', padding: '9px 10px' }}>
                                  <div style={{ fontSize: '11.5px', color: '#0f172a', fontWeight: 600 }}>
                                    Meta: <strong style={{ color: r.cumplioMeta === 'Sí' ? '#059669' : '#dc2626' }}>{r.cumplioMeta || 'No'}</strong>
                                  </div>
                                  {r.nombreLeadAgendado && (
                                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                                      👤 {r.nombreLeadAgendado}
                                    </div>
                                  )}
                                  <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: 800, marginTop: '2px' }}>
                                    ➜ Agendado: <strong>{rStats.agend}</strong> (+{rStats.agend * 5} pts)
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center', padding: '9px 8px' }}>
                                  <span style={{
                                    padding: '2px 8px', borderRadius: '10px',
                                    background: rStats.asist > 0 ? '#ecfdf5' : '#f8fafc',
                                    border: `1px solid ${rStats.asist > 0 ? '#a7f3d0' : '#e2e8f0'}`,
                                    color: rStats.asist > 0 ? '#059669' : '#64748b',
                                    fontWeight: 800, fontSize: '11px'
                                  }}>
                                    {rStats.asist > 0 ? 'SI (+10 pts)' : (r.asistioLead || 'NO')}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center', padding: '9px 8px' }}>
                                  <span style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '3px 8px', borderRadius: '8px', fontWeight: 900, fontSize: '12px' }}>
                                    +{rStats.pts} pts
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#f8fafc', fontWeight: 900, borderTop: '2px solid #cbd5e1' }}>
                            <td colSpan="3" style={{ textAlign: 'right', padding: '12px 14px', fontSize: '12.5px', color: '#0f172a' }}>
                              TOTALES CONSOLIDADOS:
                            </td>
                            <td style={{ color: '#2563eb', padding: '12px 10px', fontSize: '13px' }}>
                              {totalDiagExt} diag. (+{totalDiagExt} pts)
                            </td>
                            <td style={{ color: '#059669', padding: '12px 10px', fontSize: '13px' }}>
                              {totalAgendExt} agend. (+{totalAgendExt * 5} pts)
                            </td>
                            <td style={{ textAlign: 'center', color: '#7c3aed', padding: '12px 8px', fontSize: '13px' }}>
                              {totalAsistExt} asist. (+{totalAsistExt * 10} pts)
                            </td>
                            <td style={{ textAlign: 'center', color: '#d97706', padding: '12px 8px', fontSize: '15px' }}>
                              {totalPtsExt} pts
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 22px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setAuditModalTarget(null)}
                className="btn-cyber-primary"
                style={{ padding: '7px 20px', fontSize: '12px', fontWeight: 800 }}
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
