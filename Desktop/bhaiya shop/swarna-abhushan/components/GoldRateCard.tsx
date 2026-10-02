import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, SPACING, RADIUS, FONT_FAMILY } from '../constants/theme';

interface GoldRateCardProps {
  metalName: string;
  purity: string;
  price: number;
  unit: string;
  effectiveDate: string;
  updatedAt: string;
  previousPrice?: number | null;
  priceDifference?: number | null;
  priceDifferencePercent?: number | null;
}

export const GoldRateCard: React.FC<GoldRateCardProps> = ({
  metalName,
  purity,
  price,
  unit,
  effectiveDate,
  updatedAt,
  previousPrice,
  priceDifference,
  priceDifferencePercent,
}) => {
  const formatPrice = (price: number): string => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

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

  return (
    <View style={styles.rateCard}>
      <View style={styles.rateHeader}>
        <View>
          <Text style={styles.metalName}>{metalName}</Text>
          <Text style={styles.purity}>{purity}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>◆</Text>
        </View>
      </View>
      <View style={styles.rateBody}>
        <Text style={styles.price}>{formatPrice(price)}</Text>
        <Text style={styles.unit}>per {displayUnit}</Text>
      </View>
      <Text style={styles.updatedAt}>Updated: {formatDate(updatedAt)}</Text>
      <Text style={styles.effectiveDate}>Effective: {formatDate(effectiveDate)}</Text>
      {previousPrice != null && priceDifference != null && priceDifferencePercent != null ? (
        <View style={styles.changeIndicator}>
          {priceDifference > 0 ? (
            <>
              <Text style={styles.increase}>🟢 ↑ ₹{priceDifference.toLocaleString('en-IN')}</Text>
              <Text style={styles.increasePercent}>+{priceDifferencePercent.toFixed(2)}%</Text>
            </>
          ) : priceDifference < 0 ? (
            <>
              <Text style={styles.decrease}>🔴 ↓ ₹{Math.abs(priceDifference).toLocaleString('en-IN')}</Text>
              <Text style={styles.decreasePercent}>-{Math.abs(priceDifferencePercent).toFixed(2)}%</Text>
            </>
          ) : (
            <>
              <Text style={styles.unchanged}>— No Change</Text>
              <Text style={styles.unchangedPercent}>0.00%</Text>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  rateCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.sm,
    minWidth: 120,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  rateHeader: {
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
    borderColor: COLORS.goldBorder,
  },
  icon: {
    color: COLORS.gold,
    fontSize: SIZES.lg,
    fontWeight: 'bold',
  },
  rateBody: {
    marginBottom: SPACING.sm,
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
  },
  effectiveDate: {
    fontSize: SIZES.xs,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  changeIndicator: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
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
