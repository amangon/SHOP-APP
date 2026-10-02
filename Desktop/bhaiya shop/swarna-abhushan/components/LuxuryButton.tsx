import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { COLORS, SIZES, SPACING, FONT_FAMILY, RADIUS } from '../constants/theme';

interface LuxuryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: React.ReactNode;
}

export const LuxuryButton: React.FC<LuxuryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  variant = 'primary',
  icon,
}) => {
  const getBackgroundColor = (): string => {
    if (disabled) return COLORS.secondary;
    if (variant === 'primary') return COLORS.gold;
    if (variant === 'secondary') return COLORS.secondary;
    return 'transparent';
  };

  const getTextColor = (): string => {
    if (disabled) return COLORS.secondaryText;
    if (variant === 'primary') return COLORS.primary;
    return COLORS.gold;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? COLORS.gold : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: disabled ? 0.6 : 1,
          flexDirection: icon ? 'row' : 'column',
          gap: icon ? SPACING.sm : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? COLORS.primary : COLORS.gold}
          size="small"
        />
      ) : (
        <>
          {icon && icon}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  text: {
    fontSize: SIZES.lg,
    fontFamily: FONT_FAMILY.sansSemiBold,
    letterSpacing: 0.5,
  },
});
