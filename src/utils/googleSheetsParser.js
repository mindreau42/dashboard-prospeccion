import * as XLSX from 'xlsx';

/**
 * Converts Excel serial date (e.g., 46251) or string date to human-readable format
 */
export function formatExcelDate(rawDate) {
  if (!rawDate) return '';
  if (typeof rawDate === 'number') {
    // Excel base date: Dec 30, 1899
    const date = new Date((rawDate - 25569) * 86400 * 1000);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = monthNames[date.getUTCMonth()] || 'Mes';
    const year = date.getUTCFullYear();
    return `${day}-${month}-${year}`;
  }
  return String(rawDate).trim();
}

/**
 * Extracts spreadsheet ID and gid (sheet ID) from standard Google Sheets URLs
 */
export function extractGoogleSheetId(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim().replace(/^\/+/, ''); // Clean leading slashes

  // Handle direct published CSV links
  if (url.includes('/pub') && url.includes('output=csv')) {
    return { directCsvUrl: url.startsWith('http') ? url : `https://${url}` };
  }

  // Handle pubhtml links by converting to pub?output=csv
  if (url.includes('/pubhtml')) {
    const csvUrl = url.replace('/pubhtml', '/pub?output=csv');
    return { directCsvUrl: csvUrl.startsWith('http') ? csvUrl : `https://${csvUrl}` };
  }

  // Match standard /spreadsheets/d/ID
  const sheetIdMatch = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = sheetIdMatch ? sheetIdMatch[1] : null;

  // Match gid parameter if present (?gid=..., &gid=..., or #gid=...)
  const gidMatch = url.match(/[?&#]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : null;

  if (!spreadsheetId) {
    return null;
  }

  return { spreadsheetId, gid };
}

/**
 * Direct JSONP GViz Fetcher:
 * Bypasses ALL browser CORS restrictions and third-party proxy downtime by injecting a dynamic script tag.
 * Directly communicates with Google's official Visualization API.
 */
export function fetchViaJsonp(spreadsheetId, gid, sheetName) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      return reject(new Error('JSONP sólo es soportado en el navegador'));
    }

    const callbackName = `gviz_cb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');
    
    let url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=responseHandler:${callbackName}&_t=${Date.now()}`;
    if (gid) {
      url += `&gid=${gid}`;
    } else if (sheetName) {
      url += `&sheet=${encodeURIComponent(sheetName)}`;
    }
    
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Tiempo de espera agotado al conectar con Google Sheets"));
    }, 8500);

    function cleanup() {
      clearTimeout(timer);
      try {
        delete window[callbackName];
      } catch (_) {
        window[callbackName] = undefined;
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }

    window[callbackName] = function(data) {
      cleanup();
      try {
        if (!data || !data.table) {
          return resolve([]);
        }
        const cols = (data.table.cols || []).map((c, i) => (c && (c.label || c.id)) ? String(c.label || c.id).trim() : `Col_${i}`);
        const rows = (data.table.rows || []).map(r => {
          const rowObj = {};
          cols.forEach((colName, i) => {
            if (!colName) return;
            const cell = r.c ? r.c[i] : null;
            if (!cell) {
              rowObj[colName] = '';
            } else if (cell.f !== undefined && cell.f !== null) {
              rowObj[colName] = cell.f;
            } else if (cell.v !== undefined && cell.v !== null) {
              rowObj[colName] = cell.v;
            } else {
              rowObj[colName] = '';
            }
          });
          return rowObj;
        });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };

    script.onerror = function() {
      cleanup();
      reject(new Error("Error al cargar script de Google Sheets"));
    };

    script.src = url;
    document.head.appendChild(script);
  });
}

/**
 * Fetches general prospecting data from a Google Sheets URL with multi-strategy fallbacks.
 * Strategy order: opensheet.elk.sh (fastest) → JSONP → proxy fallbacks
 */
