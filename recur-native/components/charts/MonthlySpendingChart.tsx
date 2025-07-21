import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTooltip, VictoryVoronoiContainer, VictoryTheme, VictoryScatter } from 'victory-native';
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
  
  // Format data for Victory chart
  const chartData = data?.map((item, index) => ({
    x: index,
    y: item.totalCost,
    month: item.month,
    year: item.year,
    label: `${formatMonth(item.month)} ${item.year}: ${formatCurrency(item.totalCost, currency)}`,
    ...item,
  })) || [];
  
  // Handle point selection
  const handlePointSelection = (point: any) => {
    const selectedData = data?.find(
      (item) => item.month === point.month && item.year === point.year
    ) || null;
    
    setSelectedPoint(selectedData);
    
    if (onSelectMonth && selectedData) {
      onSelectMonth(selectedData.month, selectedData.year);
    }
  };
  
  // Calculate chart dimensions
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - THEME.SPACING.LG * 2;
  
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
      
      <View style={styles.chartContainer}>
        <VictoryChart
          width={chartWidth}
          height={220}
          padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
          containerComponent={
            <VictoryVoronoiContainer
              voronoiDimension="x"
              labels={({ datum }) => datum.label}
              labelComponent={
                <VictoryTooltip
                  cornerRadius={5}
                  flyoutStyle={{
                    fill: THEME.COLORS.CARD_BACKGROUND,
                    stroke: THEME.COLORS.BORDER,
                    strokeWidth: 1,
                  }}
                  style={{ fill: THEME.COLORS.TEXT_PRIMARY }}
                />
              }
              onActivated={(points) => {
                if (points.length > 0) {
                  handlePointSelection(points[0]);
                }
              }}
            />
          }
        >
          <VictoryAxis
            tickFormat={(t, i) => {
              if (i < chartData.length) {
                return formatMonth(chartData[i].month);
              }
              return '';
            }}
            style={{
              axis: { stroke: THEME.COLORS.BORDER },
              tickLabels: { 
                fill: THEME.COLORS.TEXT_SECONDARY,
                fontSize: 10,
                padding: 5,
              },
              grid: { stroke: 'transparent' },
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(tick) => formatCurrency(tick, currency, true)}
            style={{
              axis: { stroke: THEME.COLORS.BORDER },
              tickLabels: { 
                fill: THEME.COLORS.TEXT_SECONDARY,
                fontSize: 10,
                padding: 5,
              },
              grid: { stroke: `${THEME.COLORS.BORDER}30`, strokeDasharray: '5,5' },
            }}
          />
          <VictoryLine
            data={chartData}
            style={{
              data: { 
                stroke: THEME.COLORS.PRIMARY,
                strokeWidth: 2,
              },
            }}
            animate={{
              duration: 500,
              onLoad: { duration: 500 },
            }}
          />
          <VictoryScatter
            data={chartData}
            size={({ active }) => active ? 6 : 4}
            style={{
              data: {
                fill: THEME.COLORS.PRIMARY,
                stroke: THEME.COLORS.BACKGROUND,
                strokeWidth: 2,
              },
            }}
            animate={{
              duration: 500,
              onLoad: { duration: 500 },
            }}
          />
        </VictoryChart>
      </View>
      
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
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
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