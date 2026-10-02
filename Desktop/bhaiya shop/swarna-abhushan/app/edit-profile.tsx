import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';

import {
  COLORS,
  SIZES,
  SPACING,
  RADIUS,
  FONT_FAMILY,
} from '../constants/theme';

import {
  SectionHeader,
  LoadingScreen,
  ErrorState,
} from '../components';

import { useAuth } from '../lib/auth-context';
import { useUserProfile } from '../hooks';

import {
  uploadProfileImage,
  deleteProfilePhoto,
} from '../services/api';

import { supabase } from '../lib/supabase';


export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    isAuthenticated,
    refreshProfile,
  } = useAuth();

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useUserProfile();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [imageAsset, setImageAsset] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setFirmName(profile.firm_name || '');
      setPhone(profile.phone || '');
      setEmail(profile.email || '');
      setAvatarUrl(profile.avatar_url || profile.photo_url || null);
    }
  }, [profile]);

  const pickProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow photo library access to update your profile photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const extension = asset.uri.split('.').pop() || 'jpg';
        setImageAsset({
          uri: asset.uri,
          name: `${Date.now()}.${extension}`,
          type: `image/${extension}`,
        });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const handleUploadProfileImage = async () => {
    if (!imageAsset || uploadingImage) return;

    try {
      setUploadingImage(true);

      const uploadedUrl = await uploadProfileImage({
        uri: imageAsset.uri,
        name: imageAsset.name,
        type: imageAsset.type,
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: uploadedUrl })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const cleanUrl = uploadedUrl.split('?')[0];
      setAvatarUrl(`${cleanUrl}?t=${Date.now()}`);
      setImageAsset(null);

      queryClient.setQueryData(['profile'], updatedProfile);
      await refreshProfile();
      await refetch();

      Alert.alert('Success', 'Profile photo updated successfully.');
    } catch (error: any) {
      console.error('Profile avatar upload failed:', error);
      Alert.alert('Upload Failed', error?.message || 'Unable to upload your profile photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveProfileImage = () => {
    if (!avatarUrl) return;

    Alert.alert(
      'Remove Profile Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingImage(true);
              const deleted = await deleteProfilePhoto(avatarUrl);
              if (!deleted) throw new Error('The stored profile photo could not be deleted.');

              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Your session has expired. Please sign in again.');

              const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: null })
                .eq('id', user.id)
                .select()
                .single();

              if (updateError) throw updateError;

              setAvatarUrl(null);
              setImageAsset(null);
              queryClient.setQueryData(['profile'], updatedProfile);
              await refreshProfile();
              await refetch();
              Alert.alert('Success', 'Profile photo removed successfully.');
            } catch (error: any) {
              console.error('Profile avatar removal failed:', error);
              Alert.alert('Remove Failed', error?.message || 'Unable to remove your profile photo.');
            } finally {
              setUploadingImage(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required.');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Your session has expired. Please sign in again.');

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          full_name: fullName,
          firm_name: firmName.trim() || null,
          phone: phone.trim() || null,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      queryClient.setQueryData(['profile'], updatedProfile);
      await refreshProfile();
      await refetch();

      Alert.alert('Success', 'Profile updated successfully.');
      router.back();
    } catch (error: any) {
      console.error('Profile update failed:', error);
      Alert.alert('Save Failed', error?.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Please sign in to edit your profile.</Text>
      </View>
    );
  }

  if (isLoading) {
    return <LoadingScreen message="Loading profile..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error Loading Profile"
        message="Unable to load your profile information."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          {imageAsset?.uri || avatarUrl ? (
            <Image
              source={{ uri: imageAsset?.uri || avatarUrl || '' }}
              style={styles.profileImage}
              resizeMode="cover"
              onError={() => { if (!imageAsset) setAvatarUrl(null); }}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {firstName?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.avatarButton} onPress={pickProfileImage}>
            <Text style={styles.avatarButtonText}>
              {avatarUrl ? 'Change Photo' : 'Add Photo'}
            </Text>
          </TouchableOpacity>

          {imageAsset && (
            <TouchableOpacity
              style={styles.savePhotoButton}
              onPress={handleUploadProfileImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.savePhotoText}>Save Photo</Text>
              )}
            </TouchableOpacity>
          )}

          {avatarUrl && !imageAsset && (
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={handleRemoveProfileImage}
              disabled={uploadingImage}
            >
              <Text style={styles.removePhotoText}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.formSection}>
          <SectionHeader title="Personal Information" subtitle="Update your details" />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Firm Name</Text>
            <TextInput
              style={styles.input}
              value={firmName}
              onChangeText={setFirmName}
              placeholder="Enter your firm name"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              editable={false}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSaveProfile}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingTop: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  back: {
    color: COLORS.gold,
    fontSize: 36,
  },
  headerTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: SIZES.xxl,
  },
  spacer: {
    width: 24,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SPACING.md,
  },
  avatarText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: SIZES.xxxl,
  },
  avatarButton: {
    marginTop: SPACING.xs,
  },
  avatarButtonText: {
    fontSize: SIZES.sm,
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.sansSemiBold,
  },
  savePhotoButton: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePhotoText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: SIZES.sm,
  },
  removePhotoButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  removePhotoText: {
    color: COLORS.error,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: SIZES.sm,
  },
  formSection: {
    marginBottom: SPACING.xl,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: SIZES.sm,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: SIZES.md,
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sans,
  },
  saveButton: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.md,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: SIZES.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  errorText: {
    color: COLORS.secondaryText,
    fontSize: SIZES.lg,
    fontFamily: FONT_FAMILY.sans,
  },
});