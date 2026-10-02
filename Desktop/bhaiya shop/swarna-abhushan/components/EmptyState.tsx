import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, SPACING, FONT_FAMILY } from '../constants/theme';

interface EmptyStateProps {
  title: string;
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>◆</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.primary,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  icon: {
    fontSize: 32,
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.sans,
  },
  title: {
    fontSize: SIZES.xl,
    fontFamily: FONT_FAMILY.serifBold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    lineHeight: 28,
  },
  message: {
    fontSize: SIZES.md,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
});
