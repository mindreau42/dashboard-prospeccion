import * as XLSX from 'xlsx';
import { formatExcelDate, extractGoogleSheetId, fetchViaJsonp, parseScorecardRows } from './googleSheetsParser.js';

/**
 * Helper to fetch CSV directly with multiple fallbacks
 */
async function fetchCsvWithFallback(url) {
  const cb = `_t=${Date.now()}`;
  const urlsToTry = [
    `${url}&${cb}`,
    url,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url + '&' + cb)}`,
    `https://corsproxy.io/?${encodeURIComponent(url + '&' + cb)}`
  ];

  for (const tryUrl of urlsToTry) {
    try {
      const res = await fetch(tryUrl, { headers: { 'Cache-Control': 'no-cache' } });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 10 && !text.includes('<!DOCTYPE html>')) {
          return text;
        }
      }
    } catch (_) {}
  }
  return null;
}

/**
 * Parser for Orgánico Spreadsheet:
 * Sheet URL: https://docs.google.com/spreadsheets/d/1N092h1lIRYKeOtlVkB42_JYR3HR1Nker/edit?gid=1087525007#gid=1087525007
 * Tab 1 (gid=1087525007): "Registro Diario | Orgánico" (Interacciones y respuestas)
 * Tab 2 (gid=973360114): "Reporte General" (Scorecard diario)
 */
export async function fetchOrganicoSheetData(sheetUrl = 'https://docs.google.com/spreadsheets/d/1N092h1lIRYKeOtlVkB42_JYR3HR1Nker/edit?gid=1087525007#gid=1087525007') {
  const extracted = extractGoogleSheetId(sheetUrl);
  if (!extracted || !extracted.spreadsheetId) {
    throw new Error('URL de Google Sheets no válida');
  }
  const { spreadsheetId } = extracted;
  const regGid = '1087525007';
  const scGid = '973360114';

  let rawRegRows = [];
  let rawScRows = [];

  // Try JSONP in browser
  if (typeof document !== 'undefined') {
    try {
      const p1 = fetchViaJsonp(spreadsheetId, regGid).catch(() => null);
      const p2 = fetchViaJsonp(spreadsheetId, scGid).catch(() => null);
      const [r1, r2] = await Promise.all([p1, p2]);
      if (Array.isArray(r1)) rawRegRows = r1;
      if (Array.isArray(r2)) rawScRows = r2;
    } catch (_) {}
  }

  // Fallback to CSV GViz
  if (rawRegRows.length === 0) {
    const csvUrl1 = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${regGid}`;
    const csvText1 = await fetchCsvWithFallback(csvUrl1);
    if (csvText1) {
      const wb1 = XLSX.read(csvText1, { type: 'string', raw: true });
      rawRegRows = XLSX.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]], { defval: '', raw: true });
    }
  }

  if (rawScRows.length === 0) {
    const csvUrl2 = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${scGid}`;
    const csvText2 = await fetchCsvWithFallback(csvUrl2);
    if (csvText2) {
      const wb2 = XLSX.read(csvText2, { type: 'string', raw: true });
      rawScRows = XLSX.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], { defval: '', raw: true });
    }
  }

  // Parse records
  const records = [];
  rawRegRows.forEach((r, idx) => {
    const fecha = r['Fecha'] ? String(r['Fecha']).trim() : '';
    const nombre = r['Nombre'] ? String(r['Nombre']).trim() : '';
    const perfilUrl = r['Perfil URL'] ? String(r['Perfil URL']).trim() : '';
    const fuente = r['Fuente'] ? String(r['Fuente']).trim() : 'Instagram';
    const estado = r['Estado'] ? String(r['Estado']).trim() : 'Sin Respuesta';
    const comunidadGhl = (r['Comunidad'] || r['Comunidad GHL'] || r['Comunidad '] || '').trim() || 'NO';
    const condicion = (r['Condición'] || r['Condicion'] || r['Condición '] || '').trim() || 'Inactivo';
    const tipo = r['Tipo In/Out'] ? String(r['Tipo In/Out']).trim() :
                 (r['Tipo Inbound/Outbound'] ? String(r['Tipo Inbound/Outbound']).trim() : 'Inbound');
    const rawIntentos = r['Intentos'] !== undefined && r['Intentos'] !== null && String(r['Intentos']).trim() !== '' 
      ? Number(r['Intentos']) 
      : (r['Intentos '] !== undefined && r['Intentos '] !== null && String(r['Intentos ']).trim() !== '' ? Number(r['Intentos ']) : 0);
    const intentos = (!isNaN(rawIntentos) && rawIntentos >= 0) ? rawIntentos : 0;
    const contexto = (r[' Contexto | Opcional'] || r['Contexto | Opcional'] || r['Contexto'] || '').trim();

    if (!nombre && !fecha && !perfilUrl) return;

    records.push({
      id: `ORG-${idx + 1}-${nombre.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 15)}`,
      fecha,
      nombre: nombre || '—',
      perfilUrl,
      fuente: fuente || 'Instagram',
      estado: estado || 'Sin Respuesta',
      comunidadGhl: comunidadGhl || 'NO',
      condicion: condicion || 'Inactivo',
      tipo: tipo || 'Inbound',
      intentos,
      contexto: contexto || '—'
    });
  });

  // Parse scorecard reports
  const scorecardReports = [];
  rawScRows.forEach((r, idx) => {
    const fecha = r['Scorecard Fecha'] || r['Fecha'] || '';
    if (!fecha || (String(fecha).toLowerCase().includes('scorecard') && !String(fecha).includes('/'))) return;
    const mensajes = Number(r['Mensajes'] || 0);
    const noInteresados = Number(r['No Interesados '] || r['No Interesados'] || 0);
    const enSeguimiento = Number(r['En Seguimiento '] || r['En Seguimiento'] || 0);
    const comunidadGhl = Number(r['Comunidad'] || r['Comunidad GHL'] || r['Comunidad '] || 0);
    const citasAgendadas = Number(r['Cintas Agendadas'] || r['Citas Agendadas'] || 0);
    const inbound = Number(r['Inbound'] || 0);
    const outbound = Number(r['Outbound'] || 0);

    scorecardReports.push({
      id: `OSC-${idx + 1}`,
      fecha: String(fecha).trim(),
      mensajes,
      noInteresados,
      enSeguimiento,
      comunidadGhl,
      citasAgendadas,
      inbound,
      outbound
    });
  });

  return {
    records,
    scorecardReports,
    url: sheetUrl,
    updatedAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  };
}

