/**
 * Discord webhook URL validation utilities
 */

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a Discord webhook URL format
 */
export function validateDiscordWebhookUrl(url: string): WebhookValidationResult {
  if (!url || url.trim() === '') {
    return { isValid: false, error: 'Webhook URL is required' };
  }

  // Basic URL format validation
  try {
    const urlObj = new URL(url);
    
    // Check if it's a Discord webhook URL
    if (!urlObj.hostname.includes('discord.com') && !urlObj.hostname.includes('discordapp.com')) {
      return { isValid: false, error: 'URL must be a Discord webhook URL' };
    }

    // Check if it contains the webhook path
    if (!urlObj.pathname.includes('/api/webhooks/')) {
      return { isValid: false, error: 'Invalid Discord webhook URL format' };
    }

    // Check if it has the required webhook ID and token parts
    const pathParts = urlObj.pathname.split('/');
    const webhookIndex = pathParts.indexOf('webhooks');
    
    if (webhookIndex === -1 || pathParts.length < webhookIndex + 3) {
      return { isValid: false, error: 'Webhook URL is missing required components' };
    }

    const webhookId = pathParts[webhookIndex + 1];
    const webhookToken = pathParts[webhookIndex + 2];

    if (!webhookId || !webhookToken) {
      return { isValid: false, error: 'Webhook URL is missing ID or token' };
    }

    // Basic format checks for ID and token
    if (!/^\d+$/.test(webhookId)) {
      return { isValid: false, error: 'Invalid webhook ID format' };
    }

    if (webhookToken.length < 60) {
      return { isValid: false, error: 'Invalid webhook token format' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Extracts webhook information from a Discord webhook URL
 */
export function extractWebhookInfo(url: string): { id: string; token: string } | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const webhookIndex = pathParts.indexOf('webhooks');
    
    if (webhookIndex !== -1 && pathParts.length >= webhookIndex + 3) {
      return {
        id: pathParts[webhookIndex + 1],
        token: pathParts[webhookIndex + 2]
      };
    }
  } catch (error) {
    // Invalid URL
  }
  
  return null;
}

/**
 * Sanitizes a webhook URL for display (hides the token)
 */
export function sanitizeWebhookUrl(url: string): string {
  const info = extractWebhookInfo(url);
  if (info) {
    return url.replace(info.token, '***HIDDEN***');
  }
  return url;
}