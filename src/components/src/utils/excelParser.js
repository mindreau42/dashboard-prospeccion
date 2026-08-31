import * as XLSX from 'xlsx';
import { mapRowsToProspectingRecordsWithDedup } from './googleSheetsParser';

/**
 * Parse an Excel file (.xlsx, .xls, .csv) uploaded by user and map its rows to prospecting records
 * with automatic duplicate detection and removal.
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let workbook;
        const isCsv = file.name.toLowerCase().endsWith('.csv');

        if (isCsv) {
          // If CSV, try reading as string first with UTF-8 support
          try {
            const textDecoder = new TextDecoder('utf-8');
            const csvString = textDecoder.decode(e.target.result);
            workbook = XLSX.read(csvString, { type: 'string', codepage: 65001 });
          } catch {
            const data = new Uint8Array(e.target.result);
            workbook = XLSX.read(data, { type: 'array', codepage: 65001 });
          }
        } else {
          const data = new Uint8Array(e.target.result);
          workbook = XLSX.read(data, { type: 'array', cellDates: true });
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

        if (!rawRows || rawRows.length === 0) {
          reject(new Error("El archivo no contiene datos o está vacío."));
          return;
        }

        const { records: mappedRecords, duplicatesRemoved } = mapRowsToProspectingRecordsWithDedup(rawRows);
        
        // Attach metadata for caller components
        mappedRecords.duplicatesRemoved = duplicatesRemoved;
        mappedRecords.totalRawRows = rawRows.length;

        resolve(mappedRecords);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export sample Excel template file for Prospecting analytics matching the exact 18 fields
 */
export function downloadExcelTemplate() {
  const sampleData = [
    {
      "Marca temporal": "2026-08-10 09:30",
      "SDR": "Carlos Mendoza",
      "Estado de la herramienta Waalaxy": "Activa",
      "Conexiones Enviadas | Waalaxy": 180,
      "Conexiones Aceptadas | Waalaxy": 45,
      "Conexiones Enviadas | Manual  ": 35,
      "Conexiones Aceptadas | Manual  ": 12,
      "¿Cuántos leads te respondieron al Mensaje 1? ": 14,
      "¿Cuántos leads te respondieron al Mensaje 2? ": 8,
      "¿Cuántos leads te respondieron al Mensaje 3? ": 4,
      "Pais": "México",
      "Categoría ": "Tecnología / SaaS",
      "Origen": "LinkedIn Outbound",
      "¿Cumpliste la meta semanal (1 a 3 agendamientos)? ": "Sí",
      "Si marcaste \"No\" | Cuál fue el motivo?  ": "N/A - Meta cumplida",
      "Nombre del lead Agendado": "Ejemplo Lead Alpha (Demo)",
      "Perfil del Lead Agendado": "Director de Operaciones",
      "Link de perfil o Fuente de Origen?": "linkedin.com/in/sample-lead-alpha"
    },
    {
      "Marca temporal": "2026-08-10 11:15",
      "SDR": "Ana Silva",
      "Estado de la herramienta Waalaxy": "Activa",
      "Conexiones Enviadas | Waalaxy": 210,
      "Conexiones Aceptadas | Waalaxy": 58,
      "Conexiones Enviadas | Manual  ": 20,
      "Conexiones Aceptadas | Manual  ": 8,
      "¿Cuántos leads te respondieron al Mensaje 1? ": 18,
      "¿Cuántos leads te respondieron al Mensaje 2? ": 11,
      "¿Cuántos leads te respondieron al Mensaje 3? ": 6,
      "Pais": "Colombia",
      "Categoría ": "Servicios Financieros",
      "Origen": "LinkedIn Outbound",
      "¿Cumpliste la meta semanal (1 a 3 agendamientos)? ": "Sí",
      "Si marcaste \"No\" | Cuál fue el motivo?  ": "N/A - Meta cumplida",
      "Nombre del lead Agendado": "Ejemplo Lead Beta (Demo)",
      "Perfil del Lead Agendado": "Gerente General",
      "Link de perfil o Fuente de Origen?": "linkedin.com/in/sample-lead-beta"
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Prospección Semanal');
  XLSX.writeFile(workbook, 'Reporte_Prospeccion_Modelo.xlsx');
}

/**
 * Export current active reports to an Excel file
 */
export function exportReportsToExcel(reports, filename = 'Reporte_Prospeccion_Exportado.xlsx') {
  const exportableRows = reports.map(r => ({
    "Marca temporal": r.timestamp,
    "SDR": r.sdr,
    "Estado de la herramienta Waalaxy": r.estadoWaalaxy,
    "Conexiones Enviadas | Waalaxy": r.conexionesEnviadasWaalaxy,
    "Conexiones Aceptadas | Waalaxy": r.conexionesAceptadasWaalaxy,
    "Conexiones Enviadas | Manual": r.conexionesEnviadasManual,
    "Conexiones Aceptadas | Manual": r.conexionesAceptadasManual,
    "Respuestas M1": r.respuestasM1,
    "Respuestas M2": r.respuestasM2,
    "Respuestas M3": r.respuestasM3,
    "Pais": r.pais,
    "Categoría": r.categoria,
    "Origen": r.origen,
    "Cumplió Meta Semanal": r.cumplioMeta,
    "Motivo si No": r.motivoNoCumplimiento,
    "Nombre Lead Agendado": r.nombreLeadAgendado,
    "Perfil Lead": r.perfilLeadAgendado,
    "Link de Perfil": r.linkPerfil
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportableRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos Prospeccion');
  XLSX.writeFile(workbook, filename);
}
