import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, SIZES, SPACING, RADIUS, FONT_FAMILY } from '../constants/theme';

interface ProductCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
  shortDescription?: string;
  onPress: () => void;
  showReadMore?: boolean;
  layout?: 'horizontal' | 'vertical';
  metalType?: string | null;
  purity?: string | null;
  price?: number | null;
  isFavorite?: boolean;
  onFavorite?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  imageUrl,
  shortDescription,
  onPress,
  showReadMore = true,
  layout = 'vertical',
  metalType,
  purity,
  price,
  isFavorite = false,
  onFavorite,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, layout === 'horizontal' && styles.horizontalCard]}
    >
      <View style={[styles.imageContainer, layout === 'horizontal' && styles.horizontalImageContainer]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[styles.image, layout === 'horizontal' && styles.horizontalImage]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder, layout === 'horizontal' && styles.horizontalImage]}>
            <Text style={styles.placeholderIcon}>◆</Text>
          </View>
        )}
      </View>
      <View style={[styles.infoContainer, layout === 'horizontal' && styles.horizontalInfo]}>
        <View style={styles.nameRow}><Text
          style={[styles.productName, layout === 'horizontal' && styles.horizontalProductName]}
          numberOfLines={2}
        >
          {name}
        </Text>{onFavorite && <TouchableOpacity onPress={onFavorite} style={styles.favoriteButton}><Text style={styles.favorite}>{isFavorite ? '♥' : '♡'}</Text></TouchableOpacity>}</View>
        {(metalType || purity) && <Text style={styles.meta}>{[metalType, purity].filter(Boolean).join(' · ')}</Text>}
        {price != null && <Text style={styles.price}>₹{price.toLocaleString('en-IN')}</Text>}
        {shortDescription ? (
          <Text
            style={[
              styles.description,
              layout === 'horizontal' && styles.horizontalDescription,
            ]}
            numberOfLines={layout === 'horizontal' ? 3 : 2}
          >
            {shortDescription}
          </Text>
        ) : null}
        {showReadMore && (
          <TouchableOpacity onPress={onPress} style={styles.readMoreContainer}>
            <Text style={styles.readMoreText}>Read More</Text>
            <Text style={styles.readMoreArrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: COLORS.secondary,
    flexShrink: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    marginRight: SPACING.md,
    marginBottom: SPACING.md,
  },
  horizontalCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 180,
  },
  horizontalImageContainer: {
    width: 120,
    height: 120,
    marginRight: SPACING.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  horizontalImage: {
    borderRadius: RADIUS.md,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  placeholderIcon: {
    fontSize: 40,
    color: COLORS.gold,
  },
  infoContainer: {
    padding: SPACING.md,
  },
  horizontalInfo: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  productName: {
    fontSize: SIZES.md,
    fontFamily: FONT_FAMILY.serifBold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start' },
  favoriteButton: { marginLeft: SPACING.sm, padding: 2 },
  favorite: { color: COLORS.gold, fontSize: SIZES.xxl, lineHeight: 24 },
  meta: { color: COLORS.lightGold, fontSize: SIZES.xs, fontFamily: FONT_FAMILY.sans, marginBottom: SPACING.xs },
  price: { color: COLORS.gold, fontSize: SIZES.lg, fontFamily: FONT_FAMILY.sansBold, marginTop: SPACING.xs },
  horizontalProductName: {
    fontSize: SIZES.lg,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: SIZES.sm,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    lineHeight: 18,
  },
  horizontalDescription: {
    lineHeight: 20,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.xs,
  },
  readMoreText: {
    color: COLORS.gold,
    fontSize: SIZES.sm,
    fontFamily: FONT_FAMILY.sansSemiBold,
  },
  readMoreArrow: {
    color: COLORS.gold,
    fontSize: SIZES.md,
    marginLeft: 2,
    fontFamily: FONT_FAMILY.sans,
  },
});
