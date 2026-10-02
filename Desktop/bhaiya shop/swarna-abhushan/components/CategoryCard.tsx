import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES, SPACING, RADIUS, FONT_FAMILY } from '../constants/theme';

interface CategoryCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
  onPress: () => void;
  size?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  id,
  name,
  imageUrl,
  onPress,
  size = 140,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.card, { width: size }]}>
      <View style={[styles.imageContainer, { width: size, height: size }]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <View style={styles.placeholderIconContainer}>
              <Text style={styles.placeholderIcon}>◆</Text>
            </View>
          </View>
        )}
        <View style={styles.overlay} />
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  imageContainer: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  placeholderIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 28,
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.sans,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8, 8, 8, 0.3)',
  },
  categoryName: {
    fontSize: SIZES.md,
    fontFamily: FONT_FAMILY.serifBold,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 20,
  },
});
