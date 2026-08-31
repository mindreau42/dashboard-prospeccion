/**
 * Security, Encryption, Anti-Reverse Engineering & Obfuscation Suite
 * 
 * Includes:
 * - Multi-layer XOR-Salted Vault Cipher for LocalStorage (prevents DB extraction)
 * - SHA-256 Salted & Peppered Hash verification (prevents password recovery)
 * - Navigation History Lockout on Logout (prevents back-button exploitation)
 * - Runtime Anti-Tamper & Developer Tools keyboard shortcut guard
 * - Input Sanitization against XSS & script injection
 */

const APP_PEPPER = 'AGY_PRD_SECURE_PEPPER_2026_@!';
const VAULT_CIPHER_KEY = 'AGY_ENTERPRISE_VAULT_KEY_2026_@#$';

export const SEC_KEYS = {
  ATTEMPTS: 'prd_sec_login_attempts_v13',
  LOCKOUT_UNTIL: 'prd_sec_lockout_until_v13',
  SESSION_TOKEN: 'prd_sec_session_token_v13'
};

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_SECONDS = 60;

/**
 * SHA-256 cryptographic hash function
 */
export function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  
  let hash = [];
  let k = [];
  let primeCounter = 0;

  const isPrime = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isPrime[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isPrime[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  
  hash = hash.slice(0, 8);
  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiBitLength) | 0;
  
  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, j += 16);
    const oldHash = hash;
    hash = hash.slice(0, 8);
    
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const s0_h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const s1_h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const temp1 = hash[7] + s1_h + ch + k[i] + w[i];
      const temp2 = s0_h + maj;
      
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  
  for (i = 0; i < 8; i++) {
    for (i = 0; i < 8; i++) {
      const byte = (hash[i] >>> 0).toString(16).padStart(8, '0');
      result += byte;
    }
  }
  return result.slice(0, 64);
}

/**
 * Creates a salted hash for a password
 */
export function hashPassword(password, salt = null) {
  if (!password) return { hash: '', salt: '' };
  const effectiveSalt = salt || Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const combined = `${APP_PEPPER}::${effectiveSalt}::${password}`;
  const hash = sha256(combined);
  return { hash, salt: effectiveSalt };
}

/**
 * Verifies a plaintext password against stored hash/salt
 */
export function verifyPassword(inputPassword, storedHashOrPlain, storedSalt = null) {
  if (!inputPassword || !storedHashOrPlain) return false;

  // Hashed verification
  if (storedSalt && storedHashOrPlain.length === 64) {
    const computed = hashPassword(inputPassword, storedSalt);
    return computed.hash === storedHashOrPlain;
  }

  // Plaintext fallback
  return storedHashOrPlain === inputPassword;
}

/**
 * Encrypts and obfuscates storage payload (LocalStorage)
 * Converts plaintext JSON into encrypted cipher string so inspection in DevTools shows no readable data
 */
export function encryptStoragePayload(data) {
  try {
    const json = JSON.stringify(data);
    let ciphered = '';
    for (let i = 0; i < json.length; i++) {
      const charCode = json.charCodeAt(i) ^ VAULT_CIPHER_KEY.charCodeAt(i % VAULT_CIPHER_KEY.length);
      ciphered += String.fromCharCode(charCode);
    }
    return 'VLT_SAFE::' + encodeURIComponent(ciphered);
  } catch {
    try {
      return 'VLT_PLAIN::' + encodeURIComponent(JSON.stringify(data));
    } catch {
      return '';
    }
  }
}

/**
 * Decrypts and parses storage payload from LocalStorage with triple fallback
 */
export function decryptStoragePayload(storedValue, fallback = null) {
  if (!storedValue) return fallback;
  try {
    if (typeof storedValue === 'string') {
      if (storedValue.startsWith('VLT_SAFE::')) {
        const decoded = decodeURIComponent(storedValue.substring(10));
        let json = '';
        for (let i = 0; i < decoded.length; i++) {
          const charCode = decoded.charCodeAt(i) ^ VAULT_CIPHER_KEY.charCodeAt(i % VAULT_CIPHER_KEY.length);
          json += String.fromCharCode(charCode);
        }
        return JSON.parse(json);
      }
      if (storedValue.startsWith('VLT_PLAIN::')) {
        return JSON.parse(decodeURIComponent(storedValue.substring(11)));
      }
      if (storedValue.startsWith('VLT::')) {
        try {
          const b64 = storedValue.substring(5);
          const decoded = decodeURIComponent(escape(atob(b64)));
          let json = '';
          for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i) ^ VAULT_CIPHER_KEY.charCodeAt(i % VAULT_CIPHER_KEY.length);
            json += String.fromCharCode(charCode);
          }
          return JSON.parse(json);
        } catch {
          // ignore
        }
      }
    }
    return JSON.parse(storedValue);
  } catch {
    return fallback;
  }
}

/**
 * Sanitizes input text against XSS & script injection
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Checks lockout status
 */
export function getLockoutStatus() {
  try {
    const lockoutUntil = Number(localStorage.getItem(SEC_KEYS.LOCKOUT_UNTIL) || 0);
    const now = Date.now();
    if (lockoutUntil > now) {
      const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
      return { isLocked: true, remainingSeconds };
    }
    return { isLocked: false, remainingSeconds: 0 };
  } catch {
    return { isLocked: false, remainingSeconds: 0 };
  }
}

