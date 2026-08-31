import React, { useState } from 'react';
import { Database, Search, ExternalLink, Users, Calendar, RotateCcw, Filter } from 'lucide-react';
import { matchesDateRange } from '../utils/security';

// Resolves each row into EXACTLY 1 prospecting source: Scraping, Notion, or Outbound
function resolveRowSource(row) {
  const rawLink = String(row.linkPerfil || '').trim();
  const rawNotion = String(row.notion || '').trim();
  const rawOtros = String(row.otros || '').trim();
  const rawOrigen = String(row.origen || '').trim().toLowerCase();

  const isSpecificLinkedinLink = (str) => {
    if (!str) return false;
    const s = str.toLowerCase();
    return (s.includes('linkedin.com/in/') || s.includes('linkedin.com/pub/') || (s.startsWith('http') && s.length > 22 && !s.endsWith('linkedin.com')));
  };

  const isNotionProject = (str) => {
    if (!str) return false;
    const s = str.toLowerCase();
    return (s.includes('consultor') || s.includes('gerente') || s.includes('ingenier') || s.includes('notion')) && !s.includes('linkedin');
  };

  // 1. Scraping: A specific LinkedIn profile link in linkPerfil or notion
  if (isSpecificLinkedinLink(rawLink)) {
    return { channel: 'Scraping', scraping: rawLink, notion: null, outbound: null };
  }
  if (isSpecificLinkedinLink(rawNotion)) {
    return { channel: 'Scraping', scraping: rawNotion, notion: null, outbound: null };
  }

  // 2. Notion: A Notion project name (e.g. Consultores 8, Consultoría 03, Consultores 12, Gerentes 14, Ingenieros 21)
  if (isNotionProject(rawNotion)) {
    return { channel: 'Notion', scraping: null, notion: rawNotion, outbound: null };
  }
  if (isNotionProject(rawOtros)) {
    return { channel: 'Notion', scraping: null, notion: rawOtros, outbound: null };
  }

  // 3. Outbound: Manual base or Outbound source
  if (rawOtros && (rawOtros.toLowerCase().includes('mi propia') || rawOtros.toLowerCase().includes('outbound') || rawOtros.toLowerCase().includes('base de datos'))) {
    return { channel: 'Outbound', scraping: null, notion: null, outbound: rawOtros };
  }

  if (rawOrigen.includes('outbound') || rawOrigen.includes('propia') || rawOrigen.includes('base de datos') || rawOrigen.includes('bd')) {
    const outName = rawOrigen.includes('propia') ? 'Mi propia Base' : (rawOrigen.includes('outbound') ? 'Linkedin Outbound' : 'Base de Datos');
    return { channel: 'Outbound', scraping: null, notion: null, outbound: outName };
  }

  if (rawNotion && !rawNotion.includes('linkedin')) {
    return { channel: 'Notion', scraping: null, notion: rawNotion, outbound: null };
  }

  if (rawLink && isSpecificLinkedinLink(rawLink)) {
    return { channel: 'Scraping', scraping: rawLink, notion: null, outbound: null };
  }

  // Default empty
  return { channel: 'Scraping', scraping: null, notion: null, outbound: null };
}

