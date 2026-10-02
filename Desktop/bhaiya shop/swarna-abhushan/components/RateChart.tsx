import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, {
  Line as SvgLine,
  Circle as SvgCircle,
  Path as SvgPath,
  G,
  Text as SvgText,
} from 'react-native-svg';
import { COLORS, SIZES, SPACING, FONT_FAMILY } from '../constants/theme';

interface ChartDataPoint {
  price: number;
  recorded_at: string;
}

interface TooltipData {
  x: number;
  y: number;
  price: number;
  date: string;
}

interface RateChartProps {
  data: ChartDataPoint[];
  color?: string;
  height?: number;
}

const CHART_PADDING = { top: 20, right: 20, bottom: 40, left: 60 };

export const RateHistoryChart: React.FC<RateChartProps> = ({
  data,
  color = COLORS.gold,
  height = 240,
}) => {
  const { width: screenWidth } = Dimensions.get('window');
  const chartWidth = Math.max(280, screenWidth - 56);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const touchX = useRef(new Animated.Value(-1)).current;

  const chartHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;
  const usableWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;

  const { pathD, coordinates, yLabels, xLabels } = useMemo(() => {
    if (data.length === 0) {
      return { pathD: '', coordinates: [], yLabels: [], xLabels: [] };
    }

    const prices = data.map((d) => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const spread = maxPrice - minPrice || 1;
    const padding = spread * 0.1;
    const adjustedMin = Math.max(0, minPrice - padding);
    const adjustedMax = maxPrice + padding;
    const adjustedSpread = adjustedMax - adjustedMin || 1;

    const coords = data.map((point, index) => {
      const x =
        data.length === 1
          ? CHART_PADDING.left + usableWidth / 2
          : CHART_PADDING.left + (index / (data.length - 1)) * usableWidth;
      const y =
        CHART_PADDING.top +
        ((adjustedMax - point.price) / adjustedSpread) * chartHeight;
      return { x, y, point };
    });

    const path = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
      .join(' ');

    const yLabelCount = 4;
    const yLabels = Array.from({ length: yLabelCount + 1 }, (_, i) => {
      const value = adjustedMin + (i / yLabelCount) * adjustedSpread;
      const y = CHART_PADDING.top + (i / yLabelCount) * chartHeight;
      return { value, y, label: formatINR(value) };
    });

    const xLabelCount = Math.min(data.length, 5);
    const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
      const dataIndex = Math.round((i / (xLabelCount - 1)) * (data.length - 1));
      const x =
        data.length === 1
          ? CHART_PADDING.left + usableWidth / 2
          : CHART_PADDING.left + (dataIndex / (data.length - 1)) * usableWidth;
      const date = new Date(data[dataIndex]?.recorded_at || Date.now());
      const label = formatDateLabel(date);
      return { x, label };
    });

    return { pathD: path, coordinates: coords, yLabels, xLabels };
  }, [data, chartHeight, usableWidth]);

  const handleTouch = useCallback(
    (event: any) => {
      if (data.length === 0 || coordinates.length === 0) return;
      const { locationX } = event.nativeEvent;
      const clampedX = Math.max(
        CHART_PADDING.left,
        Math.min(locationX, CHART_PADDING.left + usableWidth)
      );

      let closestIndex = 0;
      let closestDist = Infinity;
      coordinates.forEach((coord, index) => {
        const dist = Math.abs(coord.x - clampedX);
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = index;
        }
      });

      const coord = coordinates[closestIndex];
      if (coord) {
        setActiveIndex(closestIndex);
        setTooltip({
          x: coord.x,
          y: coord.y,
          price: coord.point.price,
          date: coord.point.recorded_at,
        });
      }
    },
    [data, coordinates, usableWidth]
  );

  const handleTouchEnd = useCallback(() => {
    setTooltip(null);
    setActiveIndex(null);
  }, []);

  if (data.length === 0) {
    return (
      <View style={[styles.chartContainer, { height }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No historical data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.chartContainer, { height }]}>
      <Svg
        width={chartWidth}
        height={height}
        onTouchStart={handleTouch}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouch}
        style={styles.svg}
      >
        <G>
          {yLabels.map((label, i) => (
            <React.Fragment key={`y-${i}`}>
              <SvgLine
                x1={CHART_PADDING.left}
                y1={label.y}
                x2={CHART_PADDING.left + usableWidth}
                y2={label.y}
                stroke={COLORS.darkBorder}
                strokeWidth={0.5}
                strokeDasharray="4 4"
              />
              <SvgText
                x={CHART_PADDING.left - 8}
                y={label.y + 4}
                textAnchor="end"
                fill={COLORS.secondaryText}
                fontSize={10}
                fontFamily={FONT_FAMILY.sans}
              >
                {label.label}
              </SvgText>
            </React.Fragment>
          ))}

          {xLabels.map((label, i) => (
            <SvgText
              key={`x-${i}`}
              x={label.x}
              y={height - 8}
              textAnchor="middle"
              fill={COLORS.secondaryText}
              fontSize={10}
              fontFamily={FONT_FAMILY.sans}
            >
              {label.label}
            </SvgText>
          ))}

          {pathD && (
            <SvgPath
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {coordinates.map((coord, index) => (
            <SvgCircle
              key={`dot-${index}`}
              cx={coord.x}
              cy={coord.y}
              r={activeIndex === index ? 6 : 3}
              fill={activeIndex === index ? color : 'transparent'}
              stroke={activeIndex === index ? color : COLORS.darkBorder}
              strokeWidth={activeIndex === index ? 0 : 1.5}
            />
          ))}

          {tooltip && (
            <SvgCircle
              cx={tooltip.x}
              cy={tooltip.y}
              r={7}
              fill={color}
              opacity={0.3}
            />
          )}
        </G>
      </Svg>

      {tooltip && (
        <View
          style={[
            styles.tooltip,
            {
              left: Math.min(
                Math.max(tooltip.x - 60, 8),
                chartWidth - 128
              ),
              top: Math.max(tooltip.y - 70, 8),
            },
          ]}
        >
          <Text style={styles.tooltipPrice}>
            {formatINR(tooltip.price)}
          </Text>
          <Text style={styles.tooltipDate}>
            {formatTooltipDate(tooltip.date)}
          </Text>
        </View>
      )}
    </View>
  );
};

export const RateChart: React.FC<RateChartProps> = RateHistoryChart;

const formatINR = (value: number): string => {
  if (!Number.isFinite(value)) return '₹0';
  return `₹${value.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
};

const formatDateLabel = (date: Date): string => {
  const day = date.getDate();
  const month = date.toLocaleDateString('en-IN', { month: 'short' });
  return `${day} ${month}`;
};

const formatTooltipDate = (iso: string): string => {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const day = date.getDate();
    const month = date.toLocaleDateString('en-IN', { month: 'short' });
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} • ${hour}:${minute}`;
  } catch {
    return '';
  }
};

const styles = StyleSheet.create({
  chartContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  svg: {
    overflow: 'visible',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  tooltipPrice: {
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 14,
  },
  tooltipDate: {
    color: COLORS.secondaryText,
    fontFamily: FONT_FAMILY.sans,
    fontSize: 10,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.secondaryText,
    fontFamily: FONT_FAMILY.sans,
    fontSize: 13,
  },
});