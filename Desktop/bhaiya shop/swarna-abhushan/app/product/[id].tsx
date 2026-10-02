import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { COLORS, SIZES, SPACING, RADIUS, SHADOWS, FONT_FAMILY } from '../../constants/theme';
import {
  ProductCard,
  ReadMoreText,
  LoadingScreen,
  ErrorState,
} from '../../components';
import { useProduct, useCategory, useProductImages, useFavouriteProductIds } from '../../hooks';
import { addFavourite, removeFavourite } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { Product } from '../../types';
import { calculateProductPrice, formatINR, formatWeight } from '../../lib/rateCalculator';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading, error, refetch } = useProduct(id || '');
  const { data: category } = useCategory(product?.category_id || '');
  const { data: productImages } = useProductImages(id || '');
  const { data: favouriteIds = [] } = useFavouriteProductIds();
  const [favouriteBusy, setFavouriteBusy] = React.useState(false);

  const goldRatePerGram = useMemo(() => {
    if (!product) return null;
    const metalType = String(product.metal_type || '').toLowerCase();
    if (metalType.includes('gold') || metalType.includes('sona')) {
      return 15000;
    }
    return null;
  }, [product]);

  const productPricing = useMemo(() => {
    if (!product?.weight || !goldRatePerGram) return null;

    const weightMatch = String(product.weight).match(/(\d+\.?\d*)/);
    if (!weightMatch) return null;

    const weightGrams = parseFloat(weightMatch[1]);
    if (Number.isNaN(weightGrams) || weightGrams <= 0) return null;

    return calculateProductPrice(weightGrams, goldRatePerGram);
  }, [product, goldRatePerGram]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingScreen message="Loading product..." />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ErrorState
          title="Product Not Found"
          message="Unable to load this product details."
          onRetry={() => refetch()}
        />
      </>
    );
  }

  const categoryName = category?.name || product.category_id || 'Unknown';
  const galleryImages = [
    ...(productImages || []).map((image) => image.image_url),
    ...(product.image_url ? [product.image_url] : []),
  ].filter((image, index, images) => images.indexOf(image) === index);
  const primaryImage = galleryImages[0];
  const isFavourite = favouriteIds.includes(product.id);

  const toggleFavourite = async () => {
    if (favouriteBusy) return;
    try {
      setFavouriteBusy(true);
      if (isFavourite) await removeFavourite(product.id);
      else await addFavourite(product.id);
      await queryClient.invalidateQueries({ queryKey: ['favourites'] });
    } catch (favouriteError: any) {
      Alert.alert('Favourite error', favouriteError?.message || 'Unable to update favourites.');
    } finally {
      setFavouriteBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: COLORS.primary },
          headerTitleStyle: { color: COLORS.gold, fontFamily: FONT_FAMILY.sansSemiBold },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {primaryImage ? (
            <Image source={{ uri: primaryImage }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderIcon}>◆</Text>
            </View>
          )}
        </View>

        {galleryImages.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
            {galleryImages.map((imageUrl) => (
              <Image key={imageUrl} source={{ uri: imageUrl }} style={styles.galleryImage} />
            ))}
          </ScrollView>
        )}

        <View style={styles.content}>
          <Text style={styles.productName}>{product.name}</Text>

          <TouchableOpacity style={styles.favouriteButton} onPress={toggleFavourite} disabled={favouriteBusy}>
            <Text style={styles.favouriteIcon}>{isFavourite ? '♥' : '♡'}</Text>
            <Text style={styles.favouriteText}>{isFavourite ? 'Saved to favourites' : 'Add to favourites'}</Text>
          </TouchableOpacity>

          {product.short_description ? (
            <Text style={styles.shortDescription}>{product.short_description}</Text>
          ) : null}

          <View style={styles.metaContainer}>
            {product.metal_type ? (
              <View style={styles.metaBadge}>
                <Text style={styles.metaLabel}>Metal</Text>
                <Text style={styles.metaValue}>{product.metal_type}</Text>
              </View>
            ) : null}
            {product.purity ? (
              <View style={styles.metaBadge}>
                <Text style={styles.metaLabel}>Purity</Text>
                <Text style={styles.metaValue}>{product.purity}</Text>
              </View>
            ) : null}
            {product.weight ? (
              <View style={styles.metaBadge}>
                <Text style={styles.metaLabel}>Weight</Text>
                <Text style={styles.metaValue}>{product.weight}</Text>
              </View>
            ) : null}
          </View>

          {productPricing && (
            <View style={styles.pricingSection}>
              <Text style={styles.pricingSectionTitle}>Price Breakdown</Text>

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Gold Weight</Text>
                <Text style={styles.pricingValue}>{product.weight || '—'}</Text>
              </View>

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Current Gold Rate</Text>
                <Text style={styles.pricingValue}>
                  {goldRatePerGram ? formatINR(goldRatePerGram) + '/g' : '—'}
                </Text>
              </View>

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Gold Value</Text>
                <Text style={styles.pricingValue}>
                  {productPricing ? formatINR(productPricing.goldValue) : '—'}
                </Text>
              </View>

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Making Charge</Text>
                <Text style={styles.pricingValue}>10%</Text>
              </View>

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Making Amount</Text>
                <Text style={styles.pricingValue}>
                  {productPricing ? formatINR(productPricing.makingAmount) : '—'}
                </Text>
              </View>

              <View style={[styles.pricingRow, styles.pricingRowTotal]}>
                <Text style={styles.pricingLabelTotal}>Final Price</Text>
                <Text style={styles.pricingValueTotal}>
                  {productPricing ? formatINR(productPricing.finalPrice) : '—'}
                </Text>
              </View>

              <View style={styles.pricingSource}>
                <Text style={styles.pricingSourceText}>Rate: AIB • Lucknow</Text>
                <Text style={styles.pricingSourceText}>Updated: Live</Text>
              </View>
            </View>
          )}

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <ReadMoreText text={product.full_description || product.short_description} limit={200} />
          </View>

          {product.category_id && (
            <View style={styles.categorySection}>
              <Text style={styles.sectionTitle}>Category</Text>
              <Text style={styles.categoryText}>{categoryName}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    marginRight: SPACING.sm,
  },
  backText: {
    color: COLORS.gold,
    fontSize: SIZES.xxl,
    fontWeight: '400',
    fontFamily: FONT_FAMILY.sans,
  },
  imageContainer: {
    width: '100%',
    height: 350,
    backgroundColor: COLORS.secondary,
    ...SHADOWS.dark,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  gallery: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  galleryImage: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  placeholderIcon: {
    fontSize: 60,
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.sans,
  },
  content: {
    padding: SPACING.lg,
  },
  productName: {
    fontSize: SIZES.xxl,
    fontFamily: FONT_FAMILY.serifBold,
    color: COLORS.white,
    marginBottom: SPACING.md,
    lineHeight: 32,
  },
  favouriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  favouriteIcon: {
    color: COLORS.gold,
    fontSize: SIZES.xxl,
    marginRight: SPACING.sm,
  },
  favouriteText: {
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: SIZES.sm,
  },
  shortDescription: {
    fontSize: SIZES.md,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  metaBadge: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minWidth: 100,
    flex: 1,
    minHeight: 80,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  metaLabel: {
    fontSize: SIZES.xs,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: SIZES.lg,
    fontFamily: FONT_FAMILY.sansSemiBold,
    color: COLORS.gold,
    lineHeight: 20,
  },
  pricingSection: {
    backgroundColor: '#121212',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pricingSectionTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 18,
    marginBottom: SPACING.md,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pricingRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#252525',
    paddingTop: 10,
    marginTop: 4,
  },
  pricingLabel: {
    color: COLORS.secondaryText,
    fontFamily: FONT_FAMILY.sans,
    fontSize: 12,
  },
  pricingValue: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 13,
  },
  pricingLabelTotal: {
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 14,
  },
  pricingValueTotal: {
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 20,
  },
  pricingSource: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#252525',
  },
  pricingSourceText: {
    color: '#777777',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 10,
    marginTop: 2,
  },
  descriptionSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: SIZES.xl,
    fontFamily: FONT_FAMILY.serifBold,
    color: COLORS.white,
    marginBottom: SPACING.md,
    lineHeight: 28,
  },
  categorySection: {
    marginBottom: SPACING.xl,
  },
  categoryText: {
    fontSize: SIZES.md,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    lineHeight: 22,
  },
});