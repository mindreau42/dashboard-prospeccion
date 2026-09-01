import React, { useState, useEffect } from 'react';
import {
  X, Users, UserPlus, Trash2, Edit2,
  Shield, Crown, Eye, EyeOff, Save, AlertCircle, Layers, PhoneCall, Target,
  Search, Check, CheckCircle2, Lock, HelpCircle, Info
} from 'lucide-react';
import { hashPassword, sanitizeInput } from '../utils/security';

export default function UserManagementModal({
  isOpen,
  onClose,
  users,
  onSaveUsers,
  availableGroups = ['Setters Oficiales', 'Setters Aspirantes']
}) {
  const [userList, setUserList] = useState(users || []);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [originalPassword, setOriginalPassword] = useState('');
  const [role, setRole] = useState('setter');
  const [group, setGroup] = useState('Setters Oficiales');
  const [customGroup, setCustomGroup] = useState('');
  const [isCustomGroup, setIsCustomGroup] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // Table Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');

  // Synchronize local user list when parent users array updates or modal opens
  useEffect(() => {
    if (users && Array.isArray(users)) {
      setUserList(users);
    }
  }, [users, isOpen]);

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePasswordVisibility = (id) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Password Security Rule Checker
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/.test(password);
  const hasLength = password.length >= 6;
  const hasNoSpaces = password.length > 0 && !/\s/.test(password);
  const isPasswordValid = hasUpper && hasLower && hasNumber && hasSpecial && hasLength && hasNoSpaces;

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setPassword('');
    setOriginalPassword('');
    setRole('setter');
    setGroup(availableGroups[0] || 'Grupo A');
    setCustomGroup('');
    setIsCustomGroup(false);
    setIsEditing(false);
    setEditId(null);
    setFormError('');
  };

  const handleStartEdit = (u) => {
    setIsEditing(true);
    setEditId(u.id);
    setFullName(u.fullName || '');
    setUsername((u.username || '').replace(/\s+/g, ''));
    setPassword((u.password || '').replace(/\s+/g, ''));
    setOriginalPassword((u.password || '').replace(/\s+/g, ''));
    setRole(u.role || 'setter');
    if (u.group && !availableGroups.includes(u.group)) {
      setIsCustomGroup(true);
      setCustomGroup(u.group);
    } else {
      setIsCustomGroup(false);
      setGroup(u.group || availableGroups[0] || 'Grupo A');
    }
    setFormError('');
  };

  const handleDeleteUser = (id) => {
    const target = userList.find(u => u.id === id);
    if (target?.username === 'admin') {
      alert('No se puede eliminar el usuario administrador principal.');
      return;
    }
    if (window.confirm(`¿Seguro que deseas eliminar al usuario "${target?.fullName || target?.username}"?`)) {
      const updated = userList.filter(u => u.id !== id);
      setUserList(updated);
      onSaveUsers(updated);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      setFormError('Por favor completa todos los campos requeridos.');
      return;
    }

    const isPasswordModified = Boolean(password.trim() && password !== originalPassword);

    // Enforce strict password validation for new users or when password is changed
    if (!isEditing || isPasswordModified) {
      if (!password.trim()) {
        setFormError('Debes ingresar una contraseña para el usuario.');
        return;
      }
      if (!hasLength) {
        setFormError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (!hasUpper) {
        setFormError('La contraseña debe incluir al menos una letra mayúscula (A-Z).');
        return;
      }
      if (!hasLower) {
        setFormError('La contraseña debe incluir al menos una letra minúscula (a-z).');
        return;
      }
      if (!hasNumber) {
        setFormError('La contraseña debe incluir al menos un número (0-9).');
        return;
      }
      if (!hasSpecial) {
        setFormError('La contraseña debe incluir al menos un carácter especial (@$!%*?&#_-).');
        return;
      }
      if (!hasNoSpaces) {
        setFormError('La contraseña no puede contener espacios en blanco.');
        return;
      }
    }

    const assignedGroup = role === 'setter' ? (isCustomGroup ? customGroup.trim() : group) : null;
    if (role === 'setter' && !assignedGroup) {
      setFormError('Debes asignar un grupo al Setter.');
      return;
    }

    const duplicate = userList.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.id !== editId);
    if (duplicate) {
      setFormError('El nombre de usuario ya está en uso. Elige uno diferente.');
      return;
    }

    const cleanFullName = sanitizeInput(fullName).trim();
    const cleanUsername = sanitizeInput(username).replace(/\s+/g, '');
    const cleanPass = password.replace(/\s+/g, '');

    let updatedList;
    if (isEditing) {
      updatedList = userList.map(u => {
        if (u.id === editId) {
          const passData = isPasswordModified
            ? { ...hashPassword(cleanPass), password: cleanPass }
            : { hash: u.hash, salt: u.salt, password: u.password };

          return {
            ...u,
            fullName: cleanFullName,
            username: cleanUsername,
            ...passData,
            role,
            group: assignedGroup,
            callerKey: u.callerKey || (role === 'caller' ? 'Caller 1' : null)
          };
        }
        return u;
      });
    } else {
      const { hash, salt } = hashPassword(cleanPass);
      const newUser = {
        id: 'usr_' + Date.now(),
        fullName: cleanFullName,
        username: cleanUsername,
        password: cleanPass,
        hash,
        salt,
        role,
        group: assignedGroup,
        callerKey: role === 'caller' ? 'Caller 1' : null,
        avatar: role === 'admin' ? '👑' : role === 'gerencia' ? '🏆' : role === 'caller' ? '📞' : '🎯',
        createdAt: new Date().toLocaleDateString('es-MX')
      };
      updatedList = [...userList, newUser];
    }

    setUserList(updatedList);
    onSaveUsers(updatedList);
    setSuccessMsg(`✓ Usuario "${cleanFullName || cleanUsername}" guardado con éxito. Ahora puedes acceder con Usuario: "${cleanUsername}" o Nombre: "${cleanFullName}".`);
    setTimeout(() => setSuccessMsg(''), 6000);
    resetForm();
  };

  // Filtered Users
  const filteredUsers = userList.filter(u => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (u.fullName || '').toLowerCase().includes(term) ||
      (u.username || '').toLowerCase().includes(term) ||
      (u.group || '').toLowerCase().includes(term);
    const matchesRole = filterRole === 'Todos' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (r) => {
    if (r === 'admin') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
          <Crown size={11} /> ADMIN
        </span>
      );
    } else if (r === 'gerencia') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', background: '#f5f3ff', color: '#5b21b6', border: '1px solid #c4b5fd' }}>
          🏆 GERENCIA
        </span>
      );
    } else if (r === 'caller') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
          <PhoneCall size={11} /> CALLER
        </span>
      );
    } else {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
          <Target size={11} /> SETTER
        </span>
      );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '880px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', color: '#2563eb' }}>
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>Gestión de Usuarios & Roles</h2>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Registro de cuentas, perfiles de acceso y seguridad
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Form Create / Edit */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '16px 18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: isEditing ? '#fef3c7' : '#eff6ff',
                  border: isEditing ? '1px solid #fde68a' : '1px solid #bfdbfe',
                  color: isEditing ? '#b45309' : '#1d4ed8',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}>
                  {isEditing ? 'MODO: EDITANDO' : 'MODO: CREACIÓN'}
                </span>
                <h4 style={{ fontSize: '13.5px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  {isEditing ? <Edit2 size={15} color="#d97706" /> : <UserPlus size={15} color="#2563eb" />}
                  {isEditing ? `Modificando usuario: "${fullName || username}"` : 'Formulario de Registro de Nuevo Usuario'}
                </h4>
              </div>
              {isEditing ? (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(37,99,235,0.2)'
                  }}
                >
                  <UserPlus size={12} /> + Crear Nuevo Usuario (Cancelar Edición)
                </button>
              ) : (
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  Completa los campos abajo y presiona "Guardar Nuevo Usuario"
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                
                {/* Nombre Completo */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. María Fernanda Gómez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%', background: '#ffffff', border: '1px solid #cbd5e1',
                      borderRadius: '6px', padding: '8px 10px', color: '#0f172a', fontSize: '12.5px', outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                    Nombre visible en reportes y métricas
                  </span>
                </div>

                {/* Usuario (Login) */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Usuario (Login) *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. setter_maria (sin espacios)"
                    value={username}
                    onKeyDown={(e) => { if (e.key === ' ' || e.code === 'Space') e.preventDefault(); }}
                    onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                    style={{
                      width: '100%', background: '#ffffff', border: '1px solid #cbd5e1',
                      borderRadius: '6px', padding: '8px 10px', color: '#0f172a', fontSize: '12.5px', outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                    Identificador único de acceso (sin espacios)
                  </span>
                </div>

                {/* Contraseña */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Contraseña *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. ClaveSegura@2026"
                    value={password}
                    onKeyDown={(e) => { if (e.key === ' ' || e.code === 'Space') e.preventDefault(); }}
                    onChange={(e) => setPassword(e.target.value.replace(/\s+/g, ''))}
                    style={{
                      width: '100%', background: '#ffffff',
                      border: `1.5px solid ${
                        isPasswordValid ? '#10b981' : password ? '#ef4444' : '#cbd5e1'
                      }`,
                      borderRadius: '6px', padding: '8px 10px', color: '#0f172a', fontSize: '12.5px', outline: 'none',
                      boxShadow: isPasswordValid ? '0 0 0 2px rgba(16,185,129,0.15)' : password ? '0 0 0 2px rgba(239,68,68,0.1)' : 'none'
                    }}
                  />

                  {/* Dynamic Requirements Checklist */}
                  <div style={{ marginTop: '8px', padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Requisitos de Seguridad Obligatorios:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: hasLength ? '#059669' : '#94a3b8', fontWeight: hasLength ? 700 : 500 }}>
                        {hasLength ? '✓' : '○'} Mínimo 6 caracteres
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: hasUpper ? '#059669' : '#94a3b8', fontWeight: hasUpper ? 700 : 500 }}>
                        {hasUpper ? '✓' : '○'} 1 Mayúscula (A-Z)
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: hasLower ? '#059669' : '#94a3b8', fontWeight: hasLower ? 700 : 500 }}>
                        {hasLower ? '✓' : '○'} 1 Minúscula (a-z)
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: hasNumber ? '#059669' : '#94a3b8', fontWeight: hasNumber ? 700 : 500 }}>
                        {hasNumber ? '✓' : '○'} 1 Número (0-9)
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: hasSpecial ? '#059669' : '#94a3b8', fontWeight: hasSpecial ? 700 : 500 }}>
                        {hasSpecial ? '✓' : '○'} 1 Especial (@$!%*?&#_-)
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: hasNoSpaces ? '#059669' : '#94a3b8', fontWeight: hasNoSpaces ? 700 : 500 }}>
                        {hasNoSpaces ? '✓' : '○'} Sin espacios
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rol */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Estructura de Rol *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: '100%', background: '#ffffff', border: '1px solid #cbd5e1',
                      borderRadius: '6px', padding: '8px 10px', color: '#0f172a', fontSize: '12.5px', outline: 'none', fontWeight: 700
                    }}
                  >
                    <option value="setter">Setter — Visualización exclusiva de su grupo</option>
                    <option value="caller">Caller — Exclusivo: Caller Scorecard</option>
                    <option value="gerencia">Gerencia — Sincronización + Visualización Total (sin gestión de usuarios)</option>
                    <option value="admin">Admin — Control total de todas las vistas y usuarios</option>
                  </select>
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                    Define las vistas y módulos permitidos
                  </span>
                </div>

                {/* Grupo (Solo para Setter) */}
                {role === 'setter' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Grupo Asignado (Setter) *
                    </label>
                    {!isCustomGroup ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select
                          value={group}
                          onChange={(e) => setGroup(e.target.value)}
                          style={{
                            flex: 1, background: '#ffffff', border: '1px solid #a7f3d0',
                            borderRadius: '6px', padding: '8px 10px', color: '#059669', fontSize: '12.5px', fontWeight: 700, outline: 'none'
                          }}
                        >
                          {availableGroups.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsCustomGroup(true)}
                          style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', borderRadius: '6px', padding: '0 8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          + Nuevo
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input
                          type="text"
                          placeholder="Nombre grupo"
                          value={customGroup}
                          onChange={(e) => setCustomGroup(e.target.value)}
                          style={{
                            flex: 1, background: '#ffffff', border: '1px solid #a7f3d0',
                            borderRadius: '6px', padding: '8px 10px', color: '#059669', fontSize: '12.5px', outline: 'none'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => { setIsCustomGroup(false); setCustomGroup(''); }}
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '6px', padding: '0 8px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Lista
                        </button>
                      </div>
                    )}
                    <span style={{ fontSize: '10.5px', color: '#059669', marginTop: '2px', display: 'block' }}>
                      Aislará los datos exclusivamente para este grupo
                    </span>
                  </div>
                )}

              </div>

              {formError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
                  <AlertCircle size={14} /> {formError}
                </div>
              )}

              {successMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
                  <CheckCircle2 size={15} color="#059669" /> {successMsg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{ padding: '7px 16px', fontSize: '12.5px' }}
                >
                  <Save size={13} /> {isEditing ? 'Guardar Cambios' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>

          {/* Table Header & Quick Search Filter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Layers size={14} color="#2563eb" /> Usuarios Registrados ({filteredUsers.length} de {userList.length})
              </h4>

              {/* Search & Filter Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: '#eff6ff',
                    border: '1.5px solid #93c5fd',
                    color: '#1d4ed8',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Crear un usuario nuevo"
                >
                  <UserPlus size={13} /> + Registrar Nuevo Usuario
                </button>

                <div className="search-input-futuristic" style={{ width: '180px', padding: '5px 10px' }}>
                  <Search size={13} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ fontSize: '12px' }}
                  />
                </div>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '5px 8px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#0f172a',
                    outline: 'none'
                  }}
                >
                  <option value="Todos">Todos los roles</option>
                  <option value="admin">Admin</option>
                  <option value="setter">Setters</option>
                  <option value="caller">Callers</option>
                </select>
              </div>
            </div>

            <div className="table-responsive" style={{ maxHeight: '240px', overflowY: 'auto' }}>
              <table className="prospecting-table">
                <thead>
                  <tr>
                    <th>Nombre Completo</th>
                    <th>Usuario</th>
                    <th>Contraseña</th>
                    <th>Rol</th>
                    <th>Asignación / Alcance</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isVisible = showPasswordMap[u.id];
                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>{u.fullName || '—'}</td>
                        <td style={{ color: '#2563eb', fontWeight: 700 }}>{u.username}</td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '12px' }}>
                              {isVisible ? u.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(u.id)}
                              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: '2px' }}
                            >
                              {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        </td>
                        <td>
                          {getRoleBadge(u.role)}
                        </td>
                        <td>
                          {u.role === 'setter' ? (
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669' }}>
                              5 Vistas · {u.group || 'Sin grupo'}
                            </span>
                          ) : u.role === 'caller' ? (
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#7c3aed' }}>
                              Exclusivo: 6. Caller Scorecard
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 800 }}>
                              Control Total (Todas las vistas)
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => handleStartEdit(u)}
                              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}
                            >
                              <Edit2 size={11} /> Editar
                            </button>
                            {u.username !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '3px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        No se encontraron usuarios con el filtro seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>

      </div>
    </div>
  );
}
