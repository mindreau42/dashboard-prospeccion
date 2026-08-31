import { useState, useEffect, useRef } from "react";

/**
 * Animates a number from 0 to target using easeOutExpo on mount / value change.
 * @param {number|string} target  - End value
 * @param {number}        duration - ms (default 750)
 */
export function useAnimatedNumber(target, duration = 750) {
  const end = Number(target) || 0;
  const [current, setCurrent] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (end === 0) { setCurrent(0); return; }

    let startTs = null;

    const tick = (ts) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      // easeOutExpo — feels snappy yet smooth
      const ease = p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setCurrent(Math.round(end * ease));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setCurrent(end);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [end, duration]);

  return current;
}
