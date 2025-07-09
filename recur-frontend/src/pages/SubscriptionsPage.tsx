import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

const SubscriptionsPage: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="sm:flex sm:items-center justify-between">
          <div className="sm:flex-auto">
            <h1 className="page-title">Subscriptions</h1>
            <p className="page-subtitle">
              Manage all your subscription services in one place.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Subscription</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="card">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions yet</h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first subscription to track your recurring payments.
          </p>
          <button
            type="button"
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add your first subscription
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsPage; 