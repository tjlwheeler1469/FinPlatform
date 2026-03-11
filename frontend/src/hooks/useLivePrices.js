import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for live stock price updates with simulated fluctuations
 * Updates prices every 30 seconds with realistic market movements
 */
export const useLivePrices = (shares, updateSharePrice, enabled = true) => {
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // connected, disconnected, updating
  const intervalRef = useRef(null);

  // Generate realistic price fluctuation (-2% to +2%)
  const generatePriceChange = useCallback((currentPrice) => {
    // More realistic distribution: smaller changes more likely
    const volatility = 0.02; // 2% max change
    const random = (Math.random() - 0.5) * 2; // -1 to 1
    const change = random * volatility * currentPrice;
    
    // Apply slight upward bias (market tends to go up long term)
    const bias = currentPrice * 0.0002; // 0.02% upward bias
    
    return Math.max(0.01, currentPrice + change + bias);
  }, []);

  // Simulate market hours (ASX: 10am - 4pm AEST)
  const isMarketOpen = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    const day = now.getDay();
    
    // Weekend check
    if (day === 0 || day === 6) return false;
    
    // Market hours (simplified - actual ASX hours)
    return hours >= 10 && hours < 16;
  }, []);

  // Update all prices
  const updatePrices = useCallback(() => {
    if (!shares || shares.length === 0) return;

    setConnectionStatus('updating');
    
    shares.forEach(share => {
      const newPrice = generatePriceChange(share.currentPrice);
      updateSharePrice(share.id, parseFloat(newPrice.toFixed(2)));
    });

    setLastUpdate(new Date());
    setConnectionStatus('connected');
  }, [shares, updateSharePrice, generatePriceChange]);

  // Start live updates
  const startLiveUpdates = useCallback(() => {
    if (intervalRef.current) return;
    
    setIsLive(true);
    setConnectionStatus('connected');
    
    // Initial update
    updatePrices();
    
    // Set interval for 30 seconds
    intervalRef.current = setInterval(() => {
      updatePrices();
    }, 30000);
  }, [updatePrices]);

  // Stop live updates
  const stopLiveUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsLive(false);
    setConnectionStatus('disconnected');
  }, []);

  // Toggle live updates
  const toggleLiveUpdates = useCallback(() => {
    if (isLive) {
      stopLiveUpdates();
    } else {
      startLiveUpdates();
    }
  }, [isLive, startLiveUpdates, stopLiveUpdates]);

  // Auto-start if enabled
  useEffect(() => {
    if (enabled && shares && shares.length > 0) {
      startLiveUpdates();
    }
    
    return () => {
      stopLiveUpdates();
    };
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isLive,
    lastUpdate,
    connectionStatus,
    isMarketOpen: isMarketOpen(),
    startLiveUpdates,
    stopLiveUpdates,
    toggleLiveUpdates,
    updatePrices
  };
};

/**
 * Format time since last update
 */
export const formatLastUpdate = (date) => {
  if (!date) return 'Never';
  
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
};

export default useLivePrices;
