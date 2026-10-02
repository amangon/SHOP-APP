import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { COLORS, SIZES, SPACING, FONT_FAMILY } from '../constants/theme';

interface RateHistoryChartProps {
  points: { price: number; recorded_at: string }[];
  color: string;
}

export const RateHistoryChart: React.FC<RateHistoryChartProps> = ({ points, color }) => {
  const { width } = useWindowDimensions();

  const prices = points.map((point) => Number(point.price));
  const maximum = Math.max(...prices);
  const minimum = Math.min(...prices);
  const spread = maximum - minimum || 1;

  const chartWidth = Math.max(250, width - 72);
  const chartHeight = 170;
  const paddingHorizontal = 12;
  const usableWidth = chartWidth - paddingHorizontal * 2;

  const coordinates = points.map((point, index) => {
    const x =
      points.length === 1
        ? chartWidth / 2
        : paddingHorizontal + (index / (points.length - 1)) * usableWidth;

    const y =
      chartHeight -
      20 -
      ((Number(point.price) - minimum) / spread) * (chartHeight - 45);

    return { x, y };
  });

  const path = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });

  return (
    <View style={styles.chart}>
      <View style={styles.priceRange}>
        <Text style={styles.maxPrice}>₹{maximum.toLocaleString('en-IN')}</Text>
        <Text style={styles.minPrice}>₹{minimum.toLocaleString('en-IN')}</Text>
      </View>

      <Svg width={chartWidth} height={chartHeight}>
        <Line x1="0" y1="40" x2={chartWidth} y2="40" stroke={COLORS.darkBorder} strokeWidth="1" strokeDasharray="4 4" />
        <Line x1="0" y1="90" x2={chartWidth} y2="90" stroke={COLORS.darkBorder} strokeWidth="1" strokeDasharray="4 4" />
        <Line x1="0" y1="140" x2={chartWidth} y2="140" stroke={COLORS.darkBorder} strokeWidth="1" strokeDasharray="4 4" />

        <Path d={path} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

        {coordinates.map((point, index) => (
          <Circle key={`${point.x}-${index}`} cx={point.x} cy={point.y} r={5} fill={color} />
        ))}
      </Svg>

      <View style={styles.chartLabels}>
        <View>
          <Text style={styles.chartDate}>{firstPoint ? formatDate(firstPoint.recorded_at) : ''}</Text>
          <Text style={styles.chartPrice}>
            {firstPoint ? `₹${Number(firstPoint.price).toLocaleString('en-IN')}` : ''}
          </Text>
        </View>

        <View style={styles.lastLabel}>
          <Text style={styles.chartDate}>{lastPoint ? formatDate(lastPoint.recorded_at) : ''}</Text>
          <Text style={styles.chartPrice}>
            {lastPoint ? `₹${Number(lastPoint.price).toLocaleString('en-IN')}` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chart: {
    minHeight: 210,
    paddingTop: SPACING.sm,
  },
  priceRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  maxPrice: {
    color: COLORS.gold,
    fontSize: SIZES.sm,
    fontFamily: FONT_FAMILY.sansSemiBold,
  },
  minPrice: {
    color: COLORS.secondaryText,
    fontSize: SIZES.sm,
    fontFamily: FONT_FAMILY.sans,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
    marginTop: 2,
  },
  lastLabel: {
    alignItems: 'flex-end',
  },
  chartDate: {
    color: COLORS.secondaryText,
    fontFamily: FONT_FAMILY.sans,
    fontSize: SIZES.xs,
  },
  chartPrice: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: SIZES.xs,
    marginTop: 2,
  },
});
