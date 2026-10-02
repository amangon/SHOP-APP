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
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';
import { LoadingScreen, ErrorState } from '../../components';
import { supabase } from '../../lib/supabase';
import { AppSetting } from '../../types';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { uploadBrandAsset } from '../../services/storage';

const SETTING_LABELS: Record<string, string> = {
  login_logo_url: 'Login Logo',
  app_name: 'App Name',
  hindi_brand_name: 'Hindi Brand Name',
  english_brand_name: 'English Brand Name',
  main_logo_url: 'Main Logo',
  splash_logo_url: 'Splash Logo',
  brand_description: 'Brand Description',
  about_description: 'About Description',
  contact_email: 'Contact Email',
  contact_phone: 'Contact Phone',
  whatsapp_number: 'WhatsApp Number',
  address: 'Store Address',
  store_name: 'Store Name',
  store_location: 'Store Location',
  default_currency: 'Default Currency',
  default_city: 'Default City',
  facebook_url: 'Facebook URL',
  instagram_url: 'Instagram URL',
  twitter_url: 'Twitter URL',
  youtube_url: 'YouTube URL',
};

const IMAGE_SETTINGS = new Set([
  'login_logo_url',
  'main_logo_url',
  'splash_logo_url',
  'banner_image_url',
  'home_banner_url',
]);

