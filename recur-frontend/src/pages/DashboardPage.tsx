import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, type DashboardStats, type MonthlySpending, type CategorySpending, type UpcomingBill, type RecentActivity } from '../api/dashboard';
import {
  CurrencyDollarIcon,
  RectangleStackIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart, DonutChart } from '@/components/ui/chart';
import { formatCurrency } from '../lib/utils';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [monthlySpendingData, setMonthlySpendingData] = useState<MonthlySpending[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBill[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [stats, monthlySpending, categorySpending, bills, activity] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getMonthlySpending(),
          dashboardApi.getCategorySpending(),
          dashboardApi.getUpcomingBills(),
          dashboardApi.getRecentActivity(),
        ]);

        setDashboardStats(stats);
        setMonthlySpendingData(monthlySpending);
        setCategoryData(categorySpending);
        setUpcomingBills(bills);
        setRecentActivity(activity);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Create stats array from API data
  const stats = dashboardStats ? [
    {
      title: 'Monthly Cost',
      value: formatCurrency(dashboardStats.totalMonthlyCost, user?.currency || 'USD'),
      change: { value: 0, type: 'neutral' as const, period: 'from last month' },
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
    },
    {
      title: 'Active Subscriptions',
      value: dashboardStats.activeSubscriptions.toString(),
      change: { value: 0, type: 'neutral' as const, period: 'from last month' },
      icon: <RectangleStackIcon className="h-6 w-6" />,
    },
    {
      title: 'Upcoming Bills',
      value: dashboardStats.upcomingBills.toString(),
      change: { value: 0, type: 'neutral' as const, period: 'next 7 days' },
      icon: <ClockIcon className="h-6 w-6" />,
    },
    {
      title: 'Trials Ending',
      value: dashboardStats.trialEnding.toString(),
      change: { value: 0, type: 'neutral' as const, period: 'this month' },
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
    },
  ] : [];

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your subscriptions and upcoming bills.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <BellIcon className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Subscription
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Spending Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Monthly Spending Trend
              </CardTitle>
              <CardDescription>
                Your subscription costs over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart data={monthlySpendingData} height={300} showValues />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest changes to your subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <EmptyState
                  icon={<RectangleStackIcon className="h-12 w-12" />}
                  title="No subscriptions yet"
                  description="Start tracking your subscriptions to see your activity here."
                  action={
                    <Button>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add your first subscription
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: activity.categoryColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                      <div className="text-xs text-gray-500 flex-shrink-0">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>
                How your money is distributed
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {categoryData.length > 0 ? (
                <>
                  <DonutChart data={categoryData} size={200} />
                  <div className="mt-4 space-y-2 w-full">
                    {categoryData.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full border border-black"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        <span className="text-sm text-gray-600">{formatCurrency(category.value, user?.currency || 'USD')}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <ChartBarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No spending data yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Bills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5" />
                Upcoming Bills
              </CardTitle>
              <CardDescription>
                Next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingBills.length === 0 ? (
                <div className="text-center py-6">
                  <ClockIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No upcoming bills</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBills.map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: bill.categoryColor }}
                        />
                        <div>
                          <p className="font-medium">{bill.name}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(bill.date).toLocaleDateString()} - {bill.categoryName}
                          </p>
                        </div>
                      </div>
                      <Badge variant="warning">{formatCurrency(bill.amount, user?.currency || 'USD')}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Subscription
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Cog6ToothIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <h4 className="font-medium text-gray-900 mb-2">
                  {dashboardStats?.activeSubscriptions === 0 
                    ? "Start tracking your subscriptions"
                    : "Your subscription overview"
                  }
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {dashboardStats?.activeSubscriptions === 0 
                    ? "Add your first subscription to start getting insights about your spending patterns."
                    : `You have ${dashboardStats?.activeSubscriptions} active subscriptions costing ${formatCurrency(dashboardStats?.totalMonthlyCost || 0, user?.currency || 'USD')} per month.`
                  }
                </p>
                <Button variant="link" className="p-0 h-auto text-orange-600">
                  Learn more
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;