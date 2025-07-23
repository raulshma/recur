import { useState, useEffect } from 'react';
import { setOnlineStatus } from '@/services/queryClient';

export interface NetworkStatus {
  isConnected: boolean;
  isOnline: boolean;
  lastChecked: Date;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isOnline: true,
    lastChecked: new Date(),
  });

  const checkConnectivity = async () => {
    try {
      // Simple connectivity check by trying to fetch a small resource
      // Use a timeout instead of AbortSignal to avoid type issues
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });
      
      const fetchPromise = fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      // No need to clear timeout as it will be garbage collected
      
      const isOnline = response.ok;
      const newStatus = {
        isConnected: isOnline,
        isOnline,
        lastChecked: new Date(),
      };
      
      setNetworkStatus(newStatus);
      setOnlineStatus(isOnline); // Update React Query online manager
      
      return isOnline;
    } catch (error) {
      const newStatus = {
        isConnected: false,
        isOnline: false,
        lastChecked: new Date(),
      };
      
      setNetworkStatus(newStatus);
      setOnlineStatus(false); // Update React Query online manager
      return false;
    }
  };

  useEffect(() => {
    // Check connectivity on mount
    checkConnectivity();

    // Set up periodic connectivity checks
    const interval = setInterval(checkConnectivity, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    ...networkStatus,
    checkConnectivity,
  };
};