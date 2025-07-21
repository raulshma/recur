import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import DashboardScreen from '@/screens/dashboard/DashboardScreen';
import { useDashboardStore, initializeDashboardData } from '@/store/dashboardStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';

export default function DashboardTab() {
  const { currency } = useAppSettingsStore();
  
  // Initialize dashboard data on mount
  useEffect(() => {
    initializeDashboardData(currency);
  }, [currency]);
  
  return <DashboardScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});