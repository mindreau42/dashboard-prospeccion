import React, { useState, useEffect } from 'react';
import { X, User, Crown, Target, PhoneCall, Sparkles, Upload, Check, BadgeCheck } from 'lucide-react';

const PRESET_AVATARS = [
  { id: 'av_1', icon: '👤', label: 'Ejecutivo' },
  { id: 'av_2', icon: '👑', label: 'Líder' },
  { id: 'av_3', icon: '🎯', label: 'Setter' },
  { id: 'av_4', icon: '📞', label: 'Caller' },
  { id: 'av_5', icon: '🚀', label: 'Innovación' },
  { id: 'av_6', icon: '⚡', label: 'Eficiencia' },
  { id: 'av_7', icon: '💼', label: 'Comercial' },
  { id: 'av_8', icon: '🛡️', label: 'Auditor' },
  { id: 'av_9', icon: '💎', label: 'Premium' },
  { id: 'av_10', icon: '🦁', label: 'Estrategia' },
  { id: 'av_11', icon: '🦅', label: 'Visión' },
  { id: 'av_12', icon: '🌐', label: 'Global' }
];

export default function UserProfileModal({
  isOpen,
  onClose,
  userSession,
  onUpdateAvatar
}) {
  const [selectedAvatar, setSelectedAvatar] = useState(userSession?.avatar || '👤');
  const [fullNameInput, setFullNameInput] = useState(userSession?.fullName || '');
  const [isSaved, setIsSaved] = useState(false);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setFullNameInput(userSession?.fullName || '');
      setSelectedAvatar(userSession?.avatar || '👤');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, userSession]);

  if (!isOpen) return null;

  const role = userSession?.role || 'setter';

  const handleSelectPreset = (av) => {
    setSelectedAvatar(av.icon);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar los 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgUrl = event.target.result;
        setSelectedAvatar(imgUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdateAvatar(selectedAvatar, fullNameInput.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const isImageAvatar = selectedAvatar && selectedAvatar.startsWith('data:image');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#eff6ff',
              padding: '8px',
              borderRadius: '8px',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center'
            }}>
              <User size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>Perfil de Usuario</h2>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Ficha de cuenta e identidad visual corporativa
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* User Info Overview Card */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Logo Preview */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '14px',
              background: '#ffffff',
              border: '2px solid #bfdbfe',
              boxShadow: '0 2px 6px rgba(37,99,235,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {isImageAvatar ? (
                <img src={selectedAvatar} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{selectedAvatar}</span>
              )}
            </div>

            {/* Structured Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Nombre Completo:
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '2px 8px', borderRadius: '10px',
                  background: role === 'admin' ? '#eff6ff' : role === 'caller' ? '#f5f3ff' : '#ecfdf5',
                  border: `1px solid ${role === 'admin' ? '#bfdbfe' : role === 'caller' ? '#ddd6fe' : '#a7f3d0'}`,
                  color: role === 'admin' ? '#1d4ed8' : role === 'caller' ? '#6d28d9' : '#047857',
                  fontSize: '11px', fontWeight: 800, marginLeft: 'auto'
                }}>
                  {role === 'admin' ? <Crown size={11} /> : role === 'caller' ? <PhoneCall size={11} /> : <Target size={11} />}
                  {role.toUpperCase()}
                </span>
              </div>

              {/* Editable Name Field */}
              <input
                type="text"
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                placeholder="Nombre completo del usuario"
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  color: '#0f172a',
                  outline: 'none',
                  marginBottom: '4px'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b' }}>
                <span>Usuario: <strong style={{ color: '#0f172a' }}>@{userSession?.username}</strong></span>
                {userSession?.group && (
                  <span style={{ color: '#059669', fontWeight: 700 }}>● {userSession.group}</span>
                )}
              </div>
            </div>
          </div>

          {/* Insignia / Logo Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Personalización de Identidad Visual
            </label>

            {/* Presets Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px',
              marginBottom: '14px'
            }}>
              {PRESET_AVATARS.map(av => {
                const isSelected = selectedAvatar === av.icon;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => handleSelectPreset(av)}
                    style={{
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      border: `2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                      borderRadius: '10px',
                      padding: '10px 4px',
                      fontSize: '22px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                    title={av.label}
                  >
                    <span>{av.icon}</span>
                    <span style={{ fontSize: '9.5px', color: isSelected ? '#2563eb' : '#64748b', fontWeight: 700 }}>
                      {av.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Image Upload */}
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} color="#2563eb" />
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                  Cargar logotipo de empresa o foto (PNG, JPG máx 2MB)
                </span>
              </div>

              <label style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#0f172a',
                cursor: 'pointer'
              }}>
                Examinar archivo
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn-cyber-primary"
            onClick={handleSave}
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            {isSaved ? (
              <>
                <Check size={14} /> ¡Cambios Guardados!
              </>
            ) : (
              <>
                <Sparkles size={14} /> Guardar Cambios
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
