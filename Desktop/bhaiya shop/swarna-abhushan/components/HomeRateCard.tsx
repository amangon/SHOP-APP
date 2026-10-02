import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES, SPACING, RADIUS, FONT_FAMILY } from '../constants/theme';
import { RateHistoryChart } from './RateHistoryChart';

interface HomeRateCardProps {
  metalName: string;
  purity: string;
  price: number;
  unit: string;
  effectiveDate: string;
  updatedAt: string;
  previousPrice?: number | null;
  priceDifference?: number | null;
  priceDifferencePercent?: number | null;
  historyPoints: { price: number; recorded_at: string }[];
  onPress: () => void;
  accentColor: string;
}

export const HomeRateCard: React.FC<HomeRateCardProps> = ({
  metalName,
  purity,
  price,
  unit,
  effectiveDate,
  updatedAt,
  previousPrice,
  priceDifference,
  priceDifferencePercent,
  historyPoints,
  onPress,
  accentColor,
}) => {
  const formatPrice = (value: number): string => `₹${value.toLocaleString('en-IN')}`;

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const displayUnit = unit.replace(/^per\s+/i, '');
  const isIncrease = priceDifference !== null && priceDifference !== undefined && priceDifference > 0;
  const isDecrease = priceDifference !== null && priceDifference !== undefined && priceDifference < 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.card, { borderColor: accentColor }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.metalName}>{metalName}</Text>
          <Text style={styles.purity}>{purity}</Text>
        </View>
        <View style={[styles.iconContainer, { borderColor: accentColor }]}>
          <Text style={[styles.icon, { color: accentColor }]}>◆</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.leftInfo}>
          <Text style={styles.price}>{formatPrice(price)}</Text>
          <Text style={styles.unit}>per {displayUnit}</Text>
          <Text style={styles.updatedAt}>Updated: {formatDate(updatedAt)}</Text>
          <Text style={styles.effectiveDate}>Effective: {formatDate(effectiveDate)}</Text>
        </View>

        {historyPoints.length > 1 && (
          <View style={styles.chartContainer}>
            <RateHistoryChart points={historyPoints} color={accentColor} />
          </View>
        )}
      </View>

      {previousPrice != null && priceDifference != null && priceDifferencePercent != null && (
        <View style={styles.changeRow}>
          {isIncrease && (
            <>
              <Text style={styles.increase}>▲ +₹{priceDifference.toLocaleString('en-IN')}</Text>
              <Text style={styles.increasePercent}>+{priceDifferencePercent.toFixed(2)}%</Text>
            </>
          )}
          {isDecrease && (
            <>
              <Text style={styles.decrease}>▼ -₹{Math.abs(priceDifference).toLocaleString('en-IN')}</Text>
              <Text style={styles.decreasePercent}>-{Math.abs(priceDifferencePercent).toFixed(2)}%</Text>
            </>
          )}
          {!isIncrease && !isDecrease && (
            <>
              <Text style={styles.unchanged}>— No Change</Text>
              <Text style={styles.unchangedPercent}>0.00%</Text>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.sm,
    minWidth: 140,
    borderWidth: 1,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  metalName: {
    fontSize: SIZES.lg,
    fontFamily: FONT_FAMILY.sansBold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  purity: {
    fontSize: SIZES.sm,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.lightGold,
    marginTop: SPACING.xs,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  icon: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
  },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  leftInfo: {
    flex: 1,
  },
  price: {
    fontSize: SIZES.xxl,
    fontFamily: FONT_FAMILY.serifBold,
    color: COLORS.gold,
    letterSpacing: 0.5,
    lineHeight: 32,
  },
  unit: {
    fontSize: SIZES.sm,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    marginTop: SPACING.xs,
  },
  updatedAt: {
    fontSize: SIZES.xs,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  effectiveDate: {
    fontSize: SIZES.xs,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  chartContainer: {
    marginLeft: SPACING.sm,
    flexShrink: 1,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  increase: {
    color: COLORS.success,
    fontWeight: '600',
    fontSize: SIZES.sm,
  },
  increasePercent: {
    color: COLORS.success,
    fontWeight: '600',
    fontSize: SIZES.xs,
    marginLeft: SPACING.xs,
  },
  decrease: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: SIZES.sm,
  },
  decreasePercent: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: SIZES.xs,
    marginLeft: SPACING.xs,
  },
  unchanged: {
    color: COLORS.secondaryText,
    fontWeight: '600',
    fontSize: SIZES.sm,
  },
  unchangedPercent: {
    color: COLORS.secondaryText,
    fontWeight: '600',
    fontSize: SIZES.xs,
    marginLeft: SPACING.xs,
  },
});
