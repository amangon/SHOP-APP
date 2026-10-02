import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT_FAMILY } from '../constants/theme';

interface PurityOption {
  label: string;
  value: string;
}

interface PuritySelectorProps {
  selected: string;
  onSelect: (purity: string) => void;
  options?: PurityOption[];
  metalType?: 'gold' | 'silver';
}

const GOLD_PURITY_OPTIONS: PurityOption[] = [
  { label: '24K', value: 'gold24k' },
  { label: '22K', value: 'gold22k' },
  { label: '18K', value: 'gold18k' },
];

const SILVER_PURITY_OPTIONS: PurityOption[] = [
  { label: 'Silver', value: 'silver' },
];

export const PuritySelector: React.FC<PuritySelectorProps> = ({
  selected,
  onSelect,
  options,
  metalType = 'gold',
}) => {
  const purityOptions =
    options ||
    (metalType === 'gold' ? GOLD_PURITY_OPTIONS : SILVER_PURITY_OPTIONS);

  return (
    <View style={styles.container}>
      {purityOptions.map((option) => {
        const isActive = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.8}
            onPress={() => onSelect(option.value)}
            style={[
              styles.button,
              isActive && styles.buttonActive,
            ]}
          >
            <Text
              style={[
                styles.text,
                isActive && styles.textActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#333333',
  },
  buttonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  text: {
    color: '#B0B0B0',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 14,
  },
  textActive: {
    color: '#0A0A0A',
  },
});