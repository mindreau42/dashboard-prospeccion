import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { SDR_LIST, COUNTRY_LIST, CATEGORY_LIST, ORIGIN_LIST } from '../data/mockData';

export default function MSFormModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    sdr: "Carlos Mendoza",
    estadoWaalaxy: "Activa",
    conexionesEnviadasWaalaxy: 150,
    conexionesAceptadasWaalaxy: 40,
    conexionesEnviadasManual: 25,
    conexionesAceptadasManual: 10,
    respuestasM1: 10,
    respuestasM2: 5,
    respuestasM3: 2,
    pais: "México",
    categoria: "Tecnología / SaaS",
    origen: "LinkedIn Outbound",
    cumplioMeta: "Sí",
    motivoNoCumplimiento: "N/A - Meta cumplida",
    nombreLeadAgendado: "Ejemplo Lead Demo",
    perfilLeadAgendado: "Director Comercial",
    linkPerfil: "linkedin.com/in/sample-demo-lead"
  });

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 10) + " " + now.toTimeString().slice(0, 5);
    
    const newRecord = {
      id: `REP-${Date.now().toString().slice(-4)}`,
      timestamp: formattedDate,
      ...formData,
      conexionesEnviadasWaalaxy: Number(formData.conexionesEnviadasWaalaxy),
      conexionesAceptadasWaalaxy: Number(formData.conexionesAceptadasWaalaxy),
      conexionesEnviadasManual: Number(formData.conexionesEnviadasManual),
      conexionesAceptadasManual: Number(formData.conexionesAceptadasManual),
      respuestasM1: Number(formData.respuestasM1),
      respuestasM2: Number(formData.respuestasM2),
      respuestasM3: Number(formData.respuestasM3)
    };

    onSubmit(newRecord);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2>Simulador de Envío de Microsoft Form</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Simula la carga de un nuevo reporte semanal para actualizar la vista visual
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>SDR (Nombre del Prospector)</label>
              <select 
                value={formData.sdr} 
                onChange={e => handleChange('sdr', e.target.value)}
              >
                {SDR_LIST.filter(s => s !== 'Todos').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Estado Herramienta Waalaxy</label>
              <select 
                value={formData.estadoWaalaxy} 
                onChange={e => handleChange('estadoWaalaxy', e.target.value)}
              >
                <option value="Activa">Activa</option>
                <option value="Pausada">Pausada</option>
                <option value="Limitada">Limitada</option>
              </select>
            </div>

            <div className="form-group">
              <label>Conexiones Enviadas | Waalaxy</label>
              <input 
                type="number" 
                value={formData.conexionesEnviadasWaalaxy} 
                onChange={e => handleChange('conexionesEnviadasWaalaxy', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Conexiones Aceptadas | Waalaxy</label>
              <input 
                type="number" 
                value={formData.conexionesAceptadasWaalaxy} 
                onChange={e => handleChange('conexionesAceptadasWaalaxy', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Conexiones Enviadas | Manual</label>
              <input 
                type="number" 
                value={formData.conexionesEnviadasManual} 
                onChange={e => handleChange('conexionesEnviadasManual', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Conexiones Aceptadas | Manual</label>
              <input 
                type="number" 
                value={formData.conexionesAceptadasManual} 
                onChange={e => handleChange('conexionesAceptadasManual', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Respuestas a Mensaje 1</label>
              <input 
                type="number" 
                value={formData.respuestasM1} 
                onChange={e => handleChange('respuestasM1', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Respuestas a Mensaje 2</label>
              <input 
                type="number" 
                value={formData.respuestasM2} 
                onChange={e => handleChange('respuestasM2', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Respuestas a Mensaje 3</label>
              <input 
                type="number" 
                value={formData.respuestasM3} 
                onChange={e => handleChange('respuestasM3', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>País</label>
              <select 
                value={formData.pais} 
                onChange={e => handleChange('pais', e.target.value)}
              >
                {COUNTRY_LIST.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Categoría / Industria</label>
              <select 
                value={formData.categoria} 
                onChange={e => handleChange('categoria', e.target.value)}
              >
                {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Origen de Prospección</label>
              <select 
                value={formData.origen} 
                onChange={e => handleChange('origen', e.target.value)}
              >
                {ORIGIN_LIST.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>¿Cumpliste Meta Semanal (1-3 agendamientos)?</label>
              <select 
                value={formData.cumplioMeta} 
                onChange={e => handleChange('cumplioMeta', e.target.value)}
              >
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label>Si marcaste "No" | Motivo</label>
              <input 
                type="text" 
                value={formData.motivoNoCumplimiento} 
                onChange={e => handleChange('motivoNoCumplimiento', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Nombre del Lead Agendado</label>
              <input 
                type="text" 
                value={formData.nombreLeadAgendado} 
                onChange={e => handleChange('nombreLeadAgendado', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Perfil del Lead (Cargo)</label>
              <input 
                type="text" 
                value={formData.perfilLeadAgendado} 
                onChange={e => handleChange('perfilLeadAgendado', e.target.value)}
              />
            </div>

            <div className="form-group full-width">
              <label>Link de Perfil o Fuente</label>
              <input 
                type="text" 
                value={formData.linkPerfil} 
                onChange={e => handleChange('linkPerfil', e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">
              <CheckCircle2 size={18} />
              Enviar Registro Muestra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
