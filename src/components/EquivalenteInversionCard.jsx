import React from 'react';

/**
 * Equivalente en Inversión Publicitaria
 *
 * Muestra el valor equivalente de los resultados orgánicos calculando:
 * - CPL (Costo por lead): $3.50 USD × Diagnósticos
 * - CPA (Costo por agendado): $30 USD × Agendados
 * - CAC (Costo por cierre): $80 USD × Cierres (Activate + Catalizador)
 *
 * Gran Total = CPL + CPA + CAC
 */
export default function EquivalenteInversionCard({
  diagnosticos = 0,
  agendados = 0,
  cierres = 0,
  style = {}
}) {
  const cplUnit = 3.50;
  const cpaUnit = 30;
  const cacUnit = 80;

  const numDiag = Number(diagnosticos || 0);
  const numAgend = Number(agendados || 0);
  const numCierres = Number(cierres || 0);

  const cplTotal = Math.round(numDiag * cplUnit);
  const cpaTotal = Math.round(numAgend * cpaUnit);
  const cacTotal = Math.round(numCierres * cacUnit);

  const grandTotal = cplTotal + cpaTotal + cacTotal;

  return (
    <div
      className="glass-panel"
      style={{
        background: 'linear-gradient(145deg, #dcfce7 0%, #d1fae5 45%, #bbf7d0 100%)',
        border: '1.5px solid #86efac',
        borderRadius: '14px',
        padding: '16px 20px',
        boxShadow: '0 4px 14px rgba(5, 150, 105, 0.08)',
        ...style
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(190px, 1.1fr) repeat(3, minmax(130px, 1fr))',
          gap: '14px',
          alignItems: 'center'
        }}
      >
        {/* LADO IZQUIERDO: TOTAL EQUIVALENTE & CANAL */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 900,
              color: '#15803d',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '2px'
            }}
          >
            EQUIVALENTE EN INVERSIÓN PUBLICITARIA
          </span>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: '#16a34a',
              lineHeight: 1.05,
              margin: '3px 0'
            }}
          >
            ${grandTotal.toLocaleString()}
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 900,
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#16a34a'
              }}
            />
            LinkedIn
          </div>
        </div>

        {/* COLUMNA 1: CPL */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
            CPL · Costo por lead
          </span>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a', lineHeight: 1.1 }}>
            $3.50
          </div>
          <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600, marginTop: '3px' }}>
            {numDiag.toLocaleString()} leads · ${cplTotal.toLocaleString()}
          </span>
        </div>

        {/* COLUMNA 2: CPA */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
            CPA · Costo por agendado
          </span>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#dc2626', lineHeight: 1.1 }}>
            $30
          </div>
          <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600, marginTop: '3px' }}>
            {numAgend.toLocaleString()} agendas · ${cpaTotal.toLocaleString()}
          </span>
        </div>

        {/* COLUMNA 3: CAC (Activate + Catalizador) */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
            CAC · Costo por cierre
          </span>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#7c3aed', lineHeight: 1.1 }}>
            $80
          </div>
          <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600, marginTop: '3px' }}>
            {numCierres.toLocaleString()} cierres · ${cacTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* PIE DE TARJETA: TEXTO EXPLICATIVO */}
      <div
        style={{
          borderTop: '1px solid rgba(22, 163, 74, 0.25)',
          marginTop: '12px',
          paddingTop: '8px',
          fontSize: '11px',
          color: '#166534',
          fontWeight: 600,
          lineHeight: 1.45
        }}
      >
        Costo estimado en anuncios pagados, a tarifas de referencia de la plataforma. Resultados orgánicos que además contribuyen al posicionamiento y la confianza de marca.
      </div>
    </div>
  );
}
