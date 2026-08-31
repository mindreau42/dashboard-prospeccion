import React from 'react';
import ReactDOM from 'react-dom/client';
import './chartSetup.js';  // Registro global de Chart.js
import App from './App.jsx';
import './index.css';

// â”€â”€ Auto-Recovery: clear stale session on first crash then reload cleanly â”€â”€
const CRASH_FLAG = '__app_crash_v1__';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, autoRecovering: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Dashboard] Error atrapado:', error, errorInfo);
    try {
      const alreadyTried = sessionStorage.getItem(CRASH_FLAG);
      if (!alreadyTried) {
        sessionStorage.setItem(CRASH_FLAG, '1');
        // Solo eliminar sesiÃ³n activa, preservar datos de grupos y usuarios
        localStorage.removeItem('prd_session_v13');
        sessionStorage.removeItem('prd_session_v13');
        setTimeout(() => {
          window.location.href = window.location.origin + window.location.pathname;
        }, 600);
        this.setState({ autoRecovering: true });
      }
    } catch (_) {}
  }

  render() {
    if (this.state.autoRecovering) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#f8fafc',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>ðŸ”„</div>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 700 }}>
              Aplicando actualizaciones, cargando...
            </p>
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#f8fafc',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", padding: '24px'
        }}>
          <div style={{
            maxWidth: '480px', width: '100%', background: '#ffffff',
            border: '1px solid #e2e8f0', borderRadius: '14px',
            padding: '28px 24px', textAlign: 'center',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '12px',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', margin: '0 auto 16px'
            }}>âš¡</div>
            <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
              Restaurar Dashboard
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 12px' }}>
              Conflicto con datos guardados. Usa el botÃ³n azul para limpiar el cachÃ© y entrar de nuevo.
            </p>
            {this.state.error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '8px', padding: '8px 12px', fontSize: '11px',
                color: '#dc2626', fontFamily: 'monospace', marginBottom: '14px',
                textAlign: 'left', overflowX: 'auto'
              }}>
                {this.state.error.toString()}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  try { localStorage.clear(); sessionStorage.clear(); } catch (_) {}
                  window.location.href = window.location.origin + window.location.pathname;
                }}
                style={{
                  background: '#2563eb', color: '#ffffff', border: 'none',
                  borderRadius: '8px', padding: '11px 16px',
                  fontSize: '13px', fontWeight: 800, cursor: 'pointer'
                }}
              >
                âš¡ Limpiar CachÃ© y Reingresar
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#f8fafc', color: '#64748b',
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                ðŸ”„ Recargar Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

