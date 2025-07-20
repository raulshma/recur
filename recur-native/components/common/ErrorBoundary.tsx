import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/config';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // TODO: Log error to crash reporting service (Sentry, Crashlytics, etc.)
    // crashReporting.recordError(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We&apos;re sorry, but something unexpected happened. Please try again.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}
            
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.SPACING.LG,
  },
  errorContainer: {
    backgroundColor: THEME.COLORS.SURFACE,
    borderRadius: THEME.BORDER_RADIUS.LG,
    padding: THEME.SPACING.XL,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: THEME.FONT_SIZES.XL,
    fontWeight: 'bold',
    color: THEME.COLORS.TEXT_PRIMARY,
    marginBottom: THEME.SPACING.MD,
    textAlign: 'center',
  },
  message: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: THEME.SPACING.LG,
    lineHeight: 22,
  },
  debugContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: THEME.BORDER_RADIUS.SM,
    padding: THEME.SPACING.MD,
    marginBottom: THEME.SPACING.LG,
    width: '100%',
  },
  debugTitle: {
    fontSize: THEME.FONT_SIZES.SM,
    fontWeight: 'bold',
    color: THEME.COLORS.ERROR,
    marginBottom: THEME.SPACING.SM,
  },
  debugText: {
    fontSize: THEME.FONT_SIZES.XS,
    color: THEME.COLORS.TEXT_SECONDARY,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: THEME.COLORS.PRIMARY,
    borderRadius: THEME.BORDER_RADIUS.MD,
    paddingHorizontal: THEME.SPACING.XL,
    paddingVertical: THEME.SPACING.MD,
  },
  retryButtonText: {
    color: 'white',
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
  },
});