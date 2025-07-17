import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface CurrencyErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  showRetry?: boolean;
  variant?: 'default' | 'destructive' | 'warning';
  className?: string;
}

export function CurrencyErrorDisplay({ 
  error, 
  onRetry, 
  showRetry = true, 
  variant = 'warning',
  className 
}: CurrencyErrorDisplayProps) {
  if (!error) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4" />;
    }
  };

  return (
    <Alert className={`${getVariantStyles()} ${className}`}>
      {getIcon()}
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        {showRetry && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-2 h-6 px-2 text-xs"
          >
            <ArrowPathIcon className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export interface CurrencyConversionStatusProps {
  isConverted: boolean;
  hasError?: boolean;
  errorMessage?: string;
  isStale?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function CurrencyConversionStatus({
  isConverted,
  hasError,
  errorMessage,
  isStale,
  onRetry,
  className
}: CurrencyConversionStatusProps) {
  if (!isConverted && !hasError) return null;

  if (hasError && errorMessage) {
    return (
      <CurrencyErrorDisplay
        error={errorMessage}
        onRetry={onRetry}
        variant="warning"
        className={className}
      />
    );
  }

  if (isStale) {
    return (
      <div className={`text-xs text-yellow-600 ${className}`}>
        ⚠️ Exchange rate may be outdated
      </div>
    );
  }

  return null;
}