import { useEffect, useRef, useState } from 'react';

// Animates a number from 0 to `value` on mount. Respects reduced-motion.
export default function CountUp({ value, duration = 750, decimals }) {
  const target = Number(value) || 0;
  const dp = decimals != null ? decimals : Number.isInteger(target) ? 0 : 1;
  const reduce = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [n, setN] = useState(reduce ? target : 0);
  const raf = useRef();

  useEffect(() => {
    if (reduce) { setN(target); return; }
    const start = performance.now();
    const from = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(from + (target - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setN(target);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, reduce]);

  return <>{n.toFixed(dp)}</>;
}