export default function DataSourceSection({ reports = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('Todos');
  const [selectedSdr, setSelectedSdr] = useState('Todos');
  const [selectedDateFrom, setSelectedDateFrom] = useState('');
  const [selectedDateTo, setSelectedDateTo] = useState('');

  const uniqueSdrs = ['Todos', ...Array.from(new Set(reports.map(r => r.sdr).filter(Boolean)))];
  const isFiltered = selectedChannel !== 'Todos' || selectedSdr !== 'Todos' || selectedDateFrom || selectedDateTo || searchTerm;

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedChannel('Todos');
    setSelectedSdr('Todos');
    setSelectedDateFrom('');
    setSelectedDateTo('');
  };

  const monthsMap = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };
  const parseSpanishDate = (dateStr) => {
    if (!dateStr) return 0;
    const str = String(dateStr).trim().toLowerCase();
    const dmyMatch = str.match(/^(\d{1,2})[-/]([a-z]{3}|\d{1,2})[-/](\d{2,4})/i);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const mStr = dmyMatch[2].toLowerCase();
      const month = monthsMap[mStr] !== undefined ? monthsMap[mStr] : (parseInt(mStr, 10) - 1);
      let year = parseInt(dmyMatch[3], 10);
      if (year < 100) year += 2000;
      return new Date(year, month, day).getTime();
    }
    const isoDate = Date.parse(str);
    return isNaN(isoDate) ? 0 : isoDate;
  };

  const filtered = reports
    .map((r, originalIdx) => ({ ...r, _origIdx: originalIdx }))
    .filter(r => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (r.sdr || '').toLowerCase().includes(term) ||
        (r.notion || '').toLowerCase().includes(term) ||
        (r.otros || '').toLowerCase().includes(term) ||
        (r.linkPerfil || '').toLowerCase().includes(term) ||
        (r.categoria || '').toLowerCase().includes(term);

      let channelMatch = true;
      if (selectedChannel === 'Scraping') {
        channelMatch = isLinkedinUrl(r.linkPerfil) || (r.origen || '').toLowerCase().includes('scrap');
      } else if (selectedChannel === 'Notion') {
        channelMatch = Boolean(r.notion && r.notion.trim() && r.notion !== '—');
      } else if (selectedChannel === 'Outbound') {
        channelMatch = Boolean(r.otros && r.otros.trim() && r.otros !== '—');
      }

      const sdrMatch = selectedSdr === 'Todos' || r.sdr === selectedSdr;
      const dateMatch = matchesDateRange(r.timestamp, selectedDateFrom, selectedDateTo);
      return matchesSearch && channelMatch && sdrMatch && dateMatch;
    })
    .sort((a, b) => {
      const timeDiff = parseSpanishDate(b.timestamp) - parseSpanishDate(a.timestamp);
      if (timeDiff !== 0) return timeDiff;
      return b._origIdx - a._origIdx; // Última información que ingrese empieza de arriba
    });

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

  const getCategoryBadge = (categoria) => {
    if (!categoria || !categoria.trim()) return <Dash />;
    const cat = categoria.trim();
    const catLower = cat.toLowerCase();

    let style = { background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed' };

    if (catLower.includes('recursos') || catLower.includes('rrhh')) {
      style = { background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed' };
    } else if (catLower.includes('admin')) {
      style = { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' };
    } else if (catLower.includes('direc') || catLower.includes('geren')) {
      style = { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' };
    } else if (catLower.includes('desarrollo') || catLower.includes('personal')) {
      style = { background: '#fdf4ff', border: '1px solid #f0abfc', color: '#c026d3' };
    } else if (catLower.includes('salud') || catLower.includes('bienestar')) {
      style = { background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706' };
    }

    return (
      <span style={{
        padding: '3px 12px',
        borderRadius: '6px',
        fontSize: '11.5px',
        fontWeight: 800,
        whiteSpace: 'nowrap',
        display: 'inline-block',
        ...style
      }}>
        {cat}
      </span>
    );
  };

  const Dash = () => <span style={{ color: '#cbd5e1', fontSize: '13px' }}>—</span>;

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '14px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={17} color="#2563eb" />
            Registros &amp; Fuentes de Prospección
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Base operativa vinculada a Notion, bases de datos y perfiles de LinkedIn
          </p>
        </div>

        {/* Filter Controls Aligned to the Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="search-input-futuristic" style={{ width: '170px' }}>
            <Search size={13} color="#64748b" />
            <input
              type="text"
              placeholder="Buscar en fuentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '12px' }}
            />
          </div>

          {/* Canal Filter (Scraping, Notion, Outbound) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={12} color="#059669" />
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>CANAL:</span>
            <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} style={selectStyle}>
              <option value="Todos">Todos</option>
              <option value="Scraping">Scraping</option>
              <option value="Notion">Notion</option>
              <option value="Outbound">Outbound</option>
            </select>
          </div>

          {/* SDR Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Users size={12} color="#2563eb" />
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>SDR:</span>
            <select value={selectedSdr} onChange={(e) => setSelectedSdr(e.target.value)} style={selectStyle}>
              {uniqueSdrs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Rango de Fechas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={12} color="#7c3aed" />
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>RANGO:</span>
            <input type="date" value={selectedDateFrom} onChange={(e) => setSelectedDateFrom(e.target.value)} style={dateInputStyle} />
            <span style={{ fontSize: '11px', color: '#64748b' }}>→</span>
            <input type="date" value={selectedDateTo} onChange={(e) => setSelectedDateTo(e.target.value)} style={dateInputStyle} />
          </div>

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
      </div>

      {/* Table with responsive layout */}
      <div className="table-responsive" style={{ overflowX: 'auto' }}>
        <table className="prospecting-table" style={{ width: '100%', minWidth: '780px', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'center', width: '15%' }}>FECHA</th>
              <th style={{ textAlign: 'center', width: '25%' }}>SCRAPING (LINK)</th>
              <th style={{ textAlign: 'center', width: '20%' }}>NOTION / BD</th>
              <th style={{ textAlign: 'center', width: '22%' }}>OUTBOUND</th>
              <th style={{ textAlign: 'center', width: '18%' }}>CATEGORÍA</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => {
              // 1. Scraping: Parse LinkedIn links into clean clickable buttons/badges
              const rawLink = String(row.linkPerfil || '').trim();
              const extractedLinks = rawLink.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[^\s,;]+/gi) || [];
              const validLinks = extractedLinks.length > 0
                ? extractedLinks.map(u => u.startsWith('http') ? u : `https://${u}`)
                : (isLinkedinUrl(rawLink) ? [rawLink.startsWith('http') ? rawLink : `https://${rawLink}`] : []);

              const scrapingContent = validLinks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                  {validLinks.map((url, uIdx) => (
                    <a
                      key={uIdx}
                      href={url}
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
                      title={url}
                    >
                      <span style={{ fontWeight: 900, fontSize: '10px', background: '#0a66c2', color: '#ffffff', padding: '1px 3px', borderRadius: '3px', lineHeight: 1 }}>in</span>
                      <span>Ver Perfil</span>
                      <ExternalLink size={10} style={{ flexShrink: 0 }} />
                    </a>
                  ))}
                </div>
              ) : <Dash />;

              // 2. Notion: Only show if non-empty text
              const hasNotion = Boolean(row.notion && row.notion.trim() && row.notion !== '—' && !row.notion.includes('linkedin.com'));
              const notionContent = hasNotion ? (
                <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '12.5px', wordBreak: 'break-word', lineHeight: 1.35 }}>
                  {row.notion}
                </span>
              ) : <Dash />;

              // 3. Outbound (Comentarios / Detalles de dónde consiguieron esa base)
              const hasOutbound = Boolean(row.otros && row.otros.trim() && row.otros !== '—' && !row.otros.toLowerCase().includes('scraping') && !row.otros.includes('linkedin.com'));
              const outboundContent = hasOutbound ? (
                <span style={{ color: '#475569', fontSize: '12px', fontWeight: 600, wordBreak: 'break-word', lineHeight: 1.35, display: 'inline-block', maxWidth: '220px' }}>
                  {row.otros}
                </span>
              ) : <Dash />;

              return (
                <tr key={row.id || idx}>
                  <td style={{ textAlign: 'center', color: '#64748b', fontSize: '11.5px', whiteSpace: 'nowrap', fontWeight: 600, verticalAlign: 'middle' }}>
                    {row.timestamp || '—'}
                  </td>

                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {scrapingContent}
                    </div>
                  </td>

                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    {notionContent}
                  </td>

                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    {outboundContent}
                  </td>

                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {getCategoryBadge(row.categoria)}
                    </div>
                  </td>
                </tr>
              );
            })}


            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No se encontraron registros de fuentes de datos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}