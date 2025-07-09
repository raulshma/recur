import React, { useState } from 'react';
import { Cog6ToothIcon, UserIcon, BellIcon, CreditCardIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Personal Information</h3>
                <p className="card-description">Update your account details and profile information</p>
              </div>
              <div className="card-content space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-input"
                      defaultValue={user?.firstName}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-input"
                      defaultValue={user?.lastName}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    defaultValue={user?.email}
                    placeholder="Enter your email address"
                  />
                </div>
                <div className="flex justify-end">
                  <button className="btn-primary">Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Notification Preferences</h3>
                <p className="card-description">Choose how you want to be notified about your subscriptions</p>
              </div>
              <div className="card-content space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-500">Receive alerts about upcoming payments and renewals</p>
                  </div>
                  <input type="checkbox" className="form-checkbox" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Payment Reminders</h4>
                    <p className="text-sm text-gray-500">Get notified 3 days before subscription renewals</p>
                  </div>
                  <input type="checkbox" className="form-checkbox" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Price Change Alerts</h4>
                    <p className="text-sm text-gray-500">Be informed when subscription prices change</p>
                  </div>
                  <input type="checkbox" className="form-checkbox" />
                </div>
                <div className="flex justify-end">
                  <button className="btn-primary">Save Preferences</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Billing Information</h3>
                <p className="card-description">Manage your billing details and payment methods</p>
              </div>
              <div className="card-content">
                <div className="text-center py-12">
                  <CreditCardIcon className="mx-auto h-16 w-16 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Billing Features Coming Soon</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Payment method management and billing history will be available here
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Security Settings</h3>
                <p className="card-description">Manage your password and account security</p>
              </div>
              <div className="card-content space-y-4">
                <div>
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter your current password"
                  />
                </div>
                <div>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter a new password"
                  />
                </div>
                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Confirm your new password"
                  />
                </div>
                <div className="flex justify-end">
                  <button className="btn-primary">Update Password</button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <Cog6ToothIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your account preferences and security settings</p>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="mr-3 h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 