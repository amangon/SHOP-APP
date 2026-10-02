import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { COLORS, SIZES, SPACING, FONT_FAMILY } from '../constants/theme';
import { ErrorState, EmptyState, LoadingScreen, ProductCard } from '../components';
import { useFavouriteProducts } from '../hooks';
import { Product } from '../types';

export default function FavouritesScreen() {
  const router = useRouter();
  const { data: products, isLoading, error, refetch } = useFavouriteProducts();

  if (isLoading) return <LoadingScreen message="Loading favourites..." />;
  if (error) return <ErrorState title="Unable to load favourites" message="Please try again." onRetry={() => refetch()} />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Favourites</Text>
        <View style={styles.headerSpacer} />
      </View>
      {!products?.length ? (
        <EmptyState title="No favourites yet" message="Save jewellery you love to find it here." />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {products.map((product: Product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              imageUrl={product.image_url}
              shortDescription={product.short_description}
              layout="horizontal"
              onPress={() => router.push(`/product/${product.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  back: { color: COLORS.gold, fontSize: 36, lineHeight: 36 },
  title: { color: COLORS.white, fontFamily: FONT_FAMILY.serifBold, fontSize: SIZES.xxl },
  headerSpacer: { width: 24 },
  list: { padding: SPACING.lg },
});
