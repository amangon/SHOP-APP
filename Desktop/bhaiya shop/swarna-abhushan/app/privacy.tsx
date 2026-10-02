import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { COLORS, FONT_FAMILY, SIZES, SPACING } from '../constants/theme';

const sections = [
  ['Information We Collect', 'We collect information you provide when creating an account, updating your profile, or contacting our team.'],
  ['How We Use Your Information', 'We use your information to provide account services, respond to enquiries, improve the app, and share relevant jewellery updates.'],
  ['Account Information', 'Your email and authentication details are handled through Supabase Auth and are used to secure your account.'],
  ['Profile Information', 'Your name, phone number, and avatar are stored in your profile so the app can personalize your experience.'],
  ['Jewellery Orders and Enquiries', 'Enquiries submitted through the app are used only to respond to your request and provide service.'],
  ['Gold Rate Information', 'Gold and silver rates are displayed as market information and may change without notice.'],
  ['Data Security', 'We use authentication, row-level security, and protected storage policies to safeguard account data.'],
  ['Third Party Services', 'Supabase provides authentication, database, and storage infrastructure for this application.'],
  ['Your Rights', 'You may request access, correction, or deletion of your personal information by contacting us.'],
  ['Contact Information', 'For privacy questions, contact info@shrivijaykaushaljijeweller.com.'],
] as const;

export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.updated}>Last Updated: September 2026</Text>
        {sections.map(([heading, body]) => <View key={heading} style={styles.section}><Text style={styles.heading}>{heading}</Text><Text style={styles.body}>{body}</Text></View>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl },
  back: { color: COLORS.gold, fontFamily: FONT_FAMILY.sansSemiBold, fontSize: SIZES.md, marginBottom: SPACING.xl },
  title: { color: COLORS.white, fontFamily: FONT_FAMILY.serifBold, fontSize: SIZES.xxxl },
  updated: { color: COLORS.secondaryText, fontFamily: FONT_FAMILY.sans, fontSize: SIZES.sm, marginTop: SPACING.sm, marginBottom: SPACING.xl },
  section: { borderBottomWidth: 1, borderBottomColor: COLORS.darkBorder, paddingVertical: SPACING.md },
  heading: { color: COLORS.gold, fontFamily: FONT_FAMILY.serifBold, fontSize: SIZES.lg, marginBottom: SPACING.xs },
  body: { color: COLORS.secondaryText, fontFamily: FONT_FAMILY.sans, fontSize: SIZES.md, lineHeight: 23 },
});
