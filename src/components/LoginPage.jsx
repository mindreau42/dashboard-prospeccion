import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { getLockoutStatus, recordFailedAttempt, clearFailedAttempts, sanitizeInput, verifyPassword } from '../utils/security';
import packageJson from '../../package.json';

const APP_VERSION = `v${packageJson.version}`;

export default function LoginPage({ onLogin, users = [], sessionAlertMessage = '' }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Check lockout on mount and handle countdown
  useEffect(() => {
    const status = getLockoutStatus();
    if (status.isLocked) {
      setLockoutTimer(status.remainingSeconds);
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer(prev => {
          if (prev <= 1) {
            clearFailedAttempts();
            setErrorMsg('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockoutTimer]);

  const isLocked = lockoutTimer > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    const cleanUser = sanitizeInput(username);
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    // Artificial timing delay
    await new Promise(r => setTimeout(r, 350));

    // Verify credentials against user list: match by username OR fullName (space-insensitive and partial)
    const found = users.find(u => {
      if (!u) return false;
      const uName = (u.username || '').toLowerCase().trim();
      const uNameNoSpace = uName.replace(/\s+/g, '');
      const fName = (u.fullName || '').toLowerCase().trim();
      const fNameNoSpace = fName.replace(/\s+/g, '');
      const input = cleanUser.toLowerCase().trim();
      const inputNoSpace = input.replace(/\s+/g, '');

      const nameMatches =
        uName === input ||
        uNameNoSpace === inputNoSpace ||
        fName === input ||
        fNameNoSpace === inputNoSpace ||
        (input.length >= 3 && fName.includes(input)) ||
        (inputNoSpace.length >= 3 && fNameNoSpace.includes(inputNoSpace));

      if (!nameMatches) return false;

      const storedPass = String(u.password || '').trim();
      const storedPassNoSpace = storedPass.replace(/\s+/g, '');
      const cleanPassNoSpace = cleanPass.replace(/\s+/g, '');

      const plainMatches = Boolean(
        storedPass === cleanPass ||
        (storedPassNoSpace && storedPassNoSpace === cleanPassNoSpace)
      );
      const hashMatches = Boolean(
        (u.hash && verifyPassword(cleanPass, u.hash, u.salt)) ||
        (u.hash && verifyPassword(cleanPassNoSpace, u.hash, u.salt))
      );

      return plainMatches || hashMatches;
    });

    if (found) {
      clearFailedAttempts();
      let sessionToken = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: found.id, username: found.username })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.sessionToken) sessionToken = data.sessionToken;
        }
      } catch (_) {}

      onLogin({ ...found, sessionToken }, cleanPass);
    } else {
      const attemptResult = recordFailedAttempt();

      if (attemptResult.isLocked) {
        setLockoutTimer(attemptResult.remainingSeconds);
        setErrorMsg('Usuario o clave incorrecta. Demasiados intentos fallidos, acceso suspendido temporalmente.');
      } else {
        setErrorMsg('Usuario o clave incorrecta.');
      }
    }

    setIsLoading(false);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m > 0 ? `${m}m ` : ''}${s}s`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#2563eb',
            marginBottom: '14px',
            boxShadow: '0 4px 12px rgba(37,99,235,0.1)'
          }}>
            <TrendingUp size={26} color="#2563eb" />
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Dashboard de Prospección
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
            Ingresa tus credenciales para acceder
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 24px -2px rgba(0, 0, 0, 0.07)'
        }}>

          {sessionAlertMessage && (
            <div style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#be123c',
              fontSize: '12.5px',
              fontWeight: 600,
              lineHeight: '1.4',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <AlertCircle size={18} color="#be123c" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '2px' }}>🔒 Conexión Finalizada</strong>
                {sessionAlertMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Usuario
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}>
                  <User size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onKeyDown={(e) => { if (e.key === ' ' || e.code === 'Space') e.preventDefault(); }}
                  onChange={(e) => {
                    setUsername(e.target.value.replace(/\s+/g, ''));
                    if (errorMsg && !isLocked) setErrorMsg('');
                  }}
                  disabled={isLocked || isLoading}
                  autoComplete="username"
                  style={{
                    width: '100%',
                    background: isLocked ? '#f1f5f9' : '#ffffff',
                    border: `1px solid ${errorMsg && !isLocked ? '#f87171' : '#cbd5e1'}`,
                    borderRadius: '8px',
                    padding: '10px 12px 10px 38px',
                    color: '#0f172a',
                    fontSize: '13.5px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box',
                    cursor: isLocked ? 'not-allowed' : 'text'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex' }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onKeyDown={(e) => { if (e.key === ' ' || e.code === 'Space') e.preventDefault(); }}
                  onChange={(e) => {
                    setPassword(e.target.value.replace(/\s+/g, ''));
                    if (errorMsg && !isLocked) setErrorMsg('');
                  }}
                  disabled={isLocked || isLoading}
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    background: isLocked ? '#f1f5f9' : '#ffffff',
                    border: `1px solid ${errorMsg && !isLocked ? '#f87171' : '#cbd5e1'}`,
                    borderRadius: '8px',
                    padding: '10px 38px 10px 38px',
                    color: '#0f172a',
                    fontSize: '13.5px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box',
                    cursor: isLocked ? 'not-allowed' : 'text'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLocked}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: isLocked ? 'not-allowed' : 'pointer', display: 'flex', padding: '4px' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                padding: '10px 12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '12.5px',
                fontWeight: 700,
                lineHeight: 1.4
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{errorMsg}</div>
              </div>
            )}

            {/* Lockout Countdown Widget */}
            {isLocked && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '14px',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#dc2626', fontSize: '13px', fontWeight: 800 }}>
                  <Clock size={16} /> Tiempo de espera:
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#991b1b', margin: '6px 0 2px', fontFamily: 'monospace' }}>
                  {formatTimer(lockoutTimer)}
                </div>
                <p style={{ fontSize: '11px', color: '#7f1d1d', margin: '0 0 10px 0' }}>
                  Por favor espera a que concluya el tiempo para reintentar.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearFailedAttempts();
                    setLockoutTimer(0);
                    setErrorMsg('');
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fca5a5',
                    color: '#dc2626',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Desbloquear ahora
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isLocked || !username || !password}
              style={{
                width: '100%',
                background: isLoading || isLocked || !username || !password ? '#e2e8f0' : '#2563eb',
                color: isLoading || isLocked || !username || !password ? '#94a3b8' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '11px',
                fontSize: '13.5px',
                fontWeight: 800,
                fontFamily: 'inherit',
                cursor: isLoading || isLocked || !username || !password ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                marginTop: '4px'
              }}
            >
              {isLoading ? 'Verificando...' : isLocked ? 'Acceso suspendido' : 'Ingresar al Dashboard'}
            </button>

          </form>
        </div>

        {/* Clean professional copyright & version footer */}
        <div style={{ textAlign: 'center', marginTop: '22px' }}>
          <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0, fontWeight: 600 }}>
            © {new Date().getFullYear()} Dashboard de Gestión y Prospección Comercial.
          </p>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span>Todos los derechos reservados.</span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '1px 6px', borderRadius: '4px', fontWeight: 800, color: '#475569', fontSize: '10.5px' }}>
              {APP_VERSION}
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}
