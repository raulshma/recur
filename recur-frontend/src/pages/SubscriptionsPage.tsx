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
import type { Subscription, CreateSubscriptionRequest, BillingCycle } from '../types';
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

  // Form validation schema
  const formSchema = z.object({
    name: z.string().min(1, 'Service name is required').max(200, 'Name too long'),
    cost: z.string().min(1, 'Cost is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Must be a valid positive number'),
    billingCycle: z.string().min(1, 'Billing cycle is required'),
    nextBillingDate: z.string().min(1, 'Next billing date is required'),
    categoryId: z.string().min(1, 'Category is required'),
    description: z.string().max(1000, 'Description too long').optional(),
    website: z.string().url('Must be a valid URL').max(500, 'URL too long').optional().or(z.literal('')),
    currency: z.string().default('USD'),
    isTrial: z.boolean().default(false),
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
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (subscription.isTrial) {
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
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <TagIcon className="h-5 w-5 text-gray-600" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{row.description}</div>
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
            <div className="text-sm text-gray-500">{getBillingCycleText(row.billingCycle)}</div>
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
          <div className="text-sm text-gray-500">{getDaysUntilBilling(value)}</div>
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
      render: (value: number, _row: Subscription) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <EllipsisHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <EyeIcon className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => {
                setSubscriptionToDelete(value);
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
      };
      
      console.log('Submitting to API:', subscriptionData);
      createSubscriptionMutation.mutate(subscriptionData);
    } catch (error) {
      console.error('Error submitting form:', error);
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
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && sub.isActive) ||
                         (statusFilter === 'inactive' && !sub.isActive) ||
                         (statusFilter === 'trial' && sub.isTrial);
    const matchesTab = activeTab === 'all' ||
                      (activeTab === 'active' && sub.isActive) ||
                      (activeTab === 'trial' && sub.isTrial) ||
                      (activeTab === 'inactive' && !sub.isActive);

    return matchesSearch && matchesCategory && matchesStatus && matchesTab;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.isActive).length,
    trial: subscriptions.filter(s => s.isTrial).length,
    inactive: subscriptions.filter(s => !s.isActive).length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600 mt-1">
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
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Subscription</DialogTitle>
                <DialogDescription>
                  Add a new subscription to track your recurring payments.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                              <SelectItem value="5">Annually</SelectItem>
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
                      name="description"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Subscription</Button>
                  </DialogFooter>
                </form>
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
                <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="text-gray-400">
                <RectangleStackIcon className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
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
                <p className="text-sm font-medium text-gray-600">Trials</p>
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
                <p className="text-sm font-medium text-gray-600">Inactive</p>
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
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
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
    </div>
  );
};

export default SubscriptionsPage;