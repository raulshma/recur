import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
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
  
  // Calculate chart dimensions
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - THEME.SPACING.LG * 2;
  const chartRadius = chartWidth * 0.4;
  const centerX = chartWidth / 2;
  const centerY = 100;
  
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
  
  // Handle category selection
  const handleCategorySelection = (category: CategorySpending) => {
    setSelectedCategory(category);
    
    if (onSelectCategory) {
      onSelectCategory(category.categoryId);
    }
  };
  
  // Create simple pie chart segments
  const createPieSegments = () => {
    if (!data || data.length === 0) return null;
    
    let startAngle = 0;
    const segments = data.map((category, index) => {
      const percentage = category.totalCost / totalSpending;
      const angle = percentage * 360;
      const endAngle = startAngle + angle;
      
      // Calculate path for pie segment
      const x1 = centerX + chartRadius * Math.cos((startAngle - 90) * Math.PI / 180);
      const y1 = centerY + chartRadius * Math.sin((startAngle - 90) * Math.PI / 180);
      const x2 = centerX + chartRadius * Math.cos((endAngle - 90) * Math.PI / 180);
      const y2 = centerY + chartRadius * Math.sin((endAngle - 90) * Math.PI / 180);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = `
        M ${centerX} ${centerY}
        L ${x1} ${y1}
        A ${chartRadius} ${chartRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
        Z
      `;
      
      const isSelected = selectedCategory && selectedCategory.categoryId === category.categoryId;
      
      const segment = (
        <Path
          key={index}
          d={pathData}
          fill={category.categoryColor}
          fillOpacity={isSelected ? 1 : 0.9}
          stroke={THEME.COLORS.CARD_BACKGROUND}
          strokeWidth={1}
          onPress={() => handleCategorySelection(category)}
        />
      );
      
      startAngle = endAngle;
      return segment;
    });
    
    return segments;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Category Breakdown</Text>
        <Text style={styles.totalText}>
          {formatCurrency(totalSpending, currency)}
        </Text>
      </View>
      
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={200}>
          <G>
            {createPieSegments()}
            <Circle
              cx={centerX}
              cy={centerY}
              r={chartRadius * 0.6}
              fill={THEME.COLORS.CARD_BACKGROUND}
            />
          </G>
        </Svg>
        
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
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendSymbol, { backgroundColor: item.categoryColor }]} />
            <Text style={styles.legendText}>
              {item.categoryName} ({item.subscriptionCount})
            </Text>
          </View>
        ))}
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
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.SPACING.XS,
  },
  legendSymbol: {
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