/**
 * Manual tests for enhanced currency utilities
 * Run these tests by importing and calling testCurrencyUtils() in the browser console
 */

import {
  formatCurrency,
  formatConvertedCurrency,
  getCurrencySymbol,
  getCurrencyDisplayName,
  needsCurrencyConversion,
  createConvertedAmount
} from '../utils';
import type { ConvertedAmount, CurrencyConversionResult } from '../../types';

export function testCurrencyUtils() {
  console.log('Testing Enhanced Currency Utilities...');
  
  // Test formatCurrency
  console.log('\n--- formatCurrency Tests ---');
  console.log('Basic USD formatting:', formatCurrency(100, 'USD'));
  console.log('EUR formatting:', formatCurrency(100, 'EUR'));
  
  const convertedAmount: ConvertedAmount = {
    originalAmount: 100,
    originalCurrency: 'EUR',
    convertedAmount: 110,
    convertedCurrency: 'USD',
    exchangeRate: 1.1,
    isStale: false,
    timestamp: new Date()
  };
  
  console.log('With conversion data:', formatCurrency(100, 'EUR', convertedAmount));
  
  // Test formatConvertedCurrency
  console.log('\n--- formatConvertedCurrency Tests ---');
  console.log('Compact mode:', formatConvertedCurrency(convertedAmount, { compact: true }));
  console.log('Show original:', formatConvertedCurrency(convertedAmount, { showOriginal: true }));
  console.log('Show rate:', formatConvertedCurrency(convertedAmount, { showConversionRate: true }));
  console.log('Show all:', formatConvertedCurrency(convertedAmount, { 
    showOriginal: true, 
    showConversionRate: true 
  }));
  
  // Test getCurrencySymbol
  console.log('\n--- getCurrencySymbol Tests ---');
  console.log('USD symbol:', getCurrencySymbol('USD'));
  console.log('EUR symbol:', getCurrencySymbol('EUR'));
  console.log('USD with code:', getCurrencySymbol('USD', true));
  console.log('Unknown currency:', getCurrencySymbol('XYZ'));
  
  // Test getCurrencyDisplayName
  console.log('\n--- getCurrencyDisplayName Tests ---');
  console.log('USD name:', getCurrencyDisplayName('USD'));
  console.log('EUR name:', getCurrencyDisplayName('EUR'));
  console.log('Unknown name:', getCurrencyDisplayName('XYZ'));
  
  // Test needsCurrencyConversion
  console.log('\n--- needsCurrencyConversion Tests ---');
  console.log('EUR to USD:', needsCurrencyConversion('EUR', 'USD'));
  console.log('USD to USD:', needsCurrencyConversion('USD', 'USD'));
  
  // Test createConvertedAmount
  console.log('\n--- createConvertedAmount Tests ---');
  const conversionResult: CurrencyConversionResult = {
    convertedAmount: 110,
    exchangeRate: 1.1,
    rateTimestamp: new Date().toISOString(),
    isStale: false,
    fromCurrency: 'EUR',
    toCurrency: 'USD'
  };
  
  const result = createConvertedAmount(100, 'EUR', conversionResult);
  console.log('Created ConvertedAmount:', result);
  
  // Test with stale rate
  const oldTimestamp = new Date();
  oldTimestamp.setDate(oldTimestamp.getDate() - 2);
  
  const staleResult: CurrencyConversionResult = {
    convertedAmount: 110,
    exchangeRate: 1.1,
    rateTimestamp: oldTimestamp.toISOString(),
    isStale: false,
    fromCurrency: 'EUR',
    toCurrency: 'USD'
  };
  
  const staleConversion = createConvertedAmount(100, 'EUR', staleResult);
  console.log('Stale conversion (should be true):', staleConversion.isStale);
  
  console.log('\n✅ All currency utility tests completed!');
}