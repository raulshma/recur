import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card } from '../common/Card';
import { THEME } from '@/constants/config';
import { Skeleton } from '../common/Skeleton';
import { CurrencyBreakdown as CurrencyBreakdownType } from '@/types';
import { formatCurrency, areExchangeRatesStale } from '@/utils/currencyUtils';

interface CurrencyItemProps {
  item: CurrencyBreakdownType;
  displayCurrency: string;
}

const CurrencyItem: React.FC<CurrencyItemProps> = ({ item, displayCurrency }) => {
  const isConverted = item.currency !== displayCurrency;
  const isStale = isConverted && areExchangeRatesStale(Date.now() - 3600000); // Assuming 1 hour old rates
  
  return (
    <View style={styles.currencyItem}>
      <View style={styles.currencyInfo}>
        <Text style={styles.currencyCode}>{item.currency}</Text>
        <Text style={styles.subscriptionCount}>
          {item.subscriptionCount} {item.subscriptionCount === 1 ? 'subscription' : 'subscriptions'}
        </Text>
      </View>
      
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>
          {formatCurrency(item.totalCost, item.currency)}
        </Text>
        
        {isConverted && (
          <View style={styles.conversionContainer}>
            <Text style={styles.convertedAmount}>
              {formatCurrency(item.convertedCost, displayCurrency)}
            </Text>
            <View style={[
              styles.exchangeRateBadge, 
              isStale ? styles.staleRate : {}
            ]}>
              <Text style={[
                styles.exchangeRateText,
                isStale ? styles.staleRateText : {}
              ]}>
                1 {item.currency} = {item.exchangeRate.toFixed(4)} {displayCurrency}
                {isStale ? ' (stale)' : ''}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

interface CurrencyBreakdownProps {
  breakdowns: CurrencyBreakdownType[];
  displayCurrency: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const CurrencyBreakdown: React.FC<CurrencyBreakdownProps> = ({
  breakdowns,
  displayCurrency,
  isLoading = false,
  onRefresh,
}) => {
  if (isLoading) {
    return (
      <Card title="Currency Breakdown" variant="default" style={styles.card}>
        <View style={styles.loadingContainer}>
          <Skeleton height={24} style={styles.skeletonItem} />
          <Skeleton height={24} style={styles.skeletonItem} />
          <Skeleton height={24} style={styles.skeletonItem} />
        </View>
      </Card>
    );
  }
  
  if (!breakdowns || breakdowns.length === 0) {
    return (
      <Card title="Currency Breakdown" variant="default" style={styles.card}>
        <Text style={styles.emptyText}>No currency data available</Text>
      </Card>
    );
  }
  
  return (
    <Card title="Currency Breakdown" variant="default" style={styles.card}>
      <FlatList
        data={breakdowns}
        keyExtractor={(item) => item.currency}
        renderItem={({ item }) => (
          <CurrencyItem item={item} displayCurrency={displayCurrency} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        scrollEnabled={false}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: THEME.SPACING.MD,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: THEME.SPACING.SM,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  subscriptionCount: {
    fontSize: THEME.FONT_SIZES.XS,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  conversionContainer: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  convertedAmount: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  exchangeRateBadge: {
    backgroundColor: `${THEME.COLORS.PRIMARY}15`,
    paddingHorizontal: THEME.SPACING.XS,
    paddingVertical: 2,
    borderRadius: THEME.BORDER_RADIUS.SM,
    marginTop: 2,
  },
  exchangeRateText: {
    fontSize: THEME.FONT_SIZES.XS,
    color: THEME.COLORS.PRIMARY,
  },
  staleRate: {
    backgroundColor: `${THEME.COLORS.WARNING}15`,
  },
  staleRateText: {
    color: THEME.COLORS.WARNING,
  },
  separator: {
    height: 1,
    backgroundColor: THEME.COLORS.BORDER,
    opacity: 0.5,
  },
  loadingContainer: {
    paddingVertical: THEME.SPACING.SM,
  },
  skeletonItem: {
    marginVertical: THEME.SPACING.SM,
  },
  emptyText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    paddingVertical: THEME.SPACING.LG,
  },
});