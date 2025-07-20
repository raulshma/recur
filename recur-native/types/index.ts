// Core Types for the Recur Mobile App

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  timeZone?: string;
  currency: string;
  budgetLimit?: number;
  createdAt: Date;
  lastLoginAt?: Date;
  roles: string[];
}

export enum BillingCycle {
  Weekly = 1,
  Monthly = 2,
  Quarterly = 3,
  SemiAnnually = 4,
  Annually = 5,
  Biannually = 6,
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface Subscription {
  id: number;
  name: string;
  description?: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  billingCycleText: string;
  nextBillingDate: Date;
  trialEndDate?: Date;
  cancellationDate?: Date;
  website?: string;
  contactEmail?: string;
  notes?: string;
  isActive: boolean;
  isTrial: boolean;
  daysUntilNextBilling: number;
  createdAt: Date;
  updatedAt: Date;
  category: Category;
  convertedCost?: number;
  convertedCurrency?: string;
  exchangeRate?: number;
  rateTimestamp?: Date;
  isConverted: boolean;
  isRateStale: boolean;
}

export interface CurrencyBreakdown {
  currency: string;
  totalCost: number;
  subscriptionCount: number;
  convertedCost: number;
  exchangeRate: number;
}

export interface DashboardStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalMonthlyCost: number;
  totalAnnualCost: number;
  upcomingBills: number;
  trialEnding: number;
  daysUntilNextBilling: number;
  displayCurrency: string;
  currencyBreakdowns: CurrencyBreakdown[];
}

export interface MonthlySpending {
  month: string;
  year: number;
  totalCost: number;
  currency: string;
}

export interface CategorySpending {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  totalCost: number;
  subscriptionCount: number;
  currency: string;
}

export interface UpcomingBill {
  subscriptionId: number;
  subscriptionName: string;
  cost: number;
  currency: string;
  dueDate: Date;
  daysUntilDue: number;
  categoryColor: string;
}

export interface RecentActivity {
  id: number;
  type: 'created' | 'updated' | 'cancelled' | 'reactivated';
  subscriptionName: string;
  description: string;
  timestamp: Date;
  cost?: number;
  currency?: string;
}

export interface Notification {
  id: number;
  type: 'bill_due' | 'trial_ending' | 'budget_alert' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  subscriptionId?: number;
  actionUrl?: string;
}

export interface NotificationSettings {
  billReminders: boolean;
  trialEndings: boolean;
  budgetAlerts: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  reminderDays: number;
}

export interface AnalyticsOverview {
  totalSpending: MonthlySpending[];
  categoryBreakdown: CategorySpending[];
  upcomingBills: UpcomingBill[];
  recentActivity: RecentActivity[];
  timeRange: string;
  currency: string;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresAt: Date;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  timeZone?: string;
  currency?: string;
  budgetLimit?: number;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Subscription Management Types
export interface CreateSubscriptionDto {
  name: string;
  description?: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  nextBillingDate: Date;
  trialEndDate?: Date;
  website?: string;
  contactEmail?: string;
  notes?: string;
  categoryId: number;
}

export interface UpdateSubscriptionDto extends Partial<CreateSubscriptionDto> {
  isActive?: boolean;
}

export interface SubscriptionFilters {
  categoryId?: number;
  isActive?: boolean;
  isTrial?: boolean;
  search?: string;
  sortBy?: 'name' | 'cost' | 'nextBillingDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SubscriptionHistory {
  id: number;
  subscriptionId: number;
  action: 'created' | 'updated' | 'cancelled' | 'reactivated';
  changes: Record<string, any>;
  timestamp: Date;
  cost?: number;
  currency?: string;
}

// Category Management Types
export interface CreateCategoryDto {
  name: string;
  description?: string;
  color: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Error Types
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// Storage Types
export interface StoredAuthData {
  token: string;
  refreshToken: string;
  user: User;
  expiresAt: string;
}

export interface AppSettings {
  currency: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  biometricEnabled: boolean;
  language: string;
  timeZone: string;
}

// Navigation Types
export interface TabParamList {
  dashboard: undefined;
  subscriptions: undefined;
  categories: undefined;
  notifications: undefined;
  profile: undefined;
}

export interface AuthStackParamList {
  login: undefined;
  'biometric-setup': undefined;
}

export interface ModalParamList {
  'add-subscription': undefined;
  'edit-subscription': { subscriptionId: number };
  'add-category': undefined;
  'edit-category': { categoryId: number };
}

// Form Types
export interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
}

// Component Props Types
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  elevation?: number;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;