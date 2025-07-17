import { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { CurrencyConversionStatus } from './currency-error-display';
import { formatCurrency } from '../lib/utils';
import type { ConvertedAmount } from '../types';

export interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  showOriginal?: boolean;
  showConversionRate?: boolean;
  className?: string;
  onConversionError?: (error: string) => void;
}

export function CurrencyDisplay({
  amount,
  currency,
  showOriginal,
  showConversionRate,
  className,
  onConversionError
}: CurrencyDisplayProps) {
  const { convertAmount, settings, isConversionEnabled } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState<ConvertedAmount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConversionEnabled || !settings) {
      setConvertedAmount(null);
      return;
    }

    const performConversion = async () => {
      setIsLoading(true);
      setConversionError(null);

      try {
        const result = await convertAmount(amount, currency);
        setConvertedAmount(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
        setConversionError(errorMessage);
        onConversionError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    performConversion();
  }, [amount, currency, convertAmount, isConversionEnabled, settings, onConversionError]);

  const handleRetryConversion = async () => {
    if (!isConversionEnabled || !settings) return;

    setIsLoading(true);
    setConversionError(null);

    try {
      const result = await convertAmount(amount, currency);
      setConvertedAmount(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
      setConversionError(errorMessage);
      onConversionError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show original amount if conversion is disabled or not needed
  if (!isConversionEnabled || !convertedAmount) {
    return (
      <span className={className}>
        {formatCurrency(amount, currency)}
        {isLoading && <span className="ml-1 text-xs text-gray-500">Converting...</span>}
      </span>
    );
  }

  const shouldShowOriginal = showOriginal ?? settings?.showOriginalCurrency ?? false;
  const shouldShowRate = showConversionRate ?? settings?.showConversionRates ?? false;

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <span className="font-medium">
          {formatCurrency(convertedAmount.convertedAmount, convertedAmount.convertedCurrency)}
        </span>
        
        {shouldShowOriginal && (
          <span className="text-sm text-gray-600">
            ({formatCurrency(amount, currency)})
          </span>
        )}
        
        {isLoading && (
          <span className="text-xs text-gray-500">Updating...</span>
        )}
      </div>

      {shouldShowRate && convertedAmount.exchangeRate !== 1 && (
        <div className="text-xs text-gray-500 mt-1">
          1 {currency} = {convertedAmount.exchangeRate.toFixed(4)} {convertedAmount.convertedCurrency}
          {convertedAmount.isStale && (
            <span className="text-yellow-600 ml-1">(Rate may be outdated)</span>
          )}
        </div>
      )}

      <CurrencyConversionStatus
        isConverted={true}
        hasError={!!conversionError}
        errorMessage={conversionError || undefined}
        isStale={convertedAmount.isStale}
        onRetry={handleRetryConversion}
        className="mt-1"
      />
    </div>
  );
}

export interface CurrencyAmountProps {
  amount: number;
  currency: string;
  convertTo?: string;
  showSymbol?: boolean;
  precision?: number;
  className?: string;
}

export function CurrencyAmount({
  amount,
  currency,
  convertTo,
  showSymbol = true,
  precision = 2,
  className
}: CurrencyAmountProps) {
  const { convertAmount, isConversionEnabled } = useCurrency();
  const [displayAmount, setDisplayAmount] = useState(amount);
  const [displayCurrency, setDisplayCurrency] = useState(currency);
  const [isConverted, setIsConverted] = useState(false);

  useEffect(() => {
    if (!isConversionEnabled || !convertTo || convertTo === currency) {
      setDisplayAmount(amount);
      setDisplayCurrency(currency);
      setIsConverted(false);
      return;
    }

    const performConversion = async () => {
      try {
        const result = await convertAmount(amount, currency, convertTo);
        if (result) {
          setDisplayAmount(result.convertedAmount);
          setDisplayCurrency(result.convertedCurrency);
          setIsConverted(true);
        } else {
          setDisplayAmount(amount);
          setDisplayCurrency(currency);
          setIsConverted(false);
        }
      } catch (error) {
        console.warn('Currency conversion failed, showing original amount:', error);
        setDisplayAmount(amount);
        setDisplayCurrency(currency);
        setIsConverted(false);
      }
    };

    performConversion();
  }, [amount, currency, convertTo, convertAmount, isConversionEnabled]);

  const formattedAmount = showSymbol 
    ? formatCurrency(displayAmount, displayCurrency)
    : displayAmount.toFixed(precision);

  return (
    <span className={`${className} ${isConverted ? 'converted-currency' : ''}`}>
      {formattedAmount}
    </span>
  );
}