import React, { useState } from 'react';
import { CalendarCheck, Search, ExternalLink, CheckCircle2, XCircle, Globe, UserCheck, Users, Calendar, RotateCcw, Layers } from 'lucide-react';
import { matchesDateRange } from '../utils/security';


// Helper to unpack multi-lead submissions into individual lead rows
// with full deduplication: same person in same submission never appears twice
function expandScheduledRecords(rawReports) {
  const result = [];

  // normalize helper: strip accents, lowercase, punctuation, trim extra spaces
  const norm = (s) =>
    String(s || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  (rawReports || []).forEach((r, rowIdx) => {
    const rawNameStr = String(r.nombreLeadAgendado || '').trim();
    const rawAsistio = String(r.asistioLead || '').trim().toLowerCase();
    const rawMeta = String(r.cumplioMeta || '').trim().toLowerCase();
    const hasMetaSi = rawMeta === 'si' || rawMeta === 'sí' || rawMeta.startsWith('si') || rawMeta.startsWith('sí');
    const hasAsistioRecorded = rawAsistio.startsWith('si') || rawAsistio.startsWith('sí') || rawAsistio.startsWith('no');

    const asistio = (rawAsistio.startsWith('si') || rawAsistio.startsWith('sí') || rawAsistio === '1' || rawAsistio === 'true') ? 'Sí' : 'No';

    const isValidName = rawNameStr && rawNameStr.length >= 2 && isNaN(Number(rawNameStr)) &&
      !['n/a', '—', '-', 'ninguno', 'ninguna', 'no', '0', 'sin agendamiento', 'lead agendado', 'lead', 'prospecto'].includes(rawNameStr.toLowerCase()) &&
      /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(rawNameStr);

    if (!isValidName) {
      // Row with Meta = SI and attendance outcome recorded (valid agendado lead without a written personal contact name)
      if (hasMetaSi && hasAsistioRecorded) {
        result.push({
          id: `${r.id || rowIdx}_indiv_0`,
          timestamp: r.timestamp || '—',
          sdr: r.sdr || '—',
          nombreLeadAgendado: 'Lead Agendado',
          perfilLeadAgendado: r.perfilLeadAgendado || 'Tomador de Decisión',
          pais: r.agendamientoPorPais || r.pais || 'General',
          agendamientoPorPais: r.agendamientoPorPais || r.pais || 'General',
          linkPerfil: '',
          asistioLead: asistio,
          _originalGroup: r._group || ''
        });
      }
      return;
    }

    // 1. Split names if multiple were written in 1 cell
    let names = [rawNameStr];
    if (rawNameStr.includes(' - ') || rawNameStr.includes('.-') || rawNameStr.includes('\n') || (rawNameStr.includes('-') && rawNameStr.length > 25)) {
      names = rawNameStr.split(/\s*-\s*|\s*\.-\s*|\n+/).map(s => s.trim()).filter(s => s.length > 1);
    } else if (rawNameStr.includes(' , ') || (rawNameStr.includes(',') && rawNameStr.length > 20 && !/linkedin\.com/i.test(rawNameStr))) {
      names = rawNameStr.split(/\s*,\s*/).map(s => s.trim()).filter(s => s.length > 1);
    }

    // 2. Split roles if multiple
    const rawRoleStr = String(r.perfilLeadAgendado || 'Tomador de Decisión').trim();
    let roles = [rawRoleStr];
    if (names.length > 1) {
      if (rawRoleStr.includes(' - ') || rawRoleStr.includes('\n')) {
        roles = rawRoleStr.split(/\s*-\s*|\n+/).map(s => s.trim()).filter(Boolean);
      } else if (rawRoleStr.includes('/') || (rawRoleStr.includes(',') && !rawRoleStr.toLowerCase().includes('recursos'))) {
        roles = rawRoleStr.split(/[,/]+/).map(s => s.trim()).filter(Boolean);
      }
    }

    // 3. Split countries if multiple (only when multiple names)
    const rawCountryStr = String(r.agendamientoPorPais || r.pais || 'Colombia').trim();
    let countries = [rawCountryStr];
    if (names.length > 1 && (rawCountryStr.includes(',') || rawCountryStr.includes(' y ') || rawCountryStr.includes('/'))) {
      const candidateCountries = rawCountryStr.split(/[,/]+|\s+y\s+/i).map(s => s.trim()).filter(c => c.length > 1);
      if (candidateCountries.length > 1) countries = candidateCountries;
    }

    // 4. Extract individual LinkedIn URLs
    const rawLinkStr = String(r.linkPerfil || '').trim();
    const extractedLinks = rawLinkStr.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[^\s,;]+/gi) || [];
    const links = extractedLinks.length > 0
      ? extractedLinks.map(u => u.startsWith('http') ? u : `https://${u}`)
      : (rawLinkStr && rawLinkStr.length > 10 ? [rawLinkStr.startsWith('http') ? rawLinkStr : `https://${rawLinkStr}`] : []);

    names.forEach((name, nIdx) => {
      const role = roles[nIdx] || roles[0] || 'Tomador de Decisión';
      const country = countries[nIdx] || countries[0] || rawCountryStr || 'Colombia';
      const link = links.length === 1 ? links[0] : (links[nIdx] || '');
      const asistio = r.asistioLead === 'Sí' ? 'Sí' : 'No';

      result.push({
        id: `${r.id || rowIdx}_indiv_${nIdx}`,
        timestamp: r.timestamp || '—',
        sdr: r.sdr || '—',
        nombreLeadAgendado: name,
        perfilLeadAgendado: role,
        pais: country,
        agendamientoPorPais: country,
        linkPerfil: link,
        asistioLead: asistio,
        _originalGroup: r._group || ''
      });
    });
  });

  // ── DEDUPLICATION POST-EXPANSION (Deduplicate by unique contact name across groups/submissions) ──
  const nameMap = new Map();
  const finalLeads = [];
  result.forEach(row => {
    if (row.nombreLeadAgendado === 'Lead Agendado') {
      finalLeads.push(row);
      return;
    }
    const key = norm(row.nombreLeadAgendado);
    if (!nameMap.has(key)) {
      nameMap.set(key, row);
      finalLeads.push(row);
    } else {
      const existing = nameMap.get(key);
      if (row.asistioLead === 'Sí') {
        existing.asistioLead = 'Sí';
      }
    }
  });

  return finalLeads;
}

