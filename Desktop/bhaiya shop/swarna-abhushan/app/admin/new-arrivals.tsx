import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';
import { LoadingScreen, EmptyState, ErrorState } from '../../components';
import { Product } from '../../types';
import { MaterialIcons } from '@expo/vector-icons';
import { createNotification } from '../../services/api';

export default function AdminNewArrivalsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

const toggleNewArrival = async (product: Product) => {
  setUpdatingIds(prev => new Set([...prev, product.id]));
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_new_arrival: !product.is_new_arrival })
      .eq('id', product.id);

    if (error) throw error;

    setProducts(products.map(p =>
      p.id === product.id ? { ...p, is_new_arrival: !p.is_new_arrival } : p
    ));

    // Create notification when product is marked as new arrival
    if (!product.is_new_arrival) { // Only notify when adding to new arrivals, not removing
      try {
        await createNotification({
          title: 'New Arrival',
          message: `${product.name} is now available as a new arrival.`,
          target_route: `/product/${product.id}`,
          user_id: null, // for all users
        });
      } catch (notificationError) {
        console.error('Failed to create notification for new arrival product:', notificationError);
        // Don't fail the new arrival update if notification creation fails
      }
    }
  } catch (err: any) {
    Alert.alert('Error', err?.message || 'Failed to update');
  } finally {
    setUpdatingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(product.id);
      return newSet;
    });
  }
};

  const filteredProducts = searchQuery
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  const newArrivalProducts = filteredProducts.filter(p => p.is_new_arrival);

  if (loading) {
    return <LoadingScreen message="Loading products..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error Loading Products"
        message={error}
        onRetry={loadProducts}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={COLORS.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={COLORS.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>
      </View>

      {newArrivalProducts.length === 0 && !searchQuery ? (
        <EmptyState
          title="No new arrivals"
          message="Search below and toggle products to mark as new arrivals"
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
          {searchQuery ? (
            filteredProducts.map((product: Product) => (
              <View key={product.id} style={styles.productRow}>
                {product.image_url ? (
                  <Image source={{ uri: product.image_url }} style={styles.productThumbnail} />
                ) : (
                  <View style={[styles.productThumbnail, styles.placeholder]}>
                    <Text style={styles.placeholderIcon}>◆</Text>
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productMeta}>
                    {product.metal_type || 'N/A'} • {product.purity || 'N/A'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => toggleNewArrival(product)}
                  disabled={updatingIds.has(product.id)}
                >
                  <MaterialIcons
                    name={product.is_new_arrival ? 'fiber-new' : 'radio-button-unchecked'}
                    size={24}
                    color={product.is_new_arrival ? COLORS.gold : COLORS.secondaryText}
                  />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            newArrivalProducts.map((product: Product) => (
              <View key={product.id} style={styles.productRow}>
                {product.image_url ? (
                  <Image source={{ uri: product.image_url }} style={styles.productThumbnail} />
                ) : (
                  <View style={[styles.productThumbnail, styles.placeholder]}>
                    <Text style={styles.placeholderIcon}>◆</Text>
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productMeta}>
                    {product.metal_type || 'N/A'} • {product.purity || 'N/A'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => toggleNewArrival(product)}
                  disabled={updatingIds.has(product.id)}
                >
                  <MaterialIcons name="fiber-new" size={24} color={COLORS.gold} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  searchHeader: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tertiary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
  list: {
    padding: SPACING.lg,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    gap: SPACING.md,
  },
  productThumbnail: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.sm,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  placeholderIcon: {
    fontSize: 24,
    color: COLORS.gold,
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  productMeta: {
    fontSize: SIZES.sm,
    color: COLORS.secondaryText,
  },
  favoriteButton: {
    padding: SPACING.sm,
  },
});
