// Smoothly animate a numeric value between changes. Lightweight, no deps.
import { useEffect, useRef, useState } from "react";

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const NumberRoll = ({ value = 0, duration = 500, format = (v) => v.toString(), className, testId }) => {
  const [display, setDisplay] = useState(value);
  const startRef = useRef(value);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = startRef.current;
    const to = Number(value) || 0;
    if (from === to) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(p);
      setDisplay(from + (to - from) * eased);
      if (p < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        startRef.current = to;
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => frameRef.current && cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <span className={className} data-testid={testId}>{format(display)}</span>;
};

export default NumberRoll;
