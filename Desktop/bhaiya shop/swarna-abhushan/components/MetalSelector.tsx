import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT_FAMILY } from '../constants/theme';

interface MetalOption {
  label: string;
  value: string;
}

interface MetalSelectorProps {
  selected: string;
  onSelect: (metal: string) => void;
  options?: MetalOption[];
}

const DEFAULT_OPTIONS: MetalOption[] = [
  { label: 'Gold', value: 'gold' },
  { label: 'Silver', value: 'silver' },
];

export const MetalSelector: React.FC<MetalSelectorProps> = ({
  selected,
  onSelect,
  options = DEFAULT_OPTIONS,
}) => {
  return (
    <View style={styles.container}>
      {options.map((option) => {
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