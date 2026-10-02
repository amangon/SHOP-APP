import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface GoldTextProps {
  children: React.ReactNode;
  style?: object;
}

export const GoldText: React.FC<GoldTextProps> = ({ children, style }) => {
  return <Text style={[styles.goldText, style]}>{children}</Text>;
};

const styles = StyleSheet.create({
  goldText: {
    color: COLORS.gold,
    fontWeight: '600',
  },
});
