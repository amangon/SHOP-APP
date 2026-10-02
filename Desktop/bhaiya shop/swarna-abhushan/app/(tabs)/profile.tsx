import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  COLORS,
  SIZES,
  SPACING,
  RADIUS,
  FONT_FAMILY,
} from '../../constants/theme';

import {
  SectionHeader,
  LoadingScreen,
  ErrorState,
} from '../../components';

import { useAuth } from '../../lib/auth-context';
import { useUserProfile } from '../../hooks';

import { deleteProfilePhoto } from '../../services/api';

import { updatePassword } from '../../services/auth';
import { supabase } from '../../lib/supabase';


export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const {
    isAdmin,
    signOut,
    isAuthenticated,
    loading: authLoading,
    refreshProfile,
  } = useAuth();

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useUserProfile();


// ==============================
// PROFILE PHOTO STATES
// ==============================

  const [imageAsset, setImageAsset] = useState<{
    uri: string;
    name: string;
    type: string;
    base64?: string;
  } | null>(null);

  const [uploadingImage, setUploadingImage] = useState(false);

  const [avatarUrl, setAvatarUrl] =
    useState<string | null>(null);


  // ==============================
  // LOGOUT STATE
  // ==============================

  const [loggingOut, setLoggingOut] = useState(false);


  // ==============================
  // PASSWORD STATES
  // ==============================

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmNewPassword, setConfirmNewPassword] =
    useState('');

  const [passwordChanging, setPasswordChanging] =
    useState(false);

  const [passwordModalVisible, setPasswordModalVisible] =
    useState(false);

  const [passwordSuccess, setPasswordSuccess] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState<string | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);


  // ==============================
  // SET PROFILE PHOTO
  // ==============================

  useEffect(() => {
    setAvatarUrl(
      profile?.avatar_url ||
      null
    );
  }, [
    profile?.avatar_url,
  ]);


  // ==============================
  // PICK PROFILE IMAGE
  // ==============================

  // ==============================
  // PICK PROFILE IMAGE
  // ==============================

  const pickProfileImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow photo library access to update your profile photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];

      if (!asset.base64) {
        throw new Error(
          'The selected image could not be prepared for upload. Please select another photo.'
        );
      }

      const originalName =
        asset.fileName ||
        asset.uri.split('/').pop() ||
        `profile-${Date.now()}.jpg`;

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
        name: `profile-${Date.now()}.${extension}`,
        type: mimeType,
        base64: asset.base64,
      });
    } catch (error: any) {
      console.error('Profile image picker failed:', error);
      Alert.alert(
        'Image Error',
        error?.message || 'Failed to select image.'
      );
    }
  };

  // ==============================
  // UPLOAD PROFILE IMAGE
  // ==============================

  const handleUploadProfileImage = async () => {
    if (!imageAsset || uploadingImage) return;

    try {
      setUploadingImage(true);

      if (!imageAsset.base64) {
        throw new Error(
          'Unable to read the selected image. Please select the photo again.'
        );
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(userError.message);

      if (!user) {
        throw new Error(
          'Your session has expired. Please sign in again.'
        );
      }

      const extension =
        imageAsset.name.split('.').pop()?.toLowerCase() || 'jpg';

      const safeExtension =
        ['jpg', 'jpeg', 'png', 'webp'].includes(extension)
          ? extension
          : 'jpg';

      const contentType =
        imageAsset.type ||
        (safeExtension === 'png'
          ? 'image/png'
          : safeExtension === 'webp'
            ? 'image/webp'
            : 'image/jpeg');

      // ImagePicker already supplied the image bytes as Base64.
      // We do not read imageAsset.uri, so Android content:// 404 errors are avoided.
      const binaryString = atob(imageAsset.base64);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const fileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}.${safeExtension}`;

      const filePath = `profiles/${user.id}/${fileName}`;

      const {
        data: uploadData,
        error: uploadError,
      } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, bytes.buffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      if (!uploadData?.path) {
        throw new Error(
          'Image uploaded but no storage path was returned.'
        );
      }

      const { data: publicUrlData } =
        supabase.storage
          .from('brand-assets')
          .getPublicUrl(uploadData.path);

      const uploadedUrl = publicUrlData?.publicUrl;

      if (!uploadedUrl) {
        throw new Error(
          'Unable to generate the profile image URL.'
        );
      }

      const {
        data: updatedProfile,
        error: updateError,
      } = await supabase
        .from('profiles')
        .update({ avatar_url: uploadedUrl })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error(updateError.message);
      }

      const cleanUrl = uploadedUrl.split('?')[0];
      setAvatarUrl(`${cleanUrl}?t=${Date.now()}`);
      setImageAsset(null);

      queryClient.setQueryData(['profile'], updatedProfile);
      await refreshProfile();
      await refetch();

      Alert.alert(
        'Success',
        'Profile photo updated successfully.'
      );
    } catch (error: any) {
      console.error(
        'Profile avatar upload failed:',
        error
      );

      Alert.alert(
        'Upload Failed',
        error?.message ||
          'Unable to upload your profile photo.'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // ==============================
  // REMOVE PROFILE IMAGE
  // ==============================

  const handleRemoveProfileImage = () => {
    if (!avatarUrl) return;

    Alert.alert(
      'Remove Profile Photo',
      'Are you sure you want to remove your profile photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Remove',
          style: 'destructive',

          onPress: async () => {
            try {
              setUploadingImage(true);

              const deleted =
                await deleteProfilePhoto(
                  avatarUrl
                );

              if (!deleted) {
                throw new Error(
                  'The stored profile photo could not be deleted.'
                );
              }

              const {
                data: { user },
              } =
                await supabase.auth.getUser();

              if (!user) {
                throw new Error(
                  'Your session has expired. Please sign in again.'
                );
              }

              const {
                data: updatedProfile,
                error: updateError,
              } = await supabase
                .from('profiles')
                .update({
                  avatar_url: null,
                })
                .eq('id', user.id)
                .select()
                .single();

              if (updateError) {
                throw updateError;
              }

              setAvatarUrl(null);
              setImageAsset(null);

              queryClient.setQueryData(
                ['profile'],
                updatedProfile
              );

              await refreshProfile();
              await refetch();

              Alert.alert(
                'Success',
                'Profile photo removed successfully.'
              );

            } catch (error: any) {
              console.error(
                'Profile avatar removal failed:',
                error
              );

              Alert.alert(
                'Remove Failed',
                error?.message ||
                  'Unable to remove your profile photo.'
              );

            } finally {
              setUploadingImage(false);
            }
          },
        },
      ]
    );
  };


  // ==============================
  // OPEN PASSWORD MODAL
  // ==============================

  const openPasswordModal = () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordModalVisible(true);
  };


  // ==============================
  // CLOSE PASSWORD MODAL
  // ==============================

  const closePasswordModal = () => {
    if (passwordChanging) return;

    setPasswordModalVisible(false);

    setPasswordError(null);
    setPasswordSuccess(false);

    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };


  // ==============================
  // CHANGE PASSWORD
  // ==============================

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmNewPassword.trim()
    ) {
      setPasswordError(
        'Please fill in all password fields.'
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError(
        'New password and confirmation do not match.'
      );
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        'Your new password must be at least 6 characters.'
      );
      return;
    }

    setPasswordChanging(true);

    try {
      const result =
        await updatePassword(
          currentPassword,
          newPassword
        );

      if (result.success) {
        setPasswordSuccess(true);

        setTimeout(() => {
          closePasswordModal();
        }, 1200);

      } else {
        setPasswordError(
          result.error ||
            'Unable to update your password.'
        );
      }

    } catch (error: any) {
      setPasswordError(
        error?.message ||
          'An unexpected error occurred.'
      );

    } finally {
      setPasswordChanging(false);
    }
  };


  // ==============================
  // LOGOUT
  // ==============================

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Logout',
          style: 'destructive',

          onPress: async () => {
            try {
              setLoggingOut(true);

              await signOut();

              queryClient.clear();

              router.replace(
                '/(auth)/login'
              );

            } catch (error: any) {
              console.error(
                'Logout failed:',
                error
              );

              Alert.alert(
                'Logout Failed',
                error?.message ||
                  'Unable to log out. Please try again.'
              );

            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };


  // ==============================
// LOADING
// ==============================

const profileLoading = authLoading || isLoading;

if (profileLoading) {
  return (
    <LoadingScreen message="Loading profile..." />
  );
}


  // ==============================
  // ERROR
  // ==============================

  if (error) {
    return (
      <ErrorState
        title="Error Loading Profile"
        message="Unable to load your profile information."
        onRetry={() => refetch()}
      />
    );
  }


  // ==============================
  // AUTH CHECK
  // ==============================

  if (!isAuthenticated) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No profile data available
        </Text>
      </View>
    );
  }


  // ==============================
  // USER NAME
  // ==============================

  const displayFirmName =
    profile?.firm_name?.trim() || null;

  const profileName =
    profile?.full_name?.trim() || 'User';

  const greetingName = displayFirmName || profileName;


  // ==============================
  // GET INITIALS
  // ==============================

  const getInitials = (
    name: string | null | undefined
  ): string => {
    if (!name) return '?';

    const parts = name
      .trim()
      .split(' ');

    if (parts.length >= 2) {
      return (
        parts[0][0] +
        parts[1][0]
      ).toUpperCase();
    }

    return name
      .charAt(0)
      .toUpperCase();
  };


  // ==============================
  // MENU ITEMS
  // ==============================

  const menuItems = [
    {
      title: 'Edit Profile',
      icon: '✎',
      onPress: () =>
        router.push('/edit-profile'),
    },

    {
      title: 'My Favourites',
      icon: '♥',
      onPress: () =>
        router.push('/favourites'),
    },

    {
      title: 'Notifications',
      icon: '🔔',
      onPress: () =>
        router.push('/notifications'),
    },

    {
      title: 'About Swarna Abhushan',
      icon: '◆',
      onPress: () =>
        router.push('/about'),
    },

    {
      title: 'Contact Us',
      icon: '📞',
      onPress: () =>
        router.push('/contact'),
    },

    {
      title: 'Privacy Policy',
      icon: '🔒',
      onPress: () =>
        router.push('/privacy'),
    },
  ];


  // ==============================

  // ==============================
  // UI
  // ==============================

  const profileMenuItems = [
    {
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      icon: 'edit',
      onPress: () => router.push('/edit-profile'),
    },
    {
      title: 'Notifications',
      subtitle: 'Manage your alerts',
      icon: 'notifications-none',
      onPress: () => router.push('/notifications'),
    },
    {
      title: 'About Swarna Abhushan',
      subtitle: 'Learn more about us',
      icon: 'diamond',
      onPress: () => router.push('/about'),
    },
    {
      title: 'Contact Us',
      subtitle: 'Get in touch with our support team',
      icon: 'phone',
      onPress: () => router.push('/contact'),
    },
    {
      title: 'Privacy Policy',
      subtitle: 'Read our privacy policy',
      icon: 'lock-outline',
      onPress: () => router.push('/privacy'),
    },
  ] as const;

  const openLink = async (url: string, label: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unavailable', `Cannot open ${label}.`);
      }
    } catch {
      Alert.alert('Error', `Unable to open ${label}. Please try again.`);
    }
  };

  const legalMenuItems = [
    {
      title: 'Privacy Policy',
      subtitle: 'View our privacy policy',
      icon: 'lock-outline',
      onPress: () =>
        openLink(
          'https://shop-policy-delta.vercel.app/#privacy',
          'Privacy Policy'
        ),
    },
    {
      title: 'Terms & Conditions',
      subtitle: 'View our terms and conditions',
      icon: 'description',
      onPress: () =>
        openLink(
          'https://shop-policy-delta.vercel.app/#terms',
          'Terms & Conditions'
        ),
    },
    {
      title: 'Disclaimer',
      subtitle: 'View our disclaimer',
      icon: 'info-outline',
      onPress: () =>
        openLink(
          'https://shop-policy-delta.vercel.app/#disclaimer',
          'Disclaimer'
        ),
    },
    {
      title: 'Contact & Support',
      subtitle: 'Get help from our support team',
      icon: 'support-agent',
      onPress: () =>
        openLink(
          'https://shop-policy-delta.vercel.app/#contact',
          'Contact & Support'
        ),
    },
  ] as const;

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 8),
            paddingBottom: Math.max(insets.bottom + 140, 145),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <Image
            source={require('../../assets/main-logo.png')}
            style={styles.topBarLogo}
            resizeMode="contain"
          />

          <TouchableOpacity
            style={styles.topBarBell}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <MaterialIcons
              name="notifications-none"
              size={28}
              color={COLORS.lightGold}
            />
          </TouchableOpacity>
        </View>

        {/* PROFILE HEADER */}
        <View style={styles.profileHero}>
          <View style={styles.profileHeroText}>
            {displayFirmName ? (
              <Text style={styles.heroFirmName} numberOfLines={2}>{displayFirmName}</Text>
            ) : null}
            <Text style={styles.heroGreeting}>
              {displayFirmName ? `Welcome back, ${profileName}` : 'Hello,'}
            </Text>
            {!displayFirmName && (
              <Text style={styles.heroName}>{profileName}</Text>
            )}

            <View style={styles.membershipRow}>
              <Text style={styles.membershipText}>Premium Customer</Text>
              <MaterialIcons
                name="workspace-premium"
                size={21}
                color={COLORS.lightGold}
              />
            </View>

            {!!profile?.email && (
              <Text style={styles.heroEmail} numberOfLines={1}>
                {profile.email}
              </Text>
            )}
          </View>

          <View style={styles.heroAvatarArea}>
            <View style={styles.heroAvatarRing}>
              {imageAsset?.uri || avatarUrl ? (
                <Image
                  source={{ uri: imageAsset?.uri || avatarUrl || '' }}
                  style={styles.heroAvatar}
                  resizeMode="cover"
                  onError={() => {
                    if (!imageAsset) setAvatarUrl(null);
                  }}
                />
              ) : (
                <View style={styles.heroAvatarFallback}>
                  <Text style={styles.heroAvatarInitials}>
                    {getInitials(profileName)}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.cameraButton}
                onPress={pickProfileImage}
                activeOpacity={0.85}
              >
                <MaterialIcons
                  name="camera-alt"
                  size={17}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => router.push('/edit-profile')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="edit" size={15} color={COLORS.gold} />
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {imageAsset && (
          <View style={styles.photoActionRow}>
            <TouchableOpacity
              style={styles.photoSaveButton}
              onPress={handleUploadProfileImage}
              disabled={uploadingImage}
              activeOpacity={0.85}
            >
              {uploadingImage ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <Text style={styles.photoSaveButtonText}>Save Photo</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoCancelButton}
              onPress={() => setImageAsset(null)}
              disabled={uploadingImage}
              activeOpacity={0.85}
            >
              <Text style={styles.photoCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {avatarUrl && !imageAsset && (
          <TouchableOpacity
            style={styles.removePhotoLink}
            onPress={handleRemoveProfileImage}
            disabled={uploadingImage}
          >
            <Text style={styles.removePhotoLinkText}>Remove profile photo</Text>
          </TouchableOpacity>
        )}

        {/* QUICK ACTIONS */}
        <View style={styles.quickGrid}>
          <QuickCard
            icon="favorite"
            iconColor="#FF6B6B"
            title="Wishlist"
            subtitle="Your saved jewellery"
            onPress={() => router.push('/favourites')}
          />
          <QuickCard
            icon="notifications"
            title="Notifications"
            subtitle="Latest updates"
            onPress={() => router.push('/notifications')}
          />
          <QuickCard
            icon="show-chart"
            title="Gold Rates"
            subtitle="Live market prices"
            onPress={() => router.push('/(tabs)/rates')}
          />
          <QuickCard
            icon="lock-outline"
            title="Security"
            subtitle="Change password"
            onPress={openPasswordModal}
          />
        </View>

        {/* STORY BANNER */}
        <TouchableOpacity
          style={styles.storyBanner}
          onPress={() => router.push('/(tabs)/jewellery')}
          activeOpacity={0.9}
        >
          <View style={styles.storyImageBg} />
          <View style={styles.storyOverlay} />
          <View style={styles.storyContent}>
            <Text style={styles.storyTitle}>
              Your Jewellery{'\n'}Your Story
            </Text>
            <Text style={styles.storySubtitle}>
              Timeless designs for{'\n'}every special moment
            </Text>
            <View style={styles.storyButton}>
              <Text style={styles.storyButtonText}>Explore Collection</Text>
              <MaterialIcons
                name="arrow-forward"
                size={17}
                color={COLORS.primary}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* MY JEWELLERY */}
        <ProfileSectionHeader
          icon="diamond"
          title="My Jewellery"
        />

        <View style={styles.menuCard}>
          <MenuRow
            icon="favorite-border"
            title="Wishlist"
            subtitle="Your saved favourite items"
            onPress={() => router.push('/favourites')}
          />
          <MenuDivider />
          <MenuRow
            icon="diamond"
            title="Browse Jewellery"
            subtitle="Discover the latest collection"
            onPress={() => router.push('/(tabs)/jewellery')}
          />
          <MenuDivider />
          <MenuRow
            icon="notifications-none"
            title="Notifications"
            subtitle="Stay updated with your account"
            onPress={() => router.push('/notifications')}
          />
        </View>

        {/* RATE ALERTS */}
        <ProfileSectionHeader
          icon="trending-up"
          title="Rate Alerts"
        />

        <View style={styles.menuCard}>
          <MenuRow
            icon="notifications"
            title="Gold Price"
            subtitle="View current gold rates"
            onPress={() => router.push('/(tabs)/rates')}
          />
          <MenuDivider />
          <MenuRow
            icon="show-chart"
            title="Silver Price"
            subtitle="Stay updated with silver rates"
            onPress={() => router.push('/(tabs)/rates')}
          />
          <MenuDivider />
          <MenuRow
            icon="history"
            title="Rate History"
            subtitle="View tracked metal rates"
            onPress={() => router.push('/(tabs)/rates')}
          />
        </View>

        {/* ACCOUNT & SUPPORT */}
        <ProfileSectionHeader
          icon="shield"
          title="Account & Support"
        />

        <View style={styles.menuCard}>
          {profileMenuItems.map((item, index) => (
            <React.Fragment key={item.title}>
              <MenuRow
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                onPress={item.onPress}
              />
              {index < profileMenuItems.length - 1 && <MenuDivider />}
            </React.Fragment>
          ))}
        </View>

        {/* LEGAL & SUPPORT */}
        <ProfileSectionHeader
          icon="gavel"
          title="Legal & Support"
        />

        <View style={styles.menuCard}>
          {legalMenuItems.map((item, index) => (
            <React.Fragment key={item.title}>
              <MenuRow
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                onPress={item.onPress}
              />
              {index < legalMenuItems.length - 1 && <MenuDivider />}
            </React.Fragment>
          ))}
        </View>

        {/* CONTACT SUPPORT */}
        <ProfileSectionHeader
          icon="headset-mic"
          title="Contact Support"
        />

        <View style={styles.contactSupportCard}>
          {/* EMAIL */}
          <View style={styles.supportContactBlock}>
            <View style={styles.supportContactHeader}>
              <View style={styles.supportContactIcon}>
                <MaterialIcons
                  name="email"
                  size={19}
                  color={COLORS.gold}
                />
              </View>
              <View style={styles.supportContactCopy}>
                <Text style={styles.supportContactTitle}>Email Support</Text>
                <Text
                  style={styles.supportContactValue}
                  numberOfLines={1}
                >
                  swarnaabhushan73@gmail.com
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.supportActionButton, styles.emailButton]}
              onPress={() =>
                openLink(
                  'mailto:swarnaabhushan73@gmail.com',
                  'Email Support'
                )
              }
              activeOpacity={0.82}
            >
              <MaterialIcons
                name="send"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.emailButtonText}>Send Email</Text>
              <MaterialIcons
                name="arrow-forward"
                size={18}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.supportDivider} />

          {/* SUPPORT NUMBER 1 */}
          <View style={styles.supportContactBlock}>
            <View style={styles.supportContactHeader}>
              <View style={styles.supportContactIcon}>
                <MaterialIcons
                  name="support-agent"
                  size={19}
                  color={COLORS.gold}
                />
              </View>
              <View style={styles.supportContactCopy}>
                <Text style={styles.supportContactTitle}>Support Line 1</Text>
                <Text style={styles.supportContactValue}>
                  +91 83182 75167
                </Text>
              </View>
            </View>

            <View style={styles.supportActionRow}>
              <TouchableOpacity
                style={[styles.supportActionButton, styles.callButton]}
                onPress={() =>
                  openLink(
                    'tel:+918318275167',
                    'Call 8318275167'
                  )
                }
                activeOpacity={0.82}
              >
                <MaterialIcons
                  name="phone"
                  size={18}
                  color={COLORS.lightGold}
                />
                <Text style={styles.callButtonText}>Call Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.supportActionButton, styles.whatsappButton]}
                onPress={() =>
                  openLink(
                    'https://wa.me/918318275167',
                    'WhatsApp 8318275167'
                  )
                }
                activeOpacity={0.82}
              >
                <MaterialIcons
                  name="chat"
                  size={18}
                  color="#062D12"
                />
                <Text style={styles.whatsappButtonText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.supportDivider} />

          {/* SUPPORT NUMBER 2 */}
          <View style={styles.supportContactBlock}>
            <View style={styles.supportContactHeader}>
              <View style={styles.supportContactIcon}>
                <MaterialIcons
                  name="support-agent"
                  size={19}
                  color={COLORS.gold}
                />
              </View>
              <View style={styles.supportContactCopy}>
                <Text style={styles.supportContactTitle}>Support Line 2</Text>
                <Text style={styles.supportContactValue}>
                  +91 98077 79942
                </Text>
              </View>
            </View>

            <View style={styles.supportActionRow}>
              <TouchableOpacity
                style={[styles.supportActionButton, styles.callButton]}
                onPress={() =>
                  openLink(
                    'tel:+919807779942',
                    'Call 9807779942'
                  )
                }
                activeOpacity={0.82}
              >
                <MaterialIcons
                  name="phone"
                  size={18}
                  color={COLORS.lightGold}
                />
                <Text style={styles.callButtonText}>Call Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.supportActionButton, styles.whatsappButton]}
                onPress={() =>
                  openLink(
                    'https://wa.me/919807779942',
                    'WhatsApp 9807779942'
                  )
                }
                activeOpacity={0.82}
              >
                <MaterialIcons
                  name="chat"
                  size={18}
                  color="#062D12"
                />
                <Text style={styles.whatsappButtonText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ADMINISTRATION */}
        {isAdmin && (
          <>
            <View style={styles.adminHeadingRow}>
              <View style={styles.sectionHeadingLeft}>
                <MaterialIcons
                  name="workspace-premium"
                  size={24}
                  color={COLORS.gold}
                />
                <Text style={styles.adminHeadingText}>Administration</Text>
              </View>
              <View style={styles.adminPill}>
                <Text style={styles.adminPillText}>ADMIN</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.adminCard}
              onPress={() => router.push('/admin')}
              activeOpacity={0.88}
            >
              <View style={styles.adminIconBox}>
                <MaterialIcons
                  name="dashboard"
                  size={25}
                  color={COLORS.gold}
                />
              </View>
              <View style={styles.adminCopy}>
                <Text style={styles.adminTitle}>Admin Dashboard</Text>
                <Text style={styles.adminSubtitle}>
                  Manage products, rates, users and content
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={25}
                color={COLORS.secondaryText}
              />
            </TouchableOpacity>
          </>
        )}

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
        >
          {loggingOut ? (
            <ActivityIndicator color="#FF7777" />
          ) : (
            <>
              <MaterialIcons name="logout" size={21} color="#FF7777" />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>स्वर्ण आभूषण</Text>
          <Text style={styles.footerSubtext}>Shri Vijay Kaushal Ji Jeweller and Sons</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
          <Text style={styles.footerMadeWith}>
            Made with ❤️ by Shri Vijay Kaushal Ji Jeweller and Sons
          </Text>
        </View>
      </ScrollView>

      {/* CHANGE PASSWORD MODAL */}

      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closePasswordModal}
      >

        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >

          <Pressable
            style={styles.modalDismissArea}
            onPress={closePasswordModal}
          />


          <View
            style={styles.passwordSheet}
          >

            <View
              style={styles.dragIndicator}
            />


            <View
              style={styles.sheetHeader}
            >

              <View>

                <Text
                  style={styles.sheetTitle}
                >
                  Change Password
                </Text>

                <Text
                  style={styles.sheetSubtitle}
                >
                  Securely update your account password
                </Text>

              </View>


              <TouchableOpacity
                onPress={closePasswordModal}
                disabled={passwordChanging}
                style={styles.closeButton}
              >
                <MaterialIcons
                  name="close"
                  size={22}
                  color={COLORS.secondaryText}
                />
              </TouchableOpacity>

            </View>


            {passwordSuccess ? (

              <View
                style={
                  styles.passwordSuccessContainer
                }
              >

                <View
                  style={styles.successIcon}
                >
                  <MaterialIcons
                    name="check"
                    size={28}
                    color={COLORS.primary}
                  />
                </View>

                <Text
                  style={
                    styles.passwordSuccessTitle
                  }
                >
                  Password Changed Successfully
                </Text>

                <Text
                  style={
                    styles.passwordSuccessText
                  }
                >
                  Your account is now protected with your new password.
                </Text>

              </View>

            ) : (

              <>

                <PasswordField
                  label="Current Password"
                  value={currentPassword}
                  onChangeText={
                    setCurrentPassword
                  }
                  visible={
                    showCurrentPassword
                  }
                  onToggleVisibility={() =>
                    setShowCurrentPassword(
                      value => !value
                    )
                  }
                />


                <PasswordField
                  label="New Password"
                  value={newPassword}
                  onChangeText={
                    setNewPassword
                  }
                  visible={
                    showNewPassword
                  }
                  onToggleVisibility={() =>
                    setShowNewPassword(
                      value => !value
                    )
                  }
                />


                <PasswordField
                  label="Confirm New Password"
                  value={confirmNewPassword}
                  onChangeText={
                    setConfirmNewPassword
                  }
                  visible={
                    showConfirmPassword
                  }
                  onToggleVisibility={() =>
                    setShowConfirmPassword(
                      value => !value
                    )
                  }
                />


                {passwordError && (
                  <Text
                    style={styles.passwordError}
                  >
                    {passwordError}
                  </Text>
                )}


                <TouchableOpacity
                  style={[
                    styles.sheetSubmitButton,
                    passwordChanging &&
                      styles.disabledButton,
                  ]}
                  onPress={
                    handleChangePassword
                  }
                  disabled={passwordChanging}
                >

                  {passwordChanging ? (

                    <ActivityIndicator
                      color={COLORS.primary}
                    />

                  ) : (

                    <Text
                      style={
                        styles.sheetSubmitText
                      }
                    >
                      Change Password
                    </Text>

                  )}

                </TouchableOpacity>


                <TouchableOpacity
                  onPress={() => {
                    closePasswordModal();

                    router.push(
                      '/(auth)/forgot-password'
                    );
                  }}
                  disabled={passwordChanging}
                  style={
                    styles.forgotPasswordLink
                  }
                >

                  <Text
                    style={
                      styles.forgotPasswordText
                    }
                  >
                    Forgot current password?
                  </Text>

                </TouchableOpacity>

              </>

            )}

          </View>

        </KeyboardAvoidingView>

      </Modal>

    </View>
  );
}


// ==========================================
// PASSWORD FIELD COMPONENT
// ==========================================

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
}


function PasswordField({
  label,
  value,
  onChangeText,
  visible,
  onToggleVisibility,
}: PasswordFieldProps) {

  return (
    <View style={styles.passwordField}>

      <Text
        style={styles.passwordFieldLabel}
      >
        {label}
      </Text>


      <View
        style={styles.passwordInputRow}
      >

        <TextInput
          style={styles.passwordInput}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={
            COLORS.secondaryText
          }
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />


        <TouchableOpacity
          onPress={onToggleVisibility}
          style={styles.visibilityButton}
        >
          <MaterialIcons
            name={
              visible
                ? 'visibility'
                : 'visibility-off'
            }
            size={20}
            color={COLORS.secondaryText}
          />
        </TouchableOpacity>

      </View>

    </View>
  );
}


// ==========================================
// STYLES
// ==========================================

function QuickCard({
  icon,
  iconColor = COLORS.gold,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.quickCard}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View style={styles.quickIcon}>
        <MaterialIcons name={icon as any} size={21} color={iconColor} />
      </View>
      <View style={styles.quickCopy}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={21}
        color={COLORS.secondaryText}
      />
    </TouchableOpacity>
  );
}

function ProfileSectionHeader({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) {
  return (
    <View style={styles.sectionHeadingRow}>
      <MaterialIcons name={icon as any} size={24} color={COLORS.gold} />
      <Text style={styles.sectionHeading}>{title}</Text>
    </View>
  );
}

function MenuDivider() {
  return <View style={styles.menuDivider} />;
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.menuIconCircle}>
        <MaterialIcons name={icon as any} size={20} color={COLORS.gold} />
      </View>
      <View style={styles.menuTextBlock}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={23}
        color={COLORS.secondaryText}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#080808',
  },

  container: {
    flex: 1,
    backgroundColor: '#080808',
  },

  scrollContent: {
    paddingHorizontal: 0,
  },

  topBar: {
    minHeight: 72,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  topBarLogo: {
    width: 170,
    height: 56,
  },

  topBarBell: {
    position: 'absolute',
    right: 18,
    top: 16,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileHero: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  profileHeroText: {
    flex: 1,
    paddingRight: 12,
  },

  heroFirmName: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 30,
    lineHeight: 35,
    marginTop: 1,
  },

  heroGreeting: {
    color: '#CECECE',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 15,
  },

  heroName: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 34,
    lineHeight: 39,
    marginTop: 1,
  },

  membershipRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  membershipText: {
    color: '#D2D2D2',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 13,
  },

  heroEmail: {
    color: '#A6A6A6',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 11,
    marginTop: 12,
  },

  heroAvatarArea: {
    width: 116,
    alignItems: 'center',
  },

  heroAvatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    padding: 3,
    position: 'relative',
  },

  heroAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 49,
  },

  heroAvatarFallback: {
    flex: 1,
    borderRadius: 49,
    backgroundColor: '#202020',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroAvatarInitials: {
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 28,
  },

  cameraButton: {
    position: 'absolute',
    right: -2,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.lightGold,
    borderWidth: 2,
    borderColor: '#080808',
    alignItems: 'center',
    justifyContent: 'center',
  },

  editProfileButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  editProfileButtonText: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 11,
  },

  photoActionRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },

  photoSaveButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoSaveButtonText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 12,
  },

  photoCancelButton: {
    width: 100,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#454545',
    backgroundColor: '#171717',
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoCancelButtonText: {
    color: '#D6D6D6',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 12,
  },

  removePhotoLink: {
    alignSelf: 'center',
    marginBottom: 7,
    paddingVertical: 5,
  },

  removePhotoLinkText: {
    color: '#E87676',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 10,
  },

  quickGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  quickCard: {
    width: '48%',
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    backgroundColor: '#151515',
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#202020',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  quickCopy: {
    flex: 1,
    paddingRight: 2,
  },

  quickTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 12,
  },

  quickSubtitle: {
    color: '#999999',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 3,
  },

  storyBanner: {
    height: 168,
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#6A5219',
    backgroundColor: '#201A0D',
    position: 'relative',
  },

  storyImageBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2B1D0C',
  },

  storyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,8,8,0.34)',
  },

  storyContent: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 18,
    paddingRight: 145,
  },

  storyTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 24,
    lineHeight: 28,
  },

  storySubtitle: {
    color: '#D2D2D2',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },

  storyButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: COLORS.gold,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  storyButtonText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 10,
  },

  sectionHeadingRow: {
    paddingHorizontal: 20,
    marginTop: 23,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sectionHeading: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 18,
  },

  menuCard: {
    marginHorizontal: 20,
    backgroundColor: '#151515',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#343434',
    overflow: 'hidden',
  },

  menuRow: {
    minHeight: 66,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuIconCircle: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: '#202020',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  menuTextBlock: {
    flex: 1,
    paddingRight: 8,
  },

  menuTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 13,
  },

  menuSubtitle: {
    color: '#9C9C9C',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 10,
    marginTop: 3,
  },

  menuDivider: {
    height: 1,
    marginLeft: 61,
    backgroundColor: '#2B2B2B',
  },

  adminHeadingRow: {
    marginTop: 23,
    paddingHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionHeadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  adminHeadingText: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 18,
  },

  adminPill: {
    backgroundColor: COLORS.lightGold,
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  adminPillText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },

  adminCard: {
    marginHorizontal: 20,
    minHeight: 82,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    backgroundColor: '#19160D',
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },

  adminIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#231F13',
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  adminCopy: {
    flex: 1,
    paddingRight: 7,
  },

  adminTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 13,
  },

  adminSubtitle: {
    color: '#9C9C9C',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },

  logoutButton: {
    marginHorizontal: 20,
    marginTop: 25,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B24343',
    backgroundColor: '#351414',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  logoutText: {
    color: '#FF8585',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 14,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 25,
    paddingHorizontal: 20,
  },

  footerText: {
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 18,
    letterSpacing: 1,
  },

  footerSubtext: {
    color: '#9A9A9A',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 11,
    marginTop: 2,
  },

  footerVersion: {
    color: '#666666',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 9,
    marginTop: 3,
  },

  footerMadeWith: {
    color: '#777777',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 9,
    marginTop: 8,
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

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.74)',
    justifyContent: 'flex-end',
  },

  modalDismissArea: {
    flex: 1,
  },

  passwordSheet: {
    backgroundColor: COLORS.secondary,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderColor: COLORS.goldBorder,
  },

  dragIndicator: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.darkBorder,
    marginBottom: SPACING.lg,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },

  sheetTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: SIZES.xxl,
  },

  sheetSubtitle: {
    color: COLORS.secondaryText,
    fontFamily: FONT_FAMILY.sans,
    fontSize: SIZES.sm,
    marginTop: SPACING.xs,
  },

  closeButton: {
    padding: SPACING.xs,
  },

  passwordField: {
    marginBottom: SPACING.md,
  },

  passwordFieldLabel: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: SIZES.sm,
    marginBottom: SPACING.xs,
  },

  passwordInputRow: {
    backgroundColor: COLORS.tertiary,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: SIZES.md,
    color: COLORS.white,
  },

  visibilityButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  passwordError: {
    color: COLORS.error,
    fontFamily: FONT_FAMILY.sans,
    fontSize: SIZES.sm,
    marginBottom: SPACING.md,
  },

  sheetSubmitButton: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.md,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },

  disabledButton: {
    opacity: 0.7,
  },

  sheetSubmitText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: SIZES.md,
  },

  forgotPasswordLink: {
    alignSelf: 'center',
    paddingVertical: SPACING.md,
  },

  forgotPasswordText: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: SIZES.sm,
  },

  contactSupportCard: {
    marginHorizontal: 20,
    backgroundColor: '#151515',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#383838',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  supportContactBlock: {
    gap: 11,
  },

  supportContactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  supportContactIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#211C10',
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  supportContactCopy: {
    flex: 1,
    paddingRight: 4,
  },

  supportContactTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 13,
  },

  supportContactValue: {
    color: '#A6A6A6',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 11,
    marginTop: 3,
  },

  supportActionRow: {
    flexDirection: 'row',
    gap: 9,
  },

  supportActionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },

  emailButton: {
    width: '100%',
    backgroundColor: COLORS.gold,
  },

  emailButtonText: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 12,
  },

  callButton: {
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },

  callButtonText: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 12,
  },

  whatsappButton: {
    backgroundColor: '#25D366',
  },

  whatsappButtonText: {
    color: '#062D12',
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 12,
  },

  supportDivider: {
    height: 1,
    backgroundColor: '#2B2B2B',
    marginVertical: 15,
  },

  passwordSuccessContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },

  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },

  passwordSuccessTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: SIZES.xl,
    textAlign: 'center',
  },

  passwordSuccessText: {
    color: COLORS.secondaryText,
    fontFamily: FONT_FAMILY.sans,
    fontSize: SIZES.sm,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

