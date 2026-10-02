import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';
import { LoadingScreen, ErrorState } from '../../components';
import { supabase } from '../../lib/supabase';
import { AppSetting } from '../../types';

export default function AdminContentScreen() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('setting_key', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (setting: AppSetting) => {
    setEditingKey(setting.setting_key);
    setEditValue(setting.setting_value || '');
  };

  const saveSetting = async (key: string) => {
    try {
      setSaving(true);
      const { error } = await supabase.from('app_settings').upsert({
        setting_key: key,
        setting_value: editValue || null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setEditingKey(null);
      setEditValue('');
      loadSettings();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      // Hero Section
      hero_brand_hindi: 'Hero Brand (Hindi)',
      hero_headline: 'Hero Headline',
      hero_subtitle: 'Hero Subtitle',
      hero_cta_text: 'Hero CTA Button Text',
      
      // Section Titles
      section_live_rates_title: 'Live Rates Section Title',
      section_live_rates_subtitle: 'Live Rates Section Subtitle',
      section_explore_collections_title: 'Explore Collections Section Title',
      section_explore_collections_subtitle: 'Explore Collections Section Subtitle',
section_featured_jewellery_title: 'Featured Jewellery Section Title',
       section_featured_jewellery_subtitle: 'Featured Jewellery Section Subtitle',
      section_new_arrivals_title: 'New Arrivals Section Title',
      section_new_arrivals_subtitle: 'New Arrivals Section Subtitle',
      section_testimonials_title: 'Testimonials Section Title',
      section_testimonials_subtitle: 'Testimonials Section Subtitle',
      section_about_title: 'About Section Title',
      
      // Content
      about_section_text: 'About Section Text',
      
      // Footer
      footer_text_hindi: 'Footer Text (Hindi)',
      footer_text_english: 'Footer Text (English)',
      footer_version: 'Footer Version',
    };
    return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) return <LoadingScreen message="Loading content..." />;
  if (error) return <ErrorState title="Error" message={error} onRetry={loadSettings} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Content Management</Text>
        <Text style={styles.headerSubtitle}>Manage all text content in the app</Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {settings
          .filter(
            (setting) =>
              setting.setting_key.includes('hero_') ||
              setting.setting_key.includes('section_') ||
              setting.setting_key.includes('about_section') ||
              setting.setting_key.includes('footer_')
          )
          .map((setting: AppSetting) => (
            <View key={setting.id} style={styles.settingCard}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingKey}>{getSettingLabel(setting.setting_key)}</Text>
              </View>

              {editingKey === setting.setting_key ? (
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
                    <TouchableOpacity
                      style={styles.cancelSettingButton}
                      onPress={() => {
                        setEditingKey(null);
                        setEditValue('');
                      }}
                    >
                      <Text style={styles.cancelSettingText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveSettingButton}
                      onPress={() => saveSetting(setting.setting_key)}
                      disabled={saving}
                    >
                      <Text style={styles.saveSettingText}>
                        {saving ? 'Saving...' : 'Save'}
                      </Text>
                    </TouchableOpacity>
                  </View>
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
          ))}
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
  headerTitle: {
    fontSize: SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: SIZES.md,
    color: COLORS.secondaryText,
    marginTop: SPACING.xs,
  },
  list: { padding: SPACING.lg },
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
  cancelSettingText: {
    color: COLORS.secondaryText,
    fontWeight: '600',
    fontSize: SIZES.md,
  },
  saveSettingButton: {
    flex: 1,
    backgroundColor: COLORS.gold,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  saveSettingText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: SIZES.md,
  },
  editSettingButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  editSettingText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: SIZES.sm,
  },
});