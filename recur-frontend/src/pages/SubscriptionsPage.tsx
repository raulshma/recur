import React, { useState } from 'react';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  RectangleStackIcon,
  StopIcon,
  PlayIcon,
  ClockIcon as HistoryIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '../api/subscriptions';
import { categoriesApi } from '../api/categories';
import type { Subscription, CreateSubscriptionRequest, UpdateSubscriptionRequest, BillingCycle, SubscriptionHistory } from '../types';
import { SUPPORTED_CURRENCIES } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';

const SubscriptionsPage: React.FC = () => {
  const { user } = useAuth();
  const userCurrency = user?.currency || 'USD';
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<Subscription | null>(null);
  
  // Cancellation state
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<Subscription | null>(null);
  
  // Reactivation state
  const [reactivateConfirmOpen, setReactivateConfirmOpen] = useState(false);
  const [subscriptionToReactivate, setSubscriptionToReactivate] = useState<Subscription | null>(null);
  
  // View Details state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [subscriptionToView, setSubscriptionToView] = useState<Subscription | null>(null);
  
  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<Subscription | null>(null);
  
  // History state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [subscriptionForHistory, setSubscriptionForHistory] = useState<Subscription | null>(null);
  
  // Dropdown state management
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch subscriptions from API
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionsApi.getSubscriptions(),
  });

  // Fetch categories from API
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories(),
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: (data: CreateSubscriptionRequest) => subscriptionsApi.createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Subscription created successfully!",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete subscription mutation
  const deleteSubscriptionMutation = useMutation({
    mutationFn: (id: number) => subscriptionsApi.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setDeleteConfirmOpen(false);
      setSubscriptionToDelete(null);
      toast({
        title: "Success",
        description: "Subscription deleted successfully!",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error('Error deleting subscription:', error);
      toast({
        title: "Error",
        description: "Failed to delete subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSubscriptionRequest }) =>
      subscriptionsApi.updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setEditDialogOpen(false);
      setSubscriptionToEdit(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Subscription updated successfully!",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error('Error updating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: (id: number) => subscriptionsApi.cancelSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setCancelConfirmOpen(false);
      setSubscriptionToCancel(null);
      toast({
        title: "Success",
        description: "Subscription cancelled successfully!",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reactivate subscription mutation
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: (id: number) => subscriptionsApi.reactivateSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setReactivateConfirmOpen(false);
      setSubscriptionToReactivate(null);
      toast({
        title: "Success",
        description: "Subscription reactivated successfully!",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error('Error reactivating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to reactivate subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form validation schema
  const formSchema = z.object({
    name: z.string().min(1, 'Service name is required').max(200, 'Name too long'),
    cost: z.string().min(1, 'Cost is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Must be a valid positive number'),
    billingCycle: z.string().min(1, 'Billing cycle is required'),
    nextBillingDate: z.string().min(1, 'Next billing date is required').refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'Next billing date cannot be in the past'),
    categoryId: z.string().min(1, 'Category is required'),
    description: z.string().max(1000, 'Description too long').optional(),
    website: z.string().url('Must be a valid URL').max(500, 'URL too long').optional().or(z.literal('')),
    contactEmail: z.string().email('Must be a valid email').max(200, 'Email too long').optional().or(z.literal('')),
    notes: z.string().max(1000, 'Notes too long').optional(),
    trialEndDate: z.string().optional().refine((date) => {
      if (!date) return true; // Optional field
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate > today;
    }, 'Trial end date must be in the future'),
    currency: z.string().default('USD'),
    isTrial: z.boolean().default(false),
  }).refine((data) => {
    // Cross-field validation: if isTrial is true, trialEndDate should be provided
    if (data.isTrial && !data.trialEndDate) {
      return false;
    }
    return true;
  }, {
    message: 'Trial end date is required when subscription is marked as trial',
    path: ['trialEndDate']
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cost: '',
      billingCycle: '',
      nextBillingDate: '',
      categoryId: '',
      description: '',
      website: '',
      contactEmail: '',
      notes: '',
      trialEndDate: '',
      currency: userCurrency,
      isTrial: false,
    },
  });

  // Separate form instance for editing
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cost: '',
      billingCycle: '',
      nextBillingDate: '',
      categoryId: '',
      description: '',
      website: '',
      contactEmail: '',
      notes: '',
      trialEndDate: '',
      currency: userCurrency,
      isTrial: false,
    },
  });

  const getBillingCycleText = (cycle: number) => {
    const cycles = {
      1: 'Weekly',
      2: 'Monthly',
      3: 'Quarterly',
      4: 'Semi-annually',
      5: 'Annually',
      6: 'Biannually',
    };
    return cycles[cycle as keyof typeof cycles] || 'Unknown';
  };

  const getStatusBadge = (subscription: Subscription) => {
    if (!subscription.isActive) {
      if (subscription.cancellationDate) {
        const daysCancelled = Math.ceil((new Date().getTime() - new Date(subscription.cancellationDate).getTime()) / (1000 * 60 * 60 * 24));
        return (
          <div className="flex flex-col items-start">
            <Badge variant="destructive">Cancelled</Badge>
            <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">{daysCancelled} days ago</span>
          </div>
        );
      }
      return <Badge variant="destructive">Inactive</Badge>;
    }
    
    if (subscription.isTrial) {
      if (subscription.trialEndDate) {
        const daysUntilTrialEnd = Math.ceil((new Date(subscription.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilTrialEnd <= 0) {
          return <Badge variant="destructive">Trial Expired</Badge>;
        } else if (daysUntilTrialEnd <= 3) {
          return (
            <div className="flex flex-col items-start">
              <Badge variant="warning">Trial Ending</Badge>
              <span className="text-xs text-orange-600 dark:text-orange-400 mt-1">{daysUntilTrialEnd} days left</span>
            </div>
          );
        }
      }
      return <Badge variant="warning">Trial</Badge>;
    }
    
    return <Badge variant="success">Active</Badge>;
  };

  const getDaysUntilBilling = (nextBillingDate: string) => {
    const days = Math.ceil((new Date(nextBillingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  const columns = [
    {
      key: 'name' as keyof Subscription,
      header: 'Subscription',
      sortable: true,
      render: (value: string, row: Subscription) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <TagIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">{row.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'cost' as keyof Subscription,
      header: 'Cost',
      sortable: true,
      render: (value: number, row: Subscription) => {
        // Create converted amount object if conversion data is available
        const convertedAmount = row.isConverted && row.convertedCost && row.convertedCurrency && row.exchangeRate && row.rateTimestamp ? {
          originalAmount: value,
          originalCurrency: row.currency,
          convertedAmount: row.convertedCost,
          convertedCurrency: row.convertedCurrency,
          exchangeRate: row.exchangeRate,
          isStale: row.isRateStale,
          timestamp: new Date(row.rateTimestamp)
        } : undefined;

        return (
          <div>
            <CurrencyDisplay
              amount={value}
              currency={row.currency}
              convertedAmount={convertedAmount}
              displayOptions={{ compact: true }}
              className="font-medium"
              showStaleIndicator={true}
            />
            <div className="text-sm text-gray-500 dark:text-gray-500">{getBillingCycleText(row.billingCycle)}</div>
          </div>
        );
      },
    },
    {
      key: 'category' as keyof Subscription,
      header: 'Category',
      render: (value: any) => (
        <Badge
          style={{ backgroundColor: value.color + '20', color: value.color, borderColor: value.color }}
        >
          {value.name}
        </Badge>
      ),
    },
    {
      key: 'nextBillingDate' as keyof Subscription,
      header: 'Next Bill',
      sortable: true,
      render: (value: string) => (
        <div>
          <div className="font-medium">{new Date(value).toLocaleDateString()}</div>
          <div className="text-sm text-gray-500 dark:text-gray-500">{getDaysUntilBilling(value)}</div>
        </div>
      ),
    },
    {
      key: 'isActive' as keyof Subscription,
      header: 'Status',
      render: (_value: boolean, row: Subscription) => getStatusBadge(row),
    },
    {
      key: 'id' as keyof Subscription,
      header: 'Actions',
      render: (value: number, row: Subscription) => (
        <DropdownMenu open={openDropdownId === row.id} onOpenChange={(open) => setOpenDropdownId(open ? row.id : null)}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <EllipsisHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setOpenDropdownId(null);
                setSubscriptionToView(row);
                setViewDialogOpen(true);
              }}
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setOpenDropdownId(null);
                setSubscriptionToEdit(row);
                setEditDialogOpen(true);
                // Pre-populate edit form
                editForm.reset({
                  name: row.name,
                  cost: row.cost.toString(),
                  billingCycle: row.billingCycle.toString(),
                  nextBillingDate: row.nextBillingDate.slice(0, 10), // yyyy-mm-dd format
                  categoryId: row.category.id.toString(),
                  description: row.description ?? '',
                  website: row.website ?? '',
                  contactEmail: row.contactEmail ?? '',
                  notes: row.notes ?? '',
                  trialEndDate: row.trialEndDate ? row.trialEndDate.slice(0, 10) : '',
                  currency: row.currency,
                  isTrial: row.isTrial,
                });
              }}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.isActive ? (
              <DropdownMenuItem 
                className="text-orange-600"
                onClick={() => {
                  setOpenDropdownId(null);
                  setSubscriptionToCancel(row);
                  setCancelConfirmOpen(true);
                }}
              >
                <StopIcon className="h-4 w-4 mr-2" />
                Cancel Subscription
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem 
                className="text-green-600"
                onClick={() => {
                  setOpenDropdownId(null);
                  setSubscriptionToReactivate(row);
                  setReactivateConfirmOpen(true);
                }}
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Reactivate
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                setOpenDropdownId(null);
                setSubscriptionForHistory(row);
                setHistoryDialogOpen(true);
              }}
            >
              <HistoryIcon className="h-4 w-4 mr-2" />
              View History
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => {
                setOpenDropdownId(null);
                setSubscriptionToDelete(row);
                setDeleteConfirmOpen(true);
              }}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    try {
      console.log('Form submission started');
      console.log('Form data:', data);
      
      // Additional client-side validation
      if (data.isTrial && !data.trialEndDate) {
        toast({
          title: "Validation Error",
          description: "Trial end date is required for trial subscriptions.",
          variant: "destructive",
        });
        return;
      }

      if (data.trialEndDate && new Date(data.trialEndDate) <= new Date()) {
        toast({
          title: "Validation Error",
          description: "Trial end date must be in the future.",
          variant: "destructive",
        });
        return;
      }
      
      // Transform form data to API format
      const subscriptionData: CreateSubscriptionRequest = {
        name: data.name,
        description: data.description || undefined,
        cost: Number(data.cost),
        currency: data.currency,
        billingCycle: Number(data.billingCycle) as BillingCycle,
        nextBillingDate: data.nextBillingDate,
        website: data.website || undefined,
        categoryId: Number(data.categoryId),
        isTrial: data.isTrial,
        contactEmail: data.contactEmail || undefined,
        notes: data.notes || undefined,
        trialEndDate: data.trialEndDate || undefined,
      };
      
      console.log('Submitting to API:', subscriptionData);
      createSubscriptionMutation.mutate(subscriptionData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    console.log('Dialog open change:', open);
    setIsAddDialogOpen(open);
    if (!open) {
      console.log('Dialog closing - resetting form');
      form.reset();
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || sub.category.id.toString() === categoryFilter;
    
    // Enhanced status filtering
    const isTrialExpired = sub.isTrial && sub.trialEndDate && new Date(sub.trialEndDate) <= new Date();
    const isTrialActive = sub.isTrial && sub.trialEndDate && new Date(sub.trialEndDate) > new Date();
    
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && sub.isActive && !sub.isTrial) ||
                         (statusFilter === 'inactive' && !sub.isActive) ||
                         (statusFilter === 'trial' && sub.isTrial);
    
    const matchesTab = activeTab === 'all' ||
                      (activeTab === 'active' && sub.isActive && !isTrialExpired) ||
                      (activeTab === 'trial' && sub.isTrial && !isTrialExpired) ||
                      (activeTab === 'inactive' && (!sub.isActive || isTrialExpired));

    return matchesSearch && matchesCategory && matchesStatus && matchesTab;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => {
      const isTrialExpired = s.isTrial && s.trialEndDate && new Date(s.trialEndDate) <= new Date();
      return s.isActive && !isTrialExpired;
    }).length,
    trial: subscriptions.filter(s => {
      const isTrialExpired = s.isTrial && s.trialEndDate && new Date(s.trialEndDate) <= new Date();
      return s.isTrial && !isTrialExpired;
    }).length,
    inactive: subscriptions.filter(s => {
      const isTrialExpired = s.isTrial && s.trialEndDate && new Date(s.trialEndDate) <= new Date();
      return !s.isActive || isTrialExpired;
    }).length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Subscriptions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all your subscription services in one place.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <FunnelIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={() => console.log('Add Subscription button clicked')}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Add New Subscription</DialogTitle>
                <DialogDescription>
                  Add a new subscription to track your recurring payments.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <div className="flex-1 overflow-y-auto">
                  <form id="add-subscription-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Service Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Netflix, Spotify, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="9.99" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SUPPORTED_CURRENCIES.map((currency) => (
                                <SelectItem key={currency.value} value={currency.value}>
                                  {currency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billingCycle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Cycle</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select cycle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">Weekly</SelectItem>
                              <SelectItem value="2">Monthly</SelectItem>
                              <SelectItem value="3">Quarterly</SelectItem>
                              <SelectItem value="4">Semi-annually</SelectItem>
                              <SelectItem value="5">Annually</SelectItem>
                              <SelectItem value="6">Biannually</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nextBillingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Billing Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Website (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Contact Email (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="support@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isTrial"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border border-input"
                            />
                          </FormControl>
                          <FormLabel>Is Trial Subscription</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="trialEndDate"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Trial End Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Additional notes..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  </form>
                </div>
                <DialogFooter className="flex-shrink-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={createSubscriptionMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    form="add-subscription-form"
                    disabled={createSubscriptionMutation.isPending}
                  >
                    {createSubscriptionMutation.isPending ? 'Adding...' : 'Add Subscription'}
                  </Button>
                </DialogFooter>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
              <div className="text-gray-400 dark:text-gray-500">
                <RectangleStackIcon className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="text-green-400">
                <CheckCircleIcon className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trials</p>
                <p className="text-3xl font-bold text-orange-600">{stats.trial}</p>
              </div>
              <div className="text-orange-400">
                <ClockIcon className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</p>
                <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <div className="text-red-400">
                <XCircleIcon className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-500" />
                <Input
                  placeholder="Search subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs and Data Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
              <TabsTrigger value="trial">Trials ({stats.trial})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({stats.inactive})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <EmptyState
              icon={<RectangleStackIcon className="h-12 w-12" />}
              title="No subscriptions found"
              description={
                subscriptions.length === 0
                  ? "Get started by adding your first subscription to track your recurring payments."
                  : "Try adjusting your search or filter criteria."
              }
              action={
                subscriptions.length === 0 ? (
                  <Button onClick={() => {
                    console.log('Opening dialog from empty state');
                    setIsAddDialogOpen(true);
                  }}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add your first subscription
                  </Button>
                ) : null
              }
            />
          ) : (
            <DataTable
              data={filteredSubscriptions}
              columns={columns}
              searchable={false} // We have our own search
            />
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onOpenChange={(open) => {
          if (!open) setSubscriptionToView(null);
          setViewDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              {subscriptionToView?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {subscriptionToView && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Service Name</p>
                <p className="font-medium">{subscriptionToView.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Category</p>
                <Badge
                  style={{
                    backgroundColor: subscriptionToView.category.color + '20',
                    color: subscriptionToView.category.color,
                    borderColor: subscriptionToView.category.color
                  }}
                >
                  {subscriptionToView.category.name}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Cost</p>
                <CurrencyDisplay
                  amount={subscriptionToView.cost}
                  currency={subscriptionToView.currency}
                  convertedAmount={
                    subscriptionToView.isConverted && subscriptionToView.convertedCost && subscriptionToView.convertedCurrency && subscriptionToView.exchangeRate && subscriptionToView.rateTimestamp
                      ? {
                          originalAmount: subscriptionToView.cost,
                          originalCurrency: subscriptionToView.currency,
                          convertedAmount: subscriptionToView.convertedCost,
                          convertedCurrency: subscriptionToView.convertedCurrency,
                          exchangeRate: subscriptionToView.exchangeRate,
                          isStale: subscriptionToView.isRateStale,
                          timestamp: new Date(subscriptionToView.rateTimestamp),
                        }
                      : undefined
                  }
                  showStaleIndicator
                  className="font-medium"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Billing Cycle</p>
                <p className="font-medium">{getBillingCycleText(subscriptionToView.billingCycle)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Next Billing Date</p>
                <p className="font-medium">{new Date(subscriptionToView.nextBillingDate).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {getDaysUntilBilling(subscriptionToView.nextBillingDate)}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Status</p>
                {getStatusBadge(subscriptionToView)}
              </div>

              {subscriptionToView.isTrial && subscriptionToView.trialEndDate && (
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Trial End Date</p>
                  <p className="font-medium">{new Date(subscriptionToView.trialEndDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {getDaysUntilBilling(subscriptionToView.trialEndDate)}
                  </p>
                </div>
              )}

              {!subscriptionToView.isActive && subscriptionToView.cancellationDate && (
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Cancellation Date</p>
                  <p className="font-medium">{new Date(subscriptionToView.cancellationDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {Math.ceil((new Date().getTime() - new Date(subscriptionToView.cancellationDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Website</p>
                {subscriptionToView.website ? (
                  <a
                    href={subscriptionToView.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {subscriptionToView.website}
                  </a>
                ) : (
                  <span className="text-gray-500 dark:text-gray-500">Not provided</span>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Contact Email</p>
                {subscriptionToView.contactEmail ? (
                  <a
                    href={`mailto:${subscriptionToView.contactEmail}`}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {subscriptionToView.contactEmail}
                  </a>
                ) : (
                  <span className="text-gray-500 dark:text-gray-500">Not provided</span>
                )}
              </div>

              {subscriptionToView.description && (
                <div className="col-span-1 sm:col-span-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Description</p>
                  <p className="text-gray-900 dark:text-gray-100">{subscriptionToView.description}</p>
                </div>
              )}

              {subscriptionToView.notes && (
                <div className="col-span-1 sm:col-span-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</p>
                  <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">{subscriptionToView.notes}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Created</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {new Date(subscriptionToView.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Last Updated</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {new Date(subscriptionToView.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subscription Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setSubscriptionToEdit(null);
            editForm.reset();
          }
          setEditDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Make changes to your subscription details.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <div className="flex-1 overflow-y-auto">
              <form
                id="edit-subscription-form"
                onSubmit={editForm.handleSubmit((data) => {
                if (!subscriptionToEdit) return;
                
                const payload: UpdateSubscriptionRequest = {
                  name: data.name,
                  description: data.description || undefined,
                  cost: Number(data.cost),
                  currency: data.currency,
                  billingCycle: Number(data.billingCycle) as BillingCycle,
                  nextBillingDate: data.nextBillingDate,
                  website: data.website || undefined,
                  categoryId: Number(data.categoryId),
                  // Preserve existing flags
                  isActive: subscriptionToEdit.isActive,
                  isTrial: data.isTrial,
                  contactEmail: data.contactEmail || undefined,
                  notes: data.notes || undefined,
                  trialEndDate: data.trialEndDate || undefined,
                };
                
                updateSubscriptionMutation.mutate({ 
                  id: subscriptionToEdit.id, 
                  data: payload 
                });
              })}
              className="space-y-4"
              noValidate
            >
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Service Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Netflix, Spotify, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="9.99" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="billingCycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Cycle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cycle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Weekly</SelectItem>
                          <SelectItem value="2">Monthly</SelectItem>
                          <SelectItem value="3">Quarterly</SelectItem>
                          <SelectItem value="4">Semi-annually</SelectItem>
                          <SelectItem value="5">Annually</SelectItem>
                          <SelectItem value="6">Biannually</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="nextBillingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Billing Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Contact Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="support@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="isTrial"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border border-input"
                        />
                      </FormControl>
                      <FormLabel>Is Trial Subscription</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="trialEndDate"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Trial End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Additional notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
            </div>
            <DialogFooter className="flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={updateSubscriptionMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="edit-subscription-form"
                disabled={updateSubscriptionMutation.isPending}
              >
                {updateSubscriptionMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Subscription"
        description={`Are you sure you want to delete "${subscriptionToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (subscriptionToDelete) {
            deleteSubscriptionMutation.mutate(subscriptionToDelete.id);
          }
        }}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="Cancel Subscription"
        description={`Are you sure you want to cancel "${subscriptionToCancel?.name}"? The subscription will be marked as inactive and the cancellation date will be recorded. You can reactivate it later if needed.`}
        confirmText={cancelSubscriptionMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
        cancelText="Keep Active"
        variant="destructive"
        onConfirm={() => {
          if (subscriptionToCancel && !cancelSubscriptionMutation.isPending) {
            cancelSubscriptionMutation.mutate(subscriptionToCancel.id);
          }
        }}
      />

      {/* Reactivate Confirmation Dialog */}
      <ConfirmationDialog
        open={reactivateConfirmOpen}
        onOpenChange={setReactivateConfirmOpen}
        title="Reactivate Subscription"
        description={`Are you sure you want to reactivate "${subscriptionToReactivate?.name}"? The subscription will be marked as active and the cancellation date will be cleared.`}
        confirmText={reactivateSubscriptionMutation.isPending ? "Reactivating..." : "Reactivate"}
        cancelText="Keep Cancelled"
        variant="default"
        onConfirm={() => {
          if (subscriptionToReactivate && !reactivateSubscriptionMutation.isPending) {
            reactivateSubscriptionMutation.mutate(subscriptionToReactivate.id);
          }
        }}
      />

      {/* Subscription History Dialog */}
      <Dialog 
        open={historyDialogOpen} 
        onOpenChange={(open) => {
          if (!open) setSubscriptionForHistory(null);
          setHistoryDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Subscription History</DialogTitle>
            <DialogDescription>
              {subscriptionForHistory?.name} - Timeline of changes and events
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <SubscriptionHistoryView subscriptionId={subscriptionForHistory?.id} />
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Subscription History Component
const SubscriptionHistoryView: React.FC<{ subscriptionId?: number }> = ({ subscriptionId }) => {
  const { data: history = [], isLoading, error } = useQuery({
    queryKey: ['subscription-history', subscriptionId],
    queryFn: () => subscriptionId ? subscriptionsApi.getSubscriptionHistory(subscriptionId) : Promise.resolve([]),
    enabled: !!subscriptionId,
  });

  const getHistoryIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <PlusIcon className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <PencilIcon className="h-4 w-4 text-blue-600" />;
      case 'cancelled':
        return <StopIcon className="h-4 w-4 text-red-600" />;
      case 'reactivated':
        return <PlayIcon className="h-4 w-4 text-green-600" />;
      case 'trial_ended':
        return <ClockIcon className="h-4 w-4 text-orange-600" />;
      default:
        return <TagIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getHistoryColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'border-green-200 bg-green-50';
      case 'updated':
        return 'border-blue-200 bg-blue-50';
      case 'cancelled':
        return 'border-red-200 bg-red-50';
      case 'reactivated':
        return 'border-green-200 bg-green-50';
      case 'trial_ended':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        Failed to load subscription history. Please try again.
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-500">
        No history events found for this subscription.
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <div className="space-y-4">
        {history.map((event, index) => (
          <div key={event.id} className="relative">
            {/* Timeline line */}
            {index < history.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200 dark:bg-gray-600"></div>
            )}
            
            <div className={`flex items-start space-x-4 p-4 rounded-lg border ${getHistoryColor(event.type)}`}>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-current flex items-center justify-center">
                {getHistoryIcon(event.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{event.title}</h4>
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    {new Date(event.timestamp).toLocaleDateString()} at{' '}
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mt-1">{event.description}</p>
                
                {Object.keys(event.details).length > 0 && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(event.details).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium text-gray-600 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionsPage;