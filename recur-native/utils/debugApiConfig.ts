import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_CONFIG } from '@/constants/ApiConfig';

/**
 * Debug utility to log API configuration details
 * This helps troubleshoot connectivity issues
 */
export const debugApiConfig = () => {
  if (!__DEV__) return;

  console.log('=== API Configuration Debug ===');
  console.log('Platform:', Platform.OS);
  console.log('Environment:', API_CONFIG.ENV);
  console.log('API URL:', API_CONFIG.API_URL);
  console.log('Timeout:', API_CONFIG.TIMEOUT);
  
  console.log('\n=== Device Detection ===');
  console.log('__DEV__:', __DEV__);
  console.log('Android isDevice:', Constants.platform?.android?.isDevice);
  console.log('iOS simulator:', Constants.platform?.ios?.simulator);
  
  console.log('\n=== Environment Variables ===');
  console.log('EXPO_PUBLIC_API_HOST:', process.env.EXPO_PUBLIC_API_HOST);
  console.log('EXPO_PUBLIC_API_PORT:', process.env.EXPO_PUBLIC_API_PORT);
  
  console.log('\n=== Constants Platform ===');
  console.log('Constants.platform:', JSON.stringify(Constants.platform, null, 2));
  
  
};

/**
 * Test if the API URL is reachable
 */
export const testApiUrl = async (url: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url.replace('/api', '/api/system/health'), {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('API URL test failed:', error);
    return false;
  }
};