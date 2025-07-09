import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <ChartBarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">Track your subscription spending patterns and trends</p>
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Overview */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Monthly Spending</h2>
            <p className="card-description">Your subscription costs over time</p>
          </div>
          <div className="card-content">
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Chart Coming Soon</h3>
                <p className="mt-1 text-sm text-gray-500">Analytics features will be implemented here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Category Breakdown</h2>
            <p className="card-description">Spending by subscription category</p>
          </div>
          <div className="card-content">
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Chart Coming Soon</h3>
                <p className="mt-1 text-sm text-gray-500">Category analytics will be shown here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Spending Trends */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title">Spending Trends</h2>
            <p className="card-description">Year-over-year comparison and forecasting</p>
          </div>
          <div className="card-content">
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Advanced Analytics Coming Soon</h3>
                <p className="mt-2 text-sm text-gray-500">
                  This section will include detailed spending trends, forecasting, and insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage; 