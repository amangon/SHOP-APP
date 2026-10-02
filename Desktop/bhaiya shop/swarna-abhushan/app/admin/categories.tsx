import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';
import { LoadingScreen, EmptyState, ErrorState } from '../../components';
import { supabase } from '../../lib/supabase';
import { Category } from '../../types';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { uploadCategoryImage, deleteImage } from '../../services/storage';

interface ImageAsset {
  uri: string;
  name: string;
  type: string;
}

export default function AdminCategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', is_active: true });
  const [imageAsset, setImageAsset] = useState<ImageAsset | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setForm({ name: '', is_active: true });
    setImageAsset(null);
    setPreviewUrl(null);
    setModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setForm({ name: category.name, is_active: category.is_active });
    setImageAsset(null);
    setPreviewUrl(category.image_url || null);
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const ext = asset.uri.split('.').pop() || 'jpg';
        setImageAsset({ uri: asset.uri, name: `category-${Date.now()}.${ext}`, type: `image/${ext}` });
        setPreviewUrl(asset.uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = () => {
    setImageAsset(null);
    setPreviewUrl(null);
    if (editingCategory?.image_url) {
      setEditingCategory({ ...editingCategory, image_url: null });
    }
  };

  const uploadCategoryImageAsset = async (): Promise<string | null> => {
    if (!imageAsset) return editingCategory?.image_url || null;
    try {
      setUploading(true);
      const result = await uploadCategoryImage(imageAsset.uri);
      if (result.error) throw new Error(result.error);
      return result.url;
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }
    try {
      setSaving(true);
      const imageUrl = await uploadCategoryImageAsset();
      if (imageAsset && !imageUrl) return;
      const categoryData = {
        name: form.name,
        image_url: imageUrl,
        is_active: form.is_active,
        display_order: editingCategory?.display_order || 0,
      };
      if (editingCategory) {
        const { error } = await supabase.from('categories').update(categoryData).eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([categoryData]);
        if (error) throw error;
      }
      setModalVisible(false);
      loadCategories();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Category', 'Are you sure you want to delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw error;
            loadCategories();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete category');
          }
        },
      },
    ]);
  };

  const toggleStatus = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase.from('categories').update({ is_active: !currentValue }).eq('id', id);
      if (error) throw error;
      loadCategories();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update status');
    }
  };

  if (loading) return <LoadingScreen message="Loading categories..." />;
  if (error) return <ErrorState title="Error Loading Categories" message={error} onRetry={loadCategories} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {categories.length === 0 ? (
        <EmptyState title="No categories" message="Add categories to organize your jewellery" />
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {categories.map((category: Category) => (
            <View key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <TouchableOpacity style={[styles.statusBadge, category.is_active && styles.statusActive]} onPress={() => toggleStatus(category.id, category.is_active)}>
                  <Text style={[styles.statusText, category.is_active && styles.statusTextActive]}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
              </View>
              {category.image_url ? (
                <Image source={{ uri: category.image_url }} style={styles.categoryImage} resizeMode="cover" />
              ) : (
                <View style={[styles.categoryImage, styles.placeholder]}>
                  <MaterialIcons name="image" size={40} color={COLORS.secondaryText} />
                </View>
              )}
              <View style={styles.categoryActions}>
                <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(category)}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(category.id)}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingCategory ? 'Edit Category' : 'Add Category'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <TextInput style={styles.input} placeholder="Category Name" placeholderTextColor={COLORS.secondaryText} value={form.name} onChangeText={(text) => setForm({ ...form, name: text })} />
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Text style={styles.imagePickerText}>{previewUrl ? 'Change Image' : 'Upload Category Image'}</Text>
            </TouchableOpacity>
            {previewUrl ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="cover" />
                <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                  <Text style={styles.removeImageText}>Remove Image</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <TouchableOpacity style={[styles.toggle, form.is_active && styles.toggleActive]} onPress={() => setForm({ ...form, is_active: !form.is_active })}>
              <Text style={[styles.toggleText, form.is_active && styles.toggleTextActive]}>{form.is_active ? 'Active' : 'Inactive'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving || uploading} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>{saving || uploading ? 'Saving...' : 'Save Category'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl, borderBottomWidth: 1, borderBottomColor: COLORS.darkBorder },
  headerTitle: { fontSize: SIZES.xxxl, fontWeight: '700', color: COLORS.white },
  addButton: { backgroundColor: COLORS.gold, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  addButtonText: { color: COLORS.primary, fontWeight: 'bold', fontSize: SIZES.md },
  list: { flex: 1, padding: SPACING.lg },
  categoryCard: { backgroundColor: COLORS.secondary, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.darkBorder },
  categoryInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  categoryName: { fontSize: SIZES.xl, fontWeight: 'bold', color: COLORS.white, flex: 1 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: 8, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.darkBorder },
  statusActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  statusText: { fontSize: SIZES.xs, color: COLORS.secondaryText, fontWeight: '600' },
  statusTextActive: { color: COLORS.primary },
  categoryImage: { width: '100%', height: 140, borderRadius: RADIUS.sm, marginBottom: SPACING.md },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card },
  categoryActions: { flexDirection: 'row', gap: SPACING.md },
  editButton: { flex: 1, backgroundColor: COLORS.gold, paddingVertical: SPACING.sm, borderRadius: 10, alignItems: 'center' },
  editButtonText: { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.md },
  deleteButton: { flex: 1, backgroundColor: 'transparent', paddingVertical: SPACING.sm, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.error },
  deleteButtonText: { color: COLORS.error, fontWeight: '600', fontSize: SIZES.md },
  modalContainer: { flex: 1, backgroundColor: COLORS.primary },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl, borderBottomWidth: 1, borderBottomColor: COLORS.darkBorder },
  modalTitle: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.white },
  modalClose: { color: COLORS.gold, fontSize: SIZES.lg, fontWeight: '600' },
  modalContent: { flex: 1, padding: SPACING.lg },
  input: { backgroundColor: COLORS.secondary, borderWidth: 1, borderColor: COLORS.darkBorder, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: SIZES.lg, color: COLORS.white, marginBottom: SPACING.md },
  imagePicker: { backgroundColor: COLORS.secondary, borderWidth: 1, borderColor: COLORS.darkBorder, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md },
  imagePickerText: { color: COLORS.gold, fontSize: SIZES.lg, fontWeight: '600' },
  previewContainer: { marginBottom: SPACING.lg },
  previewImage: { width: '100%', height: 200, borderRadius: RADIUS.md, marginBottom: SPACING.sm },
  removeImageButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.error, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center' },
  removeImageText: { color: COLORS.error, fontWeight: '600', fontSize: SIZES.sm },
  toggle: { paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.darkBorder, alignItems: 'center', backgroundColor: COLORS.secondary, marginBottom: SPACING.lg },
  toggleActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  toggleText: { color: COLORS.secondaryText, fontWeight: '600', fontSize: SIZES.md },
  toggleTextActive: { color: COLORS.primary },
  saveButton: { backgroundColor: COLORS.gold, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.xxl },
  saveButtonText: { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.md },
});
