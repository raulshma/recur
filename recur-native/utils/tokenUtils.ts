/**
 * Utility functions for token management
 */

/**
 * Check if a token is about to expire within the specified buffer time
 * @param expiresAt ISO string of token expiration time
 * @param bufferMinutes Minutes before expiration to consider token as expired (default: 5)
 * @returns boolean indicating if token is expired or about to expire
 */
export const isTokenExpiring = (expiresAt: string, bufferMinutes = 5): boolean => {
  if (!expiresAt) return true;
  
  const expirationTime = new Date(expiresAt).getTime();
  const currentTime = Date.now();
  const bufferTime = bufferMinutes * 60 * 1000; // Convert minutes to milliseconds
  
  return currentTime >= (expirationTime - bufferTime);
};

/**
 * Parse JWT token to get payload
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export const parseJwt = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');
    
    const base64Url = parts[1];
    if (!base64Url) throw new Error('Invalid token payload');
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
};

/**
 * Get token expiration time from JWT token
 * @param token JWT token string
 * @returns Expiration time as Date object or null if invalid
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return null;
    
    // JWT exp is in seconds, convert to milliseconds
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};