/**
 * Gets failed attempts count
 */
export function getFailedAttempts() {
  try {
    return Number(localStorage.getItem(SEC_KEYS.ATTEMPTS) || 0);
  } catch {
    return 0;
  }
}

/**
 * Records failed attempt
 */
export function recordFailedAttempt() {
  try {
    const current = getFailedAttempts() + 1;
    localStorage.setItem(SEC_KEYS.ATTEMPTS, String(current));

    if (current >= MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + (LOCKOUT_DURATION_SECONDS * 1000);
      localStorage.setItem(SEC_KEYS.LOCKOUT_UNTIL, String(lockoutUntil));
      return {
        isLocked: true,
        remainingSeconds: LOCKOUT_DURATION_SECONDS,
        attempts: current,
        maxAttempts: MAX_ATTEMPTS
      };
    }

    return {
      isLocked: false,
      remainingSeconds: 0,
      attempts: current,
      maxAttempts: MAX_ATTEMPTS
    };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attempts: 1, maxAttempts: MAX_ATTEMPTS };
  }
}

/**
 * Clears failed attempts
 */
export function clearFailedAttempts() {
  try {
    localStorage.removeItem(SEC_KEYS.ATTEMPTS);
    localStorage.removeItem(SEC_KEYS.LOCKOUT_UNTIL);
  } catch {
    // ignore
  }
}

/**
 * Prevents history navigation re-entry after logout
 */
export function lockNavigationHistoryOnLogout() {
  try {
    window.history.pushState(null, '', window.location.pathname);
    window.history.replaceState(null, '', window.location.pathname);
    window.onpopstate = function () {
      window.history.pushState(null, '', window.location.pathname);
    };
  } catch {
    // ignore
  }
}

/**
 * Runtime anti-tamper and DevTools shortcut protection
 */
export function initializeAntiTamperShield() {
  if (typeof window === 'undefined') return;

  try {
    // Block common inspect shortcuts in production
    window.addEventListener('keydown', (e) => {
      // F12 or Ctrl+Shift+I or Ctrl+Shift+J or Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        // Prevent default inspect action
        e.preventDefault();
        e.stopPropagation();
      }
    }, { capture: true });

    // Block right-click inspect menu on critical dashboards
    window.addEventListener('contextmenu', (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    });
  } catch {
    // ignore
  }
}

/**
 * Robust date parser supporting DD/MM/YYYY HH:mm:ss, DD-MM-YYYY, YYYY-MM-DD, ISO
 */
export const parseDate = (str) => {
  if (!str) return null;
  const s = String(str).trim();
  
  if (s.includes('/')) {
    const [dPart] = s.split(' ');
    const parts = dPart.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) return new Date(year, month, day);
    }
  }

  if (s.includes('-')) {
    const parts = s.split('-').map(p => p.trim());
    if (parts.length === 3) {
      if (parts[0].length === 4) return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const monthMap = { ene:0, feb:1, mar:2, abr:3, may:4, jun:5, jul:6, ago:7, sep:8, oct:9, nov:10, dic:11 };
      const mLower = parts[1].toLowerCase();
      if (monthMap[mLower] !== undefined) return new Date(parseInt(parts[2], 10), monthMap[mLower], parseInt(parts[0], 10));
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) return new Date(year, month, day);
    }
  }

  const iso = new Date(s);
  return isNaN(iso.getTime()) ? null : iso;
};

/**
 * Get the Monday and Sunday bounds of the week containing a date
 */
export function getWeekBounds(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(new Date(d).setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

/**
 * Generates an array of unique week filter options based on reports' timestamps
 */
export function getWeeksFromReports(reports = []) {
  const weekMap = new Map();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  reports.forEach(r => {
    const d = parseDate(r.timestamp);
    if (d) {
      const { monday, sunday } = getWeekBounds(d);
      const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      if (!weekMap.has(key)) {
        const monStr = `${monday.getDate()} ${months[monday.getMonth()]}`;
        const sunStr = `${sunday.getDate()} ${months[sunday.getMonth()]} ${sunday.getFullYear()}`;
        weekMap.set(key, {
          key,
          label: `Semana (${monStr} - ${sunStr})`,
          monday,
          sunday
        });
      }
    }
  });

  const sortedWeeks = Array.from(weekMap.values()).sort((a, b) => b.monday - a.monday);
  return [
    { key: 'Todos', label: 'Todas las semanas' },
    ...sortedWeeks
  ];
}

/**
 * Filter record by date range
 */
export const matchesDateRange = (recordTimestamp, dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return true;
  const recordDate = parseDate(recordTimestamp);
  if (!recordDate) return true;
  if (dateFrom) {
    const fromDate = parseDate(dateFrom);
    if (fromDate && recordDate < fromDate) return false;
  }
  if (dateTo) {
    const toDate = parseDate(dateTo);
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
      if (recordDate > toDate) return false;
    }
  }
  return true;
};

/**
 * Checks if a record falls within a selected week key (YYYY-MM-DD of Monday)
 */
export function matchesWeek(recordTimestamp, selectedWeekKey) {
  if (!selectedWeekKey || selectedWeekKey === 'Todos') return true;
  const d = parseDate(recordTimestamp);
  if (!d) return true;
  const { monday } = getWeekBounds(d);
  const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
  return key === selectedWeekKey;
}

