import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SPACING, RADIUS, FONT_FAMILY } from '../constants/theme';

interface AppHeaderProps {
  title?: string;
  showProfile?: boolean;
  firstName?: string | null;
  avatarUrl?: string | null;
  onNotifications?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, showProfile = true, avatarUrl, onNotifications }) => {
  const router = useRouter();
  const initials = title?.replace(/^Welcome,\s*/i, '').charAt(0).toUpperCase() || 'S';

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/main-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View>
          <Text style={styles.brandName}>स्वर्ण आभूषण</Text>
          {title && <Text style={styles.title}>{title}</Text>}
        </View>
      </View>
      {showProfile && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={onNotifications} style={styles.notificationButton} activeOpacity={0.7} accessibilityLabel="Notifications">
            <MaterialIcons name="notifications-none" size={25} color={COLORS.gold} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.profileButton} activeOpacity={0.7}>
          <View style={styles.avatar}>
            {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials}</Text>}
          </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 40,
    height: 40,
    marginRight: SPACING.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: SIZES.lg,
    fontFamily: FONT_FAMILY.serifBold,
    color: COLORS.gold,
  },
  title: {
    fontSize: SIZES.sm,
    color: COLORS.secondaryText,
    fontFamily: FONT_FAMILY.sans,
    marginTop: 2,
  },
  profileButton: {
    padding: SPACING.sm,
  },
  actions: { flexDirection: 'row', alignItems: 'center' },
  notificationButton: { padding: SPACING.sm },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: SIZES.md,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 18 },
});
