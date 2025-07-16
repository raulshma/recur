import React, { useState } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { MetricCard } from '@/components/ui/metric-card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, DonutChart } from '@/components/ui/chart';
import { AreaChart } from '@/components/ui/area-chart';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('12months');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - in a real app this would come from your API
  const overviewStats = [
    {
      title: 'Total Spent',
      value: '$2,847.50',
      change: { value: 12.5, type: 'increase' as const, period: 'from last month' },
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
    },
    {
      title: 'Monthly Average',
      value: '$237.29',
      change: { value: 8.2, type: 'increase' as const, period: 'from last month' },
      icon: <ArrowTrendingUpIcon className="h-6 w-6" />,
    },
    {
      title: 'Active Subscriptions',
      value: '14',
      change: { value: 2, type: 'increase' as const, period: 'this month' },
      icon: <ArrowPathIcon className="h-6 w-6" />,
    },
    {
      title: 'Savings Potential',
      value: '$89.99',
      change: { value: 15.3, type: 'decrease' as const, period: 'unused services' },
      icon: <BanknotesIcon className="h-6 w-6" />,
    },
  ];

  // Monthly spending trend data
  const monthlySpendingData = [
    { name: 'Jan', value: 185.50 },
    { name: 'Feb', value: 201.25 },
    { name: 'Mar', value: 189.75 },
    { name: 'Apr', value: 245.80 },
    { name: 'May', value: 267.90 },
    { name: 'Jun', value: 234.60 },
    { name: 'Jul', value: 289.45 },
    { name: 'Aug', value: 312.20 },
    { name: 'Sep', value: 298.75 },
    { name: 'Oct', value: 276.30 },
    { name: 'Nov', value: 254.85 },
    { name: 'Dec', value: 237.29 },
  ];

  // Category breakdown data
  const categoryData = [
    { name: 'Entertainment', value: 89.97, color: '#FF6B35' },
    { name: 'Productivity', value: 67.98, color: '#4ECDC4' },
    { name: 'Development', value: 45.99, color: '#45B7D1' },
    { name: 'Design', value: 33.35, color: '#96CEB4' },
    { name: 'Cloud Storage', value: 25.99, color: '#FFEAA7' },
    { name: 'Communication', value: 19.99, color: '#DDA0DD' },
  ];

  // Yearly comparison data
  const yearlyComparisonData = [
    {
      name: 'Yearly Comparison',
      data: [
        { name: '2022', value: 2156.80 },
        { name: '2023', value: 2847.50 },
        { name: '2024', value: 3124.75 },
      ],
      color: '#FF6B35',
    },
  ];

  // Top subscriptions by cost
  const topSubscriptions = [
    { name: 'Adobe Creative Cloud', cost: 52.99, category: 'Design', trend: 'stable' },
    { name: 'Netflix Premium', cost: 19.99, category: 'Entertainment', trend: 'up' },
    { name: 'GitHub Pro', cost: 19.00, category: 'Development', trend: 'stable' },
    { name: 'Spotify Premium', cost: 15.99, category: 'Entertainment', trend: 'stable' },
    { name: 'Dropbox Plus', cost: 11.99, category: 'Cloud Storage', trend: 'down' },
  ];

  // Upcoming renewals
  const upcomingRenewals = [
    { name: 'Adobe Creative Cloud', cost: 52.99, date: '2024-01-15', daysLeft: 3 },
    { name: 'Netflix Premium', cost: 19.99, date: '2024-01-18', daysLeft: 6 },
    { name: 'Spotify Premium', cost: 15.99, date: '2024-01-22', daysLeft: 10 },
    { name: 'GitHub Pro', cost: 19.00, date: '2024-01-25', daysLeft: 13 },
  ];

  // Cost optimization insights
  const insights = [
    {
      type: 'warning',
      title: 'Duplicate Services',
      description: 'You have 2 music streaming services. Consider canceling one to save $15.99/month.',
      savings: 15.99,
      action: 'Review Services',
    },
    {
      type: 'info',
      title: 'Annual Billing Savings',
      description: 'Switch to annual billing for 3 services to save $47.88 per year.',
      savings: 47.88,
      action: 'Switch to Annual',
    },
    {
      type: 'success',
      title: 'Unused Trial',
      description: 'Your Figma trial ends in 5 days. Decide whether to continue or cancel.',
      savings: 0,
      action: 'Review Trial',
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightBadgeVariant = (type: string) => {
    switch (type) {
      case 'warning':
        return 'warning' as const;
      case 'success':
        return 'success' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Insights and trends for your subscription spending.
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
              <SelectItem value="2years">Last 2 years</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Monthly Spending Chart */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5" />
                    Monthly Spending Trend
                  </CardTitle>
                  <CardDescription>
                    Your subscription costs over the last 12 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChart data={monthlySpendingData} height={300} showValues />
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                  <CardDescription>
                    Current month breakdown
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
            </div>
          </div>

          {/* Top Subscriptions and Upcoming Renewals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Subscriptions */}
            <Card>
              <CardHeader>
                <CardTitle>Top Subscriptions</CardTitle>
                <CardDescription>
                  Highest cost services this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topSubscriptions.map((sub, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{sub.name}</p>
                          <p className="text-sm text-gray-600">{sub.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${sub.cost}</span>
                        {getTrendIcon(sub.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Renewals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5" />
                  Upcoming Renewals
                </CardTitle>
                <CardDescription>
                  Next 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingRenewals.map((renewal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">{renewal.name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(renewal.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${renewal.cost}</p>
                        <Badge variant={renewal.daysLeft <= 7 ? 'warning' : 'default'}>
                          {renewal.daysLeft} days
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Yearly Spending Comparison</CardTitle>
              <CardDescription>
                Compare your spending across different years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AreaChart
                datasets={yearlyComparisonData}
                height={400}
                showGrid
                showAxes
                showLegend
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Growth Rate"
              value="32.1%"
              change={{ value: 5.2, period: "vs last year" }}
              trend="up"
              icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
            />
            <MetricCard
              title="Average Monthly"
              value="$237.29"
              change={{ value: 12.5, period: "vs last year" }}
              trend="up"
              icon={<CurrencyDollarIcon className="h-6 w-6" />}
            />
            <MetricCard
              title="Peak Month"
              value="August"
              change={{ value: 0, period: "$312.20" }}
              trend="neutral"
              icon={<ChartBarIcon className="h-6 w-6" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Category Spending</CardTitle>
                <CardDescription>
                  Monthly spending by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart 
                  data={categoryData.map(cat => ({ name: cat.name, value: cat.value, color: cat.color }))} 
                  height={300} 
                  showValues 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
                <CardDescription>
                  Breakdown and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-black"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span className="font-medium">${category.value}</span>
                      </div>
                      <Progress 
                        value={(category.value / Math.max(...categoryData.map(c => c.value))) * 100} 
                        className="h-2"
                      />
                      <p className="text-sm text-gray-600">
                        {((category.value / categoryData.reduce((sum, c) => sum + c.value, 0)) * 100).toFixed(1)}% of total spending
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cost Optimization */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization</CardTitle>
                <CardDescription>
                  Recommendations to reduce your spending
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{insight.title}</h4>
                            <Badge variant={getInsightBadgeVariant(insight.type)}>
                              {insight.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                          <div className="flex items-center justify-between">
                            {insight.savings > 0 && (
                              <span className="text-sm font-medium text-green-600">
                                Save ${insight.savings}/month
                              </span>
                            )}
                            <Button variant="outline" size="sm">
                              {insight.action}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Spending Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Spending Patterns</CardTitle>
                <CardDescription>
                  Your subscription behavior insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Most Active Day</h4>
                    <p className="text-2xl font-bold text-blue-600">15th</p>
                    <p className="text-sm text-gray-600">Most renewals happen mid-month</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Average Service Life</h4>
                    <p className="text-2xl font-bold text-green-600">18 months</p>
                    <p className="text-sm text-gray-600">How long you keep subscriptions</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Cancellation Rate</h4>
                    <p className="text-2xl font-bold text-orange-600">12%</p>
                    <p className="text-sm text-gray-600">Services canceled within 3 months</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Peak Spending Month</h4>
                    <p className="text-2xl font-bold text-purple-600">August</p>
                    <p className="text-sm text-gray-600">When you spend the most</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;