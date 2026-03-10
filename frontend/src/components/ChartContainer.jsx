import { useState, useEffect, useRef } from "react";

/**
 * ChartContainer - A wrapper component that ensures Recharts only renders 
 * when the container has valid dimensions. This prevents console warnings
 * about negative width/height during initial render.
 */
const ChartContainer = ({ children, height = 250, className = "" }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
        setIsReady(true);
      }
    };

    // Use requestAnimationFrame to ensure DOM is fully laid out before measuring
    // This prevents the race condition where charts render before dimensions are available
    const rafId = requestAnimationFrame(() => {
      // Additional small delay to ensure CSS has been applied
      setTimeout(updateDimensions, 50);
    });

    // Use ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
          setIsReady(true);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`w-full ${className}`}
      style={{ height: `${height}px`, minHeight: `${height}px` }}
    >
      {isReady ? children : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-pulse bg-muted rounded-lg w-full h-full" />
        </div>
      )}
    </div>
  );
};

export default ChartContainer;