export default function AdminSettingsScreen() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [imageAsset, setImageAsset] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('app_settings')
        .select('*')
        .order('setting_key', { ascending: true });

      if (fetchError) throw fetchError;
      setSettings(data || []);
    } catch (err: any) {
      console.error('Load settings error:', err);
      setError(err?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const getSettingValue = (key: string): string => {
    const setting = settings.find((s) => s.setting_key === key);
    return setting?.setting_value || '';
  };

  const startEdit = (setting: AppSetting) => {
    setEditingKey(setting.setting_key);
    setEditValue(setting.setting_value || '');
    setImageAsset(null);
    setPreviewUrl(setting.setting_value);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
    setImageAsset(null);
    setPreviewUrl(null);
  };

  const pickImage = async (settingKey: string) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant photo library permission to select an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      const originalName = asset.fileName || asset.uri.split('/').pop() || 'image.jpg';
      const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
      const fileType = asset.mimeType || `image/${fileExtension}`;
      const newImageAsset = { uri: asset.uri, name: `${settingKey}-${Date.now()}.${fileExtension}`, type: fileType };

      setImageAsset(newImageAsset);
      setPreviewUrl(asset.uri);
    } catch (err: any) {
      console.error('Image picker error:', err);
      Alert.alert('Error', err?.message || 'Failed to select image');
    }
  };

  const uploadImage = async (settingKey: string): Promise<string | null> => {
    if (!imageAsset) return previewUrl;
    try {
      setUploadingImage(true);
      const result = await uploadBrandAsset(imageAsset.uri);
      if (result.error) throw new Error(result.error);
      return result.url;
    } catch (err: any) {
      console.error('Image upload error:', err);
      Alert.alert('Upload Error', err?.message || 'Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const saveSetting = async (key: string) => {
    try {
      setSaving(true);
      let finalValue = editValue.trim();

      if (IMAGE_SETTINGS.has(key) && imageAsset) {
        const uploadedUrl = await uploadImage(key);
        if (!uploadedUrl) return;
        finalValue = uploadedUrl;
      }

      const { error: saveError } = await supabase
        .from('app_settings')
        .upsert(
          {
            setting_key: key,
            setting_value: finalValue || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' }
        );

      if (saveError) throw saveError;

      Alert.alert('Success', 'Setting saved successfully');
      setEditingKey(null);
      setEditValue('');
      setImageAsset(null);
      setPreviewUrl(null);
      await loadSettings();
    } catch (err: any) {
      console.error('Save setting error:', err);
      Alert.alert('Error', err?.message || 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const getLabel = (key: string): string => SETTING_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  if (loading) return <LoadingScreen message="Loading settings..." />;
  if (error) return <ErrorState title="Error Loading Settings" message={error} onRetry={loadSettings} />;

  const editableSettings = settings.filter((s) => SETTING_LABELS[s.setting_key] !== undefined);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>App Settings</Text>
        <Text style={styles.headerSubtitle}>Configure application settings</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {editableSettings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No settings available</Text>
          </View>
        ) : (
          editableSettings.map((setting: AppSetting) => (
            <View key={setting.id} style={styles.settingCard}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingKey}>{getLabel(setting.setting_key)}</Text>
                <Text style={styles.settingDatabaseKey}>{setting.setting_key}</Text>
              </View>

              {editingKey === setting.setting_key ? (
                <>
                  {IMAGE_SETTINGS.has(setting.setting_key) ? (
                    <View style={styles.imagePreviewContainer}>
                      {previewUrl ? (
                        <Image source={{ uri: previewUrl }} style={styles.imagePreview} resizeMode="contain" />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Text style={styles.imagePlaceholderText}>No Image</Text>
                        </View>
                      )}
                      <View style={styles.imageActions}>
                        <TouchableOpacity style={styles.imageUploadButton} onPress={() => pickImage(setting.setting_key)} disabled={uploadingImage}>
                          {uploadingImage ? (
                            <ActivityIndicator color={COLORS.primary} />
                          ) : (
                            <Text style={styles.imageUploadText}>Change Image</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelImageButton} onPress={cancelEdit} disabled={uploadingImage}>
                          <Text style={styles.cancelImageText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <TextInput
                        style={styles.editInput}
                        placeholder={`Enter value for ${setting.setting_key}`}
                        placeholderTextColor={COLORS.secondaryText}
                        value={editValue}
                        onChangeText={setEditValue}
                        autoCapitalize="sentences"
                      />
                      <View style={styles.settingActions}>
                        <TouchableOpacity style={styles.cancelSettingButton} onPress={cancelEdit}>
                          <Text style={styles.cancelSettingText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveSettingButton} onPress={() => saveSetting(setting.setting_key)} disabled={saving}>
                          <Text style={styles.saveSettingText}>{saving ? 'Saving...' : 'Save'}</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.settingValue}>
                    {setting.setting_value || <Text style={styles.settingEmpty}>(empty)</Text>}
                  </Text>
                  <TouchableOpacity style={styles.editSettingButton} onPress={() => startEdit(setting)}>
                    <Text style={styles.editSettingText}>Edit</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  headerTitle: { fontSize: SIZES.xxxl, fontWeight: '700', color: COLORS.white },
  headerSubtitle: { fontSize: SIZES.md, color: COLORS.secondaryText, marginTop: SPACING.xs },
  list: { padding: SPACING.lg },
  listContent: { paddingBottom: SPACING.xxl },
  settingCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  settingHeader: { marginBottom: SPACING.sm },
  settingKey: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.white },
  settingDatabaseKey: { fontSize: SIZES.xs, color: COLORS.secondaryText, marginTop: 2 },
  settingValue: { fontSize: SIZES.md, color: COLORS.secondaryText, lineHeight: 20, marginBottom: SPACING.md },
  settingEmpty: { color: COLORS.secondaryText, fontStyle: 'italic' },
  editInput: {
    backgroundColor: COLORS.tertiary,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: SIZES.lg,
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  settingActions: { flexDirection: 'row', gap: SPACING.md },
  cancelSettingButton: {
    flex: 1,
    backgroundColor: COLORS.tertiary,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  cancelSettingText: { color: COLORS.secondaryText, fontWeight: '600', fontSize: SIZES.md },
  saveSettingButton: {
    flex: 1,
    backgroundColor: COLORS.gold,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  saveSettingText: { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.md },
  editSettingButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  editSettingText: { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.sm },
  imagePreviewContainer: { marginBottom: SPACING.md },
  imagePreview: { width: '100%', height: 180, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  imagePlaceholder: { width: '100%', height: 120, borderRadius: RADIUS.md, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  imagePlaceholderText: { color: COLORS.secondaryText, fontSize: SIZES.md },
  imageActions: { flexDirection: 'row', gap: SPACING.md },
  imageUploadButton: {
    flex: 1,
    backgroundColor: COLORS.gold,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  imageUploadText: { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.md },
  cancelImageButton: {
    flex: 1,
    backgroundColor: COLORS.tertiary,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  cancelImageText: { color: COLORS.secondaryText, fontWeight: '600', fontSize: SIZES.md },
  emptyContainer: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyText: { color: COLORS.secondaryText, fontSize: SIZES.md },
});
