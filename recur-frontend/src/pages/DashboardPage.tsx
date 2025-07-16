import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CurrencyDollarIcon,
  RectangleStackIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Mock data - in a real app this would come from your API
  const stats = [
    {
      id: 1,
      name: 'Monthly Cost',
      value: '$0.00',
      change: '+0%',
      changeType: 'neutral',
      icon: CurrencyDollarIcon,
      color: 'primary',
    },
    {
      id: 2,
      name: 'Active Subscriptions',
      value: '0',
      change: '+0',
      changeType: 'neutral',
      icon: RectangleStackIcon,
      color: 'success',
    },
    {
      id: 3,
      name: 'Upcoming Bills',
      value: '0',
      change: 'Next 7 days',
      changeType: 'neutral',
      icon: ClockIcon,
      color: 'warning',
    },
    {
      id: 4,
      name: 'Trials Ending',
      value: '0',
      change: 'This month',
      changeType: 'neutral',
      icon: ExclamationTriangleIcon,
      color: 'danger',
    },
  ];

  const getIconColorClass = (color: string) => {
    switch (color) {
      case 'primary':
        return 'bg-primary-500 text-white';
      case 'success':
        return 'bg-success-500 text-white';
      case 'warning':
        return 'bg-warning-500 text-white';
      case 'danger':
        return 'bg-danger-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="page-subtitle">
              Here's an overview of your subscriptions and upcoming bills.
            </p>
          </div>
          <Button className="btn-primary flex items-center space-x-2">
            <PlusIcon className="h-5 w-5" />
            <span>Add Subscription</span>
          </Button>
          {/* <button className="btn-primary flex items-center space-x-2">

          </button> */}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.id} className="metric-card group">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getIconColorClass(stat.color)} shadow-sm`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="metric-label">{stat.name}</p>
                  <p className="metric-value">{stat.value}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{stat.change}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <button className="btn-ghost text-sm">View all</button>
            </div>

            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <RectangleStackIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No subscriptions yet</h4>
              <p className="text-gray-600 mb-6">
                Start tracking your subscriptions to see your activity here.
              </p>
              <button className="btn-primary">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add your first subscription
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions & Insights */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200 text-left">
                <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
                  <PlusIcon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-900">Add Subscription</span>
              </button>

              <button className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-success-300 hover:bg-success-50 transition-colors duration-200 text-left">
                <div className="w-8 h-8 bg-success-100 text-success-600 rounded-lg flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-900">View Analytics</span>
              </button>

              <button className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-warning-300 hover:bg-warning-50 transition-colors duration-200 text-left">
                <div className="w-8 h-8 bg-warning-100 text-warning-600 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-900">Set Reminders</span>
              </button>
            </div>
          </div>

          {/* Insights Card */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Insights</h3>
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-lg border border-primary-100">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Start tracking your subscriptions
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Add your first subscription to start getting insights about your spending patterns.
              </p>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Learn more →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 