export async function fetchGoogleSheetData(sheetUrl) {
  if (!sheetUrl || typeof sheetUrl !== 'string' || sheetUrl.trim().length < 20) {
    throw new Error(
      'URL vacía o inválida. Pega el enlace completo de Google Sheets (debe contener "docs.google.com/spreadsheets/d/").'
    );
  }

  const extracted = extractGoogleSheetId(sheetUrl.trim());

  if (!extracted) {
    throw new Error(
      'El enlace ingresado no es una URL válida de Google Sheets.\n\n' +
      '✅ Correcto: https://docs.google.com/spreadsheets/d/TU_ID/edit?usp=sharing\n' +
      '❌ Incorrecto: solo el ID o un enlace acortado.'
    );
  }

  const { spreadsheetId, gid, directCsvUrl } = extracted;
  const cacheBuster = `_t=${Date.now()}`;

  // ── ESTRATEGIA 1: JSONP directo via Google gviz (datos EN TIEMPO REAL, sin caché) ──
  // Este método consulta directamente la API oficial de Google sin intermediarios.
  if (!directCsvUrl && spreadsheetId && typeof document !== 'undefined') {
    try {
      const jsonpRows = await fetchViaJsonp(spreadsheetId, gid);
      if (Array.isArray(jsonpRows)) {
        if (jsonpRows.length === 0) {
          return { records: [], rowCount: 0, duplicatesRemoved: 0, totalRawRows: 0, url: sheetUrl, isEmpty: true };
        }
        const { records: parsedRecords, duplicatesRemoved } = mapRowsToProspectingRecordsWithDedup(jsonpRows);
        if (parsedRecords.length > 0) {
          return { records: parsedRecords, rowCount: parsedRecords.length, duplicatesRemoved, totalRawRows: jsonpRows.length, url: sheetUrl };
        }
      }
    } catch (_) { /* fall through to next strategy */ }
  }

  // ── ESTRATEGIA 2: opensheet.elk.sh (respaldo — puede tener caché de hasta 30 min) ──
  if (!directCsvUrl && spreadsheetId) {
    const opensheetResult = await tryOpensheet(spreadsheetId, sheetUrl);
    if (opensheetResult !== null) return opensheetResult;

    // Reintento automático (en caso de caída temporal del servicio)
    await new Promise(r => setTimeout(r, 1200));
    const opensheetRetry = await tryOpensheet(spreadsheetId, sheetUrl);
    if (opensheetRetry !== null) return opensheetRetry;
  }

  // ── ESTRATEGIA 3: Proxies alternativos (corsproxy, allorigins) ──
  const candidateUrls = [];

  if (directCsvUrl) {
    candidateUrls.push({ url: `${directCsvUrl}&${cacheBuster}`, type: 'csv' });
    candidateUrls.push({ url: `https://api.allorigins.win/raw?url=${encodeURIComponent(directCsvUrl + '&' + cacheBuster)}`, type: 'csv' });
  } else if (spreadsheetId) {
    const gvizBase = gid
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}&${cacheBuster}`
      : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&${cacheBuster}`;
    const exportBase = gid
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}&${cacheBuster}`
      : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&${cacheBuster}`;

    candidateUrls.push({ url: `https://corsproxy.io/?url=${encodeURIComponent(gvizBase)}`, type: 'csv' });
    candidateUrls.push({ url: `https://corsproxy.io/?url=${encodeURIComponent(exportBase)}`, type: 'csv' });
    candidateUrls.push({ url: `https://api.allorigins.win/raw?url=${encodeURIComponent(gvizBase)}`, type: 'csv' });
    candidateUrls.push({ url: `https://api.allorigins.win/raw?url=${encodeURIComponent(exportBase)}`, type: 'csv' });
    candidateUrls.push({ url: gvizBase, type: 'csv' });
    candidateUrls.push({ url: exportBase, type: 'csv' });
  }

  for (const item of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(item.url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'text/csv,text/plain,*/*', 'Cache-Control': 'no-cache' }
      });
      clearTimeout(timeoutId);
      if (!response.ok) continue;
      const csvText = await response.text();
      if (!csvText || csvText.trim().length < 5) continue;
      if (csvText.trim().startsWith('<!DOCTYPE') || csvText.trim().startsWith('<html')) continue;
      const workbook = XLSX.read(csvText, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: '' });
      if (!rawRows || rawRows.length === 0) {
        return { records: [], rowCount: 0, duplicatesRemoved: 0, totalRawRows: 0, url: sheetUrl, isEmpty: true };
      }
      const { records: parsedRecords, duplicatesRemoved } = mapRowsToProspectingRecordsWithDedup(rawRows);
      return { records: parsedRecords, rowCount: parsedRecords.length, duplicatesRemoved, totalRawRows: rawRows.length, url: sheetUrl };
    } catch (_) { /* continue */ }
  }

  throw new Error(
    '❌ No se pudo conectar al Google Sheet.\n\n' +
    'Pasos para solucionarlo:\n' +
    '1. Abre el Sheet en tu navegador.\n' +
    '2. Haz clic en "Compartir" → "Cambiar a cualquier persona con el enlace" → Permiso: Lector.\n' +
    '3. Copia el enlace completo y pégalo de nuevo aquí.\n\n' +
    'Si el Sheet ya está compartido, puede ser una caída temporal del servicio. Intenta en 30 segundos.'
  );
}


/**
 * Tries opensheet.elk.sh with tab index '1' first, then common tab names.
 * Returns parsed result or null if all attempts fail.
 */
