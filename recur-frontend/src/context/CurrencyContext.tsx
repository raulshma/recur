import { createContext, useContext, type ReactNode } from 'react';
import { useCurrencyConversion, type UseCurrencyConversionReturn } from '../hooks/use-currency-conversion';

const CurrencyContext = createContext<UseCurrencyConversionReturn | undefined>(undefined);

export interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const currencyConversion = useCurrencyConversion();

  return (
    <CurrencyContext.Provider value={currencyConversion}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

export { CurrencyContext };