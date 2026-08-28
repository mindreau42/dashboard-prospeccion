// Datos Genéricos de Muestra — Gestión Operativa (Moneda: Soles Peruanos S/)

// ── COMBUSTIBLE ────────────────────────────────────────────────────────────────
export const TANQUES = [
  { id: 'TQ-A', nombre: 'Tanque Principal A (Diesel)', capacidadGal: 10000, saldoGal: 8400, tipo: 'Diesel', precioGalSoles: 16.5 },
  { id: 'TQ-B', nombre: 'Tanque Secundario B (Diesel)', capacidadGal: 5000,  saldoGal: 1100, tipo: 'Diesel', precioGalSoles: 16.5 },
  { id: 'TQ-C', nombre: 'Tanque Gasolina C',            capacidadGal: 2000,  saldoGal: 1750, tipo: 'Gasolina', precioGalSoles: 19.2 },
];

export const INITIAL_COMBUSTIBLE_DATA = [
  { id:'COM-101', fecha:'2026-08-01', equipo:'Excavadora CAT 320',          tipo:'Diesel',   cantidadGal:45.0, horometroKm:3450,  operador:'Juan Pérez',      costoSoles:742.5,  tanqueOrigen:'TQ-A' },
  { id:'COM-102', fecha:'2026-08-02', equipo:'Camión Volquete Volvo FMX',   tipo:'Diesel',   cantidadGal:60.0, horometroKm:124500, operador:'Carlos Gómez',    costoSoles:990.0,  tanqueOrigen:'TQ-A' },
  { id:'COM-103', fecha:'2026-08-03', equipo:'Cargador Frontal Komatsu',    tipo:'Diesel',   cantidadGal:38.5, horometroKm:2180,  operador:'Miguel Rodríguez',costoSoles:635.3,  tanqueOrigen:'TQ-B' },
  { id:'COM-104', fecha:'2026-08-04', equipo:'Camioneta Hilux (Supervisión)',tipo:'Gasolina', cantidadGal:15.0, horometroKm:45200, operador:'Ana Silva',       costoSoles:288.0,  tanqueOrigen:'TQ-C' },
  { id:'COM-105', fecha:'2026-08-05', equipo:'Generador Eléctrico 150 kVA', tipo:'Diesel',   cantidadGal:50.0, horometroKm:1890,  operador:'Luis Martínez',   costoSoles:825.0,  tanqueOrigen:'TQ-A' },
  { id:'COM-106', fecha:'2026-08-06', equipo:'Excavadora CAT 320',          tipo:'Diesel',   cantidadGal:42.0, horometroKm:3492,  operador:'Juan Pérez',      costoSoles:693.0,  tanqueOrigen:'TQ-A' },
];

// ── MADERA ─────────────────────────────────────────────────────────────────────
export const MADERA_ESPECIES = ['Pino Radiata', 'Eucalipto Grandis', 'Teca', 'Roble', 'Cedro'];

export const INITIAL_MADERA_DATA = [
  { id:'MAD-201', fecha:'2026-08-01', especie:'Pino Radiata',     tipoProducto:'Trozas de Aserrío',   volumenM3:48.5, piezas:120, loteUbicación:'Patio Norte — Lote A', tipoMovimiento:'Entrada', estado:'Madera Verde',    clienteProveedor:'Bosques del Norte S.A.',       precioM3Soles:380 },
  { id:'MAD-202', fecha:'2026-08-02', especie:'Eucalipto Grandis',tipoProducto:'Polines / Postes',    volumenM3:32.0, piezas:250, loteUbicación:'Patio Sur — Lote B',   tipoMovimiento:'Entrada', estado:'Seco al Aire',    clienteProveedor:'Forestal Eucalipto Corp',      precioM3Soles:290 },
  { id:'MAD-203', fecha:'2026-08-03', especie:'Teca',             tipoProducto:'Tablas Dimensionadas',volumenM3:18.2, piezas:420, loteUbicación:'Nave Secadero 1',       tipoMovimiento:'Salida',  estado:'Seco en Cámara',  clienteProveedor:'Muebles & Diseños S.A.',       precioM3Soles:850 },
  { id:'MAD-204', fecha:'2026-08-04', especie:'Roble',            tipoProducto:'Vigas de Estructura', volumenM3:24.8, piezas:85,  loteUbicación:'Patio Central — Lote C',tipoMovimiento:'Entrada', estado:'Madera Verde',    clienteProveedor:'Aserraderos del Sur',          precioM3Soles:520 },
  { id:'MAD-205', fecha:'2026-08-05', especie:'Pino Radiata',     tipoProducto:'Tablas Dimensionadas',volumenM3:35.0, piezas:780, loteUbicación:'Despacho Principal',   tipoMovimiento:'Salida',  estado:'Seco en Cámara',  clienteProveedor:'Distribuidora Maderera Global',precioM3Soles:420 },
  { id:'MAD-206', fecha:'2026-08-06', especie:'Cedro',            tipoProducto:'Tablas Dimensionadas',volumenM3:12.5, piezas:310, loteUbicación:'Patio Norte — Lote B', tipoMovimiento:'Entrada', estado:'Seco al Aire',    clienteProveedor:'Maderas Andinas EIRL',         precioM3Soles:680 },
];

