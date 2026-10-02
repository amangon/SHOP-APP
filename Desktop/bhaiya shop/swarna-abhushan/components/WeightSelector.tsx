import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT_FAMILY } from '../constants/theme';

interface WeightOption {
  label: string;
  value: number;
}

interface WeightSelectorProps {
  selected: number;
  onSelect: (weight: number) => void;
  options?: WeightOption[];
  label?: string;
}

const GOLD_WEIGHT_OPTIONS: WeightOption[] = [
  { label: '1g', value: 1 },
  { label: '5g', value: 5 },
  { label: '10g', value: 10 },
];

const SILVER_WEIGHT_OPTIONS: WeightOption[] = [
  { label: '500g', value: 500 },
  { label: '1kg', value: 1000 },
];

export const WeightSelector: React.FC<WeightSelectorProps> = ({
  selected,
  onSelect,
  options,
  label,
}) => {
  const weightOptions = options || (selected >= 1000 ? SILVER_WEIGHT_OPTIONS : GOLD_WEIGHT_OPTIONS);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {weightOptions.map((option) => {
          const isActive = selected === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.8}
              style={[
                styles.button,
                isActive && styles.buttonActive,
              ]}
              onPress={() => onSelect(option.value)}
            >
              <Text
                style={[
                  styles.buttonText,
                  isActive && styles.buttonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    color: COLORS.secondaryText,
    fontFamily: FONT_FAMILY.sans,
    fontSize: 11,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#191919',
    borderWidth: 1,
    borderColor: '#3A3A3A',
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