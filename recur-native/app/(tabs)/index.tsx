import React, { useEffect } from 'react';
import DashboardScreen from '@/screens/dashboard/DashboardScreen';
import { initializeDashboardData } from '@/store/dashboardStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';

export default function DashboardTab() {
  const { currency } = useAppSettingsStore();
  
  // Initialize dashboard data on mount
  useEffect(() => {
    initializeDashboardData(currency);
  }, [currency]);
  
  return <DashboardScreen />;
}