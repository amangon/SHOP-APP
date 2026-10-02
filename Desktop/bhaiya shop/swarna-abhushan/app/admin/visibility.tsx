import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';
import { LoadingScreen, ErrorState } from '../../components';
import { supabase } from '../../lib/supabase';
import { AppSetting } from '../../types';

export default function AdminVisibilityScreen() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const toggleVisibility = async (key: string, currentValue: string) => {
    try {
      setSaving(true);
      const newValue = currentValue === 'true' ? 'false' : 'true';
      const { error } = await supabase.from('app_settings').upsert({
        setting_key: key,
        setting_value: newValue,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      loadSettings();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update visibility');
    } finally {
      setSaving(false);
    }
  };

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      visibility_hero: 'Show Hero Section',
      visibility_live_rates: 'Show Live Rates Section',
      visibility_explore_collections: 'Show Explore Collections Section',
      visibility_featured_jewellery: 'Show Featured Jewellery Section',
      visibility_new_arrivals: 'Show New Arrivals Section',
      visibility_testimonials: 'Show Testimonials Section',
      visibility_about: 'Show About Section',
    };
    return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) return <LoadingScreen message="Loading visibility settings..." />;
  if (error) return <ErrorState title="Error" message={error} onRetry={loadSettings} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Section Visibility</Text>
        <Text style={styles.headerSubtitle}>Show or hide sections in the app</Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {settings
          .filter((setting) => setting.setting_key.startsWith('visibility_'))
          .map((setting: AppSetting) => (
            <View key={setting.id} style={styles.settingCard}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingKey}>{getSettingLabel(setting.setting_key)}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.toggleContainer,
                  setting.setting_value === 'true' && styles.toggleActive,
                ]}
                onPress={() => toggleVisibility(setting.setting_key, setting.setting_value || 'false')}
              >
                <Text style={[
                  styles.toggleText,
                  setting.setting_value === 'true' && styles.toggleTextActive,
                ]}>
                  {setting.setting_value === 'true' ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  toggleActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  toggleText: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  toggleTextActive: {
    color: COLORS.primary,
  },
});