import React, { useState, useEffect } from 'react';
import { X, Globe, Wifi, Monitor, Copy, Check, ExternalLink, ShieldCheck, RefreshCw, Send, Zap } from 'lucide-react';

export default function ShareConnectionModal({ isOpen, onClose }) {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchNetworkInfo = () => {
    setIsLoading(true);
    fetch('/api/network-info')
      .then(res => {
        if (!res.ok) throw new Error('Not available');
        return res.json();
      })
      .then(data => {
        setNetworkInfo(data);
        setIsLoading(false);
      })
      .catch(() => {
        setNetworkInfo({
          isLocalServer: true,
          localUrl: window.location.origin,
          lanUrl: null,
          cloudflareUrl: null,
          primaryPublicUrl: window.location.origin,
          tunnelStatus: 'connecting'
        });
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchNetworkInfo();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text, key) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
      }).catch(() => {
        fallbackCopy(text, key);
      });
    } else {
      fallbackCopy(text, key);
    }
  };

  const fallbackCopy = (text, key) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const publicUrl = networkInfo?.primaryPublicUrl || networkInfo?.cloudflareUrl || networkInfo?.ngrokUrl;
  const lanUrl = networkInfo?.lanUrl;
  const localUrl = networkInfo?.localUrl || 'http://localhost:5185';

  const shareViaWhatsApp = (url) => {
    const text = encodeURIComponent(`Hola! Aquí tienes el acceso al Dashboard de Gestión y Prospección Comercial:\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.35)'
            }}>
              <Globe size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Compartir Acceso al Dashboard
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Conexión segura tanto para usuarios locales como vía internet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Cerrar ventana"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* OPCIÓN 1: Enlace Público Seguro (Cloudflare Tunnel - ILIMITADO) */}
          <div style={{
            border: '1.5px solid #0284c7',
            background: 'linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  padding: '6px',
                  borderRadius: '8px',
                  background: '#0284c7',
                  color: '#ffffff',
                  display: 'flex'
                }}>
                  <Globe size={16} />
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0369a1' }}>
                    1. Enlace Remoto / Fuera de la Oficina (Internet)
                  </span>
                  <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
                    Para directores, callers y setters trabajando desde cualquier parte del mundo
                  </div>
                </div>
              </div>
              <span style={{
                background: '#16a34a',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Zap size={10} />
                TÚNEL ILIMITADO
              </span>
            </div>

            {/* Input URL */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <input
                type="text"
                readOnly
                value={isLoading ? 'Iniciando túnel seguro Cloudflare...' : (publicUrl || 'Conectando túnel seguro...')}
                style={{
                  flex: 1,
                  background: '#ffffff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#0f172a',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />
              <button
                type="button"
                onClick={() => copyToClipboard(publicUrl, 'public')}
                disabled={!publicUrl || isLoading}
                style={{
                  background: copiedKey === 'public' ? '#16a34a' : '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 14px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: !publicUrl || isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                {copiedKey === 'public' ? <Check size={14} /> : <Copy size={14} />}
                {copiedKey === 'public' ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>

            {/* Acciones Rápidas */}
            {publicUrl && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => shareViaWhatsApp(publicUrl)}
                  style={{
                    flex: 1,
                    background: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={13} /> Enviar por WhatsApp
                </button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#ffffff',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Probar Enlace <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          {/* OPCIÓN 2: Red Local Wi-Fi (Oficina) */}
          <div style={{
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{
                padding: '5px',
                borderRadius: '6px',
                background: '#64748b',
                color: '#ffffff',
                display: 'flex'
              }}>
                <Wifi size={15} />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  2. Enlace en Misma Red Local (Wi-Fi de la Oficina)
                </span>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Máxima velocidad para celulares y PCs en la misma red (0 consumo de datos de internet)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input
                type="text"
                readOnly
                value={lanUrl || (isLoading ? 'Detectando IP local...' : `${localUrl} (Red no detectada)`)}
                style={{
                  flex: 1,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />
              <button
                type="button"
                onClick={() => copyToClipboard(lanUrl || localUrl, 'lan')}
                style={{
                  background: copiedKey === 'lan' ? '#16a34a' : '#475569',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap'
                }}
              >
                {copiedKey === 'lan' ? <Check size={13} /> : <Copy size={13} />}
                {copiedKey === 'lan' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* OPCIÓN 3: Esta PC (Localhost) */}
          <div style={{
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Monitor size={15} style={{ color: '#64748b' }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  3. Acceso en esta PC (Servidor Local)
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                  {localUrl}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(localUrl, 'local')}
              style={{
                background: copiedKey === 'local' ? '#16a34a' : '#f1f5f9',
                color: copiedKey === 'local' ? '#ffffff' : '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {copiedKey === 'local' ? <Check size={12} /> : <Copy size={12} />}
              {copiedKey === 'local' ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          {/* Banner de Seguridad & Estado */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#64748b'
          }}>
            <ShieldCheck size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
            <span>
              <strong>Seguridad Blindada:</strong> Conexión cifrada TLS, firewall de solicitudes y rate-limiting anti fuerza bruta.
            </span>
          </div>

        </div>

        {/* Pie de modal */}
        <div style={{
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            type="button"
            onClick={fetchNetworkInfo}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} className={isLoading ? 'spin-icon' : ''} />
            {isLoading ? 'Verificando red...' : 'Actualizar Estado'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 18px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Listo / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
