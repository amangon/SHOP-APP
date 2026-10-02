import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, SPACING, RADIUS } from '../constants/theme';

interface TestimonialCardProps {
  customerName: string;
  rating: number;
  reviewText: string;
}

const renderStars = (rating: number) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Text
        key={i}
        style={[styles.star, i <= rating && styles.starFilled]}
      >
        ★
      </Text>
    );
  }
  return stars;
};

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  customerName,
  rating,
  reviewText,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.ratingRow}>{renderStars(rating)}</View>
      <Text style={styles.reviewText}>"{reviewText}"</Text>
      <Text style={styles.customerName}>— {customerName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: 2,
  },
  star: {
    fontSize: 18,
    color: COLORS.secondaryText,
  },
  starFilled: {
    color: COLORS.gold,
  },
  reviewText: {
    fontSize: SIZES.md,
    color: COLORS.secondaryText,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  customerName: {
    fontSize: SIZES.md,
    color: COLORS.gold,
    fontWeight: '600',
    textAlign: 'right',
  },
});