/**
 * Parser for Closer Spreadsheet:
 * Sheet URL: https://docs.google.com/spreadsheets/d/1U5CyKhgMjvw6djjMiIGiidno41dJC-iM/edit?gid=1981983632#gid=1981983632
 * Tab 1 (gid=1981983632): "Closer Scorecard" (Gestión diaria por closer)
 * Tab 2 (gid=592771444): "Reporte General" (Totales consolidados y promedios)
 */
export async function fetchCloserSheetData(sheetUrl = 'https://docs.google.com/spreadsheets/d/1U5CyKhgMjvw6djjMiIGiidno41dJC-iM/edit?gid=1981983632#gid=1981983632') {
  const extracted = extractGoogleSheetId(sheetUrl);
  if (!extracted || !extracted.spreadsheetId) {
    throw new Error('URL de Google Sheets no válida');
  }
  const { spreadsheetId } = extracted;
  const scGid = '1981983632';
  const repGid = '592771444';

  let rawScRows = [];
  let rawRepRows = [];

  if (typeof document !== 'undefined') {
    try {
      const p1 = fetchViaJsonp(spreadsheetId, scGid).catch(() => null);
      const p2 = fetchViaJsonp(spreadsheetId, repGid).catch(() => null);
      const [r1, r2] = await Promise.all([p1, p2]);
      if (Array.isArray(r1)) rawScRows = r1;
      if (Array.isArray(r2)) rawRepRows = r2;
    } catch (_) {}
  }

  if (rawScRows.length === 0) {
    const csvUrl1 = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${scGid}`;
    const csvText1 = await fetchCsvWithFallback(csvUrl1);
    if (csvText1) {
      const wb1 = XLSX.read(csvText1, { type: 'string', raw: true });
      rawScRows = XLSX.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]], { defval: '', raw: true });
    }
  }

  if (rawRepRows.length === 0) {
    const csvUrl2 = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${repGid}`;
    const csvText2 = await fetchCsvWithFallback(csvUrl2);
    if (csvText2) {
      const wb2 = XLSX.read(csvText2, { type: 'string', raw: true });
      rawRepRows = XLSX.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], { defval: '', raw: true });
    }
  }

  const reports = [];
  rawScRows.forEach((r, idx) => {
    const fecha = r['SCORECARD  Fecha de Gestión'] || r['Fecha de Gestión'] || r['Fecha'] || '';
    const closer = r['Closer'] || '';

    // Skip completely empty rows and header-like rows
    const prod1raw = r['Prod.1'] || r['Prod 1'] || r['Mente Global'] || '';
    const prod2raw = r['Prod.2'] || r['Prod 2'] || r['Neuro State'] || r['NeuroState'] || '';
    const prod3raw = r['Prod.3'] || r['Prod 3'] || r['Activate'] || '';
    const prod4raw = r['Prod.4'] || r['Prod 4'] || r['Catalizador'] || '';
    const citasRaw = r['Citas Asignadas'] || '';
    const ventasRaw = r['Ventas Cerradas'] || '';
    const hasAnyData = fecha || closer || prod1raw || prod2raw || prod3raw || prod4raw || citasRaw || ventasRaw;
    if (!hasAnyData) return;
    if (String(fecha).toLowerCase().includes('scorecard') && !String(fecha).includes('/')) return;

    const citasAsignadas = Number(r['Citas Asignadas'] || 0);
    const asistenciasEfectivas = Number(r['Asistencias Efectivas'] || 0);
    const ventasCerradas = Number(r['Ventas Cerradas'] || 0);
    const enSeguimiento = Number(r['En Seguimiento'] || 0);
    const facturacionRaw = String(r['Total Facturación'] || r['Facturación'] || '0').replace(/[^0-9.]/g, '');
    const facturacion = Number(facturacionRaw) || 0;
    const cashRaw = String(r['Cash Collected'] || r['Cash Collected ($)'] || '0').replace(/[^0-9.]/g, '');
    const cashCollected = Number(cashRaw) || 0;
    const duracionPromedio = Number(r['Duración Prom. Llamada (min)'] || r['Duración Llamada'] || 0);
    const cicloCierre = Number(r['Ciclo de Cierre Prom. (días)'] || r['Ciclo de Cierre'] || 0);
    const tasaAsistencia = r['Tasa de Asistencia (%)'] || r['Tasa Asistencia'] || '0%';
    const ticketPromedio = Number(String(r['Ticket Promedio ($)'] || r['Ticket Promedio'] || '0').replace(/[^0-9.]/g, '')) || 0;
    const tasaRecaudo = r['Tasa de Recaudo (%)'] || r['Tasa Recaudo'] || '0%';
    const inasistencias = Number(r['Inasistencias'] || 0);
    const declinadas = Number(r['Declinadas'] || 0);
    const tasaConversion = r['Tasa de Conversión (%)'] || r['Tasa Conversión'] || '0%';

    // Productos vendidos por día
    const prod1 = Number(r['Prod.1'] || r['Prod 1'] || r['Mente Global'] || 0);
    const prod2 = Number(r['Prod.2'] || r['Prod 2'] || r['Neuro State'] || r['NeuroState'] || 0);
    const prod3 = Number(r['Prod.3'] || r['Prod 3'] || r['Activate'] || 0);
    const prod4 = Number(r['Prod.4'] || r['Prod 4'] || r['Catalizador'] || 0);

    reports.push({
      id: `CLOSER-SC-${idx + 1}`,
      fecha: String(fecha).trim(),
      closer: closer || 'Closer 1',
      citasAsignadas,
      asistenciasEfectivas,
      ventasCerradas,
      enSeguimiento,
      facturacion,
      cashCollected,
      duracionPromedio,
      cicloCierre,
      tasaAsistencia,
      ticketPromedio,
      tasaRecaudo,
      inasistencias,
      declinadas,
      tasaConversion,
      prod1,
      prod2,
      prod3,
      prod4
    });
  });

  // Summary row if present
  let summary = null;
  if (rawRepRows.length > 0) {
    const r0 = rawRepRows[0];
    summary = {
      citasAsignadas: Number(r0['Citas Asignadas'] || 0),
      asistenciasEfectivas: Number(r0['Asistencias Efectivas'] || 0),
      ventasCerradas: Number(r0['Ventas Cerradas'] || 0),
      enSeguimiento: Number(r0['En Seguimiento'] || 0),
      facturacion: Number(String(r0['Total Facturación'] || r0['Facturación'] || '0').replace(/[^0-9.]/g, '')) || 0,
      cashCollected: Number(String(r0['Cash Collected'] || r0['Cash Collected ($)'] || '0').replace(/[^0-9.]/g, '')) || 0,
      duracionPromedio: Number(r0['Duración Prom. Llamada (min)'] || 0),
      cicloCierre: Number(r0['Ciclo de Cierre Prom. (días)'] || 0),
      tasaAsistencia: r0['Tasa de Asistencia (%)'] || '0%',
      ticketPromedio: Number(String(r0['Ticket Promedio ($)'] || '0').replace(/[^0-9.]/g, '')) || 0,
      tasaRecaudo: r0['Tasa de Recaudo (%)'] || '0%',
      inasistencias: Number(r0['Inasistencias'] || 0),
      declinadas: Number(r0['Declinadas'] || 0),
      tasaConversion: r0['Tasa de Conversión (%)'] || '0%',
      menteGlobal: Number(r0['Mente Global'] || 0),
      neuroState: Number(r0['Neuro State'] || r0['NeuroState'] || 0),
      activate: Number(r0['Activate'] || 0),
      catalizador: Number(r0['Catalizador'] || 0)
    };
  }

  return {
    reports,
    summary,
    url: sheetUrl,
    updatedAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  };
}
