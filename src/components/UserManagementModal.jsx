import React, { useState, useEffect } from 'react';
import {
  X, Users, UserPlus, Trash2, Edit2,
  Shield, Crown, Eye, EyeOff, Save, AlertCircle, Layers, PhoneCall, Target,
  Search, Check, CheckCircle2, Lock, HelpCircle, Info, Key
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

  // Quick Change Password Modal State
  const [pwdModalUser, setPwdModalUser] = useState(null);
  const [newPwdValue, setNewPwdValue] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdModalError, setPwdModalError] = useState('');
  const [pwdModalSuccess, setPwdModalSuccess] = useState('');

  // Table Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');

  // Dedicated Edit User Modal State
  const [editModalUser, setEditModalUser] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editRole, setEditRole] = useState('setter');
  const [editGroup, setEditGroup] = useState('Setters Oficiales');
  const [editCustomGroup, setEditCustomGroup] = useState('');
  const [editIsCustomGroup, setEditIsCustomGroup] = useState(false);
  const [editModalError, setEditModalError] = useState('');
  const [editModalSuccess, setEditModalSuccess] = useState('');

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

  // Quick Change Password Modal Helpers
  const handleOpenChangePassword = (user) => {
    setPwdModalUser(user);
    setNewPwdValue('');
    setShowNewPwd(false);
    setPwdModalError('');
    setPwdModalSuccess('');
  };

  const handleCloseChangePassword = () => {
    setPwdModalUser(null);
    setNewPwdValue('');
    setShowNewPwd(false);
    setPwdModalError('');
    setPwdModalSuccess('');
  };

  const newPwdHasUpper = /[A-Z]/.test(newPwdValue);
  const newPwdHasLower = /[a-z]/.test(newPwdValue);
  const newPwdHasNumber = /[0-9]/.test(newPwdValue);
  const newPwdHasSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/.test(newPwdValue);
  const newPwdHasLength = newPwdValue.length >= 6;
  const newPwdHasNoSpaces = newPwdValue.length > 0 && !/\s/.test(newPwdValue);
  const isNewPwdValid = newPwdHasUpper && newPwdHasLower && newPwdHasNumber && newPwdHasSpecial && newPwdHasLength && newPwdHasNoSpaces;

  const handleSaveNewPassword = (e) => {
    if (e) e.preventDefault();
    if (!pwdModalUser) return;

    if (!newPwdValue.trim()) {
      setPwdModalError('Por favor ingresa la nueva contraseña.');
      return;
    }
    if (!newPwdHasLength) {
      setPwdModalError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!newPwdHasUpper) {
      setPwdModalError('Debe incluir al menos una letra mayúscula (A-Z).');
      return;
    }
    if (!newPwdHasLower) {
      setPwdModalError('Debe incluir al menos una letra minúscula (a-z).');
      return;
    }
    if (!newPwdHasNumber) {
      setPwdModalError('Debe incluir al menos un número (0-9).');
      return;
    }
    if (!newPwdHasSpecial) {
      setPwdModalError('Debe incluir al menos un carácter especial (@$!%*?&#_-).');
      return;
    }
    if (!newPwdHasNoSpaces) {
      setPwdModalError('No puede contener espacios en blanco.');
      return;
    }

    const cleanPass = newPwdValue.replace(/\s+/g, '');
    const { hash, salt } = hashPassword(cleanPass);

    const updatedList = userList.map(u => {
      if (u.id === pwdModalUser.id) {
        return {
          ...u,
          password: cleanPass,
          hash,
          salt
        };
      }
      return u;
    });

    setUserList(updatedList);
    onSaveUsers(updatedList);
    setPwdModalSuccess(`✓ Contraseña actualizada correctamente para "${pwdModalUser.fullName || pwdModalUser.username}".`);
    setTimeout(() => {
      handleCloseChangePassword();
    }, 1400);
  };

  // Edit User Modal Helpers
  const editPwdHasUpper = /[A-Z]/.test(editPassword);
  const editPwdHasLower = /[a-z]/.test(editPassword);
  const editPwdHasNumber = /[0-9]/.test(editPassword);
  const editPwdHasSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/.test(editPassword);
  const editPwdHasLength = editPassword.length >= 6;
  const editPwdHasNoSpaces = editPassword.length > 0 && !/\s/.test(editPassword);
  const isEditPwdValid = !editPassword || (editPwdHasUpper && editPwdHasLower && editPwdHasNumber && editPwdHasSpecial && editPwdHasLength && editPwdHasNoSpaces);

  const handleOpenEditModal = (u) => {
    setEditModalUser(u);
    setEditFullName(u.fullName || '');
    setEditUsername((u.username || '').replace(/\s+/g, ''));
    setEditPassword('');
    setShowEditPassword(false);
    setEditRole(u.role || 'setter');
    if (u.group && !availableGroups.includes(u.group)) {
      setEditIsCustomGroup(true);
      setEditCustomGroup(u.group);
    } else {
      setEditIsCustomGroup(false);
      setEditGroup(u.group || availableGroups[0] || 'Setters Oficiales');
    }
    setEditModalError('');
    setEditModalSuccess('');
  };

  const handleCloseEditModal = () => {
    setEditModalUser(null);
    setEditFullName('');
    setEditUsername('');
    setEditPassword('');
    setShowEditPassword(false);
    setEditModalError('');
    setEditModalSuccess('');
  };

  const handleSaveEditModal = (e) => {
    if (e) e.preventDefault();
    if (!editModalUser) return;

    if (!editFullName.trim() || !editUsername.trim()) {
      setEditModalError('Por favor completa todos los campos requeridos (Nombre y Usuario).');
      return;
    }

    const cleanFullName = sanitizeInput(editFullName).trim();
    const cleanUsername = sanitizeInput(editUsername).replace(/\s+/g, '');
    const isPassModified = Boolean(editPassword.trim().length > 0);

    if (isPassModified) {
      if (!editPwdHasLength) { setEditModalError('La contraseña debe tener al menos 6 caracteres.'); return; }
      if (!editPwdHasUpper) { setEditModalError('La contraseña debe incluir al menos una letra mayúscula (A-Z).'); return; }
      if (!editPwdHasLower) { setEditModalError('La contraseña debe incluir al menos una letra minúscula (a-z).'); return; }
      if (!editPwdHasNumber) { setEditModalError('La contraseña debe incluir al menos un número (0-9).'); return; }
      if (!editPwdHasSpecial) { setEditModalError('La contraseña debe incluir al menos un carácter especial (@$!%*?&#_-).'); return; }
      if (!editPwdHasNoSpaces) { setEditModalError('La contraseña no puede contener espacios en blanco.'); return; }
    }

    // Check duplicate username
    const duplicate = userList.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase() && u.id !== editModalUser.id);
    if (duplicate) {
      setEditModalError('El nombre de usuario ya está en uso. Elige uno diferente.');
      return;
    }

    const assignedGroup = editRole === 'setter' ? (editIsCustomGroup ? editCustomGroup.trim() : editGroup) : null;
    if (editRole === 'setter' && !assignedGroup) {
      setEditModalError('Debes asignar un grupo al Setter.');
      return;
    }

    const updatedList = userList.map(u => {
      if (u.id === editModalUser.id) {
        const passData = isPassModified
          ? hashPassword(editPassword.replace(/\s+/g, ''))
          : { hash: u.hash, salt: u.salt };
        return {
          ...u,
          fullName: cleanFullName,
          username: cleanUsername,
          password: isPassModified ? editPassword.replace(/\s+/g, '') : u.password,
          ...passData,
          role: u.username === 'admin' ? 'admin' : editRole, // Admin stays admin
          group: assignedGroup,
          callerKey: u.callerKey || (editRole === 'caller' ? 'Caller 1' : null)
        };
      }
      return u;
    });

    setUserList(updatedList);
    onSaveUsers(updatedList);
    setEditModalSuccess(`✓ Usuario "${cleanFullName || cleanUsername}" guardado con éxito.`);
    setTimeout(() => {
      handleCloseEditModal();
    }, 1100);
  };

  const handleStartEdit = (u) => {
    setIsEditing(true);
    setEditId(u.id);
    setFullName(u.fullName || '');
    setUsername((u.username || '').replace(/\s+/g, ''));
    setPassword('');
    setOriginalPassword('');
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

    const isPasswordModified = Boolean(password.trim().length > 0);

    // Enforce strict password validation for new users or when password is changed
    if (!isEditing || isPasswordModified) {
      if (!isEditing && !password.trim()) {
        setFormError('Debes ingresar una contraseña para el usuario.');
        return;
      }
      if (isPasswordModified) {
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
            ? hashPassword(cleanPass)
            : { hash: u.hash, salt: u.salt };

          return {
            ...u,
            fullName: cleanFullName,
            username: cleanUsername,
            password: isPasswordModified ? cleanPass : u.password,
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
                    Contraseña {isEditing ? '(Opcional — Dejar vacía para conservar actual)' : '*'}
                  </label>
                  <input
                    type="text"
                    placeholder={isEditing ? "•••••••• (conservar contraseña actual)" : "Ej. ClaveSegura@2026"}
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

            <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto', overflowX: 'auto', width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff' }}>
              <table className="prospecting-table" style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ textAlign: 'left', padding: '10px 14px', width: '22%' }}>Nombre Completo</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', width: '15%' }}>Usuario</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', width: '18%' }}>Contraseña</th>
                    <th style={{ textAlign: 'center', padding: '10px 14px', width: '12%' }}>Rol</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', width: '18%' }}>Asignación / Alcance</th>
                    <th style={{ textAlign: 'right', padding: '10px 14px', width: '15%' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isMainAdmin = u.username === 'admin';
                    const isVisible = Boolean(showPasswordMap[u.id]);
                    return (
                      <tr key={u.id}>
                        <td style={{ textAlign: 'left', fontWeight: 800, color: '#0f172a', padding: '10px 14px' }}>
                          {u.fullName || '—'}
                        </td>
                        <td style={{ textAlign: 'left', color: '#2563eb', fontWeight: 700, padding: '10px 14px' }}>
                          @{u.username}
                        </td>
                        <td style={{ textAlign: 'left', padding: '10px 14px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontFamily: 'monospace', color: isVisible ? '#0f172a' : '#64748b', fontSize: '12px', fontWeight: isVisible ? 800 : 500, letterSpacing: isVisible ? '0.02em' : '0.12em' }}>
                              {isVisible ? (u.password || '••••••••') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(u.id)}
                              title={isVisible ? "Ocultar contraseña" : "Ver contraseña"}
                              style={{
                                background: isVisible ? '#eff6ff' : 'transparent',
                                border: isVisible ? '1px solid #bfdbfe' : 'none',
                                borderRadius: '4px',
                                color: isVisible ? '#2563eb' : '#94a3b8',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '3px 4px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                          {getRoleBadge(u.role)}
                        </td>
                        <td style={{ textAlign: 'left', padding: '10px 14px' }}>
                          {u.role === 'setter' ? (
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#059669' }}>
                              5 Vistas · {u.group || 'Sin grupo'}
                            </span>
                          ) : u.role === 'caller' ? (
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#7c3aed' }}>
                              Caller Scorecard
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 800 }}>
                              Control Total (Todas las vistas)
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 14px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(u)}
                              title="Editar datos del usuario (Nombre, login, rol, grupo)"
                              style={{
                                background: '#eff6ff',
                                border: '1.5px solid #93c5fd',
                                color: '#1d4ed8',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11.5px',
                                fontWeight: 800
                              }}
                            >
                              <Edit2 size={12} /> Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenChangePassword(u)}
                              title="Asignar una nueva contraseña a este usuario"
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                color: '#475569',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 700
                              }}
                            >
                              <Key size={12} /> Clave
                            </button>

                            {!isMainAdmin ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id)}
                                title="Eliminar este usuario permanentemente"
                                style={{
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  color: '#dc2626',
                                  borderRadius: '6px',
                                  padding: '4px 7px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '11px'
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            ) : (
                              <span
                                title="El usuario Administrador principal no puede ser eliminado"
                                style={{
                                  fontSize: '10px',
                                  color: '#64748b',
                                  fontWeight: 800,
                                  padding: '3px 6px',
                                  background: '#f1f5f9',
                                  borderRadius: '4px',
                                  border: '1px solid #e2e8f0'
                                }}
                              >
                                Principal
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
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

      {/* Sub-Modal: Cambiar Contraseña Rápido */}
      {pwdModalUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            padding: '16px'
          }}
          onClick={handleCloseChangePassword}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#ffffff',
              borderRadius: '14px',
              boxShadow: '0 20px 45px -10px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Encabezado Sub-modal */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  background: '#2563eb',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Key size={16} color="#ffffff" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                    Cambiar Contraseña
                  </h4>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Usuario: <strong style={{ color: '#60a5fa' }}>{pwdModalUser.username}</strong> ({pwdModalUser.fullName || 'Sin nombre'})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseChangePassword}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido Sub-modal */}
            <form onSubmit={handleSaveNewPassword} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Nueva Contraseña *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    placeholder="Escribe la nueva contraseña..."
                    value={newPwdValue}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === ' ' || e.code === 'Space') e.preventDefault(); }}
                    onChange={(e) => setNewPwdValue(e.target.value.replace(/\s+/g, ''))}
                    style={{
                      width: '100%',
                      padding: '9px 36px 9px 12px',
                      background: '#ffffff',
                      border: `1.5px solid ${isNewPwdValid ? '#10b981' : newPwdValue ? '#ef4444' : '#cbd5e1'}`,
                      borderRadius: '8px',
                      fontSize: '13px',
                      outline: 'none',
                      boxShadow: isNewPwdValid ? '0 0 0 2px rgba(16,185,129,0.15)' : 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex'
                    }}
                  >
                    {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Checklist requisitos */}
              <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Requisitos de Seguridad Obligatorios:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10.5px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: newPwdHasLength ? '#059669' : '#94a3b8', fontWeight: newPwdHasLength ? 700 : 500 }}>
                    {newPwdHasLength ? '✓' : '○'} Mínimo 6 caracteres
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: newPwdHasUpper ? '#059669' : '#94a3b8', fontWeight: newPwdHasUpper ? 700 : 500 }}>
                    {newPwdHasUpper ? '✓' : '○'} 1 Mayúscula (A-Z)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: newPwdHasLower ? '#059669' : '#94a3b8', fontWeight: newPwdHasLower ? 700 : 500 }}>
                    {newPwdHasLower ? '✓' : '○'} 1 Minúscula (a-z)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: newPwdHasNumber ? '#059669' : '#94a3b8', fontWeight: newPwdHasNumber ? 700 : 500 }}>
                    {newPwdHasNumber ? '✓' : '○'} 1 Número (0-9)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: newPwdHasSpecial ? '#059669' : '#94a3b8', fontWeight: newPwdHasSpecial ? 700 : 500 }}>
                    {newPwdHasSpecial ? '✓' : '○'} 1 Especial (@$!%*?&#_-)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: newPwdHasNoSpaces ? '#059669' : '#94a3b8', fontWeight: newPwdHasNoSpaces ? 700 : 500 }}>
                    {newPwdHasNoSpaces ? '✓' : '○'} Sin espacios
                  </span>
                </div>
              </div>

              {pwdModalError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '11.5px', fontWeight: 700, marginBottom: '12px' }}>
                  <AlertCircle size={14} /> {pwdModalError}
                </div>
              )}

              {pwdModalSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, marginBottom: '12px' }}>
                  <CheckCircle2 size={14} color="#059669" /> {pwdModalSuccess}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleCloseChangePassword}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isNewPwdValid}
                  style={{
                    background: isNewPwdValid ? '#2563eb' : '#94a3b8',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '7px 16px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#ffffff',
                    cursor: isNewPwdValid ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isNewPwdValid ? '0 2px 6px rgba(37,99,235,0.3)' : 'none'
                  }}
                >
                  <Save size={13} /> Guardar Nueva Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Modal: Editar Usuario Completo */}
      {editModalUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            padding: '16px'
          }}
          onClick={handleCloseEditModal}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#ffffff',
              borderRadius: '14px',
              boxShadow: '0 20px 45px -10px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease-out',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Encabezado Sub-modal */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: '#2563eb',
                  padding: '7px',
                  borderRadius: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Edit2 size={16} color="#ffffff" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                    Editar Usuario
                  </h4>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Modificando cuenta: <strong style={{ color: '#60a5fa' }}>@{editModalUser.username}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEditModal}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido Formulario */}
            <form onSubmit={handleSaveEditModal} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Nombre Completo */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Nombre y Apellido"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  style={{
                    width: '100%', background: '#ffffff', border: '1px solid #cbd5e1',
                    borderRadius: '6px', padding: '8px 10px', color: '#0f172a', fontSize: '12.5px', outline: 'none'
                  }}
                />
              </div>

              {/* Usuario (Login) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Usuario (Login) *
                </label>
                <input
                  type="text"
                  placeholder="usuario_login (sin espacios)"
                  value={editUsername}
                  onKeyDown={(e) => { if (e.key === ' ' || e.code === 'Space') e.preventDefault(); }}
                  onChange={(e) => setEditUsername(e.target.value.replace(/\s+/g, ''))}
                  style={{
                    width: '100%', background: '#ffffff', border: '1px solid #cbd5e1',
                    borderRadius: '6px', padding: '8px 10px', color: '#0f172a', fontSize: '12.5px', outline: 'none'
                  }}
                />
                <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                  Identificador para iniciar sesión (sin espacios)
                </span>
              </div>

              {/* Rol */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Estructura de Rol *
                </label>
                {editModalUser.username === 'admin' ? (
                  <div>
                    <input
                      type="text"
                      disabled
                      value="👑 Admin — Control total (Usuario Administrador Principal)"
                      style={{
                        width: '100%', background: '#f1f5f9', border: '1px solid #cbd5e1',
                        borderRadius: '6px', padding: '8px 10px', color: '#1e293b', fontSize: '12px', fontWeight: 700
                      }}
                    />
                    <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                      El rol del Administrador principal se mantiene fijo para evitar bloqueos del sistema.
                    </span>
                  </div>
                ) : (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    style={{
                      width: '100%', background: '#ffffff', border: '1px solid #cbd5e1',
                      borderRadius: '6px', padding: '8px 10px', color: '#0f172a', fontSize: '12.5px', outline: 'none', fontWeight: 700
                    }}
                  >
                    <option value="setter">Setter — Visualización exclusiva de su grupo</option>
                    <option value="caller">Caller — Exclusivo: Caller Scorecard</option>
                    <option value="gerencia">Gerencia — Sincronización + Visualización Total (sin gestión)</option>
                    <option value="admin">Admin — Control total de todas las vistas y usuarios</option>
                  </select>
                )}
              </div>

              {/* Grupo (Solo para Setter) */}
              {editRole === 'setter' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Grupo Asignado (Setter) *
                  </label>
                  {!editIsCustomGroup ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <select
                        value={editGroup}
                        onChange={(e) => setEditGroup(e.target.value)}
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
                        onClick={() => setEditIsCustomGroup(true)}
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
                        value={editCustomGroup}
                        onChange={(e) => setEditCustomGroup(e.target.value)}
                        style={{
                          flex: 1, background: '#ffffff', border: '1px solid #a7f3d0',
                          borderRadius: '6px', padding: '8px 10px', color: '#059669', fontSize: '12.5px', outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => { setEditIsCustomGroup(false); setEditCustomGroup(''); }}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '6px', padding: '0 8px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Lista
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Nueva Contraseña (Opcional) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Nueva Contraseña (Opcional)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Dejar vacía para conservar la contraseña actual"
                    value={editPassword}
                    onKeyDown={(e) => { if (e.key === ' ' || e.code === 'Space') e.preventDefault(); }}
                    onChange={(e) => setEditPassword(e.target.value.replace(/\s+/g, ''))}
                    style={{
                      width: '100%',
                      background: '#ffffff',
                      border: `1.5px solid ${isEditPwdValid ? '#cbd5e1' : '#ef4444'}`,
                      borderRadius: '6px',
                      padding: '8px 36px 8px 10px',
                      color: '#0f172a',
                      fontSize: '12.5px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex'
                    }}
                  >
                    {showEditPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {editPassword.length > 0 && (
                  <div style={{ marginTop: '6px', padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Requisitos de Seguridad:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', fontSize: '10.5px' }}>
                      <span style={{ color: editPwdHasLength ? '#059669' : '#94a3b8', fontWeight: editPwdHasLength ? 700 : 500 }}>
                        {editPwdHasLength ? '✓' : '○'} Mínimo 6 caracteres
                      </span>
                      <span style={{ color: editPwdHasUpper ? '#059669' : '#94a3b8', fontWeight: editPwdHasUpper ? 700 : 500 }}>
                        {editPwdHasUpper ? '✓' : '○'} 1 Mayúscula (A-Z)
                      </span>
                      <span style={{ color: editPwdHasLower ? '#059669' : '#94a3b8', fontWeight: editPwdHasLower ? 700 : 500 }}>
                        {editPwdHasLower ? '✓' : '○'} 1 Minúscula (a-z)
                      </span>
                      <span style={{ color: editPwdHasNumber ? '#059669' : '#94a3b8', fontWeight: editPwdHasNumber ? 700 : 500 }}>
                        {editPwdHasNumber ? '✓' : '○'} 1 Número (0-9)
                      </span>
                      <span style={{ color: editPwdHasSpecial ? '#059669' : '#94a3b8', fontWeight: editPwdHasSpecial ? 700 : 500 }}>
                        {editPwdHasSpecial ? '✓' : '○'} 1 Especial (@$!%*?&#_-)
                      </span>
                      <span style={{ color: editPwdHasNoSpaces ? '#059669' : '#94a3b8', fontWeight: editPwdHasNoSpaces ? 700 : 500 }}>
                        {editPwdHasNoSpaces ? '✓' : '○'} Sin espacios
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {editModalError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '11.5px', fontWeight: 700 }}>
                  <AlertCircle size={14} /> {editModalError}
                </div>
              )}

              {editModalSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700 }}>
                  <CheckCircle2 size={14} color="#059669" /> {editModalSuccess}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isEditPwdValid}
                  style={{
                    background: isEditPwdValid ? '#2563eb' : '#94a3b8',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '7px 16px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#ffffff',
                    cursor: isEditPwdValid ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isEditPwdValid ? '0 2px 6px rgba(37,99,235,0.3)' : 'none'
                  }}
                >
                  <Save size={13} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
