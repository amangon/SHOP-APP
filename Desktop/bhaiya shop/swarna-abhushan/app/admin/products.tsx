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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';
import { LuxuryButton, LoadingScreen, EmptyState, LuxuryInput } from '../../components';
import { Product, Category } from '../../types';
import { MaterialIcons } from '@expo/vector-icons';
import { createNotification } from '../../services/api';

interface ProductForm {
  name: string;
  short_description: string;
  full_description: string;
  metal_type: string;
  purity: string;
  weight: string;
  category_id: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_active: boolean;
  price: string;
  original_price: string;
  making_charges: string;
  stock_quantity: string;
  sku: string;
}

interface ImageAsset {
  uri: string;
  name: string;
  type: string;
}

export default function AdminProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductForm>({
    name: '',
    short_description: '',
    full_description: '',
    metal_type: '',
    purity: '',
    weight: '',
    category_id: '',
    is_featured: false,
    is_new_arrival: false,
    is_best_seller: false,
    is_active: true,
    price: '',
    original_price: '',
    making_charges: '',
    stock_quantity: '0',
    sku: '',
  });
  const [imageAsset, setImageAsset] = useState<ImageAsset | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Search and filter states
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive' | 'featured' | 'new-arrivals'>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [searchText, activeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      let query = supabase.from('products').select('*');
      
      // Apply search filter
      if (searchText.trim()) {
        query = query.ilike('name', `%${searchText.trim()}%`);
      }
      
      // Apply active/inactive filter
      if (activeFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (activeFilter === 'inactive') {
        query = query.eq('is_active', false);
      }
      
      // Apply featured filter
      if (activeFilter === 'featured') {
        query = query.eq('is_featured', true);
      }
      
      // Apply new arrivals filter
      if (activeFilter === 'new-arrivals') {
        query = query.eq('is_new_arrival', true);
      }
      
      const [{ data: productsData, error: productsError }, { data: categoriesData, error: categoriesError }] =
        await Promise.all([
          query.order('display_order', { ascending: true }),
          supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true }),
        ]);

      if (productsError) throw productsError;
      if (categoriesError) throw categoriesError;

      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      short_description: '',
      full_description: '',
      metal_type: '',
      purity: '',
      weight: '',
      category_id: categories[0]?.id || '',
      is_featured: false,
      is_new_arrival: false,
      is_best_seller: false,
      is_active: true,
      price: '',
      original_price: '',
      making_charges: '',
      stock_quantity: '0',
      sku: '',
    });
    setImageAsset(null);
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      short_description: product.short_description,
      full_description: product.full_description,
      metal_type: product.metal_type || '',
      purity: product.purity || '',
      weight: product.weight || '',
      category_id: product.category_id || '',
      is_featured: product.is_featured,
      is_new_arrival: product.is_new_arrival,
      is_best_seller: product.is_best_seller ?? false,
      is_active: product.is_active,
      price: product.price?.toString() || '',
      original_price: product.original_price?.toString() || '',
      making_charges: product.making_charges?.toString() || '',
      stock_quantity: product.stock_quantity?.toString() || '0',
      sku: product.sku || '',
    });
    setImageAsset(null);
    setModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant photo library access');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const filename = asset.uri.split('/').pop() || 'image.jpg';
        const fileExt = filename.split('.').pop() || 'jpg';
        setImageAsset({
          uri: asset.uri,
          name: `${Date.now()}.${fileExt}`,
          type: `image/${fileExt}`,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadProductImage = async (): Promise<string | null> => {
    if (!imageAsset) {
      return editingProduct?.image_url || null;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', {
        uri: imageAsset.uri,
        name: imageAsset.name,
        type: imageAsset.type,
      } as any);

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(imageAsset.name, formData, {
          contentType: imageAsset.type,
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }

    try {
      setSaving(true);
      const imageUrl = await uploadProductImage();
      if (imageAsset && !imageUrl) return;

      const productData = {
        ...form,
        price: form.price ? Number(form.price) : null,
        original_price: form.original_price ? Number(form.original_price) : null,
        making_charges: form.making_charges ? Number(form.making_charges) : null,
        stock_quantity: Math.max(0, Number(form.stock_quantity) || 0),
        image_url: imageUrl,
        category_id: form.category_id || null,
        metal_type: form.metal_type || null,
        purity: form.purity || null,
        weight: form.weight || null,
        display_order: editingProduct?.display_order || 0,
      };

      let productId = editingProduct?.id;
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { data: insertedProduct, error } = await supabase
          .from('products')
          .insert([productData])
          .select('id')
          .single();

        if (error) throw error;
        productId = insertedProduct?.id;

        // Create notification for new product
        if (productId) {
          try {
            await createNotification({
              title: 'New Product Added',
              message: `A new product, ${form.name} has been added to our collection.`,
              target_route: `/product/${productId}`,
              user_id: null, // null means for all users
            });
          } catch (notificationError) {
            console.error('Failed to create notification for new product:', notificationError);
            // Don't fail the product save if notification creation fails
          }
        }
      }

      if (productId && imageUrl) {
        const { error: deleteImagesError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId);
        if (deleteImagesError) throw deleteImagesError;

        const { error: imageRowError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: imageUrl,
            display_order: 0,
          });
        if (imageRowError) throw imageRowError;
      }

      setModalVisible(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            loadData();
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to delete product');
          }
        },
      },
    ]);
  };