async function tryOpensheet(spreadsheetId, sheetUrl) {
  const tabCandidates = ['1', 'Sheet1', 'Hoja1', 'Hoja 1', 'Sheet 1', '2'];
  for (const tab of tabCandidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(`https://opensheet.elk.sh/${spreadsheetId}/${encodeURIComponent(tab)}`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      if (!response.ok) continue;
      const jsonData = await response.json();
      if (!Array.isArray(jsonData)) continue;
      if (jsonData.length === 0) {
        return { records: [], rowCount: 0, duplicatesRemoved: 0, totalRawRows: 0, url: sheetUrl, isEmpty: true };
      }
      const { records: parsedRecords, duplicatesRemoved } = mapRowsToProspectingRecordsWithDedup(jsonData);
      return { records: parsedRecords, rowCount: parsedRecords.length, duplicatesRemoved, totalRawRows: jsonData.length, url: sheetUrl };
    } catch (_) { /* try next tab */ }
  }
  return null;
}



/**
 * Fetches and parses the Supervisor Caller & Scorecard Spreadsheet
 */
export function parseScorecardRows(rawScorecardRows) {
  if (!Array.isArray(rawScorecardRows) || rawScorecardRows.length === 0) return [];
  const reports = [];

  rawScorecardRows.forEach((r, idx) => {
    const rawFecha = getVal(r, ['scorecard fecha', 'fecha', 'date', 'día', 'dia']);
    if (!rawFecha || (String(rawFecha).toLowerCase().includes('scorecard') && !String(rawFecha).includes('/'))) return;
    const fecha = formatExcelDate(rawFecha);
    const llamadasDiarias = Number(getVal(r, ['llamadas diarias', 'llamadas', 'intentos', 'total llamadas']) || 0);
    const contactosUnicos = Number(getVal(r, ['contactos únicos', 'contactos unicos', 'contactos', 'prospectos']) || 0);
    const mensajesEnviados = Number(getVal(r, ['mensajes 1-1 (enviados)', 'mensajes 1-1', 'mensajes 1:1', 'mensajes 1 a 1', 'mensajes']) || 0);
    const noInteresados = Number(getVal(r, ['no interesados', 'no interesado', 'sin interes', 'sin interés']) || 0);
    const noCalificanFC = Number(getVal(r, ['no califican (derivar a fc)', 'no califican', 'no califica', 'no aplica']) || 0);
    const enSeguimiento = Number(getVal(r, ['en seguimiento', 'seguimiento', 'interesados']) || 0);
    const comunidadSkool = Number(getVal(r, ['comunidad | skool', 'comunidad skool', 'skool']) || 0);
    const citasAgendadas = Number(getVal(r, ['cintas agendadas', 'citas agendadas', 'citas', 'agendados', 'agendado']) || 0);

    if (llamadasDiarias > 0 || contactosUnicos > 0 || mensajesEnviados > 0 || enSeguimiento > 0 || citasAgendadas > 0) {
      reports.push({
        id: `SC-${idx + 1}`,
        fecha,
        llamadasDiarias,
        contactosUnicos,
        mensajesEnviados,
        noInteresados,
        noCalificanFC,
        enSeguimiento,
        comunidadSkool,
        citasAgendadas
      });
    }
  });

  return reports;
}

