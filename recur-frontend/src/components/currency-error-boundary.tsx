import { Component, type ReactNode, type ErrorInfo } from 'react';
import { CurrencyErrorDisplay } from './currency-error-display';

interface CurrencyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface CurrencyErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class CurrencyErrorBoundary extends Component<
  CurrencyErrorBoundaryProps,
  CurrencyErrorBoundaryState
> {
  constructor(props: CurrencyErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): CurrencyErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for debugging
    console.error('Currency Error Boundary caught an error:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'An error occurred with currency operations';
      
      return (
        <div className="p-4">
          <CurrencyErrorDisplay
            error={errorMessage}
            onRetry={this.handleRetry}
            variant="destructive"
          />
          {import.meta.env.DEV && this.state.errorInfo && (
            <details className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {this.state.error?.stack}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}