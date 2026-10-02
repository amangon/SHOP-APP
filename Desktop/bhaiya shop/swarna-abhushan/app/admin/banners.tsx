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
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';
import { LoadingScreen, EmptyState, ErrorState } from '../../components';
import { supabase } from '../../lib/supabase';
import { HomeBanner } from '../../types';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';

interface BannerForm {
  title: string;
  subtitle: string;
  is_active: boolean;
}

interface ImageAsset {
  uri: string;
  name: string;
  type: string;
  base64: string;
}

export default function AdminBannersScreen() {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HomeBanner | null>(null);
  const [form, setForm] = useState<BannerForm>({
    title: '',
    subtitle: '',
    is_active: true,
  });
  const [imageAsset, setImageAsset] = useState<ImageAsset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('home_banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingBanner(null);
    setForm({ title: '', subtitle: '', is_active: true });
    setImageAsset(null);
    setModalVisible(true);
  };

  const openEditModal = (banner: HomeBanner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle,
      is_active: banner.is_active,
    });
    setImageAsset(null);
    setModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow photo library access to select a banner image.'
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.9,
          base64: true,
        });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];

      if (!asset.base64) {
        throw new Error(
          'The selected image could not be prepared for upload. Please select another image.'
        );
      }

      const originalName =
        asset.fileName ||
        asset.uri.split('/').pop() ||
        `banner-${Date.now()}.jpg`;

      let extension =
        originalName.split('.').pop()?.toLowerCase() || 'jpg';

      if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
        extension = 'jpg';
      }

      const mimeType =
        asset.mimeType ||
        (extension === 'png'
          ? 'image/png'
          : extension === 'webp'
            ? 'image/webp'
            : 'image/jpeg');

      setImageAsset({
        uri: asset.uri,
        name: `banner-${Date.now()}.${extension}`,
        type: mimeType,
        base64: asset.base64,
      });
    } catch (error: any) {
      console.error('Banner image picker failed:', error);

      Alert.alert(
        'Image Error',
        error?.message || 'Failed to pick image.'
      );
    }
  };


  const uploadBannerImage = async (): Promise<string | null> => {
    if (!imageAsset) {
      return editingBanner?.image_url || null;
    }

    try {
      setSaving(true);

      if (!imageAsset.base64) {
        throw new Error(
          'Banner image data is missing. Please select the image again.'
        );
      }

      // ImagePicker already gives us the image bytes as Base64.
      // This avoids Android content:// URI 404 issues completely.
      const binaryString = atob(imageAsset.base64);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const filePath =
        `banners/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}-${imageAsset.name}`;

      const {
        data,
        error,
      } = await supabase.storage
        .from('banner-images')
        .upload(filePath, bytes.buffer, {
          contentType: imageAsset.type,
          upsert: false,
        });

      if (error) {
        console.error('Banner upload error:', error);
        throw new Error(error.message);
      }

      if (!data?.path) {
        throw new Error(
          'Banner uploaded but no storage path was returned.'
        );
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from('banner-images')
        .getPublicUrl(data.path);

      if (!publicUrl) {
        throw new Error(
          'Unable to create the banner image URL.'
        );
      }

      return publicUrl;
    } catch (err: any) {
      console.error('Banner image upload failed:', err);

      Alert.alert(
        'Upload Failed',
        err?.message || 'Failed to upload banner image.'
      );

      return null;
    } finally {
      setSaving(false);
    }
  };


  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Banner title is required');
      return;
    }

    try {
      setSaving(true);

      const imageUrl = await uploadBannerImage();

      if (imageAsset && !imageUrl) {
        return;
      }

      const bannerData = {
        title: form.title,
        subtitle: form.subtitle,
        image_url: imageUrl,
        is_active: form.is_active,
        display_order: editingBanner?.display_order || 0,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('home_banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('home_banners')
          .insert([bannerData]);

        if (error) throw error;
      }

      setModalVisible(false);
      loadBanners();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save banner');
    } finally {
      setSaving(false);
      setImageAsset(null);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Banner', 'Are you sure you want to delete this banner?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('home_banners').delete().eq('id', id);
            if (error) throw error;
            loadBanners();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete banner');
          }
        },
      },
    ]);
  };

  const toggleStatus = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('home_banners')
        .update({ is_active: !currentValue })
        .eq('id', id);

      if (error) throw error;
      loadBanners();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading banners..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error Loading Banners"
        message={error}
        onRetry={loadBanners}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home Banners</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {banners.length === 0 ? (
        <EmptyState title="No banners" message="Add a banner to showcase on the home screen" />
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {banners.map((banner: HomeBanner) => (
            <View key={banner.id} style={styles.bannerCard}>
              {banner.image_url ? (
                <Image source={{ uri: banner.image_url }} style={styles.bannerImage} resizeMode="cover" />
              ) : (
                <View style={[styles.bannerImage, styles.imagePlaceholder]}>
                  <MaterialIcons name="image" size={40} color={COLORS.secondaryText} />
                </View>
              )}
              <View style={styles.bannerInfo}>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                <Text style={styles.bannerSubtitle}>{banner.subtitle || 'No subtitle'}</Text>
                <View style={styles.bannerActions}>
                  <TouchableOpacity
                    style={[styles.statusBadge, banner.is_active && styles.statusActive]}
                    onPress={() => toggleStatus(banner.id, banner.is_active)}
                  >
                    <Text style={[styles.statusText, banner.is_active && styles.statusTextActive]}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.bannerButtons}>
                    <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(banner)}>
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(banner.id)}>
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingBanner ? 'Edit Banner' : 'Add Banner'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.input}
              placeholder="Banner Title"
              placeholderTextColor={COLORS.secondaryText}
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Banner Subtitle"
              placeholderTextColor={COLORS.secondaryText}
              value={form.subtitle}
              onChangeText={(text) => setForm({ ...form, subtitle: text })}
            />

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Text style={styles.imagePickerText}>
                {imageAsset ? 'Change Banner Image' : 'Upload Banner Image'}
              </Text>
            </TouchableOpacity>

            {imageAsset ? (
              <Image source={{ uri: imageAsset.uri }} style={styles.previewImage} resizeMode="cover" />
            ) : editingBanner?.image_url ? (
              <Image source={{ uri: editingBanner.image_url }} style={styles.previewImage} resizeMode="cover" />
            ) : null}

            <TouchableOpacity
              style={[styles.toggle, form.is_active && styles.toggleActive]}
              onPress={() => setForm({ ...form, is_active: !form.is_active })}
            >
              <Text style={[styles.toggleText, form.is_active && styles.toggleTextActive]}>
                {form.is_active ? 'Active' : 'Inactive'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Banner'}
              </Text>
            </TouchableOpacity>
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
  bannerCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  bannerImage: {
    width: '100%',
    height: 180,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  bannerInfo: {
    padding: SPACING.lg,
  },
  bannerTitle: {
    fontSize: SIZES.xl,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  bannerSubtitle: {
    fontSize: SIZES.md,
    color: COLORS.secondaryText,
    marginBottom: SPACING.md,
  },
  bannerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  bannerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  editButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  editButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: SIZES.sm,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: SIZES.sm,
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
  toggle: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    marginBottom: SPACING.lg,
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
  saveButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  saveButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: SIZES.md,
  },
});
