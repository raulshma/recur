import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { THEME } from '@/constants/config';
import { useApiConfig } from '@/hooks/useApiConfig';
import { ThemedView } from '@/components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export const ApiSettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    apiConfigInfo,
    isTestingConnectivity,
    isTestingAuthentication,
    connectivityResult,
    authenticationResult,
    isOnline,
    testConnectivity,
    testAuthentication,
    checkOnlineStatus,
  } = useApiConfig();

  // Check online status on mount
  useEffect(() => {
    checkOnlineStatus();
  }, [checkOnlineStatus]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>API Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* API Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Configuration</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Environment:</Text>
              <Text style={styles.value}>{apiConfigInfo.environment}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>API URL:</Text>
              <Text style={styles.value} numberOfLines={1}>{apiConfigInfo.apiUrl}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Timeout:</Text>
              <Text style={styles.value}>{apiConfigInfo.timeout}ms</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Retry Attempts:</Text>
              <Text style={styles.value}>{apiConfigInfo.retryAttempts}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Logging:</Text>
              <Text style={styles.value}>{apiConfigInfo.enableLogging ? 'Enabled' : 'Disabled'}</Text>
            </View>
          </View>
        </View>

        {/* Network Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Status</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Online Status:</Text>
              {isOnline === null ? (
                <ActivityIndicator size="small" color={THEME.COLORS.PRIMARY} />
              ) : (
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: isOnline ? THEME.COLORS.SUCCESS : THEME.COLORS.ERROR },
                    ]}
                  />
                  <Text style={styles.value}>{isOnline ? 'Online' : 'Offline'}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={checkOnlineStatus}
              disabled={isTestingConnectivity || isTestingAuthentication}
            >
              <Text style={styles.buttonText}>Check Online Status</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* API Connectivity Test Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Connectivity Test</Text>
          <View style={styles.card}>
            {connectivityResult && (
              <View style={styles.testResult}>
                <View style={styles.resultHeader}>
                  <Ionicons
                    name={connectivityResult.success ? 'checkmark-circle' : 'close-circle'}
                    size={24}
                    color={connectivityResult.success ? THEME.COLORS.SUCCESS : THEME.COLORS.ERROR}
                  />
                  <Text
                    style={[
                      styles.resultTitle,
                      {
                        color: connectivityResult.success
                          ? THEME.COLORS.SUCCESS
                          : THEME.COLORS.ERROR,
                      },
                    ]}
                  >
                    {connectivityResult.success ? 'Success' : 'Failed'}
                  </Text>
                </View>
                <Text style={styles.resultMessage}>{connectivityResult.message}</Text>
                {connectivityResult.responseTime && (
                  <Text style={styles.resultDetail}>
                    Response Time: {connectivityResult.responseTime}ms
                  </Text>
                )}
                {connectivityResult.statusCode && (
                  <Text style={styles.resultDetail}>
                    Status Code: {connectivityResult.statusCode}
                  </Text>
                )}
              </View>
            )}
            <TouchableOpacity
              style={styles.button}
              onPress={testConnectivity}
              disabled={isTestingConnectivity || isTestingAuthentication}
            >
              {isTestingConnectivity ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Test API Connectivity</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* API Authentication Test Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Authentication Test</Text>
          <View style={styles.card}>
            {authenticationResult && (
              <View style={styles.testResult}>
                <View style={styles.resultHeader}>
                  <Ionicons
                    name={authenticationResult.success ? 'checkmark-circle' : 'close-circle'}
                    size={24}
                    color={authenticationResult.success ? THEME.COLORS.SUCCESS : THEME.COLORS.ERROR}
                  />
                  <Text
                    style={[
                      styles.resultTitle,
                      {
                        color: authenticationResult.success
                          ? THEME.COLORS.SUCCESS
                          : THEME.COLORS.ERROR,
                      },
                    ]}
                  >
                    {authenticationResult.success ? 'Success' : 'Failed'}
                  </Text>
                </View>
                <Text style={styles.resultMessage}>{authenticationResult.message}</Text>
                {authenticationResult.responseTime && (
                  <Text style={styles.resultDetail}>
                    Response Time: {authenticationResult.responseTime}ms
                  </Text>
                )}
                {authenticationResult.statusCode && (
                  <Text style={styles.resultDetail}>
                    Status Code: {authenticationResult.statusCode}
                  </Text>
                )}
              </View>
            )}
            <TouchableOpacity
              style={styles.button}
              onPress={testAuthentication}
              disabled={isTestingConnectivity || isTestingAuthentication}
            >
              {isTestingAuthentication ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Test API Authentication</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.SPACING.LG,
  },
  section: {
    marginBottom: THEME.SPACING.LG,
  },
  sectionTitle: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.SM,
  },
  card: {
    backgroundColor: THEME.COLORS.SURFACE,
    borderRadius: THEME.BORDER_RADIUS.MD,
    padding: THEME.SPACING.LG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.MD,
  },
  label: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  value: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  button: {
    backgroundColor: THEME.COLORS.PRIMARY,
    borderRadius: THEME.BORDER_RADIUS.SM,
    paddingVertical: THEME.SPACING.MD,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: THEME.SPACING.MD,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: THEME.SPACING.SM,
  },
  testResult: {
    backgroundColor: THEME.COLORS.BACKGROUND,
    borderRadius: THEME.BORDER_RADIUS.SM,
    padding: THEME.SPACING.MD,
    marginBottom: THEME.SPACING.MD,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.SPACING.SM,
  },
  resultTitle: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
    marginLeft: THEME.SPACING.SM,
  },
  resultMessage: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.SM,
  },
  resultDetail: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
});

export default ApiSettingsScreen;