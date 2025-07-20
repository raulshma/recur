// Development-specific configuration and utilities

export const DEV_CONFIG = {
  // Enable detailed logging in development
  ENABLE_LOGGING: __DEV__,
  
  // Enable React Query DevTools (if available)
  ENABLE_QUERY_DEVTOOLS: __DEV__,
  
  // Enable Flipper integration
  ENABLE_FLIPPER: __DEV__,
  
  // Mock API responses in development
  USE_MOCK_API: false,
  
  // Skip authentication in development (for testing)
  SKIP_AUTH: false,
  
  // Enable performance monitoring
  ENABLE_PERFORMANCE_MONITORING: __DEV__,
} as const;

// Development utilities
export const devUtils = {
  log: (message: string, data?: any) => {
    if (DEV_CONFIG.ENABLE_LOGGING) {
      console.log(`[Recur] ${message}`, data || '');
    }
  },
  
  warn: (message: string, data?: any) => {
    if (DEV_CONFIG.ENABLE_LOGGING) {
      console.warn(`[Recur Warning] ${message}`, data || '');
    }
  },
  
  error: (message: string, error?: any) => {
    if (DEV_CONFIG.ENABLE_LOGGING) {
      console.error(`[Recur Error] ${message}`, error || '');
    }
  },
  
  time: (label: string) => {
    if (DEV_CONFIG.ENABLE_PERFORMANCE_MONITORING) {
      console.time(`[Recur] ${label}`);
    }
  },
  
  timeEnd: (label: string) => {
    if (DEV_CONFIG.ENABLE_PERFORMANCE_MONITORING) {
      console.timeEnd(`[Recur] ${label}`);
    }
  },
};

// Mock data for development
export const MOCK_DATA = {
  user: {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    currency: 'USD',
    timeZone: 'America/New_York',
    createdAt: new Date(),
    roles: ['user'],
  },
  
  subscriptions: [
    {
      id: 1,
      name: 'Netflix',
      cost: 15.99,
      currency: 'USD',
      billingCycle: 2, // Monthly
      billingCycleText: 'Monthly',
      nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isActive: true,
      isTrial: false,
      daysUntilNextBilling: 7,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: 1,
        name: 'Entertainment',
        color: '#FF6B6B',
        isDefault: false,
        createdAt: new Date(),
      },
      isConverted: false,
      isRateStale: false,
    },
    {
      id: 2,
      name: 'Spotify',
      cost: 9.99,
      currency: 'USD',
      billingCycle: 2, // Monthly
      billingCycleText: 'Monthly',
      nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      isActive: true,
      isTrial: true,
      trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      daysUntilNextBilling: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: 1,
        name: 'Entertainment',
        color: '#FF6B6B',
        isDefault: false,
        createdAt: new Date(),
      },
      isConverted: false,
      isRateStale: false,
    },
  ],
  
  categories: [
    {
      id: 1,
      name: 'Entertainment',
      description: 'Movies, music, and streaming services',
      color: '#FF6B6B',
      isDefault: false,
      createdAt: new Date(),
    },
    {
      id: 2,
      name: 'Productivity',
      description: 'Tools and software for work',
      color: '#4ECDC4',
      isDefault: false,
      createdAt: new Date(),
    },
    {
      id: 3,
      name: 'Other',
      description: 'Miscellaneous subscriptions',
      color: '#95A5A6',
      isDefault: true,
      createdAt: new Date(),
    },
  ],
  
  dashboardStats: {
    totalSubscriptions: 2,
    activeSubscriptions: 2,
    totalMonthlyCost: 25.98,
    totalAnnualCost: 311.76,
    upcomingBills: 1,
    trialEnding: 1,
    daysUntilNextBilling: 7,
    displayCurrency: 'USD',
    currencyBreakdowns: [
      {
        currency: 'USD',
        totalCost: 25.98,
        subscriptionCount: 2,
        convertedCost: 25.98,
        exchangeRate: 1,
      },
    ],
  },
};