// ── INVENTARIO GENERAL ─────────────────────────────────────────────────────────
export const INITIAL_INVENTARIO_DATA = [
  { id:'INV-301', sku:'REP-FIL-001', descripcion:'Filtro de Aceite CAT 320',          categoria:'Repuestos y Filtros',  stockActual:18, stockMinimo:5,  stockMaximo:30, unidad:'Unidades',  precioUnitSoles:128.5,  ubicacion:'Estante A-02', estado:'Óptimo' },
  { id:'INV-302', sku:'REP-FIL-002', descripcion:'Filtro de Combustible Diesel',      categoria:'Repuestos y Filtros',  stockActual:3,  stockMinimo:8,  stockMaximo:25, unidad:'Unidades',  precioUnitSoles:155.0,  ubicacion:'Estante A-03', estado:'Reorden Necesario' },
  { id:'INV-303', sku:'LUB-ACE-1540',descripcion:'Aceite Motor 15W40 (Tambor 55 Gal)',categoria:'Lubricantes y Grasas', stockActual:4,  stockMinimo:2,  stockMaximo:10, unidad:'Tambores',  precioUnitSoles:2130.0, ubicacion:'Bodega Aceites',estado:'Óptimo' },
  { id:'INV-304', sku:'EPP-CAS-YEL', descripcion:'Casco de Seguridad Amarillo MSA',   categoria:'EPP y Seguridad',      stockActual:25, stockMinimo:10, stockMaximo:50, unidad:'Unidades',  precioUnitSoles:66.0,   ubicacion:'Estante C-01', estado:'Óptimo' },
  { id:'INV-305', sku:'HER-LLAV-SET',descripcion:'Juego de Llaves Combinadas Métrica',categoria:'Herramientas',         stockActual:2,  stockMinimo:4,  stockMaximo:12, unidad:'Juegos',    precioUnitSoles:531.5,  ubicacion:'Caja Taller',  estado:'Reorden Necesario' },
  { id:'INV-306', sku:'NEU-315-80R', descripcion:'Neumático 315/80 R22.5 Camión',     categoria:'Neumáticos',           stockActual:8,  stockMinimo:4,  stockMaximo:16, unidad:'Unidades',  precioUnitSoles:1540.0, ubicacion:'Bodega Neumát.',estado:'Óptimo' },
];

// Movimientos de inventario (entradas y salidas recientes)
export const INITIAL_INVENTARIO_MOVIMIENTOS = [
  { id:'MOV-01', fecha:'2026-08-01', sku:'REP-FIL-001', descripcion:'Filtro de Aceite CAT 320',          tipo:'Salida',  cantidad:2,  motivoArea:'Mantenimiento Excavadora' },
  { id:'MOV-02', fecha:'2026-08-02', sku:'LUB-ACE-1540',descripcion:'Aceite Motor 15W40',                tipo:'Entrada', cantidad:2,  motivoArea:'Reposición de Stock' },
  { id:'MOV-03', fecha:'2026-08-03', sku:'HER-LLAV-SET',descripcion:'Juego de Llaves',                   tipo:'Salida',  cantidad:1,  motivoArea:'Préstamo Taller Mecánico' },
  { id:'MOV-04', fecha:'2026-08-04', sku:'EPP-CAS-YEL', descripcion:'Cascos de Seguridad',               tipo:'Entrada', cantidad:10, motivoArea:'Compra Mensual EPP' },
  { id:'MOV-05', fecha:'2026-08-05', sku:'REP-FIL-002', descripcion:'Filtro Combustible Diesel',         tipo:'Salida',  cantidad:3,  motivoArea:'Cambio Programado Flota' },
  { id:'MOV-06', fecha:'2026-08-06', sku:'NEU-315-80R', descripcion:'Neumático 315/80 Camión',           tipo:'Salida',  cantidad:2,  motivoArea:'Cambio Camión Volvo FMX' },
  { id:'MOV-07', fecha:'2026-08-07', sku:'REP-FIL-001', descripcion:'Filtro de Aceite CAT 320',          tipo:'Entrada', cantidad:12, motivoArea:'Reposición de Stock' },
];
