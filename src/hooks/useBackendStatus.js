import { useState, useEffect } from 'react';
import api from '../services/api';

export const useBackendStatus = () => {
  const [isOnline, setIsOnline] = useState(false); // Start with offline assumption
  const [lastChecked, setLastChecked] = useState(null);

  const checkBackendStatus = async () => {
    try {
      // Try a simple request - categories endpoint is lightweight
      await api.get('/categories', { timeout: 3000 });
      setIsOnline(true);
    } catch (error) {
      // Check if it's a network error (backend not running)
      if (error.isNetworkError || error.status === 0 || !error.status) {
        setIsOnline(false);
      } else {
        // If we get any HTTP response (even 401, 404, etc.), backend is running
        setIsOnline(true);
      }
    } finally {
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    // Check after a short delay to avoid immediate errors
    const initialCheck = setTimeout(checkBackendStatus, 1000);

    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, lastChecked, checkBackendStatus };
};

export default useBackendStatus; 