import { useState, useCallback } from 'react';
import { API_CONFIG } from '@/constants/ApiConfig';
import { testApiConnectivity, testApiAuthentication, getApiConfigInfo, ApiTestResult } from '@/services/api/apiTester';
import { checkNetworkConnectivity } from '@/services/api/errorHandler';

/**
 * Hook for accessing and testing API configuration
 */
export const useApiConfig = () => {
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);
  const [isTestingAuthentication, setIsTestingAuthentication] = useState(false);
  const [connectivityResult, setConnectivityResult] = useState<ApiTestResult | null>(null);
  const [authenticationResult, setAuthenticationResult] = useState<ApiTestResult | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  /**
   * Test API connectivity
   */
  const testConnectivity = useCallback(async () => {
    setIsTestingConnectivity(true);
    try {
      const result = await testApiConnectivity();
      setConnectivityResult(result);
      return result;
    } catch (error) {
      console.error('Error testing API connectivity:', error);
      const errorResult: ApiTestResult = {
        success: false,
        message: 'Error testing API connectivity',
        error,
      };
      setConnectivityResult(errorResult);
      return errorResult;
    } finally {
      setIsTestingConnectivity(false);
    }
  }, []);

  /**
   * Test API authentication
   */
  const testAuthentication = useCallback(async () => {
    setIsTestingAuthentication(true);
    try {
      const result = await testApiAuthentication();
      setAuthenticationResult(result);
      return result;
    } catch (error) {
      console.error('Error testing API authentication:', error);
      const errorResult: ApiTestResult = {
        success: false,
        message: 'Error testing API authentication',
        error,
      };
      setAuthenticationResult(errorResult);
      return errorResult;
    } finally {
      setIsTestingAuthentication(false);
    }
  }, []);

  /**
   * Check if the device is online
   */
  const checkOnlineStatus = useCallback(async () => {
    try {
      const isConnected = await checkNetworkConnectivity();
      setIsOnline(isConnected);
      return isConnected;
    } catch (error) {
      console.error('Error checking online status:', error);
      setIsOnline(false);
      return false;
    }
  }, []);

  /**
   * Run all tests (connectivity, authentication, online status)
   */
  const runAllTests = useCallback(async () => {
    const onlineStatus = await checkOnlineStatus();
    if (!onlineStatus) {
      return {
        online: false,
        connectivity: null,
        authentication: null,
      };
    }

    const connectivityTest = await testConnectivity();
    let authenticationTest = null;
    
    if (connectivityTest.success) {
      authenticationTest = await testAuthentication();
    }

    return {
      online: onlineStatus,
      connectivity: connectivityTest,
      authentication: authenticationTest,
    };
  }, [checkOnlineStatus, testConnectivity, testAuthentication]);

  return {
    apiConfig: API_CONFIG,
    apiConfigInfo: getApiConfigInfo(),
    isTestingConnectivity,
    isTestingAuthentication,
    connectivityResult,
    authenticationResult,
    isOnline,
    testConnectivity,
    testAuthentication,
    checkOnlineStatus,
    runAllTests,
  };
};