import React, { useState, useEffect } from "react";
import {
  analyticsApi,
  type AnalyticsOverview,
  type MonthlySpending,
  type CategorySpending,
  type YearlyComparison,
  type TopSubscription,
  type Insight,
  type SpendingPatterns,
} from "../api/analytics";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../lib/utils";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, DonutChart } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("12months");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for dynamic data
  const [analyticsOverview, setAnalyticsOverview] =
    useState<AnalyticsOverview | null>(null);
  const [monthlySpendingData, setMonthlySpendingData] = useState<
    MonthlySpending[]
  >([]);
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([]);
  const [yearlyComparisonData, setYearlyComparisonData] = useState<
    YearlyComparison[]
  >([]);
  const [topSubscriptions, setTopSubscriptions] = useState<TopSubscription[]>(
    []
  );
  const [insights, setInsights] = useState<Insight[]>([]);
  const [spendingPatterns, setSpendingPatterns] =
    useState<SpendingPatterns | null>(null);
    const fetchAnalyticsData = React.useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
  
        // Use user's preferred currency for all API calls
        const userCurrency = user?.currency || "USD";
  
        const [
          overview,
          monthlySpending,
          categorySpending,
          yearlyComparison,
          topSubs,
          analyticsInsights,
          patterns,
        ] = await Promise.all([
          analyticsApi.getOverview(timeRange, userCurrency),
          analyticsApi.getExtendedMonthlySpending(timeRange, userCurrency),
          analyticsApi.getCategorySpending(userCurrency),
          analyticsApi.getYearlyComparison(userCurrency),
          analyticsApi.getTopSubscriptions(userCurrency),
          analyticsApi.getInsights(userCurrency),
          analyticsApi.getSpendingPatterns(userCurrency),
        ]);
  
        setAnalyticsOverview(overview);
        setMonthlySpendingData(monthlySpending);
        setCategoryData(categorySpending);
        setYearlyComparisonData(yearlyComparison);
        setTopSubscriptions(topSubs);
        setInsights(analyticsInsights);
        setSpendingPatterns(patterns);
      } catch (err) {
        console.error("Failed to fetch analytics data:", err);
        setError("Failed to load analytics data. Please try again.");
      } finally {
        setLoading(false);
      }
    }, [timeRange, user?.currency]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Create stats array from API data - use the currency from the API response
  // This ensures we're using the same currency that was used for conversion
  const displayCurrency =
    analyticsOverview?.displayCurrency || user?.currency || "USD";
  const overviewStats = analyticsOverview
    ? [
        {
          title: "Total Spent",
          value: formatCurrency(analyticsOverview.totalSpent, displayCurrency),
          change: {
            value: 0,
            type: "neutral" as const,
            period: "from last month",
          },
          icon: <CurrencyDollarIcon className="h-6 w-6" />,
        },
        {
          title: "Monthly Average",
          value: formatCurrency(
            analyticsOverview.monthlyAverage,
            displayCurrency
          ),
          change: {
            value: 0,
            type: "neutral" as const,
            period: "from last month",
          },
          icon: <ArrowTrendingUpIcon className="h-6 w-6" />,
        },
        {
          title: "Active Subscriptions",
          value: analyticsOverview.activeSubscriptions.toString(),
          change: { value: 0, type: "neutral" as const, period: "this month" },
          icon: <ArrowPathIcon className="h-6 w-6" />,
        },
        {
          title: "Savings Potential",
          value: formatCurrency(
            analyticsOverview.savingsPotential,
            displayCurrency
          ),
          change: {
            value: 0,
            type: "neutral" as const,
            period: "unused services",
          },
          icon: <BanknotesIcon className="h-6 w-6" />,
        },
      ]
    : [];

  // Transform yearly comparison data for chart
  const yearlyComparisonChartData =
    yearlyComparisonData.length > 0
      ? [
          {
            name: "Yearly Comparison",
            data: yearlyComparisonData.map((item) => ({
              name: item.year,
              value: item.value,
            })),
            color: "#FF6B35",
          },
        ]
      : [];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "info":
      default:
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightBadgeVariant = (type: string) => {
    switch (type) {
      case "warning":
        return "warning" as const;
      case "success":
        return "success" as const;
      case "info":
      default:
        return "secondary" as const;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
      case "down":
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
      case "stable":
      default:
        return <div className="h-4 w-4 bg-gray-400 dark:bg-gray-500 rounded-full" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
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
            <Button onClick={() => fetchAnalyticsData()} className="mt-4">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Deep insights into your subscription spending patterns and trends.
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
              <SelectItem value="24months">Last 24 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
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
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Spending Chart */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5" />
                    Monthly Spending Trend
                  </CardTitle>
                  <CardDescription>
                    Your subscription costs over the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlySpendingData.length > 0 ? (
                    <BarChart
                      data={monthlySpendingData}
                      height={300}
                      showValues
                    />
                  ) : (
                    <EmptyState
                      icon={<ChartBarIcon className="h-12 w-12" />}
                      title="No spending data"
                      description="Start adding subscriptions to see your spending trends."
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>How your money is distributed</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {categoryData.length > 0 ? (
                  <>
                    <DonutChart data={categoryData} size={200} />
                    <div className="mt-4 space-y-2 w-full">
                      {categoryData.map((category, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full border border-black"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm font-medium">
                              {category.name}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(category.value, displayCurrency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={<ChartBarIcon className="h-8 w-8" />}
                    title="No category data"
                    description="Add subscriptions to see category breakdown."
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Top Subscriptions by Cost</CardTitle>
              <CardDescription>
                Your most expensive active subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topSubscriptions.length > 0 ? (
                <div className="space-y-4">
                  {topSubscriptions.map((subscription, index) => (
                    <div
                      key={subscription.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-gray-500 dark:text-gray-500">
                          #{index + 1}
                        </div>
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: subscription.categoryColor,
                          }}
                        />
                        <div>
                          <p className="font-medium">{subscription.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {subscription.categoryName} -{" "}
                            {subscription.billingCycle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(subscription.trend)}
                        <span className="font-bold">
                          {formatCurrency(subscription.cost, displayCurrency)}
                          /mo
                          {subscription.originalCurrency &&
                            subscription.originalCurrency !==
                              displayCurrency && (
                              <span className="text-sm text-gray-500 dark:text-gray-500 ml-1">
                                (
                                {formatCurrency(
                                  subscription.originalCost,
                                  subscription.originalCurrency
                                )}
                                )
                              </span>
                            )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<CurrencyDollarIcon className="h-12 w-12" />}
                  title="No subscriptions"
                  description="Add subscriptions to see your top expenses."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Yearly Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Yearly Comparison</CardTitle>
                <CardDescription>
                  Annual spending comparison over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {yearlyComparisonChartData.length > 0 ? (
                  <BarChart
                    data={yearlyComparisonChartData[0].data}
                    height={300}
                    showValues
                  />
                ) : (
                  <EmptyState
                    icon={<CalendarDaysIcon className="h-12 w-12" />}
                    title="No yearly data"
                    description="Need more historical data for yearly comparison."
                  />
                )}
              </CardContent>
            </Card>

            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>
                  Spending breakdown with percentages
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <div className="space-y-4">
                    {categoryData.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(category.value, displayCurrency)}
                          </span>
                        </div>
                        <Progress
                          value={
                            (category.value /
                              Math.max(...categoryData.map((c) => c.value))) *
                            100
                          }
                          className="h-2"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {(
                            (category.value /
                              categoryData.reduce(
                                (sum, c) => sum + c.value,
                                0
                              )) *
                            100
                          ).toFixed(1)}
                          % of total spending
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<ChartBarIcon className="h-8 w-8" />}
                    title="No category data"
                    description="Add subscriptions to see performance metrics."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Optimization */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization</CardTitle>
                <CardDescription>Recommendations to save money</CardDescription>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <div className="space-y-4">
                    {insights.map((insight, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{insight.title}</h4>
                              <Badge
                                variant={getInsightBadgeVariant(insight.type)}
                              >
                                {insight.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {insight.description}
                            </p>
                            <div className="flex items-center justify-between">
                              {insight.savings > 0 && (
                                <span className="text-sm font-medium text-green-600">
                                  Save{" "}
                                  {formatCurrency(
                                    insight.savings,
                                    displayCurrency
                                  )}
                                  /month
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
                ) : (
                  <EmptyState
                    icon={<ExclamationTriangleIcon className="h-12 w-12" />}
                    title="No insights available"
                    description="Add more subscriptions to get personalized insights."
                  />
                )}
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
                {spendingPatterns ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Most Active Day</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {spendingPatterns.mostActiveDay}th
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Most renewals happen on this day
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Average Service Life</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {spendingPatterns.averageServiceLifeMonths.toFixed(1)}{" "}
                        months
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        How long you keep subscriptions
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Cancellation Rate</h4>
                      <p className="text-2xl font-bold text-orange-600">
                        {spendingPatterns.cancellationRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Services canceled within 3 months
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Peak Spending Month</h4>
                      <p className="text-2xl font-bold text-purple-600">
                        {spendingPatterns.peakSpendingMonth}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        When you spend the most
                      </p>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={<ChartBarIcon className="h-12 w-12" />}
                    title="No pattern data"
                    description="Need more subscription history to analyze patterns."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
