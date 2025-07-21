import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { VictoryPie, VictoryLabel, VictoryLegend } from 'victory-native';
import { THEME } from '@/constants/config';
import { CategorySpending } from '@/types';
import { formatCurrency } from '@/utils/currencyUtils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface CategorySpendingChartProps {
  data: CategorySpending[] | null;
  currency: string;
  isLoading: boolean;
  onSelectCategory?: (categoryId: number) => void;
}

export const CategorySpendingChart: React.FC<CategorySpendingChartProps> = ({
  data,
  currency,
  isLoading,
  onSelectCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategorySpending | null>(null);
  
  // Format data for Victory chart
  const chartData = data?.map((item) => ({
    x: item.categoryName,
    y: item.totalCost,
    color: item.categoryColor,
    label: `${item.categoryName}: ${formatCurrency(item.totalCost, currency)}`,
    ...item,
  })) || [];
  
  // Create legend data
  const legendData = data?.map((item) => ({
    name: `${item.categoryName} (${item.subscriptionCount})`,
    symbol: { fill: item.categoryColor },
    labels: { fill: THEME.COLORS.TEXT_SECONDARY },
  })) || [];
  
  // Handle category selection
  const handleCategorySelection = (category: CategorySpending) => {
    setSelectedCategory(category);
    
    if (onSelectCategory) {
      onSelectCategory(category.categoryId);
    }
  };
  
  // Calculate chart dimensions
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - THEME.SPACING.LG * 2;
  
  // Calculate total spending
  const totalSpending = data?.reduce((sum, item) => sum + item.totalCost, 0) || 0;
  
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
        <Text style={styles.emptyText}>No category data available</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Category Breakdown</Text>
        <Text style={styles.totalText}>
          {formatCurrency(totalSpending, currency)}
        </Text>
      </View>
      
      <View style={styles.chartContainer}>
        <VictoryPie
          data={chartData}
          width={chartWidth}
          height={200}
          padding={{ top: 0, bottom: 0, left: 0, right: 0 }}
          colorScale={chartData.map(item => item.color)}
          innerRadius={chartWidth * 0.15}
          labelRadius={({ innerRadius }) => (innerRadius || 0) + 30}
          style={{
            labels: {
              fill: 'transparent', // Hide default labels
            },
            data: {
              fillOpacity: ({ datum }) => 
                selectedCategory && selectedCategory.categoryId === datum.categoryId ? 1 : 0.9,
              stroke: THEME.COLORS.CARD_BACKGROUND,
              strokeWidth: 1,
            },
          }}
          events={[{
            target: "data",
            eventHandlers: {
              onPress: (_, props) => {
                const category = props.datum;
                handleCategorySelection(category);
                return null;
              },
            }
          }]}
          animate={{
            duration: 500,
            onLoad: { duration: 500 },
          }}
        />
        
        {/* Center label showing selected category or total */}
        <View style={styles.centerLabelContainer}>
          <Text style={styles.centerLabelTitle}>
            {selectedCategory ? selectedCategory.categoryName : 'Total'}
          </Text>
          <Text style={styles.centerLabelValue}>
            {formatCurrency(
              selectedCategory ? selectedCategory.totalCost : totalSpending,
              currency
            )}
          </Text>
          {selectedCategory && (
            <Text style={styles.centerLabelSubs}>
              {selectedCategory.subscriptionCount} subscription{selectedCategory.subscriptionCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner size="small" />
        </View>
      )}
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <VictoryLegend
          width={chartWidth}
          height={Math.min(120, legendData.length * 25)}
          data={legendData}
          orientation="vertical"
          gutter={10}
          style={{
            labels: { fontSize: 12, fill: THEME.COLORS.TEXT_SECONDARY },
          }}
          padding={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => onSelectCategory && onSelectCategory(-1)} // -1 to indicate "all categories"
      >
        <Text style={styles.viewAllText}>View All Categories</Text>
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
  totalText: {
    fontSize: THEME.FONT_SIZES.SM,
    fontWeight: '500',
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    position: 'relative',
  },
  centerLabelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabelTitle: {
    fontSize: THEME.FONT_SIZES.SM,
    fontWeight: '500',
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  centerLabelValue: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '700',
    color: THEME.COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginVertical: THEME.SPACING.XS,
  },
  centerLabelSubs: {
    fontSize: THEME.FONT_SIZES.XS,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  loadingContainer: {
    backgroundColor: THEME.COLORS.CARD_BACKGROUND,
    borderRadius: THEME.BORDER_RADIUS.LG,
    padding: THEME.SPACING.MD,
    marginVertical: THEME.SPACING.MD,
    height: 350,
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
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  legendContainer: {
    marginTop: THEME.SPACING.MD,
    maxHeight: 120,
    overflow: 'scroll',
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