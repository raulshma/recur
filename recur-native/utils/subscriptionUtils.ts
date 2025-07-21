import { Subscription, SubscriptionFilters, BillingCycle } from '@/types';

/**
 * Filter subscriptions based on provided filters
 */
export const filterSubscriptions = (
  subscriptions: Subscription[],
  filters: SubscriptionFilters
): Subscription[] => {
  if (!subscriptions) return [];
  
  return subscriptions.filter(subscription => {
    // Filter by category
    if (filters.categoryId !== undefined && 
        subscription.category.id !== filters.categoryId) {
      return false;
    }
    
    // Filter by active status
    if (filters.isActive !== undefined && 
        subscription.isActive !== filters.isActive) {
      return false;
    }
    
    // Filter by trial status
    if (filters.isTrial !== undefined && 
        subscription.isTrial !== filters.isTrial) {
      return false;
    }
    
    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const nameMatch = subscription.name.toLowerCase().includes(searchTerm);
      const descMatch = subscription.description?.toLowerCase().includes(searchTerm) || false;
      const notesMatch = subscription.notes?.toLowerCase().includes(searchTerm) || false;
      
      if (!nameMatch && !descMatch && !notesMatch) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Sort subscriptions based on sort criteria
 */
export const sortSubscriptions = (
  subscriptions: Subscription[],
  sortBy: 'name' | 'cost' | 'nextBillingDate' | 'createdAt' = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): Subscription[] => {
  if (!subscriptions) return [];
  
  return [...subscriptions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'cost':
        // Use converted cost if available, otherwise use original cost
        const aCost = a.convertedCost !== undefined ? a.convertedCost : a.cost;
        const bCost = b.convertedCost !== undefined ? b.convertedCost : b.cost;
        comparison = aCost - bCost;
        break;
      case 'nextBillingDate':
        comparison = new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime();
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

/**
 * Calculate the next billing date based on current date and billing cycle
 */
export const calculateNextBillingDate = (
  currentDate: Date,
  billingCycle: BillingCycle
): Date => {
  const nextDate = new Date(currentDate);
  
  switch (billingCycle) {
    case BillingCycle.Weekly:
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case BillingCycle.Monthly:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case BillingCycle.Quarterly:
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case BillingCycle.SemiAnnually:
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case BillingCycle.Annually:
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case BillingCycle.Biannually:
      nextDate.setFullYear(nextDate.getFullYear() + 2);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
  }
  
  return nextDate;
};

/**
 * Calculate days until next billing date
 */
export const calculateDaysUntilNextBilling = (nextBillingDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const nextDate = new Date(nextBillingDate);
  nextDate.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const diffTime = nextDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Format billing cycle as human-readable text
 */
export const formatBillingCycle = (billingCycle: BillingCycle): string => {
  switch (billingCycle) {
    case BillingCycle.Weekly:
      return 'Weekly';
    case BillingCycle.Monthly:
      return 'Monthly';
    case BillingCycle.Quarterly:
      return 'Quarterly';
    case BillingCycle.SemiAnnually:
      return 'Semi-Annually';
    case BillingCycle.Annually:
      return 'Annually';
    case BillingCycle.Biannually:
      return 'Every 2 Years';
    default:
      return 'Unknown';
  }
};

/**
 * Calculate annual cost based on billing cycle and cost
 */
export const calculateAnnualCost = (cost: number, billingCycle: BillingCycle): number => {
  switch (billingCycle) {
    case BillingCycle.Weekly:
      return cost * 52;
    case BillingCycle.Monthly:
      return cost * 12;
    case BillingCycle.Quarterly:
      return cost * 4;
    case BillingCycle.SemiAnnually:
      return cost * 2;
    case BillingCycle.Annually:
      return cost;
    case BillingCycle.Biannually:
      return cost / 2;
    default:
      return cost * 12; // Default to monthly
  }
};

/**
 * Calculate monthly cost based on billing cycle and cost
 */
export const calculateMonthlyCost = (cost: number, billingCycle: BillingCycle): number => {
  switch (billingCycle) {
    case BillingCycle.Weekly:
      return cost * 4.33; // Average weeks in a month
    case BillingCycle.Monthly:
      return cost;
    case BillingCycle.Quarterly:
      return cost / 3;
    case BillingCycle.SemiAnnually:
      return cost / 6;
    case BillingCycle.Annually:
      return cost / 12;
    case BillingCycle.Biannually:
      return cost / 24;
    default:
      return cost; // Default to monthly
  }
};

/**
 * Group subscriptions by category
 */
export const groupSubscriptionsByCategory = (
  subscriptions: Subscription[]
): Record<number, Subscription[]> => {
  if (!subscriptions) return {};
  
  return subscriptions.reduce((acc, subscription) => {
    const categoryId = subscription.category.id;
    
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    
    acc[categoryId].push(subscription);
    return acc;
  }, {} as Record<number, Subscription[]>);
};

/**
 * Process subscription history to create a readable timeline
 */
export const processSubscriptionHistory = (
  history: any[]
): { date: Date; action: string; changes: string[] }[] => {
  if (!history) return [];
  
  return history.map(item => {
    const changes: string[] = [];
    
    // Process changes object to create readable descriptions
    if (item.changes) {
      Object.entries(item.changes).forEach(([key, value]: [string, any]) => {
        const { oldValue, newValue } = value;
        
        switch (key) {
          case 'name':
            changes.push(`Name changed from "${oldValue}" to "${newValue}"`);
            break;
          case 'cost':
            changes.push(`Cost changed from ${oldValue} to ${newValue}`);
            break;
          case 'billingCycle':
            changes.push(`Billing cycle changed from ${formatBillingCycle(oldValue)} to ${formatBillingCycle(newValue)}`);
            break;
          case 'nextBillingDate':
            changes.push(`Next billing date changed from ${new Date(oldValue).toLocaleDateString()} to ${new Date(newValue).toLocaleDateString()}`);
            break;
          case 'isActive':
            changes.push(newValue ? 'Subscription activated' : 'Subscription deactivated');
            break;
          case 'categoryId':
            changes.push(`Category changed`);
            break;
          default:
            if (oldValue && newValue) {
              changes.push(`${key.charAt(0).toUpperCase() + key.slice(1)} updated`);
            }
        }
      });
    }
    
    // Create action description based on action type
    let action = '';
    switch (item.action) {
      case 'created':
        action = 'Subscription created';
        break;
      case 'updated':
        action = 'Subscription updated';
        break;
      case 'cancelled':
        action = 'Subscription cancelled';
        break;
      case 'reactivated':
        action = 'Subscription reactivated';
        break;
      default:
        action = item.action;
    }
    
    return {
      date: new Date(item.timestamp),
      action,
      changes,
    };
  });
};