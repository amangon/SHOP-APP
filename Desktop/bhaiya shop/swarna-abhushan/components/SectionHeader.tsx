import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES, SPACING, FONT_FAMILY } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {actionText && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.action}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontSize: SIZES.xxl,
    fontFamily: FONT_FAMILY.serifBold,
    color: COLORS.white,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.secondaryText,
    fontFamily: FONT_FAMILY.sans,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  action: {
    color: COLORS.gold,
    fontSize: SIZES.md,
    fontFamily: FONT_FAMILY.sansSemiBold,
  },
});
