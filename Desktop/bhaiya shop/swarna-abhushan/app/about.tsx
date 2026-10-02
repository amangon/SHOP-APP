import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { COLORS, SIZES, SPACING, RADIUS, SHADOWS, FONT_FAMILY } from '../constants/theme';
import { AppLogo } from '../components';
import { useSettings } from '../hooks';

export default function AboutScreen() {
  const router = useRouter();
  const { data: settings } = useSettings();

  const getSettingValue = (key: string, fallback: string): string => {
    if (!Array.isArray(settings) || settings.length === 0) return fallback;
    const setting = settings.find((item) => item.setting_key === key);
    return setting?.setting_value || fallback;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: COLORS.primary },
          headerTitleStyle: { color: COLORS.gold, fontFamily: FONT_FAMILY.sansSemiBold },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppLogo size={140} showText={false} />
          <Text style={styles.brandNameHindi}>स्वर्ण आभूषण</Text>
          <Text style={styles.brandNameEnglish}>SHRI VIJAY KAUSHAL JI JEWELLER AND SONS</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Our Story</Text>
          <Text style={styles.text}>
            {getSettingValue(
              'about_section_text',
              'Shri Vijay Kaushal Ji Jeweller and Sons brings you the finest collection of traditional and contemporary jewellery. Each piece in our collection is carefully crafted by master artisans who have inherited their skills through generations.'
            )}
          </Text>

          <Text style={styles.subtitle}>Our Philosophy</Text>
          <Text style={styles.text}>
            We believe that jewellery is more than adornment — it is expression, heritage, and emotion captured in precious metals and stones. Our designs blend traditional craftsmanship with contemporary aesthetics to create pieces that are both timeless and relevant.
          </Text>

          <Text style={styles.subtitle}>Quality &amp; Craftsmanship</Text>
          <Text style={styles.text}>
            Every piece we create undergoes rigorous quality checks. We source only the finest gold, silver, and precious stones, ensuring that each creation meets the highest standards of excellence. Our commitment to quality is reflected in the lustrous finish and intricate details of every piece.
          </Text>

          <Text style={styles.subtitle}>Customer Experience</Text>
          <Text style={styles.text}>
            At Swarna Abhushan, we strive to provide an exceptional customer experience. Our knowledgeable team is dedicated to helping you find the perfect piece, whether it is for a special occasion or everyday elegance.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{getSettingValue('footer_text_hindi', 'स्वर्ण आभूषण')}</Text>
          <Text style={styles.footerSubtext}>{getSettingValue('footer_text_english', 'Swarna Abhushan')}</Text>
          <Text style={styles.footerVersion}>{getSettingValue('footer_version', 'Version 1.0.0')}</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    marginRight: SPACING.sm,
  },
  backText: {
    color: COLORS.gold,
    fontSize: SIZES.xxl,
    fontWeight: '400',
    fontFamily: FONT_FAMILY.sans,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
    marginBottom: SPACING.xl,
  },
  brandNameHindi: {
    fontSize: SIZES.xxl,
    fontFamily: FONT_FAMILY.serifBold,
    color: COLORS.gold,
    marginTop: SPACING.md,
    letterSpacing: 1,
    lineHeight: 32,
  },
  brandNameEnglish: {
    fontSize: SIZES.md,
    fontFamily: FONT_FAMILY.sansSemiBold,
    color: COLORS.lightGold,
    letterSpacing: 4,
    marginTop: SPACING.xs,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  title: {
    fontSize: SIZES.xxxl,
    fontFamily: FONT_FAMILY.serifBold,
    color: COLORS.white,
    marginBottom: SPACING.lg,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: SIZES.xl,
    fontFamily: FONT_FAMILY.serifBold,
    color: COLORS.gold,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    lineHeight: 28,
  },
  text: {
    fontSize: SIZES.md,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkBorder,
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: SIZES.md,
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.serifBold,
    letterSpacing: 2,
  },
  footerSubtext: {
    fontSize: SIZES.sm,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    marginTop: SPACING.xs,
  },
  footerVersion: {
    fontSize: SIZES.xs,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    marginTop: SPACING.xs,
  },
});
