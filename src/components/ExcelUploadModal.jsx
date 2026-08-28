import React, { useState, useRef } from 'react';
import {
  X, FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle,
  ChevronDown
} from 'lucide-react';
import { parseExcelFile, downloadExcelTemplate } from '../utils/excelParser';

const CHANNEL_OPTIONS = [
  { value: 'Setters Oficiales',  label: 'Canal A - Setters Oficiales' },
  { value: 'Setters Aspirantes', label: 'Canal B - Setters Aspirantes' },
  { value: 'Caller 1',           label: 'Canal C - Call Team' },
  { value: 'Global',             label: 'Consolidado Global (ADMIN)' },
];

export default function ExcelUploadModal({
  isOpen,
  onClose,
  onDataImported,
  userSession
}) {
  const [selectedChannel, setSelectedChannel] = useState(
    userSession?.role === 'caller'
      ? 'Caller 1'
      : (userSession?.group || (userSession?.role === 'admin' ? 'Global' : 'Setters Aspirantes'))
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationData, setValidationData] = useState(null);
  const [isImportSuccess, setIsImportSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMessage('');
    setIsImportSuccess(false);
    setIsProcessing(true);

    try {
      const parsedRecords = await parseExcelFile(file);
      if (!parsedRecords || parsedRecords.length === 0) {
        throw new Error('El archivo no contiene filas válidas de prospección.');
      }

      const sdrsFound = Array.from(new Set(parsedRecords.map(r => r.sdr).filter(Boolean)));
      const datesFound = Array.from(new Set(parsedRecords.map(r => r.timestamp).filter(Boolean)));

      setValidationData({
        parsedRecords,
        totalRows: parsedRecords.length,
        duplicatesRemoved: parsedRecords.duplicatesRemoved || 0,
        sdrsFound,
        datesRange: datesFound.length > 0 ? `${datesFound[0]} → ${datesFound[datesFound.length - 1]}` : 'Sin rango específico',
        sampleRows: parsedRecords.slice(0, 3)
      });
    } catch (err) {
      setErrorMessage(err.message || 'Error al procesar el archivo Excel.');
      setValidationData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!validationData || !validationData.parsedRecords) {
      setErrorMessage('Por favor selecciona un archivo válido primero.');
      return;
    }

    setIsProcessing(true);
    try {
      onDataImported(validationData.parsedRecords, selectedFile.name, selectedChannel);
      setIsImportSuccess(true);
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
        setSelectedFile(null);
        setValidationData(null);
        setIsImportSuccess(false);
      }, 1300);
    } catch (err) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Error al importar los datos.');
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px', width: '95%', padding: 0, overflow: 'hidden', borderRadius: '16px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* HEADER */}
        <div className="modal-header" style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#eff6ff',
              padding: '9px',
              borderRadius: '10px',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Cargar Tabla Excel (.xlsx / .csv)
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                Importa y valida registros de prospección con verificación automática
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>

          {/* SELECTOR DE CANAL DESTINO */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
              Canal de destino para estos datos:
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                style={{
                  width: '100%', padding: '9px 36px 9px 12px', fontSize: '13px', fontWeight: 700,
                  border: '1.5px solid #cbd5e1', borderRadius: '8px', background: '#ffffff',
                  color: '#0f172a', outline: 'none', cursor: 'pointer', appearance: 'none'
                }}
              >
                {CHANNEL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} />
            </div>
          </div>

          {/* DROPZONE DE ARCHIVO */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '10px',
              padding: '24px 18px',
              textAlign: 'center',
              background: validationData ? '#f0fdf4' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              borderColor: validationData ? '#86efac' : '#cbd5e1'
            }}
          >
            <Upload size={28} color={validationData ? '#059669' : '#2563eb'} style={{ marginBottom: '6px' }} />
            <p style={{ fontWeight: 800, fontSize: '13.5px', margin: '0 0 3px', color: '#0f172a' }}>
              {selectedFile ? selectedFile.name : 'Haz clic para seleccionar tu archivo Excel'}
            </p>
            <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
              {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB · Haz clic para cambiar archivo` : 'Formatos soportados: .xlsx, .xls, .csv'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* VISTA PREVIA & VALIDACION EN TIEMPO REAL */}
          {validationData && (
            <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, color: '#047857', marginBottom: '8px' }}>
                <CheckCircle2 size={16} /> Archivo validado con éxito
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', color: '#065f46' }}>
                <div><strong>Registros válidos:</strong> {validationData.totalRows} filas</div>
                <div><strong>Duplicados filtrados:</strong> {validationData.duplicatesRemoved} omitidos</div>
                <div><strong>SDRs detectados:</strong> {validationData.sdrsFound.length > 0 ? validationData.sdrsFound.slice(0, 3).join(', ') : 'Generales'}</div>
                <div><strong>Rango fechas:</strong> {validationData.datesRange}</div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '9px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} /> {errorMessage}
            </div>
          )}

          {isImportSuccess && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '9px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
              <CheckCircle2 size={15} /> ¡Datos importados correctamente al dashboard!
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="modal-footer" style={{ padding: '12px 22px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => downloadExcelTemplate()}
            style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Download size={13} /> Plantilla Modelo
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '7px 14px', fontSize: '12.5px' }}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-cyber-primary"
              onClick={handleConfirmImport}
              disabled={isProcessing || !validationData}
              style={{
                padding: '8px 16px', fontSize: '12.5px', fontWeight: 800,
                opacity: (!validationData || isProcessing) ? 0.6 : 1
              }}
            >
              {isProcessing ? 'Importando...' : 'Confirmar e Importar'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
