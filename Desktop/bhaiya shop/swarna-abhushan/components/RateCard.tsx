import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { COLORS, FONT_FAMILY } from '../constants/theme';

export interface MetalRateEntry {
  metal?: string;
  purity?: string;
  price_per_gram?: number | string | null;
  price_per_10_gram?: number | string | null;
  pricePerGram?: number | string | null;
  pricePer10Gram?: number | string | null;
  [key: string]: unknown;
}

export interface RateCardProps {
  entry: MetalRateEntry;
  weightLabel?: string;
  style?: any;
}

const toNumber = (value: unknown): number | null => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const getPricePerGram = (entry: MetalRateEntry): number | null => {
  return (
    toNumber(entry.price_per_gram) ??
    toNumber(entry.pricePerGram)
  );
};

const getPriceForWeight = (
  entry: MetalRateEntry,
  weightLabel?: string
): number | null => {
  const pricePerGram = getPricePerGram(entry);
  if (pricePerGram !== null && weightLabel) {
    const normalized = weightLabel.toLowerCase().trim();

    if (normalized === '1 gram') return pricePerGram;
    if (normalized === '5 gram') return pricePerGram * 5;
    if (normalized === '10 gram') return pricePerGram * 10;
    if (normalized === '11.66 gram') return pricePerGram * 11.66;
    if (normalized === '500 gram') return pricePerGram * 500;
    if (normalized === '1 kg') return pricePerGram * 1000;
  }

  return (
    toNumber(entry.pricePer10Gram) ??
    toNumber(entry.price_per_10_gram) ??
    null
  );
};

const formatPrice = (value: number | null): string => {
  if (value === null) return 'Rate unavailable';
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getMetalIcon = (metal?: string): keyof typeof MaterialIcons.glyphMap => {
  return String(metal).toLowerCase().includes('silver')
    ? 'radio-button-checked'
    : 'diamond';
};

export default function RateCard({ entry, weightLabel, style }: RateCardProps) {
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const metal = String(entry?.metal ?? '').toLowerCase();
  const title = metal.includes('silver')
    ? 'Silver 999'
    : entry?.purity || (metal.includes('gold') ? '24K' : 'Rate');

  const price = getPriceForWeight(entry, weightLabel);
  const pricePerGram = getPricePerGram(entry);
  const unavailable = price === null;

  return (
    <View style={[styles.card, compact && styles.cardCompact, style]}>
      <View style={styles.iconWrap}>
        <MaterialIcons
          name={getMetalIcon(entry?.metal)}
          size={compact ? 38 : 44}
          color={COLORS.lightGold}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <Text
          style={[styles.price, compact && styles.priceCompact, unavailable && styles.unavailable]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
          ellipsizeMode="tail"
        >
          {formatPrice(price)}
        </Text>

        <Text style={styles.weight} numberOfLines={1}>
          {weightLabel || '10 gram'}
        </Text>

        {!unavailable && pricePerGram !== null && (
          <Text style={styles.perGram} numberOfLines={1}>
            ₹{pricePerGram.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}/g
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 182,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 24,
    borderWidth: 1.4,
    borderColor: '#6A6A6A',
    backgroundColor: '#252525',
    overflow: 'hidden',
  },
  cardCompact: {
    minHeight: 170,
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  iconWrap: {
    width: 86,
    height: 86,
    flexShrink: 0,
    borderRadius: 43,
    backgroundColor: '#3B3B3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 21,
    lineHeight: 25,
    marginBottom: 7,
  },
  price: {
    color: '#F4F4F4',
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 25,
    lineHeight: 30,
    flexShrink: 1,
  },
  priceCompact: {
    fontSize: 22,
    lineHeight: 27,
  },
  unavailable: {
    color: '#B7B7B7',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 16,
    lineHeight: 20,
  },
  weight: {
    marginTop: 8,
    color: '#D4D4D4',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 15,
    lineHeight: 19,
  },
  perGram: {
    marginTop: 1,
    color: '#B6B6B6',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 15,
    lineHeight: 19,
  },
});
