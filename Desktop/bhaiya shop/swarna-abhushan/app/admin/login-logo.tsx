import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';
import { LoadingScreen, ErrorState } from '../../components';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { uploadBrandAsset } from '../../services/storage';

interface ImageAsset { uri: string; name: string; type: string; }

export default function AdminLoginLogoScreen() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageAsset, setImageAsset] = useState<ImageAsset | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLoginLogo();
  }, []);

  const loadLoginLogo = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'login_logo_url')
        .maybeSingle();
      if (error) throw error;
      setLogoUrl(data?.setting_value || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load login logo');
    } finally {
      setLoading(false);
    }
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
        allowsEditing: true, aspect: [1, 1], quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const ext = asset.uri.split('.').pop() || 'jpg';
        const newAsset = { uri: asset.uri, name: `login-logo-${Date.now()}.${ext}`, type: `image/${ext}` };
        setImageAsset(newAsset);
        setPreviewUrl(asset.uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!imageAsset) return logoUrl;
    try {
      setUploading(true);
      const result = await uploadBrandAsset(imageAsset.uri);
      if (result.error) throw new Error(result.error);
      return result.url;
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to upload logo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = await uploadLogo();
      if (url) {
        const { error } = await supabase.from('app_settings').upsert({ setting_key: 'login_logo_url', setting_value: url });
        if (error) throw error;
        setLogoUrl(url);
        setImageAsset(null);
        setPreviewUrl(null);
        Alert.alert('Success', 'Login logo updated successfully');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update logo');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    Alert.alert('Remove Logo', 'Are you sure you want to remove the login logo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('app_settings').update({ setting_value: null }).eq('setting_key', 'login_logo_url');
            if (error) throw error;
            setLogoUrl(null);
            setImageAsset(null);
            setPreviewUrl(null);
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to remove logo');
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen message="Loading..." />;
  if (error) return <ErrorState title="Error" message={error} onRetry={loadLoginLogo} />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.previewSection}>
          <Text style={styles.sectionLabel}>Current Login Logo</Text>
          <View style={styles.previewContainer}>
            {(previewUrl || logoUrl) ? (
              <Image source={{ uri: previewUrl || logoUrl! }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.placeholderContainer}>
                <MaterialIcons name="image" size={60} color={COLORS.secondaryText} />
                <Text style={styles.placeholderText}>No custom logo set</Text>
                <Text style={styles.placeholderSubtext}>Default placeholder will be shown</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionLabel}>Actions</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.uploadButtonText}>{(previewUrl || logoUrl) ? 'Replace Login Logo' : 'Upload Login Logo'}</Text>
          </TouchableOpacity>

          {(imageAsset || logoUrl) && (
            <>
              {previewUrl && (
                <View style={styles.newPreviewContainer}>
                  <Text style={styles.newPreviewLabel}>New Logo Preview:</Text>
                  <Image source={{ uri: previewUrl }} style={styles.newPreviewImage} resizeMode="contain" />
                </View>
              )}
              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSave} disabled={saving || uploading}>
                  {saving || uploading ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Logo'}</Text>
                  )}
                </TouchableOpacity>
                {(previewUrl || logoUrl) && (
                  <TouchableOpacity style={[styles.actionButton, styles.removeButton]} onPress={handleRemove}>
                    <Text style={styles.removeButtonText}>Remove Logo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: SPACING.lg },
  sectionLabel: { fontSize: SIZES.lg, fontWeight: '600', color: COLORS.white, marginBottom: SPACING.md },
  previewSection: { marginBottom: SPACING.xxl },
  previewContainer: { width: '100%', height: 240, borderRadius: RADIUS.xl, backgroundColor: COLORS.secondary, borderWidth: 1, borderColor: COLORS.darkBorder, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImage: { width: '80%', height: '80%' },
  placeholderContainer: { alignItems: 'center' },
  placeholderText: { fontSize: SIZES.xl, fontWeight: 'bold', color: COLORS.gold, marginTop: SPACING.sm },
  placeholderSubtext: { fontSize: SIZES.sm, color: COLORS.secondaryText, marginTop: SPACING.xs },
  actionsSection: { marginBottom: SPACING.xl },
  uploadButton: { backgroundColor: COLORS.secondary, borderWidth: 1, borderColor: COLORS.darkBorder, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.lg },
  uploadButtonText: { color: COLORS.gold, fontSize: SIZES.lg, fontWeight: '600' },
  newPreviewContainer: { marginBottom: SPACING.lg },
  newPreviewLabel: { fontSize: SIZES.md, color: COLORS.secondaryText, marginBottom: SPACING.sm },
  newPreviewImage: { width: '100%', height: 200, borderRadius: RADIUS.md, backgroundColor: COLORS.secondary, borderWidth: 1, borderColor: COLORS.darkBorder },
  buttonRow: { flexDirection: 'row', gap: SPACING.md },
  actionButton: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  saveButton: { backgroundColor: COLORS.gold },
  saveButtonText: { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.md },
  removeButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.error },
  removeButtonText: { color: COLORS.error, fontWeight: '600', fontSize: SIZES.md },
});
