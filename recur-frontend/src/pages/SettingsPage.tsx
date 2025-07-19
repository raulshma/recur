import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  KeyIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { settingsApi, type UserSettings, type UpdateProfileRequest, type UpdateUserSettingsRequest } from '../api/settings';
import { validateDiscordWebhookUrl } from '../utils/discord-webhook-validator';
import { useToast } from '@/hooks/use-toast';
import { SUPPORTED_CURRENCIES } from '@/lib/utils';
import { CurrencySettings } from '@/components/currency-settings';
import { useTheme } from '@/components/theme-provider';

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [hasUnsavedDiscordChanges, setHasUnsavedDiscordChanges] = useState(false);

  // Form for profile settings
  const profileForm = useForm<UpdateProfileRequest>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      timeZone: user?.timeZone || 'UTC',
      currency: user?.currency || 'USD',
      budgetLimit: user?.budgetLimit || undefined,
    },
  });

  // Form for security settings
  const securityForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  useEffect(() => {
    // Update form when user data changes
    if (user) {
      profileForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        timeZone: user.timeZone || 'UTC',
        currency: user.currency || 'USD',
        budgetLimit: user.budgetLimit || undefined,
      });
    }
  }, [user, profileForm]);

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      setSettingsLoading(true);
      const settings = await settingsApi.getUserSettings();
      
      // Ensure all required currency settings are present
      const defaultSettings = {
        discordNotifications: false,
        discordWebhookUrl: '',
        trialEndingAlerts: false,
        billingReminders: false,
        priceChangeAlerts: false,
        recommendationAlerts: false,
        trialEndingReminderDays: 7,
        billingReminderDays: 3,
        defaultCurrency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeZone: 'UTC',
        theme: 'light',
        enableCurrencyConversion: false,
        autoConvertCurrencies: false,
        preferredDisplayCurrency: 'USD',
        showOriginalCurrency: true,
        showConversionRates: false,
        currencyRefreshInterval: 60
      };
      
      // Merge with defaults to ensure all required properties exist
      const mergedSettings = { ...defaultSettings, ...settings };
      setUserSettings(mergedSettings);
      setHasUnsavedDiscordChanges(false);
    } catch (error) {
      console.error('Failed to fetch user settings:', error);
      // Set default settings on error
      setUserSettings({
        discordNotifications: false,
        discordWebhookUrl: '',
        trialEndingAlerts: false,
        billingReminders: false,
        priceChangeAlerts: false,
        recommendationAlerts: false,
        trialEndingReminderDays: 7,
        billingReminderDays: 3,
        defaultCurrency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeZone: 'UTC',
        theme: 'light',
        enableCurrencyConversion: false,
        autoConvertCurrencies: false,
        preferredDisplayCurrency: 'USD',
        showOriginalCurrency: true,
        showConversionRates: false,
        currencyRefreshInterval: 60
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const timeZones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
  ];

  const themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto (System)' },
  ];

  const onProfileSubmit = async (data: UpdateProfileRequest) => {
    try {
      setLoading(true);
      const response = await settingsApi.updateProfile(data);
      if (response.success && response.user) {
        updateUser(response.user);
        toast({
          title: "Success",
          description: "Profile updated successfully!",
          variant: "success",
        });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSecuritySubmit = async (data: unknown) => {
    try {
      setLoading(true);
      const response = await authApi.changePassword({
        currentPassword: (data as any).currentPassword,
        newPassword: (data as any).newPassword,
        confirmNewPassword: (data as any).confirmNewPassword,
      });
      if (response.success) {
        securityForm.reset();
        toast({
          title: "Success",
          description: "Password changed successfully!",
          variant: "success",
        });
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (key: keyof UserSettings, value: boolean | number | string) => {
    if (!userSettings) return;

    // Special handling for Discord notifications toggle
    if (key === 'discordNotifications' && value === true) {
      // Just update the UI state, don't save yet
      setUserSettings({ ...userSettings, [key]: value });
      return;
    }

    try {
      // Create a copy of the current settings
      const updatedSettings = { ...userSettings, [key]: value };
      console.log(`Updating setting ${key} to:`, value);
      
      // Optimistically update UI
      setUserSettings(updatedSettings);

      // Save to server
      const response = await settingsApi.updateUserSettings(updatedSettings);
      console.log('Settings update response:', response);
      
      // If currency was changed, update the user context as well
      if (key === 'defaultCurrency' && response.user) {
        console.log('Currency changed, updating user context with:', response.user);
        updateUser(response.user);
      }
      
      // If theme was changed, update the theme provider
      if (key === 'theme' && typeof value === 'string') {
        console.log('Theme changed, updating theme provider to:', value);
        setTheme(value as 'light' | 'dark');
      }
      
      // If this is a currency-related setting, we might need to refresh some data
      if (key === 'enableCurrencyConversion' || 
          key === 'preferredDisplayCurrency' || 
          key === 'currencyRefreshInterval') {
        console.log('Currency setting changed, refreshing data if needed');
        // No need to await this, let it happen in the background
        try {
          // Clear any cached currency data that might be using old settings
          if ((window as any).clearCurrencyCache && typeof (window as any).clearCurrencyCache === 'function') {
            (window as any).clearCurrencyCache();
          }
        } catch (cacheError) {
          console.warn('Failed to clear currency cache:', cacheError);
        }
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      // Revert the change on error
      setUserSettings(userSettings);
      
      toast({
        title: "Error",
        description: `Failed to update ${key}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleDiscordSettingsSave = async () => {
    if (!userSettings) return;

    try {
      setLoading(true);
      
      // Validate webhook URL if Discord notifications are enabled
      if (userSettings.discordNotifications) {
        if (!userSettings.discordWebhookUrl) {
          toast({
            title: "Validation Error",
            description: "Please enter a Discord webhook URL",
            variant: "destructive",
          });
          return;
        }
        
        const validation = validateDiscordWebhookUrl(userSettings.discordWebhookUrl);
        if (!validation.isValid) {
          toast({
            title: "Invalid Webhook URL",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }
      }

      // Save Discord settings
      const response = await settingsApi.updateUserSettings(userSettings);
      console.log('Discord settings saved:', response);
      
      toast({
        title: "Success",
        description: "Discord notification settings saved successfully!",
        variant: "success",
      });
      setHasUnsavedDiscordChanges(false);
    } catch (error) {
      console.error('Failed to save Discord settings:', error);
      toast({
        title: "Error",
        description: "Failed to save Discord settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.deleteAccount();
      if (response.success) {
        toast({
          title: "Account Deleted",
          description: "Your account has been successfully deleted.",
          variant: "success",
        });
        // Logout and redirect
        authApi.logout();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleExportData = async () => {
    try {
      const blob = await settingsApi.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recur-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Success",
        description: "Data exported successfully!",
        variant: "success",
      });
    } catch (error) {
      console.error('Failed to export data:', error);
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (settingsLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account settings and preferences.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportData}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-2">
            <CreditCardIcon className="h-4 w-4" />
            Currency
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <BellIcon className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Cog6ToothIcon className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="timeZone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Zone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a time zone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeZones.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Currency</FormLabel>
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
                      control={profileForm.control}
                      name="budgetLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Budget Limit</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Set a monthly spending limit for alerts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Currency Settings */}
        <TabsContent value="currency" className="space-y-6">
          {settingsLoading ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  Currency & Conversion Settings
                </CardTitle>
                <CardDescription>
                  Loading currency settings...
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </CardContent>
            </Card>
          ) : (
            <CurrencySettings
              settings={userSettings || {
                discordNotifications: false,
                discordWebhookUrl: '',
                trialEndingAlerts: false,
                billingReminders: false,
                priceChangeAlerts: false,
                recommendationAlerts: false,
                trialEndingReminderDays: 7,
                billingReminderDays: 3,
                defaultCurrency: 'USD',
                dateFormat: 'MM/DD/YYYY',
                timeZone: 'UTC',
                theme: 'light',
                enableCurrencyConversion: false,
                autoConvertCurrencies: false,
                preferredDisplayCurrency: 'USD',
                showOriginalCurrency: true,
                showConversionRates: false,
                currencyRefreshInterval: 60
              }}
              onSettingChange={handleNotificationChange}
              disabled={loading}
            />
          )}
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellIcon className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {userSettings && (
                <>
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Discord Notifications</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via Discord webhook</p>
                      </div>
                      <Switch
                        checked={userSettings.discordNotifications}
                        onCheckedChange={(checked) => {
                          if (!checked) {
                            // If disabling, save immediately
                            handleNotificationChange('discordNotifications', checked);
                            setHasUnsavedDiscordChanges(false);
                          } else {
                            // If enabling, just update UI state
                            setUserSettings({ ...userSettings, discordNotifications: checked });
                            setHasUnsavedDiscordChanges(true);
                          }
                        }}
                      />
                    </div>
                    
                    {userSettings.discordNotifications && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="discord-webhook">Discord Webhook URL *</Label>
                          <Input
                            id="discord-webhook"
                            type="url"
                            placeholder="https://discord.com/api/webhooks/..."
                            value={userSettings.discordWebhookUrl || ''}
                            onChange={(e) => {
                              const url = e.target.value;
                              setUserSettings({ ...userSettings, discordWebhookUrl: url });
                              setHasUnsavedDiscordChanges(true);
                            }}
                            className={`font-mono text-sm ${
                              userSettings.discordWebhookUrl && 
                              !validateDiscordWebhookUrl(userSettings.discordWebhookUrl).isValid 
                                ? 'border-red-500' 
                                : ''
                            }`}
                          />
                          {userSettings.discordWebhookUrl && (
                            <div className="text-xs">
                              {validateDiscordWebhookUrl(userSettings.discordWebhookUrl).isValid ? (
                                <span className="text-green-600">✓ Valid Discord webhook URL</span>
                              ) : (
                                <span className="text-red-600">
                                  ✗ {validateDiscordWebhookUrl(userSettings.discordWebhookUrl).error}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              onClick={handleDiscordSettingsSave}
                              disabled={loading || !userSettings.discordWebhookUrl}
                              size="sm"
                              className={hasUnsavedDiscordChanges ? 'bg-orange-600 hover:bg-orange-700' : ''}
                            >
                              {loading ? 'Saving...' : hasUnsavedDiscordChanges ? 'Save Changes' : 'Save Discord Settings'}
                            </Button>
                          
                          {userSettings.discordWebhookUrl && validateDiscordWebhookUrl(userSettings.discordWebhookUrl).isValid && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await settingsApi.testDiscordNotification(userSettings.discordWebhookUrl!);
                                  toast({
                                    title: "Success",
                                    description: "Test notification sent successfully!",
                                    variant: "success",
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to send test notification. Please check your webhook URL.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              Test Webhook
                            </Button>
                          )}
                          </div>
                          
                          {hasUnsavedDiscordChanges && (
                            <p className="text-xs text-orange-600">
                              ⚠️ You have unsaved changes. Click "Save Changes" to apply them.
                            </p>
                          )}
                        </div>

                                      <details className="text-xs text-gray-500 dark:text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">How to create a Discord webhook</summary>
                          <div className="mt-2 space-y-1 pl-4">
                            <p>1. Go to your Discord server settings</p>
                            <p>2. Navigate to Integrations → Webhooks</p>
                            <p>3. Click "New Webhook" or "Create Webhook"</p>
                            <p>4. Choose a channel and copy the webhook URL</p>
                            <p>5. Paste the URL above and click "Save Discord Settings"</p>
                            <p>6. Use "Test Webhook" to verify it's working</p>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Trial Ending Alerts</Label>
                                              <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when trials are ending</p>
                    </div>
                    <Switch
                      checked={userSettings.trialEndingAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('trialEndingAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Billing Reminders</Label>
                                              <p className="text-sm text-gray-600 dark:text-gray-400">Reminders before subscription renewals</p>
                    </div>
                    <Switch
                      checked={userSettings.billingReminders}
                      onCheckedChange={(checked) => handleNotificationChange('billingReminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Price Change Alerts</Label>
                                              <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about subscription price changes</p>
                    </div>
                    <Switch
                      checked={userSettings.priceChangeAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('priceChangeAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Recommendation Alerts</Label>
                                              <p className="text-sm text-gray-600 dark:text-gray-400">Receive cost-saving recommendations</p>
                    </div>
                    <Switch
                      checked={userSettings.recommendationAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('recommendationAlerts', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Trial Ending Reminder (days before)</Label>
                      <Select
                        value={userSettings.trialEndingReminderDays.toString()}
                        onValueChange={(value) => handleNotificationChange('trialEndingReminderDays', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Billing Reminder (days before)</Label>
                      <Select
                        value={userSettings.billingReminderDays.toString()}
                        onValueChange={(value) => handleNotificationChange('billingReminderDays', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="2">2 days</SelectItem>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Default Currency</Label>
                      <Select
                        value={userSettings.defaultCurrency}
                        onValueChange={(value) => handleNotificationChange('defaultCurrency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <Select
                        value={userSettings.theme}
                        onValueChange={(value) => handleNotificationChange('theme', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {themes.map((theme) => (
                            <SelectItem key={theme.value} value={theme.value}>
                              {theme.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Monthly Budget Limit</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={userSettings.budgetLimit || ''}
                        onChange={(e) => handleNotificationChange('budgetLimit', e.target.value ? parseFloat(e.target.value) : 0)}
                      />
                                              <p className="text-sm text-gray-600 dark:text-gray-400">Set a monthly spending limit for alerts</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                  <FormField
                    control={securityForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeSlashIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={securityForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Password must be at least 6 characters long
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={securityForm.control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownTrayIcon className="h-5 w-5" />
                Data Export
              </CardTitle>
              <CardDescription>
                Download your subscription data and analytics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium">Export All Data</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Download all your subscription data as JSON
                  </p>
                </div>
                <Button variant="outline" onClick={handleExportData}>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <ExclamationTriangleIcon className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-100">Delete Account</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Permanently delete your account and all data. This cannot be undone.
                  </p>
                </div>
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteAccount} disabled={loading}>
                        {loading ? 'Deleting...' : 'Delete Account'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;