import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

export default function DataEntryModal({ isOpen, onClose, activeTab, onSubmitRecord }) {
  const [combustibleForm, setCombustibleForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    equipo: 'Excavadora CAT 320',
    tipo: 'Diesel',
    cantidadGal: 40,
    horometroKm: 3500,
    operador: 'Juan Pérez',
    costoSoles: 660,
    tanqueOrigen: 'Tanque Principal A'
  });

  const [maderaForm, setMaderaForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    especie: 'Pino Radiata',
    tipoProducto: 'Trozas de Aserrío',
    volumenM3: 25.0,
    piezas: 100,
    loteUbicación: 'Patio Norte — Lote A',
    tipoMovimiento: 'Entrada',
    estado: 'Madera Verde',
    clienteProveedor: 'Bosques del Norte S.A.',
    precioM3Soles: 380
  });

  const [inventarioForm, setInventarioForm] = useState({
    sku: `REP-${Math.floor(100 + Math.random() * 900)}`,
    descripcion: 'Filtro / Repuesto Nuevo',
    categoria: 'Repuestos y Filtros',
    stockActual: 10,
    stockMinimo: 5,
    stockMaximo: 25,
    unidad: 'Unidades',
    precioUnitSoles: 125.0,
    ubicacion: 'Estante A-01',
    estado: 'Óptimo'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    let newRecord = null;

    if (activeTab === 'combustible') {
      newRecord = {
        id: `COM-${Date.now().toString().slice(-4)}`,
        ...combustibleForm,
        cantidadGal: Number(combustibleForm.cantidadGal),
        horometroKm: Number(combustibleForm.horometroKm),
        costoSoles: Number(combustibleForm.costoSoles)
      };
    } else if (activeTab === 'madera') {
      newRecord = {
        id: `MAD-${Date.now().toString().slice(-4)}`,
        ...maderaForm,
        volumenM3: Number(maderaForm.volumenM3),
        piezas: Number(maderaForm.piezas),
        precioM3Soles: Number(maderaForm.precioM3Soles)
      };
    } else {
      newRecord = {
        id: `INV-${Date.now().toString().slice(-4)}`,
        ...inventarioForm,
        stockActual: Number(inventarioForm.stockActual),
        stockMinimo: Number(inventarioForm.stockMinimo),
        stockMaximo: Number(inventarioForm.stockMaximo),
        precioUnitSoles: Number(inventarioForm.precioUnitSoles)
      };
    }

    onSubmitRecord(newRecord);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
          
          {/* Fixed Header */}
          <div className="modal-header">
            <div>
              <h2>
                Nuevo Registro — {activeTab === 'combustible' ? 'Control de Combustible' : activeTab === 'madera' ? 'Control de Madera' : 'Stock de Inventario'}
              </h2>
              <p>
                Ingresa los datos manualmente para actualizar el dashboard en tiempo real (en Soles S/)
              </p>
            </div>
            <button type="button" className="btn-icon" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
          </div>

          {/* Scrollable Body */}
          <div className="modal-body">
            {/* Form for Combustible */}
            {activeTab === 'combustible' && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Fecha</label>
                  <input 
                    type="date" 
                    value={combustibleForm.fecha} 
                    onChange={e => setCombustibleForm({ ...combustibleForm, fecha: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Maquinaria / Equipo / Placa</label>
                  <input 
                    type="text" 
                    value={combustibleForm.equipo} 
                    onChange={e => setCombustibleForm({ ...combustibleForm, equipo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Combustible</label>
                  <select 
                    value={combustibleForm.tipo} 
                    onChange={e => setCombustibleForm({ ...combustibleForm, tipo: e.target.value })}
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Gasolina">Gasolina</option>
                    <option value="Kerosene">Kerosene</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Cantidad (Galones / Litros)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={combustibleForm.cantidadGal} 
                    onChange={e => setCombustibleForm({ ...combustibleForm, cantidadGal: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Horómetro / Kilometraje</label>
                  <input 
                    type="number" 
                    value={combustibleForm.horometroKm} 
                    onChange={e => setCombustibleForm({ ...combustibleForm, horometroKm: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Operador / Responsable</label>
                  <input 
                    type="text" 
                    value={combustibleForm.operador} 
                    onChange={e => setCombustibleForm({ ...combustibleForm, operador: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Costo Total en Soles (S/)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={combustibleForm.costoSoles} 
                    onChange={e => setCombustibleForm({ ...combustibleForm, costoSoles: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Tanque de Origen / Estación</label>
                  <input 
                    type="text" 
                    value={combustibleForm.tanqueOrigen} 
                    onChange={e => setCombustibleForm({ ...combustibleForm, tanqueOrigen: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Form for Wood */}
            {activeTab === 'madera' && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Fecha</label>
                  <input 
                    type="date" 
                    value={maderaForm.fecha} 
                    onChange={e => setMaderaForm({ ...maderaForm, fecha: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Especie de Madera</label>
                  <select 
                    value={maderaForm.especie} 
                    onChange={e => setMaderaForm({ ...maderaForm, especie: e.target.value })}
                  >
                    <option value="Pino Radiata">Pino Radiata</option>
                    <option value="Eucalipto Grandis">Eucalipto Grandis</option>
                    <option value="Teca">Teca</option>
                    <option value="Roble">Roble</option>
                    <option value="Cedro">Cedro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tipo de Producto</label>
                  <select 
                    value={maderaForm.tipoProducto} 
                    onChange={e => setMaderaForm({ ...maderaForm, tipoProducto: e.target.value })}
                  >
                    <option value="Trozas de Aserrío">Trozas de Aserrío</option>
                    <option value="Tablas Dimensionadas">Tablas Dimensionadas</option>
                    <option value="Polines / Postes">Polines / Postes</option>
                    <option value="Vigas de Estructura">Vigas de Estructura</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Volumen (m³)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={maderaForm.volumenM3} 
                    onChange={e => setMaderaForm({ ...maderaForm, volumenM3: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Cantidad de Piezas</label>
                  <input 
                    type="number" 
                    value={maderaForm.piezas} 
                    onChange={e => setMaderaForm({ ...maderaForm, piezas: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Precio Aprox. por m³ (S/)</label>
                  <input 
                    type="number" 
                    value={maderaForm.precioM3Soles} 
                    onChange={e => setMaderaForm({ ...maderaForm, precioM3Soles: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Movimiento</label>
                  <select 
                    value={maderaForm.tipoMovimiento} 
                    onChange={e => setMaderaForm({ ...maderaForm, tipoMovimiento: e.target.value })}
                  >
                    <option value="Entrada">Entrada (Ingreso)</option>
                    <option value="Salida">Salida (Despacho)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Lote / Ubicación en Patio</label>
                  <input 
                    type="text" 
                    value={maderaForm.loteUbicación} 
                    onChange={e => setMaderaForm({ ...maderaForm, loteUbicación: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Estado / Secado</label>
                  <select 
                    value={maderaForm.estado} 
                    onChange={e => setMaderaForm({ ...maderaForm, estado: e.target.value })}
                  >
                    <option value="Madera Verde">Madera Verde</option>
                    <option value="Seco al Aire">Seco al Aire</option>
                    <option value="Seco en Cámara">Seco en Cámara</option>
                  </select>
                </div>
              </div>
            )}

            {/* Form for Inventory */}
            {activeTab === 'inventario' && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Código SKU / Referencia</label>
                  <input 
                    type="text" 
                    value={inventarioForm.sku} 
                    onChange={e => setInventarioForm({ ...inventarioForm, sku: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Descripción del Artículo</label>
                  <input 
                    type="text" 
                    value={inventarioForm.descripcion} 
                    onChange={e => setInventarioForm({ ...inventarioForm, descripcion: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Categoría</label>
                  <select 
                    value={inventarioForm.categoria} 
                    onChange={e => setInventarioForm({ ...inventarioForm, categoria: e.target.value })}
                  >
                    <option value="Repuestos y Filtros">Repuestos y Filtros</option>
                    <option value="Lubricantes y Grasas">Lubricantes y Grasas</option>
                    <option value="EPP y Seguridad">EPP y Seguridad</option>
                    <option value="Herramientas">Herramientas</option>
                    <option value="Neumáticos">Neumáticos</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Stock Actual</label>
                  <input 
                    type="number" 
                    value={inventarioForm.stockActual} 
                    onChange={e => setInventarioForm({ ...inventarioForm, stockActual: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Stock Mínimo (Alerta)</label>
                  <input 
                    type="number" 
                    value={inventarioForm.stockMinimo} 
                    onChange={e => setInventarioForm({ ...inventarioForm, stockMinimo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Capacidad Máxima Sugerida</label>
                  <input 
                    type="number" 
                    value={inventarioForm.stockMaximo} 
                    onChange={e => setInventarioForm({ ...inventarioForm, stockMaximo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Precio Unitario en Soles (S/)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={inventarioForm.precioUnitSoles} 
                    onChange={e => setInventarioForm({ ...inventarioForm, precioUnitSoles: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Ubicación en Bodega</label>
                  <input 
                    type="text" 
                    value={inventarioForm.ubicacion} 
                    onChange={e => setInventarioForm({ ...inventarioForm, ubicacion: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">
              <CheckCircle2 size={16} /> Guardar Registro
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