export default function ScheduledLeadsSection({ reports = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSdr, setSelectedSdr] = useState('Todos');
  const [selectedGroup, setSelectedGroup] = useState('Todos');
  const [selectedCountry, setSelectedCountry] = useState('Todos');
  const [selectedDateFrom, setSelectedDateFrom] = useState('');
  const [selectedDateTo, setSelectedDateTo] = useState('');

  // Unpack all leads individually so every contact has its own row
  const scheduledReports = expandScheduledRecords(reports);

  const uniqueSdrs = ['Todos', ...Array.from(new Set(scheduledReports.map(r => r.sdr).filter(Boolean)))];
  const uniqueGroups = ['Todos', ...Array.from(new Set(scheduledReports.map(r => r._originalGroup).filter(Boolean)))];
  
  // Clean list of unique countries for dropdown
  const uniqueCountries = ['Todos', ...Array.from(new Set(
    scheduledReports
      .flatMap(r => String(r.agendamientoPorPais || r.pais).split(/[,/-]+/))
      .map(c => c.trim())
      .filter(c => c.length > 2)
  ))];

  const isFiltered = selectedSdr !== 'Todos' || selectedGroup !== 'Todos' || selectedCountry !== 'Todos' || selectedDateFrom !== '' || selectedDateTo !== '' || searchTerm !== '';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSdr('Todos');
    setSelectedGroup('Todos');
    setSelectedCountry('Todos');
    setSelectedDateFrom('');
    setSelectedDateTo('');
  };

  const monthsMap = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, set: 8, oct: 9, nov: 10, dic: 11 };
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

  const filtered = scheduledReports
    .map((r, originalIdx) => ({ ...r, _origIdx: originalIdx }))
    .filter(r => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (r.nombreLeadAgendado || '').toLowerCase().includes(term) ||
        (r.perfilLeadAgendado || '').toLowerCase().includes(term) ||
        (r.pais || '').toLowerCase().includes(term) ||
        (r.agendamientoPorPais || '').toLowerCase().includes(term) ||
        (r._originalGroup || '').toLowerCase().includes(term) ||
        (r.linkPerfil || '').toLowerCase().includes(term) ||
        (r.sdr || '').toLowerCase().includes(term);

      const sdrMatch = selectedSdr === 'Todos' || (r.sdr || '').trim().toLowerCase() === selectedSdr.trim().toLowerCase();
      const groupMatch = selectedGroup === 'Todos' || (r._originalGroup || '') === selectedGroup;
      const countryMatch = selectedCountry === 'Todos' || (r.agendamientoPorPais || r.pais).toLowerCase().includes(selectedCountry.toLowerCase());
      const dateMatch = matchesDateRange(r.timestamp, selectedDateFrom, selectedDateTo);

      return matchesSearch && sdrMatch && groupMatch && countryMatch && dateMatch;
    })
    .sort((a, b) => {
      const timeDiff = parseSpanishDate(b.timestamp) - parseSpanishDate(a.timestamp);
      if (timeDiff !== 0) return timeDiff;
      return b._origIdx - a._origIdx; // Última fila ingresada va en la parte superior
    });

  const totalScheduled = filtered.length;
  const asistidosCount = filtered.filter(r => r.asistioLead === 'Sí').length;
  const showUpRate = totalScheduled > 0 ? Math.round((asistidosCount / totalScheduled) * 100) : 0;

  // Solo dejar los 3 países principales solicitados por el usuario
  const countryFreq = {};
  filtered.forEach(r => {
    const c = String(r.agendamientoPorPais || r.pais || '').trim();
    if (c && c.length > 2) {
      countryFreq[c] = (countryFreq[c] || 0) + 1;
    }
  });
  const top3Countries = Object.entries(countryFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);
  const marketsString = top3Countries.length > 0 ? top3Countries.join(', ') : 'México, Colombia, España';

  const getCountryBadge = (country) => {
    const c = String(country || 'Colombia').trim();
    const l = c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    let bg = '#eff6ff';
    let border = '#bfdbfe';
    let text = '#1d4ed8';

    if (l.includes('colombia')) { bg = '#eff6ff'; border = '#bfdbfe'; text = '#1d4ed8'; }
    else if (l.includes('mexico')) { bg = '#ecfdf5'; border = '#a7f3d0'; text = '#047857'; }
    else if (l.includes('espana')) { bg = '#fffbeb'; border = '#fde68a'; text = '#b45309'; }
    else if (l.includes('peru')) { bg = '#fef2f2'; border = '#fecaca'; text = '#b91c1c'; }
    else if (l.includes('argentina')) { bg = '#f0f9ff'; border = '#bae6fd'; text = '#0369a1'; }
    else if (l.includes('venezuela')) { bg = '#faf5ff'; border = '#e9d5ff'; text = '#7e22ce'; }
    else if (l.includes('ecuador')) { bg = '#fdf4ff'; border = '#f5d0fe'; text = '#a21caf'; }
    else if (l.includes('panama')) { bg = '#f0fdfa'; border = '#99f6e4'; text = '#0f766e'; }
    else if (l.includes('chile')) { bg = '#fff1f2'; border = '#fecdd3'; text = '#be123c'; }
    else if (l.includes('dominicana')) { bg = '#fefce8'; border = '#fef08a'; text = '#a16207'; }
    else if (l.includes('nicaragua')) { bg = '#eef2ff'; border = '#c7d2fe'; text = '#4338ca'; }
    else { bg = '#f8fafc'; border = '#e2e8f0'; text = '#475569'; }

    return (
      <span style={{
        fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px',
        background: bg, color: text, border: `1px solid ${border}`,
        display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
      }}>
        📍 {c}
      </span>
    );
  };

  const getGroupBadge = (group) => {
    const g = String(group || '').toLowerCase();
    if (g.includes('oficial')) {
      return (
        <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
          🚀 Oficiales
        </span>
      );
    } else if (g.includes('aspirante')) {
      return (
        <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
          🎯 Aspirantes
        </span>
      );
    }
    return (
      <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
        🌐 Global
      </span>
    );
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


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
      
      {/* ─── SUMMARY CARDS DE AGENDADOS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        
        <div className="glass-panel" style={{ padding: '16px 18px', borderTop: '3px solid #059669', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: '#ecfdf5', color: '#059669' }}>
            <CalendarCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>LEADS ASISTIDOS</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#059669' }}>{asistidosCount}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Asistencias confirmadas</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px', borderTop: '3px solid #2563eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb' }}>
            <UserCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>TASA DE ASISTENCIA</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#2563eb' }}>{showUpRate}%</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>{asistidosCount} de {totalScheduled} Agendados</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px', borderTop: '3px solid #7c3aed', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed' }}>
            <Globe size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>MERCADOS PRINCIPALES</div>
            <div style={{ fontSize: '14.5px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>{marketsString}</div>
            <div style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 700 }}>Segmentación</div>
          </div>
        </div>

      </div>

      {/* ─── TABLA DE LEADS AGENDADOS ─── */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        {/* Header with Title on Left and Filters on Right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '14px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarCheck size={17} color="#059669" />
              Lista de Agendados
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Detalle de prospectos agendados, cargo, país y estado de asistencia
            </p>
          </div>

          {/* Filter Controls Aligned to the Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Quick Search Box */}
            <div className="search-input-futuristic" style={{ width: '180px' }}>
              <Search size={13} color="#64748b" />
              <input
                type="text"
                placeholder="Buscar agendado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '12px' }}
              />
            </div>

            {/* Equipo / Canal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Layers size={12} color="#7c3aed" />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>EQUIPO:</span>
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} style={selectStyle}>
                {uniqueGroups.map(g => <option key={g} value={g}>{g === 'Todos' ? 'Todos los Equipos' : g}</option>)}
              </select>
            </div>

            {/* SDR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={12} color="#2563eb" />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>SDR:</span>
              <select value={selectedSdr} onChange={(e) => setSelectedSdr(e.target.value)} style={selectStyle}>
                {uniqueSdrs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* País */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Globe size={12} color="#059669" />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>PAÍS:</span>
              <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} style={selectStyle}>
                {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
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
        </div>

        {/* Table */}
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="prospecting-table" style={{ width: '100%', minWidth: '900px', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'center', width: '11%' }}>Fecha</th>
                <th style={{ textAlign: 'left', paddingLeft: '20px', width: '22%' }}>Nombre Completo</th>
                <th style={{ textAlign: 'left', width: '11%' }}>Equipo</th>
                <th style={{ textAlign: 'center', width: '18%' }}>Cargo</th>
                <th style={{ textAlign: 'center', width: '10%' }}>País</th>
                <th style={{ textAlign: 'center', width: '17%' }}>LinkedIn</th>
                <th style={{ textAlign: 'center', width: '11%' }}>Asistió</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                const asistio = row.asistioLead === 'Sí';
                const countryDisplay = row.agendamientoPorPais || row.pais || 'Colombia';
                
                return (
                  <tr key={row.id || idx}>
                    <td style={{ textAlign: 'center', color: '#64748b', fontSize: '11.5px', fontWeight: 600, verticalAlign: 'middle' }}>
                      {row.timestamp}
                    </td>

                    <td style={{ textAlign: 'left', paddingLeft: '20px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: '#ecfdf5', border: '1px solid #a7f3d0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10.5px', fontWeight: 800, color: '#059669', flexShrink: 0
                        }}>
                          {row.nombreLeadAgendado.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '12.5px', lineHeight: 1.3, display: 'block' }}>
                            {row.nombreLeadAgendado}
                          </span>
                          <span style={{ fontSize: '10.5px', color: '#64748b' }}>{row.sdr}</span>
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'left', verticalAlign: 'middle' }}>
                      {getGroupBadge(row._originalGroup)}
                    </td>

                    <td style={{ textAlign: 'center', color: '#475569', fontSize: '12px', fontWeight: 600, verticalAlign: 'middle' }}>
                      <span style={{ lineHeight: 1.3, wordBreak: 'break-word' }}>
                        {row.perfilLeadAgendado}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {getCountryBadge(countryDisplay)}
                      </div>
                    </td>

                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {row.linkPerfil && row.linkPerfil.length > 5 ? (
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
                              padding: '3px 9px',
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
                          <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>—</span>
                        )}
                      </div>
                    </td>

                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '3px 10px', borderRadius: '12px',
                            background: asistio ? '#ecfdf5' : '#fef2f2',
                            border: `1px solid ${asistio ? '#a7f3d0' : '#fecaca'}`,
                            color: asistio ? '#059669' : '#dc2626',
                            fontSize: '11.5px', fontWeight: 800,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {asistio ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          {asistio ? 'Sí' : 'No'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No se encontraron prospectos agendados con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

