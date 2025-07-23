import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/config';
import { ThemedView } from '@/components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();
  const router = useRouter();
  
  const navigateToApiSettings = () => {
    router.push('/settings/api');
  };
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <View style={styles.content}>
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userDetail}>Currency: {user.currency}</Text>
            {user.firstName && user.lastName && (
              <Text style={styles.userDetail}>
                Name: {user.firstName} {user.lastName}
              </Text>
            )}
          </View>
        )}
        
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={navigateToApiSettings}
          >
            <View style={styles.settingsItemContent}>
              <Ionicons name="server-outline" size={24} color={THEME.COLORS.TEXT_PRIMARY} />
              <Text style={styles.settingsItemText}>API Configuration</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={THEME.COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>
        
        <Button 
          title="Logout" 
          onPress={logout} 
          variant="outline"

        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.LG,
    paddingVertical: THEME.SPACING.MD,
  },
  title: {
    fontSize: THEME.FONT_SIZES.XL,
    fontWeight: '700',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  content: {
    flex: 1,
    padding: THEME.SPACING.LG,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: THEME.SPACING.XL,
    padding: THEME.SPACING.LG,
    backgroundColor: THEME.COLORS.SURFACE,
    borderRadius: THEME.BORDER_RADIUS.MD,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userEmail: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.MD,
  },
  userDetail: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: THEME.SPACING.SM,
  },
  settingsSection: {
    width: '100%',
    marginBottom: THEME.SPACING.XL,
  },
  sectionTitle: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.MD,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.COLORS.SURFACE,
    padding: THEME.SPACING.LG,
    borderRadius: THEME.BORDER_RADIUS.MD,
    marginBottom: THEME.SPACING.MD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    marginLeft: THEME.SPACING.MD,
  },
  logoutButton: {
    marginTop: 'auto',
    width: '100%',
  },
});