const toggleStatus = async (
  id: string,
  field: 'is_active' | 'is_featured' | 'is_new_arrival' | 'is_best_seller',
  currentValue: boolean
) => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ [field]: !currentValue })
      .eq('id', id);

    if (error) throw error;
    loadData();

    // Create notification for status changes that matter to customers
    if (['is_featured', 'is_new_arrival', 'is_best_seller'].includes(field)) {
      const product = products.find(p => p.id === id);
      if (product) {
        let title = '';
        let message = '';

        if (field === 'is_featured') {
          title = 'New Featured Product';
          message = `${product.name} is now featured in our collection.`;
        } else if (field === 'is_new_arrival') {
          title = 'New Arrival';
          message = `${product.name} is now available as a new arrival.`;
        } else if (field === 'is_best_seller') {
          title = 'Best Seller Update';
          message = `${product.name} is now marked as a best seller.`;
        }

        if (title && message) {
          try {
            await createNotification({
              title,
              message,
              target_route: `/product/${id}`,
              user_id: null, // for all users
            });
          } catch (notificationError) {
            console.error('Failed to create notification for product status change:', notificationError);
            // Don't fail the status update if notification creation fails
          }
        }
      }
    }
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to update status');
  }
};

  if (loading) {
    return <LoadingScreen message="Loading products..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Products</Text>
          <View style={styles.searchFilterContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={COLORS.secondaryText}
            />
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
</View>
      
      {/* Filter Chips */}
      <View style={styles.filterChipsContainer}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'active' && styles.filterChipActive]}
          onPress={() => setActiveFilter('active')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'active' && styles.filterChipTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'inactive' && styles.filterChipActive]}
          onPress={() => setActiveFilter('inactive')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'inactive' && styles.filterChipTextActive]}>Inactive</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'featured' && styles.filterChipActive]}
          onPress={() => setActiveFilter('featured')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'featured' && styles.filterChipTextActive]}>Featured</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'new-arrivals' && styles.filterChipActive]}
          onPress={() => setActiveFilter('new-arrivals')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'new-arrivals' && styles.filterChipTextActive]}>New Arrivals</Text>
        </TouchableOpacity>
      </View>
      
      {products.length === 0 ? (
        <EmptyState
          title="No products"
          message="Add your first product to get started"
        />
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {products.map((product: Product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={styles.statusContainer}>
                  <TouchableOpacity
                    style={[styles.statusBadge, product.is_active && styles.statusActive]}
                    onPress={() => toggleStatus(product.id, 'is_active', product.is_active)}
                  >
                    <Text style={[styles.statusText, product.is_active && styles.statusTextActive]}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.productMeta}>
                <Text style={styles.metaText}>{product.metal_type || 'No metal type'}</Text>
                <Text style={styles.metaText}>{product.purity || 'N/A'}</Text>
                <Text style={styles.metaText}>{product.weight || 'N/A'}</Text>
                <Text style={styles.metaText}>Stock: {product.stock_quantity ?? 0}</Text>
              </View>

              {product.price != null && (
                <Text style={styles.productPrice}>₹{product.price.toLocaleString('en-IN')}</Text>
              )}

              {product.image_url && (
                <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="cover" />
              )}

              <View style={styles.flagsContainer}>
                {product.is_featured && (
                  <View style={styles.flag}>
                    <Text style={styles.flagText}>Featured</Text>
                  </View>
                )}
                {product.is_new_arrival && (
                  <View style={[styles.flag, styles.flagNew]}>
                    <Text style={styles.flagText}>New Arrival</Text>
                  </View>
                )}
                {product.is_best_seller && (
                  <View style={[styles.flag, styles.flagBest]}>
                    <Text style={styles.flagText}>Best Seller</Text>
                  </View>
                )}
              </View>

              <View style={styles.productActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(product)}>
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(product.id)}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.input}
              placeholder="Product Name"
              placeholderTextColor={COLORS.secondaryText}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Short Description"
              placeholderTextColor={COLORS.secondaryText}
              value={form.short_description}
              onChangeText={(text) => setForm({ ...form, short_description: text })}
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Full Description"
              placeholderTextColor={COLORS.secondaryText}
              value={form.full_description}
              onChangeText={(text) => setForm({ ...form, full_description: text })}
              multiline
              numberOfLines={5}
            />

            <TextInput
              style={styles.input}
              placeholder="Selling Price (INR)"
              placeholderTextColor={COLORS.secondaryText}
              value={form.price}
              onChangeText={(text) => setForm({ ...form, price: text.replace(/[^0-9.]/g, '') })}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Original Price (INR)"
              placeholderTextColor={COLORS.secondaryText}
              value={form.original_price}
              onChangeText={(text) => setForm({ ...form, original_price: text.replace(/[^0-9.]/g, '') })}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Making Charges (INR)"
              placeholderTextColor={COLORS.secondaryText}
              value={form.making_charges}
              onChangeText={(text) => setForm({ ...form, making_charges: text.replace(/[^0-9.]/g, '') })}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Stock Quantity"
              placeholderTextColor={COLORS.secondaryText}
              value={form.stock_quantity}
              onChangeText={(text) => setForm({ ...form, stock_quantity: text.replace(/[^0-9]/g, '') })}
              keyboardType="number-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="SKU"
              placeholderTextColor={COLORS.secondaryText}
              value={form.sku}
              onChangeText={(text) => setForm({ ...form, sku: text.toUpperCase() })}
              autoCapitalize="characters"
            />

            <TextInput
              style={styles.input}
              placeholder="Metal Type"
              placeholderTextColor={COLORS.secondaryText}
              value={form.metal_type}
              onChangeText={(text) => setForm({ ...form, metal_type: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Purity (e.g., 22K / 91.6%)"
              placeholderTextColor={COLORS.secondaryText}
              value={form.purity}
              onChangeText={(text) => setForm({ ...form, purity: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Weight (e.g., 12.5g)"
              placeholderTextColor={COLORS.secondaryText}
              value={form.weight}
              onChangeText={(text) => setForm({ ...form, weight: text })}
            />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((category: Category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryChip, form.category_id === category.id && styles.categoryChipActive]}
                  onPress={() => setForm({ ...form, category_id: category.id })}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      form.category_id === category.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggle, form.is_featured && styles.toggleActive]}
                onPress={() => setForm({ ...form, is_featured: !form.is_featured })}
              >
                <Text style={[styles.toggleText, form.is_featured && styles.toggleTextActive]}>
                  Featured
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggle, form.is_new_arrival && styles.toggleActive]}
                onPress={() => setForm({ ...form, is_new_arrival: !form.is_new_arrival })}
              >
                <Text style={[styles.toggleText, form.is_new_arrival && styles.toggleTextActive]}>
                  New Arrival
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggle, form.is_best_seller && styles.toggleActive]}
                onPress={() => setForm({ ...form, is_best_seller: !form.is_best_seller })}
              >
                <Text style={[styles.toggleText, form.is_best_seller && styles.toggleTextActive]}>
                  Best Seller
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Text style={styles.imagePickerText}>
                {imageAsset ? 'Change Product Image' : 'Upload Product Image'}
              </Text>
            </TouchableOpacity>

            {imageAsset ? (
              <Image source={{ uri: imageAsset.uri }} style={styles.previewImage} resizeMode="cover" />
            ) : editingProduct?.image_url ? (
              <Image source={{ uri: editingProduct.image_url }} style={styles.previewImage} resizeMode="cover" />
            ) : null}

            <LuxuryButton
              title={saving || uploadingImage ? 'Saving...' : 'Save Product'}
              onPress={handleSave}
              loading={saving || uploadingImage}
              style={styles.saveButton}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  headerTitle: {
    fontSize: SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  addButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  addButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: SIZES.md,
  },
  list: {
    flex: 1,
    padding: SPACING.lg,
  },
  productCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  productName: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.white,
    flex: 1,
    marginRight: SPACING.md,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  statusActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  statusText: {
    fontSize: SIZES.xs,
    color: COLORS.secondaryText,
    fontWeight: '600',
  },
  statusTextActive: {
    color: COLORS.primary,
  },
  productMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  metaText: {
    fontSize: SIZES.sm,
    color: COLORS.secondaryText,
  },
  productPrice: {
    color: COLORS.gold,
    fontSize: SIZES.xl,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  productImage: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  flagsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  flag: {
    backgroundColor: COLORS.goldBorder,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  flagNew: {
    backgroundColor: COLORS.darkGold,
  },
  flagBest: {
    backgroundColor: COLORS.success,
  },
  flagText: {
    color: COLORS.white,
    fontSize: SIZES.xs,
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
  },
  actionText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: SIZES.md,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: SIZES.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  modalTitle: {
    fontSize: SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  modalClose: {
    color: COLORS.gold,
    fontSize: SIZES.lg,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  input: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: SIZES.lg,
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: SIZES.md,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  categoryScroll: {
    marginBottom: SPACING.lg,
    maxHeight: 44,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.secondary,
  },
  categoryChipActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  categoryChipText: {
    color: COLORS.secondaryText,
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: COLORS.primary,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  toggle: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
  },
  toggleActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  toggleText: {
    color: COLORS.secondaryText,
    fontWeight: '600',
    fontSize: SIZES.md,
  },
  toggleTextActive: {
    color: COLORS.primary,
  },
  imagePicker: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  imagePickerText: {
    color: COLORS.gold,
    fontSize: SIZES.lg,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
saveButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xxl
  },
  // Search and Filter Styles
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    width: 200,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
  filterButton: {
    padding: SPACING.xs,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    backgroundColor: COLORS.secondary,
  },
  filterChipActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  filterChipText: {
    color: COLORS.secondaryText,
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.primary,
  },
});
