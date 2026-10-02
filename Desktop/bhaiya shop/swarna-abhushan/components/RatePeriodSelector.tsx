import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SIZES, SPACING, RADIUS, FONT_FAMILY } from '../constants/theme';

const PERIODS = [
  { label: 'Today', value: 1 },
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '3 Months', value: 90 },
];

interface RatePeriodSelectorProps {
  selected: number;
  onSelect: (days: number) => void;
}

export const RatePeriodSelector: React.FC<RatePeriodSelectorProps> = ({ selected, onSelect }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {PERIODS.map((period) => (
        <TouchableOpacity
          key={period.value}
          activeOpacity={0.84}
          onPress={() => onSelect(period.value)}
          style={[
            styles.button,
            selected === period.value && styles.buttonActive,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              selected === period.value && styles.buttonTextActive,
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 8,
  },
  button: {
    minWidth: 72,
    height: 38,
    paddingHorizontal: 15,
    borderRadius: 19,
    backgroundColor: '#191919',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  buttonText: {
    color: '#B9B9B9',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 12,
  },
  buttonTextActive: {
    color: COLORS.primary,
  },
});
