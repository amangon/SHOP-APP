import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { COLORS, SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { SectionHeader, LoadingScreen, ErrorState } from '../../components';
import { DashboardStats } from '../../types';
import { MaterialIcons } from '@expo/vector-icons';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    activeProducts: 0,
    featuredProducts: 0,
    lastRateUpdate: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setError(null);
      const [
        usersResult,
        productsResult,
        activeResult,
        featuredResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_featured', true),
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalProducts: productsResult.count || 0,
        activeProducts: activeResult.count || 0,
        featuredProducts: featuredResult.count || 0,
        lastRateUpdate: null,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Dashboard Error"
        message={error}
        onRetry={loadStats}
      />
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toString(), icon: 'people' },
    { label: 'Total Products', value: stats.totalProducts.toString(), icon: 'diamond' },
    { label: 'Active Products', value: stats.activeProducts.toString(), icon: 'check-circle' },
    { label: 'Featured Products', value: stats.featuredProducts.toString(), icon: 'star' },
  ];

  const managementItems: ManagementItem[] = [
     { title: 'Manage Products', subtitle: 'Add, edit, delete products', route: '/admin/products', icon: 'diamond' },
     { title: 'Manage Featured', subtitle: 'Promote featured jewellery', route: '/admin/featured', icon: 'star' },
     { title: 'Manage New Arrivals', subtitle: 'Showcase latest pieces', route: '/admin/new-arrivals', icon: 'new-releases' },
     { title: 'Manage Categories', subtitle: 'Organize jewellery types', route: '/admin/categories', icon: 'category' },
     { title: 'Manage Home Banner', subtitle: 'Update hero banner', route: '/admin/banners', icon: 'image' },
     { title: 'Manage Login Logo', subtitle: 'Update login branding', route: '/admin/login-logo', icon: 'branding-watermark' },
     { title: 'App Settings', subtitle: 'Configure application', route: '/admin/settings', icon: 'settings' },
     { title: 'Content Management', subtitle: 'Manage text content', route: '/admin/content', icon: 'text-format' },
     { title: 'Section Visibility', subtitle: 'Show/hide sections', route: '/admin/visibility', icon: 'visibility' },
     { title: 'Manage Users', subtitle: 'User roles and access', route: '/admin/users', icon: 'people' },
   ];

  interface ManagementItem {
    title: string;
    subtitle: string;
    route: string;
    icon: string;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your jewellery application</Text>
      </View>

      <View style={styles.statsContainer}>
        {statCards.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {stats.lastRateUpdate && (
        <View style={styles.lastUpdateContainer}>
          <Text style={styles.lastUpdateText}>
            Last rate update: {new Date(stats.lastRateUpdate).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}

      <View style={styles.managementSection}>
        <SectionHeader title="Management" subtitle="Quick access to all tools" />
        <View style={styles.managementGrid}>
          {managementItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.managementCard}
              onPress={() => router.push(item.route as never)}
              activeOpacity={0.8}
            >
              <View style={styles.managementCardIcon}>
                <MaterialIcons name={item.icon as any} size={24} color={COLORS.gold} />
              </View>
              <View style={styles.managementCardContent}>
                <Text style={styles.managementCardTitle}>{item.title}</Text>
                <Text style={styles.managementCardSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.managementCardArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    ...SHADOWS.gold,
  },
  statValue: {
    fontSize: SIZES.xxl,
    fontWeight: '700',
    color: COLORS.gold,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: SIZES.sm,
    color: COLORS.secondaryText,
  },
  lastUpdateContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  lastUpdateText: {
    fontSize: SIZES.sm,
    color: COLORS.secondaryText,
  },
  managementSection: {
    padding: SPACING.lg,
  },
  managementGrid: {
    gap: SPACING.md,
  },
  managementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    ...SHADOWS.dark,
  },
  managementCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  managementCardContent: {
    flex: 1,
  },
  managementCardTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  managementCardSubtitle: {
    fontSize: SIZES.sm,
    color: COLORS.secondaryText,
    marginTop: SPACING.xs,
  },
  managementCardArrow: {
    fontSize: 24,
    color: COLORS.secondaryText,
    marginLeft: SPACING.md,
  },
});
