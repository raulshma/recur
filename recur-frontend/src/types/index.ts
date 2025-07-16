// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  timeZone?: string;
  currency: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  expires?: string;
  user?: User;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  timeZone?: string;
  currency: string;
  createdAt: string;
  lastLoginAt?: string;
  budgetLimit?: number;
}

// Subscription Types
export const BillingCycle = {
  Weekly: 1,
  Monthly: 2,
  Quarterly: 3,
  SemiAnnually: 4,
  Annually: 5,
  Biannually: 6
} as const;

export type BillingCycle = typeof BillingCycle[keyof typeof BillingCycle];

export interface CreateSubscriptionRequest {
  name: string;
  description?: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  trialEndDate?: string;
  website?: string;
  contactEmail?: string;
  notes?: string;
  categoryId: number;
  isTrial?: boolean;
}

export interface UpdateSubscriptionRequest extends CreateSubscriptionRequest {
  isActive: boolean;
}

export interface Subscription {
  id: number;
  name: string;
  description?: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  billingCycleText: string;
  nextBillingDate: string;
  trialEndDate?: string;
  cancellationDate?: string;
  website?: string;
  contactEmail?: string;
  notes?: string;
  isActive: boolean;
  isTrial: boolean;
  daysUntilNextBilling: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color: string;
}

export interface UpdateCategoryRequest extends CreateCategoryRequest {}

// API Response Types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Query Parameters
export interface SubscriptionFilters {
  categoryId?: number;
  isActive?: boolean;
  isTrial?: boolean;
  search?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalMonthlyCost: number;
  totalAnnualCost: number;
  upcomingBills: number;
  trialEnding: number;
} 

