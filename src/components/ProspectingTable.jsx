import React, { useState } from 'react';
import { Search, ExternalLink, ShieldCheck, AlertCircle, PauseCircle, Download, FileSpreadsheet, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Users, Tag, Globe, Calendar, RotateCcw, Layers } from 'lucide-react';
import { exportReportsToExcel } from '../utils/excelParser';
import { matchesDateRange } from '../utils/security';

export default function ProspectingTable({ reports = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSdr, setSelectedSdr] = useState('Todos');
  const [selectedGroup, setSelectedGroup] = useState('Todos');
  const [selectedOrigin, setSelectedOrigin] = useState('Todos');
  const [selectedCountry, setSelectedCountry] = useState('Todos');
  const [selectedDateFrom, setSelectedDateFrom] = useState('');
  const [selectedDateTo, setSelectedDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const uniqueSdrs = ['Todos', ...Array.from(new Set(reports.map(r => r.sdr).filter(Boolean)))];
  const uniqueGroups = ['Todos', ...Array.from(new Set(reports.map(r => r._group).filter(Boolean)))];
  const uniqueOrigins = ['Todos', 'Scraping', 'Base de Datos', ...Array.from(new Set(reports.map(r => r.origen).filter(o => o && o !== 'Scraping' && o !== 'Base de Datos')))];
  const uniqueCountries = ['Todos', ...Array.from(new Set(reports.map(r => r.pais).filter(Boolean)))];

  const isFiltered = selectedSdr !== 'Todos' || selectedGroup !== 'Todos' || selectedOrigin !== 'Todos' || selectedCountry !== 'Todos' || selectedDateFrom || selectedDateTo || searchTerm;

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSdr('Todos');
    setSelectedGroup('Todos');
    setSelectedOrigin('Todos');
    setSelectedCountry('Todos');
    setSelectedDateFrom('');
    setSelectedDateTo('');
    setCurrentPage(1);
  };

  const filteredReports = reports.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (r.sdr || '').toLowerCase().includes(term) ||
      (r.pais || '').toLowerCase().includes(term) ||
      (r.categoria || '').toLowerCase().includes(term) ||
      (r.origen || '').toLowerCase().includes(term) ||
      (r._group || '').toLowerCase().includes(term) ||
      (r.nombreLeadAgendado || '').toLowerCase().includes(term) ||
      (r.perfilLeadAgendado || '').toLowerCase().includes(term);
    const sdrMatch = selectedSdr === 'Todos' || r.sdr === selectedSdr;
    const groupMatch = selectedGroup === 'Todos' || r._group === selectedGroup;
    const originMatch = selectedOrigin === 'Todos' || (r.origen || '').toLowerCase().includes(selectedOrigin.toLowerCase());
    const countryMatch = selectedCountry === 'Todos' || r.pais === selectedCountry;
    const dateMatch = matchesDateRange(r.timestamp, selectedDateFrom, selectedDateTo);
    return matchesSearch && sdrMatch && groupMatch && originMatch && countryMatch && dateMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + pageSize);

  const getInitials = (name) => {
    if (!name) return 'SD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
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

  const getWaalaxyBadge = (status) => {
    if (status === 'Activa') {
      return <span className="status-badge active"><ShieldCheck size={11} /> ACTIVA</span>;
    } else if (status === 'Pausada' || status === 'Bajo SSI') {
      return <span className="status-badge paused"><PauseCircle size={11} /> BAJO SSI</span>;
    } else {
      return <span className="status-badge limited"><AlertCircle size={11} /> LIMITADA</span>;
    }
  };

  const handleExport = () => {
    exportReportsToExcel(filteredReports);
  };

  const selectStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#0f172a',
    padding: '0 10px',
    height: '34px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center'
  };

  const dateInputStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#0f172a',
    padding: '0 8px',
    height: '34px',
    borderRadius: '6px',
    fontFamily: 'inherit',
    fontSize: '12px',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
    width: '125px',
    boxSizing: 'border-box'
  };

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '32px' }}>
      
      {/* ─── FILTERS BAR ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
        padding: '12px 14px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px'
      }}>
        {/* Left: Search + Dropdown Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          {/* Search Box */}
          <div className="search-input-futuristic" style={{ width: '180px', height: '34px' }}>
            <Search size={13} color="#64748b" />
            <input
              type="text"
              placeholder="Buscar SDR, lead..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ fontSize: '12px', height: '100%' }}
            />
          </div>

          {/* Equipo / Canal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={12} color="#7c3aed" />
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>EQUIPO:</span>
            <select value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setCurrentPage(1); }} style={selectStyle}>
              {uniqueGroups.map(g => <option key={g} value={g}>{g === 'Todos' ? 'Todos los Equipos' : g}</option>)}
            </select>
          </div>

          {/* SDR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={12} color="#2563eb" />
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>SDR:</span>
            <select value={selectedSdr} onChange={(e) => { setSelectedSdr(e.target.value); setCurrentPage(1); }} style={selectStyle}>
              {uniqueSdrs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Origen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Tag size={12} color="#d97706" />
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>ORIGEN:</span>
            <select value={selectedOrigin} onChange={(e) => { setSelectedOrigin(e.target.value); setCurrentPage(1); }} style={selectStyle}>
              {uniqueOrigins.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* País */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe size={12} color="#059669" />
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>PAÍS:</span>
            <select value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setCurrentPage(1); }} style={selectStyle}>
              {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Rango de Fechas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} color="#7c3aed" />
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>RANGO:</span>
            <input type="date" value={selectedDateFrom} onChange={(e) => { setSelectedDateFrom(e.target.value); setCurrentPage(1); }} style={dateInputStyle} />
            <span style={{ fontSize: '11px', color: '#64748b' }}>→</span>
            <input type="date" value={selectedDateTo} onChange={(e) => { setSelectedDateTo(e.target.value); setCurrentPage(1); }} style={dateInputStyle} />
          </div>
        </div>

        {/* Right: Reset and Export Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          <button
            onClick={handleExport}
            className="btn-cyber-primary"
            style={{
              height: '34px',
              padding: '0 14px',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <Download size={14} /> Exportar Excel
          </button>
        </div>
      </div>


      <div className="table-responsive">
        <table className="prospecting-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'center' }}>Fecha</th>
              <th style={{ textAlign: 'left', paddingLeft: '20px' }}>SDR</th>
              <th style={{ textAlign: 'left' }}>Equipo / Canal</th>
              <th style={{ textAlign: 'center' }}>Waalaxy</th>
              <th style={{ textAlign: 'center' }}>Env. Waalaxy</th>
              <th style={{ textAlign: 'center' }}>Acept. Waalaxy</th>
              <th style={{ textAlign: 'center' }}>Env. Manual</th>
              <th style={{ textAlign: 'center' }}>Acept. Manual</th>
              <th style={{ textAlign: 'center' }}>M1</th>
              <th style={{ textAlign: 'center' }}>M2</th>
              <th style={{ textAlign: 'center' }}>M3</th>
              <th style={{ textAlign: 'center' }}>País</th>
              <th style={{ textAlign: 'center' }}>Origen</th>
              <th style={{ textAlign: 'center' }}>Meta Semanal</th>
              <th style={{ textAlign: 'center' }}>Lead Agendado</th>
              <th style={{ textAlign: 'center' }}>Cargo</th>
              <th style={{ textAlign: 'center' }}>LinkedIn</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReports.map((row) => (
              <tr key={row.id}>
                <td style={{ textAlign: 'center', color: '#64748b', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                  {row.timestamp}
                </td>

                <td style={{ textAlign: 'left', paddingLeft: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: '#eff6ff', border: '1px solid #bfdbfe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10.5px', fontWeight: 800, color: '#2563eb', flexShrink: 0
                    }}>
                      {getInitials(row.sdr)}
                    </div>
                    <span style={{ fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>{row.sdr}</span>
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

                <td style={{ textAlign: 'center', fontWeight: 700 }}>{row.conexionesEnviadasWaalaxy}</td>
                <td style={{ textAlign: 'center', color: '#2563eb', fontWeight: 800 }}>{row.conexionesAceptadasWaalaxy}</td>
                <td style={{ textAlign: 'center', fontWeight: 700 }}>{row.conexionesEnviadasManual}</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 800 }}>{row.conexionesAceptadasManual}</td>

                <td style={{ textAlign: 'center', color: '#2563eb', fontWeight: 800 }}>{row.respuestasM1}</td>
                <td style={{ textAlign: 'center', color: '#7c3aed', fontWeight: 800 }}>{row.respuestasM2}</td>
                <td style={{ textAlign: 'center', color: '#059669', fontWeight: 800 }}>{row.respuestasM3}</td>

                <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '11.5px' }}>
                    {row.pais}
                  </span>
                </td>
                <td style={{ textAlign: 'center', color: '#64748b', fontSize: '12px' }}>{row.origen}</td>

                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span className={`goal-tag ${row.cumplioMeta === 'Sí' ? 'yes' : 'no'}`}>
                      {row.cumplioMeta === 'Sí' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {row.cumplioMeta === 'Sí' ? 'Sí' : 'No'}
                    </span>
                  </div>
                </td>

                <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a', fontSize: '12.5px' }}>{row.nombreLeadAgendado}</td>
                <td style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>{row.perfilLeadAgendado}</td>

                <td style={{ textAlign: 'center' }}>
                  {row.linkPerfil && row.linkPerfil !== 'N/A' && row.linkPerfil !== '—' ? (
                    <a
                      href={row.linkPerfil.startsWith('http') ? row.linkPerfil : `https://${row.linkPerfil}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: '#f0f7ff',
                        border: '1px solid #cce4ff',
                        color: '#0a66c2',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#0a66c2';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.borderColor = '#0a66c2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f0f7ff';
                        e.currentTarget.style.color = '#0a66c2';
                        e.currentTarget.style.borderColor = '#cce4ff';
                      }}
                      title={row.linkPerfil}
                    >
                      <span style={{ fontWeight: 900, fontSize: '10px', background: '#0a66c2', color: '#ffffff', padding: '1px 3px', borderRadius: '3px', lineHeight: 1 }}>in</span>
                      <span>Ver Perfil</span>
                      <ExternalLink size={10} style={{ flexShrink: 0 }} />
                    </a>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>
                  )}
                </td>
              </tr>
            ))}

            {paginatedReports.length === 0 && (
              <tr>
                <td colSpan="16" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No se encontraron registros que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '14px',
        paddingTop: '12px',
        borderTop: '1px solid #e2e8f0',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          Mostrando <strong>{filteredReports.length > 0 ? startIndex + 1 : 0}</strong> a <strong>{Math.min(filteredReports.length, startIndex + pageSize)}</strong> de <strong>{filteredReports.length}</strong> registros
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-cyber-ghost"
            style={{ padding: '5px 10px', fontSize: '12px' }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={13} /> Anterior
          </button>
          <span style={{ padding: '4px 8px', fontSize: '12px', color: '#2563eb', fontWeight: 800 }}>
            {currentPage} / {totalPages}
          </span>
          <button
            className="btn-cyber-ghost"
            style={{ padding: '5px 10px', fontSize: '12px' }}
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Siguiente <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
