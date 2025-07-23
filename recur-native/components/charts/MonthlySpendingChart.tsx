import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

import { THEME } from '@/constants/config';
import { MonthlySpending } from '@/types';
import { formatCurrency } from '@/utils/currencyUtils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface MonthlySpendingChartProps {
  data: MonthlySpending[] | null;
  currency: string;
  isLoading: boolean;
  onSelectMonth?: (month: string, year: number) => void;
}

export const MonthlySpendingChart: React.FC<MonthlySpendingChartProps> = ({
  data,
  currency,
  isLoading,
  onSelectMonth,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<MonthlySpending | null>(null);
  
  // Format month names for display
  const formatMonth = (month: string): string => {
    return month.substring(0, 3); // Jan, Feb, etc.
  };
  
  // Handle point selection
  const handlePointSelection = (point: MonthlySpending) => {
    setSelectedPoint(point);
    
    if (onSelectMonth) {
      onSelectMonth(point.month, point.year);
    }
  };
  
  // Calculate chart dimensions
  
  // If loading and no data, show loading spinner
  if (isLoading && !data?.length) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="small" />
      </View>
    );
  }
  
  // If no data, show empty state
  if (!data?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No spending data available</Text>
      </View>
    );
  }
  
  // Find max value for scaling
  const maxValue = Math.max(...data.map(item => item.totalCost));
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Spending</Text>
        {selectedPoint && (
          <Text style={styles.selectedMonth}>
            {selectedPoint.month} {selectedPoint.year}
          </Text>
        )}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScrollContainer}
      >
        <View style={styles.chartContainer}>
          {/* Chart bars */}
          {data.map((item, index) => {
            const barHeight = (item.totalCost / maxValue) * 150;
            const isSelected = selectedPoint && 
              selectedPoint.month === item.month && 
              selectedPoint.year === item.year;
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.barContainer}
                onPress={() => handlePointSelection(item)}
              >
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: barHeight,
                      backgroundColor: isSelected ? THEME.COLORS.PRIMARY : `${THEME.COLORS.PRIMARY}80`,
                    }
                  ]}
                />
                <Text style={styles.barLabel}>
                  {formatMonth(item.month)}
                </Text>
                <Text style={styles.barValue}>
                  {formatCurrency(item.totalCost, currency, { compact: true })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner size="small" />
        </View>
      )}
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: THEME.COLORS.PRIMARY }]} />
          <Text style={styles.legendText}>Monthly Spending</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => onSelectMonth && onSelectMonth('all', new Date().getFullYear())}
      >
        <Text style={styles.viewAllText}>View All Analytics</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.COLORS.CARD_BACKGROUND,
    borderRadius: THEME.BORDER_RADIUS.LG,
    padding: THEME.SPACING.MD,
    marginVertical: THEME.SPACING.MD,
    shadowColor: THEME.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.MD,
  },
  title: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  selectedMonth: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  chartScrollContainer: {
    paddingRight: THEME.SPACING.MD,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 220,
    paddingTop: THEME.SPACING.MD,
  },
  barContainer: {
    alignItems: 'center',
    width: 50,
    marginRight: THEME.SPACING.SM,
  },
  bar: {
    width: 20,
    borderRadius: THEME.BORDER_RADIUS.SM,
    marginBottom: THEME.SPACING.SM,
  },
  barLabel: {
    fontSize: THEME.FONT_SIZES.XS,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginBottom: THEME.SPACING.XS,
  },
  barValue: {
    fontSize: THEME.FONT_SIZES.XS,
    color: THEME.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  loadingContainer: {
    backgroundColor: THEME.COLORS.CARD_BACKGROUND,
    borderRadius: THEME.BORDER_RADIUS.LG,
    padding: THEME.SPACING.MD,
    marginVertical: THEME.SPACING.MD,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${THEME.COLORS.BACKGROUND}80`,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: THEME.BORDER_RADIUS.LG,
  },
  emptyContainer: {
    backgroundColor: THEME.COLORS.CARD_BACKGROUND,
    borderRadius: THEME.BORDER_RADIUS.LG,
    padding: THEME.SPACING.MD,
    marginVertical: THEME.SPACING.MD,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: THEME.SPACING.SM,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: THEME.SPACING.SM,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: THEME.SPACING.XS,
  },
  legendText: {
    fontSize: THEME.FONT_SIZES.XS,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  viewAllButton: {
    alignSelf: 'center',
    marginTop: THEME.SPACING.MD,
    paddingVertical: THEME.SPACING.XS,
    paddingHorizontal: THEME.SPACING.MD,
    borderRadius: THEME.BORDER_RADIUS.MD,
    backgroundColor: `${THEME.COLORS.PRIMARY}10`,
  },
  viewAllText: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.PRIMARY,
    fontWeight: '500',
  },
});