export async function fetchSupervisorSheetData(sheetUrl = 'https://docs.google.com/spreadsheets/d/1XVwdte_5CKGHSxmeEQo5AT812REs_1YF/edit?rtpof=true') {
  const extracted = extractGoogleSheetId(sheetUrl);
  if (!extracted || !extracted.spreadsheetId) {
    throw new Error("URL de Google Sheets de Supervisión no válida.");
  }

  const { spreadsheetId, gid } = extracted;

  // 1. Try Browser JSONP first (zero CORS issues)
  if (typeof document !== 'undefined') {
    try {
      // Fetch official "Reporte General" / "Scorecard" tab
      let scorecardRows = [];
      for (const scName of ['Reporte General', 'Scorecard', 'Reporte', 'Metricas', 'Métricas']) {
        try {
          const res = await fetchViaJsonp(spreadsheetId, null, scName);
          if (Array.isArray(res) && res.length > 0) {
            scorecardRows = res;
            break;
          }
        } catch (_) {}
      }

      // Fetch detailed "Registro Diario" tab
      let callLogRows = [];
      for (const logName of ['Registro Diario (Caller)', 'Registro Diario', 'Registro de Llamadas', 'Prospectos', 'Llamadas']) {
        try {
          const res = await fetchViaJsonp(spreadsheetId, null, logName);
          if (Array.isArray(res) && res.length > 0) {
            callLogRows = res;
            break;
          }
        } catch (_) {}
      }

      if (callLogRows.length === 0) {
        callLogRows = await fetchViaJsonp(spreadsheetId, gid);
      }

      const parsed = parseSupervisorRows(callLogRows, sheetUrl);
      const parsedScorecard = parseScorecardRows(scorecardRows);
      if (parsedScorecard.length > 0) {
        parsed.scorecardReports = parsedScorecard;
      }
      return parsed;
    } catch (jErr) {
      console.warn("Supervisor JSONP fetch failed, falling back:", jErr);
    }
  }

  const cb = `_t=${Date.now()}`;
  const candidateUrls = [];
  if (gid) {
    candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}&${cb}`);
    candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}&${cb}`);
  }
  candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&${cb}`);
  candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&${cb}`);
  candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`);

  const targetUrl = gid
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}&${cb}`
    : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&${cb}`;

  candidateUrls.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
  candidateUrls.push(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);

  for (const fetchUrl of candidateUrls) {
    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) continue;

      let rawRows = [];
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('spreadsheet') || fetchUrl.includes('format=xlsx')) {
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetNames = workbook.SheetNames;
        
        let callerSheet = sheetNames[0];
        let scorecardSheet = null;

        for (const name of sheetNames) {
          const lower = name.toLowerCase();
          if (lower.includes('reporte general') || lower.includes('scorecard') || lower.includes('resumen') || lower.includes('metricas') || lower.includes('métricas')) {
            scorecardSheet = name;
          }
          if (lower.includes('registro diario') || lower.includes('llamada') || lower.includes('prospecto') || lower.includes('caller')) {
            callerSheet = name;
          }
        }

        const callerRows = XLSX.utils.sheet_to_json(workbook.Sheets[callerSheet], { defval: '' });
        let directScorecardReports = [];
        if (scorecardSheet && workbook.Sheets[scorecardSheet]) {
          const scRows = XLSX.utils.sheet_to_json(workbook.Sheets[scorecardSheet], { defval: '' });
          directScorecardReports = parseScorecardRows(scRows);
        }

        const parsed = parseSupervisorRows(callerRows, sheetUrl);
        if (directScorecardReports.length > 0) {
          parsed.scorecardReports = directScorecardReports;
        }
        return parsed;
      } else {
        const text = await response.text();
        if (!text || text.trim().length === 0 || (text.includes('<!DOCTYPE html>') && !text.includes(','))) continue;
        const workbook = XLSX.read(text, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
      }

      if (!rawRows || rawRows.length === 0) continue;

      return parseSupervisorRows(rawRows, sheetUrl);
    } catch (err) {
      // Continue to next candidate URL
    }
  }

  throw new Error("No se pudo conectar con la hoja de Caller. Verifica los permisos de acceso compartido.");
}

function parseSupervisorRows(rawRows, sheetUrl) {
      const callerRecords = [];
      rawRows.forEach((r) => {
        const rawNombre = String(getVal(r, ['nombre', 'nombre completo', 'nombre y apellido', 'nombre del prospecto', 'prospecto', 'lead', 'contacto', 'cliente', 'persona', 'titular', 'alumno', 'name', 'full name']) || '').trim();
        const rawFuente = String(getVal(r, ['fuente', 'origen', 'canal', 'source', 'lead source', 'fuente de origen', 'tipo de fuente']) || '').trim();
        const rawRespuesta = String(getVal(r, ['respuesta', 'estado', 'status', 'calificacion']) || '').trim();
        const rawContexto = String(getVal(r, ['contexto | opcional', 'contexto opcional', 'contexto', 'notas', 'observaciones', 'comentarios']) || '').trim();
        const rawMensajes = String(getVal(r, ['mensajes 1-1', 'mensajes 1:1', 'mensajes 1 a 1', 'mensajes', 'mensajes whatsapp']) || '').trim();
        const rawSkool = String(getVal(r, ['comunidad | skool', 'comunidad skool', 'comunidad |skool', 'comunidad|skool', 'skool', 'comunidad']) || '').trim();

        // Skip completely blank template rows (where all data columns are empty)
        if (!rawNombre && !rawFuente && !rawRespuesta && !rawContexto && !rawMensajes && !rawSkool) {
          return;
        }

        const fecha = formatExcelDate(getVal(r, ['fecha', 'marca temporal', 'date']) || '18-ago-26');
        const nombre = rawNombre || '—';
        const fuente = (rawFuente && rawFuente !== '—' && rawFuente !== '-') ? rawFuente : '—';
        const respuesta = rawRespuesta || 'Sin Respuesta';
        const intentosNum = Number(getVal(r, ['número de intentos', 'numero de intentos', 'intentos', 'nro intentos']) || 1);
        const intentos = isNaN(intentosNum) || intentosNum < 1 ? 1 : intentosNum;
        const mensajes1a1 = (rawMensajes.toUpperCase().includes('SI') || rawMensajes.toUpperCase().includes('SÍ') || rawMensajes === '1') ? 'Sí' : 'No';
        const comunidadSkool = (rawSkool.toUpperCase().includes('SI') || rawSkool.toUpperCase().includes('SÍ') || rawSkool === '1') ? 'Sí' : 'No';
        const contexto = rawContexto || 'Sin notas adicionales';
        const fechaRecontactar = formatExcelDate(getVal(r, ['fecha & hora| re-contactar', 'fecha & hora | re-contactar', 'fecha recontactar', 'recontactar', 're-contactar']));

        callerRecords.push({
          id: `CALLER-${callerRecords.length + 1}`,
          fecha,
          nombre,
          fuente,
          respuesta,
          intentos,
          mensajes1a1,
          comunidadSkool,
          contexto,
          fechaRecontactar
        });
      });

      return {
        callerRecords,
        scorecardReports: [],
        url: sheetUrl,
        updatedAt: new Date().toLocaleTimeString()
      };
}

/**
 * Maps arbitrary JSON row objects from Excel/Google Sheets to standardized prospecting records
 * with comprehensive automatic deduplication.
 */
export function mapRowsToProspectingRecordsWithDedup(rawRows) {
  const seenSignatures = new Set();
  const validRecords = [];
  let duplicatesRemoved = 0;

  let lastSeenSdr = '';
  let lastSeenTimestamp = '';

  rawRows.forEach((row, index) => {
    // Ignore completely empty rows
    const values = Object.values(row).filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    if (values.length === 0) return;

    // ── STRICT SDR EXTRACTION (Never match generic 'nombre' which matches 'Agendado: Nombre Completo') ──
    const rawSdr = getVal(row, ['sdr', 'setter', 'nombre del sdr', 'nombre del setter', 'nombre sdr', 'nombre setter', 'prospector', 'agente', 'ejecutivo', 'responsable', 'quien reporta']);
    
    // Continuation rows: if a row has empty SDR (e.g. additional leads listed on subsequent lines), inherit the previous row's SDR
    const sdr = (rawSdr && rawSdr.trim()) ? rawSdr.trim() : (lastSeenSdr || `SDR ${index + 1}`);
    if (rawSdr && rawSdr.trim()) {
      lastSeenSdr = rawSdr.trim();
    }
    
    // ── ESTADO DE LA HERRAMIENTA WAALAXY / SALUD OPERATIVA ──
    const rawEstadoWaalaxy = String(getVal(row, [
      'estado de la herramienta waalaxy',
      'estado de la herramienta',
      'estado waalaxy',
      'waalaxy status',
      'waalaxy',
      'estatus automatizacion',
      'estatus',
      'estado cuenta'
    ]) || '').trim();

    let estadoWaalaxy = '';
    if (rawEstadoWaalaxy.toLowerCase().includes('restricci') || rawEstadoWaalaxy.toLowerCase().includes('restringid') || rawEstadoWaalaxy.toLowerCase().includes('bloquead')) {
      estadoWaalaxy = 'Restricción';
    } else if (rawEstadoWaalaxy.toLowerCase().includes('bajo ssi') || rawEstadoWaalaxy.toLowerCase().includes('ssi')) {
      estadoWaalaxy = 'Bajo SSI';
    } else if (rawEstadoWaalaxy.toLowerCase().includes('activo') || rawEstadoWaalaxy.toLowerCase().includes('activa')) {
      estadoWaalaxy = 'Activo';
    } else if (rawEstadoWaalaxy) {
      estadoWaalaxy = rawEstadoWaalaxy;
    }

    // ── CONEXIONES Y MENSAJES WAALAXY Y MANUAL ──
    const conexionesEnviadasWaalaxy = Number(getVal(row, ['conexiones enviadas | waalaxy', 'conexiones enviadas waalaxy', 'enviadas waalaxy', 'waalaxy enviadas', 'conexiones waalaxy', 'invitaciones waalaxy', 'conexiones enviadas auto']) || 0);
    const conexionesAceptadasWaalaxy = Number(getVal(row, ['conexiones aceptadas | waalaxy', 'conexiones aceptadas waalaxy', 'aceptadas waalaxy', 'waalaxy aceptadas', 'conexiones aceptadas auto']) || 0);

    const conexionesEnviadasManual = Number(getVal(row, ['conexiones enviadas | manual', 'conexiones enviadas manual', 'enviadas manual', 'manual enviadas', 'conexiones manual', 'invitaciones manual']) || 0);
    const conexionesAceptadasManual = Number(getVal(row, ['conexiones aceptadas | manual', 'conexiones aceptadas manual', 'aceptadas manual', 'manual aceptadas']) || 0);

    const rawMsgWaalaxy = getVal(row, ['mensajes enviados | waalaxy', 'mensajes enviados waalaxy', 'mensajes waalaxy', 'mensajes | waalaxy', 'mensajes auto']);
    const mensajesWaalaxy = (rawMsgWaalaxy !== '' && !isNaN(Number(rawMsgWaalaxy))) ? Number(rawMsgWaalaxy) : 0;

    const rawMsgManual = getVal(row, ['mensajes enviados | manual', 'mensajes enviados manual', 'mensajes manual', 'mensajes | manual']);
    const mensajesManual = (rawMsgManual !== '' && !isNaN(Number(rawMsgManual))) ? Number(rawMsgManual) : 0;

    const respuestasM1 = Number(getVal(row, ['cuantos leads te respondieron al mensaje 1', 'respuestas mensaje 1', 'respuestas m1', 'mensaje 1', 'm1', 'resp m1', 'primer mensaje']) || 0);
    const respuestasM2 = Number(getVal(row, ['cuantos leads te respondieron al mensaje 2', 'respuestas mensaje 2', 'respuestas m2', 'mensaje 2', 'm2', 'resp m2', 'segundo mensaje']) || 0);
    const respuestasM3 = Number(getVal(row, ['cuantos leads te respondieron al mensaje 3', 'respuestas mensaje 3', 'respuestas m3', 'mensaje 3', 'm3', 'resp m3', 'tercer mensaje']) || 0);

    const diagPaisRaw = String(getVal(row, ['diagnosticos por pais', 'diagnósticos por país', 'diagnosticos pais', 'diagnósticos país', 'pais diagnosticos', 'país diagnósticos']) || '').trim();
    const diagRaw = getVal(row, ['total de diagnosticos', 'total de diagnósticos', 'total diagnosticos', 'total diagnósticos', 'diagnosticos', 'diagnósticos', 'total diag', 'diag']);
    
    let diagnosticos = 0;
    if (diagPaisRaw) {
      if (!isNaN(Number(diagPaisRaw))) {
        diagnosticos = Number(diagPaisRaw);
      } else {
        const matches = diagPaisRaw.match(/\d+/g);
        if (matches && matches.length > 0) {
          diagnosticos = matches.reduce((acc, m) => acc + parseInt(m, 10), 0);
        }
      }
    }
    if (diagnosticos === 0 && diagRaw !== '' && !isNaN(Number(diagRaw))) {
      diagnosticos = Number(diagRaw);
    }
    
    // ── CUMPLIMIENTO DE META SEMANAL (Lectura exacta de columna ¿Cumpliste la meta semanal?) ──
    const cumplioMetaRaw = String(getVal(row, [
      '¿cumpliste la meta semanal?',
      'cumpliste la meta semanal?',
      '¿cumpliste la meta semanal (1 a 3 agendamientos)?',
      'cumpliste la meta semanal (1 a 3 agendamientos)?',
      'cumpliste la meta semanal (1 a 3 agendamientos)',
      'cumpliste la meta semanal',
      'cumplio la meta semanal',
      'cumpliste la meta',
      'cumplio la meta',
      'cumplio meta',
      'cumplió meta',
      'meta cumplida',
      'goal',
      'meta semanal',
      'objetivo cumplido',
      'cumplimiento de meta',
      'meta'
    ]) || '').trim();
    
    const agendamientosRaw = getVal(row, ['agendamientos asistido', 'agendamiento asistido', 'agendamientos', 'agendamiento', 'citas agendadas', 'citas', 'demos', 'agendados', 'reuniones', 'total agendamientos']);
    const rawLeadNombre = getVal(row, ['agendado: nombre completo', 'agendado nombre completo', 'nombre completo agendado', 'nombre del lead agendado', 'prospecto agendado']);
    const hasValidLeadName = Boolean(rawLeadNombre && isNaN(Number(rawLeadNombre)) && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(String(rawLeadNombre)));

    const isMetaExplicitYes = Boolean(
      cumplioMetaRaw && (
        cumplioMetaRaw.toLowerCase() === 'si' ||
        cumplioMetaRaw.toLowerCase() === 'sí' ||
        cumplioMetaRaw === '1' ||
        cumplioMetaRaw.toLowerCase() === 'true' ||
        cumplioMetaRaw.toLowerCase().startsWith('si') ||
        cumplioMetaRaw.toLowerCase().startsWith('sí')
      ) &&
      !cumplioMetaRaw.toLowerCase().startsWith('no')
    );

    // Exact Meta fulfillment from sheet: 'Sí' if answered affirmative, otherwise 'No'
    const cumplioMeta = isMetaExplicitYes ? 'Sí' : 'No';

    // ── ASISTENCIA AL BOOKING (SHOW UP) ──
    const asistioBookingRaw = String(getVal(row, [
      'asistio al booking?',
      'asistió al booking?',
      'asistio al booking',
      'asistió al booking',
      'asistio booking',
      'asistio lead',
      'asistio',
      'asistió',
      'show up',
      'asistencia',
      'concurrio',
      'asistio?'
    ]) || '').trim();
    let asistioLead = '';
    const lowAsist = asistioBookingRaw.toLowerCase();
    if ((lowAsist === 'si' || lowAsist === 'sí' || lowAsist.startsWith('si') || lowAsist.startsWith('sí') || lowAsist === '1' || lowAsist === 'true') && !lowAsist.startsWith('no')) {
      asistioLead = 'Sí';
    } else if (lowAsist === 'no' || lowAsist.startsWith('no')) {
      asistioLead = 'No';
    } else if (lowAsist.includes('pendiente')) {
      asistioLead = 'Pendiente';
    } else {
      asistioLead = '';
    }

    const asistidosRaw = getVal(row, ['asistidos', 'total asistidos', 'asistido', 'asistieron']);
    const asistidos = (asistidosRaw !== '' && !isNaN(Number(asistidosRaw)))
      ? Number(asistidosRaw)
      : (asistioLead === 'Sí' ? 1 : 0);

    const agendamientos = (agendamientosRaw !== '' && !isNaN(Number(agendamientosRaw)))
      ? Number(agendamientosRaw)
      : (cumplioMeta === 'Sí' ? 1 : 0);

    const showUpRate = agendamientos > 0 ? Math.round((asistidos / agendamientos) * 100) : (asistidos > 0 ? 100 : 0);
    
    // ── RESULTADOS DE PROSPECCIÓN (POSITIVAS / NEGATIVAS / GHOSTING) ──
    const rawResultados = String(getVal(row, [
      'resultados de prospeccion',
      'resultados de prospección',
      'resultado de prospeccion',
      'resultado de prospección',
      'resultados',
      'sentimiento'
    ]) || '').trim();

    let respuestasPositivas = 0;
    let respuestasNegativas = 0;
    let respuestasGhosting = 0;

    if (rawResultados && (rawResultados.includes('-') || rawResultados.includes('/') || rawResultados.includes(','))) {
      const parts = rawResultados.split(/[-/,]+/).map(p => Number(p.trim()) || 0);
      if (parts.length >= 3) {
        respuestasPositivas = parts[0];
        respuestasNegativas = parts[1];
        respuestasGhosting = parts[2];
      }
    }

    if (respuestasPositivas === 0 && respuestasNegativas === 0 && respuestasGhosting === 0) {
      const rawPos = getVal(row, ['positivas', 'respuestas positivas', 'positivos', 'interes confirmado']);
      const rawNeg = getVal(row, ['negativas', 'respuestas negativas', 'negativos', 'rechazo o descarte']);
      const rawGhost = getVal(row, ['ghosting', 'sin respuesta', 'sin contestar']);
      if (rawPos !== '' || rawNeg !== '' || rawGhost !== '') {
        respuestasPositivas = Number(rawPos) || 0;
        respuestasNegativas = Number(rawNeg) || 0;
        respuestasGhosting = Number(rawGhost) || 0;
      }
      // When all sources are empty → leave as 0 (no invented values)
    }

    // Fórmula de puntaje exacta:
    // (Diagnósticos × 1) + (Agendamientos × 5) + (Asistidos × 10)
    const puntaje = (diagnosticos * 1) + (agendamientos * 5) + (asistidos * 10);

    const pais = getVal(row, ['pais', 'país', 'country', 'region', 'mercado', 'ubicacion', 'territorio', 'ciudad']) || 'General';
    const categoria = getVal(row, ['categoria', 'categoría', 'industria', 'sector', 'category', 'rubro', 'nicho', 'giro']) || 'Recursos Humanos';
    
    // ── EXTRACCIÓN DIRECTA DE ORIGEN DE PROSPECCIÓN (COLUMNA 15) ──
    const rawOrigenCol = String(getVal(row, ['origen de prospeccion', 'origen de prospección', 'origen', 'origen prospeccion']) || '').trim().toLowerCase();
    let origen = '';
    if (rawOrigenCol.includes('base') || rawOrigenCol.includes('datos') || rawOrigenCol.includes('bd')) {
      origen = 'Base de Datos';
    } else if (rawOrigenCol.includes('outbound')) {
      origen = 'Outbound';
    } else if (rawOrigenCol.includes('scraping') || rawOrigenCol.includes('scrap')) {
      origen = 'Scraping';
    }

    const origenProspeccion = origen;

    const linkPerfilRaw = String(getVal(row, [
      'link de linkedin', 'link linkedin', 'link de perfil o fuente de origen',
      'link de perfil', 'link perfil', 'perfil linkedin', 'url linkedin', 'link', 'linkedin', 'url'
    ]) || '').trim();

    const rawNotion = String(getVal(row, [
      'fuente de datos', 'notion', 'base notion', 'proyecto notion',
      'campana notion', 'campaña notion', 'base de datos notion'
    ]) || '').trim();

    const linkPerfil = linkPerfilRaw;
    const notion = rawNotion;
    const otros = '';

    const rawTimestamp = getVal(row, ['marca temporal', 'timestamp', 'fecha', 'fecha / hora', 'date', 'registro', 'hora']);
    const timestamp = rawTimestamp ? formatExcelDate(rawTimestamp) : (lastSeenTimestamp || new Date().toISOString().slice(0, 10));
    if (rawTimestamp) {
      lastSeenTimestamp = formatExcelDate(rawTimestamp);
    }

    const diagnosticosPorPais = getVal(row, ['diagnosticos por pais', 'diagnósticos por país', 'diagnosticos pais', 'diagnosticos region']) || '';
    const agendamientoPorPais = getVal(row, ['agendamiento por pais', 'agendamiento por país', 'agendamientos por pais', 'pais agendamiento', 'agendamientos region']) || pais || 'General';

    const isValidPersonName = (name) => {
      if (!name) return false;
      const clean = String(name).trim();
      if (!clean || clean.length < 2) return false;
      if (!isNaN(Number(clean))) return false; // Ignore pure numbers like 9, 12, 11, etc.
      if (['n/a', '—', '-', 'ninguno', 'ninguna', 'no', '0', 'sin agendamiento', 'lead agendado', 'lead', 'prospecto'].includes(clean.toLowerCase())) return false;
      return /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(clean);
    };

    const rawAgendadoName = getVal(row, [
      'agendado: nombre completo',
      'agendado nombre completo',
      'nombre completo agendado',
      'nombre del lead agendado',
      'prospecto agendado'
    ]);

    const nombreLeadAgendado = isValidPersonName(rawAgendadoName) ? String(rawAgendadoName).trim() : '';
    const rawCargo = getVal(row, ['cargo', 'puesto', 'posicion', 'rol']);
    const perfilLeadAgendado = nombreLeadAgendado ? (rawCargo || 'Tomador de Decisión') : '';
    const motivoNoCumplimiento = getVal(row, ['si marcaste "no" | cual fue el motivo?', 'si marcaste no cual fue el motivo', 'motivo no cumplimiento', 'motivo no meta', 'motivo']) || '';
    const clasificacion = puntaje >= 12 ? 'Alto Desempeño' : (puntaje >= 6 ? 'En Desarrollo' : 'Requiere Refuerzo');


    // ── DEDUPLICATION ──
    const signature = `${index}|${timestamp}|${sdr}|${conexionesEnviadasWaalaxy}|${conexionesEnviadasManual}|${nombreLeadAgendado}`;
    if (seenSignatures.has(signature)) {
      duplicatesRemoved++;
      return;
    }
    seenSignatures.add(signature);

    validRecords.push({
      id: `GS-${Date.now()}-${validRecords.length + 1}`,

      timestamp,
      sdr,
      estadoWaalaxy,
      conexionesEnviadasWaalaxy,
      conexionesAceptadasWaalaxy,
      conexionesEnviadasManual,
      conexionesAceptadasManual,
      mensajesWaalaxy,
      mensajesManual,
      respuestasM1,
      respuestasM2,
      respuestasM3,
      diagnosticos,
      diagnosticosPorPais,
      agendamientos,
      agendamientoPorPais,
      asistidos,
      showUpRate,
      puntaje,
      clasificacion,
      respuestasPositivas,
      respuestasNegativas,
      respuestasGhosting,
      notion,
      otros,
      pais,
      categoria,
      origen,
      origenProspeccion,
      cumplioMeta,
      motivoNoCumplimiento,
      nombreLeadAgendado,
      perfilLeadAgendado,
      linkPerfil,
      asistioLead
    });
  });

  return {
    records: validRecords,
    duplicatesRemoved
  };
}

export function mapRowsToProspectingRecords(rawRows) {
  return mapRowsToProspectingRecordsWithDedup(rawRows).records;
}

/**
 * Flexible multi-pass property key matching ignoring accents, punctuation, spaces, and case
 */
function getVal(rowObject, possibleKeys) {
  if (!rowObject || typeof rowObject !== 'object') return '';
  const rowKeys = Object.keys(rowObject);

  const normalize = (str) =>
    String(str || '')
       .toLowerCase()
       .normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "")
       .replace(/[^a-z0-9]/g, '');

  const normRowKeyMap = rowKeys.map(rk => ({
    original: rk,
    normalized: normalize(rk)
  }));

  // Pass 1: Exact normalized match
  for (const pKey of possibleKeys) {
    const normPKey = normalize(pKey);
    const found = normRowKeyMap.find(item => item.normalized === normPKey);
    if (found && rowObject[found.original] !== undefined && rowObject[found.original] !== null && String(rowObject[found.original]).trim() !== '') {
      return rowObject[found.original];
    }
  }

  // Pass 2: StartsWith / EndsWith match
  for (const pKey of possibleKeys) {
    const normPKey = normalize(pKey);
    if (normPKey.length < 3) continue;
    const found = normRowKeyMap.find(item => item.normalized.startsWith(normPKey) || normPKey.startsWith(item.normalized));
    if (found && rowObject[found.original] !== undefined && rowObject[found.original] !== null && String(rowObject[found.original]).trim() !== '') {
      return rowObject[found.original];
    }
  }

  // Pass 3: Substring contains match (for headers with extra notes/parentheses)
  for (const pKey of possibleKeys) {
    const normPKey = normalize(pKey);
    if (normPKey.length < 4) continue;
    const found = normRowKeyMap.find(item => item.normalized.includes(normPKey) || normPKey.includes(item.normalized));
    if (found && rowObject[found.original] !== undefined && rowObject[found.original] !== null && String(rowObject[found.original]).trim() !== '') {
      return rowObject[found.original];
    }
  }

  return '';
}
