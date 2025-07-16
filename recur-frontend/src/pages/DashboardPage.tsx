import React from 'react';
import { useAuth } from '../context/AuthContext';
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

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Mock data - in a real app this would come from your API
  const stats = [
    {
      title: 'Monthly Cost',
      value: '$0.00',
      change: { value: 0, type: 'neutral' as const, period: 'from last month' },
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
    },
    {
      title: 'Active Subscriptions',
      value: '0',
      change: { value: 0, type: 'neutral' as const, period: 'from last month' },
      icon: <RectangleStackIcon className="h-6 w-6" />,
    },
    {
      title: 'Upcoming Bills',
      value: '0',
      change: { value: 0, type: 'neutral' as const, period: 'next 7 days' },
      icon: <ClockIcon className="h-6 w-6" />,
    },
    {
      title: 'Trials Ending',
      value: '0',
      change: { value: 0, type: 'neutral' as const, period: 'this month' },
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
    },
  ];

  // Mock chart data
  const monthlySpendingData = [
    { name: 'Jan', value: 0 },
    { name: 'Feb', value: 0 },
    { name: 'Mar', value: 0 },
    { name: 'Apr', value: 0 },
    { name: 'May', value: 0 },
    { name: 'Jun', value: 0 },
  ];

  const categoryData = [
    { name: 'Entertainment', value: 0, color: '#FF6B35' },
    { name: 'Productivity', value: 0, color: '#4ECDC4' },
    { name: 'Development', value: 0, color: '#45B7D1' },
    { name: 'Design', value: 0, color: '#96CEB4' },
  ];

  const upcomingBills = [
    // Mock empty data - would be populated from API
  ];

  const recentActivity = [
    // Mock empty data - would be populated from API
  ];

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
                    <span className="text-sm text-gray-600">${category.value}</span>
                  </div>
                ))}
              </div>
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
                  {upcomingBills.map((bill: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">{bill.name}</p>
                        <p className="text-sm text-gray-600">{bill.date}</p>
                      </div>
                      <Badge variant="warning">${bill.amount}</Badge>
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
                  Start tracking your subscriptions
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Add your first subscription to start getting insights about your spending patterns.
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