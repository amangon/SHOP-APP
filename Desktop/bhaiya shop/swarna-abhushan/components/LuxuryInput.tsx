import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { COLORS, SIZES, SPACING, RADIUS, FONT_FAMILY } from '../constants/theme';

interface LuxuryInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const LuxuryInput: React.FC<LuxuryInputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : styles.inputNormal,
          style,
        ]}
        placeholderTextColor={COLORS.secondaryText}
        selectionColor={COLORS.gold}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: SIZES.md,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    fontWeight: '500',
    fontFamily: FONT_FAMILY.sansMedium,
  },
  input: {
    backgroundColor: COLORS.tertiary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: SIZES.lg,
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sans,
    minHeight: 52,
  },
  inputNormal: {
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.sm,
    fontFamily: FONT_FAMILY.sans,
    marginTop: SPACING.xs,
  },
});
