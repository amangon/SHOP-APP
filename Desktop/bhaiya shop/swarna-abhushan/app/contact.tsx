import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { COLORS, FONT_FAMILY, RADIUS, SIZES, SPACING } from '../constants/theme';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { useSettings } from '../hooks';
import { BUSINESS } from '../constants/business';
import { MaterialIcons } from '@expo/vector-icons';
import * as LinkingExpo from 'expo-linking';

export default function ContactScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: settings } = useSettings();
  const [sending, setSending] = useState(false);

  const getSettingValue = (key: string, fallback: string): string => {
    if (!Array.isArray(settings) || settings.length === 0) return fallback;
    const setting = settings.find((item) => item.setting_key === key);
    return setting?.setting_value || fallback;
  };

  const storeName = getSettingValue('store_name', BUSINESS.firmName);
  const primaryBranch = BUSINESS.branches[0];
  const secondaryBranch = BUSINESS.branches[1];

  const [form, setForm] = React.useState({ name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '', subject: '', message: '' });

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const buildWhatsAppMessage = () => {
    const trimmedName = form.name.trim() || 'Customer';
    const trimmedEmail = form.email.trim() || 'Not provided';
    const trimmedPhone = form.phone.trim() || 'Not provided';
    const trimmedSubject = form.subject.trim() || 'General Enquiry';
    const trimmedMessage = form.message.trim() || 'No message';

    return [
      `*New Enquiry - ${storeName}*`,
      ``,
      `*Firm:*`,
      BUSINESS.firmName,
      ``,
      `*Name:*`,
      trimmedName,
      ``,
      `*Email:*`,
      trimmedEmail,
      ``,
      `*Phone:*`,
      trimmedPhone,
      ``,
      `*Subject:*`,
      trimmedSubject,
      ``,
      `*Message:*`,
      trimmedMessage,
      ``,
      `*Sent From:*`,
      `${storeName} Mobile App`,
    ].join('\n');
  };

  const openWhatsApp = async (message: string) => {
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${BUSINESS.primaryWhatsapp}?text=${encoded}`;
    try {
      const canOpen = await LinkingExpo.canOpenURL(url);
      if (canOpen) {
        await LinkingExpo.openURL(url);
      } else {
        Alert.alert('WhatsApp', 'Unable to open WhatsApp. Please ensure it is installed.');
      }
    } catch {
      Alert.alert('WhatsApp', 'Unable to open WhatsApp. Please try again later.');
    }
  };

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      Alert.alert('Missing details', 'Please enter your name, email, and message.');
      return;
    }

    try {
      setSending(true);
      const { error } = await supabase.from('contact_messages').insert({
        user_id: user?.id || null,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        subject: form.subject.trim() || 'General Enquiry',
        message: form.message.trim(),
        status: 'new',
      });
      if (error) throw error;

      const whatsappMessage = buildWhatsAppMessage();
      await openWhatsApp(whatsappMessage);

      setForm((current) => ({ ...current, subject: '', message: '' }));
    } catch (error: any) {
      console.error('Contact submission failed:', error);
      Alert.alert('Unable to send', error?.message || 'Please try again later.');
    } finally {
      setSending(false);
    }
  };

  const openDial = async (phone: string) => {
    const url = `tel:+91${phone}`;
    try {
      const canOpen = await LinkingExpo.canOpenURL(url);
      if (canOpen) {
        await LinkingExpo.openURL(url);
      }
    } catch {
      // ignore dialer failures silently
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.firmTitle}>{BUSINESS.firmName}</Text>
        <Text style={styles.title}>Contact Us</Text>
        <Text style={styles.subtitle}>We'd love to hear from you</Text>

        <View style={styles.branchGrid}>
          <View style={styles.branchCard}>
            <Text style={styles.branchName}>{primaryBranch.name}</Text>
            <Text style={styles.branchAddress}>{primaryBranch.address}</Text>
            <View style={styles.branchRow}>
              <MaterialIcons name="person" size={16} color={COLORS.lightGold} />
              <Text style={styles.branchDetail}>{primaryBranch.contactPerson}</Text>
            </View>
            <View style={styles.branchRow}>
              <MaterialIcons name="phone" size={16} color={COLORS.lightGold} />
              <TouchableOpacity onPress={() => openDial(`tel:+91${primaryBranch.phone}`)}>
                <Text style={styles.branchLink}>+91 {primaryBranch.phone}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.branchRow}>
              <MaterialIcons name="schedule" size={16} color={COLORS.lightGold} />
              <Text style={styles.branchDetail}>{primaryBranch.timing}</Text>
            </View>
            <View style={styles.branchRow}>
              <MaterialIcons name="info" size={16} color={COLORS.lightGold} />
              <Text style={styles.branchDetail}>{primaryBranch.closed}</Text>
            </View>
            <TouchableOpacity style={styles.whatsappButton} onPress={() => openWhatsApp(`Hello ${primaryBranch.name}, I would like to enquire about your jewellery collection.`)}>
              <Text style={styles.whatsappButtonText}>WhatsApp {primaryBranch.name}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.branchCard}>
            <Text style={styles.branchName}>{secondaryBranch.name}</Text>
            <Text style={styles.branchAddress}>{secondaryBranch.address}</Text>
            <View style={styles.branchRow}>
              <MaterialIcons name="person" size={16} color={COLORS.lightGold} />
              <Text style={styles.branchDetail}>{secondaryBranch.contactPerson}</Text>
            </View>
            <View style={styles.branchRow}>
              <MaterialIcons name="phone" size={16} color={COLORS.lightGold} />
              <TouchableOpacity onPress={() => openDial(`tel:+91${secondaryBranch.phone}`)}>
                <Text style={styles.branchLink}>+91 {secondaryBranch.phone}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.branchRow}>
              <MaterialIcons name="schedule" size={16} color={COLORS.lightGold} />
              <Text style={styles.branchDetail}>{secondaryBranch.timing}</Text>
            </View>
            <View style={styles.branchRow}>
              <MaterialIcons name="info" size={16} color={COLORS.lightGold} />
              <Text style={styles.branchDetail}>{secondaryBranch.closed}</Text>
            </View>
            <TouchableOpacity style={styles.whatsappButton} onPress={() => openWhatsApp(`Hello ${secondaryBranch.name}, I would like to enquire about your jewellery collection.`)}>
              <Text style={styles.whatsappButtonText}>WhatsApp {secondaryBranch.name}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Send an enquiry</Text>
        {(['name', 'email', 'phone', 'subject'] as const).map((field) => (
          <TextInput key={field} style={styles.input} placeholder={field[0].toUpperCase() + field.slice(1)} placeholderTextColor={COLORS.secondaryText} value={form[field]} onChangeText={(value) => update(field, value)} keyboardType={field === 'email' ? 'email-address' : field === 'phone' ? 'phone-pad' : 'default'} />
        ))}
        <TextInput style={[styles.input, styles.message]} placeholder="Message" placeholderTextColor={COLORS.secondaryText} value={form.message} onChangeText={(value) => update('message', value)} multiline numberOfLines={5} />
        <TouchableOpacity style={styles.button} onPress={submit} disabled={sending}><Text style={styles.buttonText}>{sending ? 'Sending...' : 'Send Message'}</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl },
  back: { color: COLORS.gold, fontFamily: FONT_FAMILY.sansSemiBold, fontSize: SIZES.md, marginBottom: SPACING.xl },
  firmTitle: { color: COLORS.gold, fontFamily: FONT_FAMILY.serifBold, fontSize: SIZES.lg, marginBottom: SPACING.xs },
  title: { color: COLORS.white, fontFamily: FONT_FAMILY.serifBold, fontSize: SIZES.xxxl },
  subtitle: { color: COLORS.secondaryText, fontFamily: FONT_FAMILY.sans, fontSize: SIZES.md, marginTop: SPACING.xs, marginBottom: SPACING.xl },
  branchGrid: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  branchCard: { flex: 1, backgroundColor: COLORS.secondary, borderWidth: 1, borderColor: COLORS.goldBorder, borderRadius: RADIUS.lg, padding: SPACING.lg },
  branchName: { color: COLORS.gold, fontFamily: FONT_FAMILY.serifBold, fontSize: SIZES.xl, marginBottom: SPACING.sm },
  branchAddress: { color: COLORS.secondaryText, fontFamily: FONT_FAMILY.sans, fontSize: SIZES.sm, lineHeight: 20, marginBottom: SPACING.md },
  branchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.xs },
  branchDetail: { color: COLORS.secondaryText, fontFamily: FONT_FAMILY.sans, fontSize: SIZES.sm },
  branchLink: { color: COLORS.lightGold, fontFamily: FONT_FAMILY.sansSemiBold, fontSize: SIZES.sm },
  whatsappButton: { marginTop: SPACING.md, backgroundColor: '#25D366', paddingVertical: SPACING.sm, borderRadius: RADIUS.md, alignItems: 'center' },
  whatsappButtonText: { color: COLORS.primary, fontFamily: FONT_FAMILY.sansBold, fontSize: SIZES.sm },
  sectionTitle: { color: COLORS.white, fontFamily: FONT_FAMILY.serifBold, fontSize: SIZES.xl, marginBottom: SPACING.md },
  input: { backgroundColor: COLORS.secondary, borderWidth: 1, borderColor: COLORS.darkBorder, borderRadius: RADIUS.md, color: COLORS.white, fontFamily: FONT_FAMILY.sans, fontSize: SIZES.md, padding: SPACING.md, marginBottom: SPACING.md },
  message: { minHeight: 120, textAlignVertical: 'top' },
  button: { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  buttonText: { color: COLORS.primary, fontFamily: FONT_FAMILY.sansBold, fontSize: SIZES.md },
});
