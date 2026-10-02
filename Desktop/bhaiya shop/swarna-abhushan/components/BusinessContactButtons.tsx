import React from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { COLORS, FONT_FAMILY, RADIUS, SIZES, SPACING } from '../constants/theme';
import { BUSINESS } from '../constants/business';
import type { BusinessBranch } from '../constants/business';

const openURL = async (url: string, label: string) => {
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

export const BusinessContactButtons = () => {
  return (
    <View style={styles.wrap}>
      {BUSINESS.branches.map((branch: BusinessBranch) => (
        <View key={branch.id} style={styles.block}>
          <Text style={styles.name}>{branch.contactPerson}</Text>
          <Text style={styles.phone}>+91 {branch.phone}</Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.button, styles.callButton]}
              onPress={() => openURL(`tel:+91${branch.phone}`, 'dialer')}
              activeOpacity={0.85}
              accessibilityLabel={`Call Swarna Abhushan at ${branch.phone}`}
            >
              <MaterialIcons name="phone" size={16} color={COLORS.primary} />
              <Text style={styles.callText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.whatsappButton]}
              onPress={() => openURL(`https://wa.me/${branch.whatsapp}`, 'WhatsApp')}
              activeOpacity={0.85}
              accessibilityLabel={`WhatsApp Swarna Abhushan at ${branch.phone}`}
            >
              <MaterialIcons name="chat" size={16} color={COLORS.primary} />
              <Text style={styles.whatsappText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  block: {
    gap: SPACING.xs,
  },
  name: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: SIZES.lg,
  },
  phone: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: SIZES.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    minHeight: 44,
  },
  callButton: {
    backgroundColor: '#2C2C2C',
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  callText: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: SIZES.sm,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  whatsappText: {
    color: '#052505',
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: SIZES.sm,
  },
});
