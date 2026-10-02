import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';
import { LoadingScreen, ErrorState, EmptyState } from '../../components';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import { getPasswordResetRedirectUrl } from '../../services/auth';
import { MaterialIcons } from '@expo/vector-icons';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionUser, setActionUser] = useState<Profile | null>(null);
  const [actionMode, setActionMode] = useState<'promote' | 'demote' | 'reset' | 'enable' | 'disable'>('promote');
  const [actionVisible, setActionVisible] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openAction = (user: Profile, mode: 'promote' | 'demote' | 'reset' | 'enable' | 'disable') => {
    setActionUser(user);
    setActionMode(mode);
    setActionVisible(true);
  };

  const confirmAction = async () => {
    if (!actionUser) return;

    try {
      if (actionMode === 'promote' || actionMode === 'demote') {
        const newRole = actionMode === 'promote' ? 'admin' : 'user';
        const rpcName = actionMode === 'promote' ? 'promote_user_to_admin' : 'demote_user_from_admin';
        Alert.alert(
          `${actionMode === 'promote' ? 'Promote' : 'Demote'} User`,
          `Change ${actionUser.email || actionUser.id} to ${newRole}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Confirm',
              onPress: async () => {
                try {
                  const { error } = await supabase.rpc(rpcName, {
                    target_user_id: actionUser.id,
                  });

                  if (error) throw error;
                  await loadUsers();
                  Alert.alert('Success', `User ${actionMode === 'promote' ? 'promoted' : 'demoted'} successfully`);
                } catch (err: any) {
                  Alert.alert('Error', err?.message || 'Failed to update user role');
                }
              },
            },
          ]
        );
      } else if (actionMode === 'enable' || actionMode === 'disable') {
        const { error } = await supabase
          .from('profiles')
          .update({ status: actionMode === 'enable' ? 'active' : 'inactive' })
          .eq('id', actionUser.id);
        if (error) throw error;
        await loadUsers();
      } else if (actionMode === 'reset') {
        Alert.alert(
          'Reset Password',
          `Send password reset email to ${actionUser.email || actionUser.id}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Send',
              onPress: async () => {
                try {
                   const { error } = await supabase.auth.resetPasswordForEmail(
                     actionUser.email,
                     {
                       redirectTo: getPasswordResetRedirectUrl(),
                     }
                   );
                  if (error) throw error;
                  Alert.alert('Success', 'Password reset email sent');
                } catch (err: any) {
                  Alert.alert('Error', err?.message || 'Failed to send reset email');
                }
              },
            },
          ]
        );
      }
    } finally {
      setActionVisible(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (user.email || '').toLowerCase().includes(query) ||
      (user.full_name || '').toLowerCase().includes(query) ||
      (user.firm_name || '').toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      (user.status || '').toLowerCase().includes(query)
    );
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return COLORS.gold;
      case 'tech':
        return COLORS.lightGold;
      default:
        return COLORS.secondaryText;
    }
  };

  const getRoleBgColor = (role: string) => {
    switch (role) {
      case 'admin':
        return COLORS.goldBorder;
      case 'tech':
        return COLORS.card;
      default:
        return COLORS.card;
    }
  };

  if (loading) return <LoadingScreen message="Loading users..." />;
  if (error) return <ErrorState title="Error" message={error} onRetry={loadUsers} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <Text style={styles.headerSubtitle}>Manage admin and tech roles</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={22} color={COLORS.secondaryText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={COLORS.secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="clear" size={22} color={COLORS.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {filteredUsers.length === 0 ? (
        <EmptyState title="No users found" message={searchQuery ? 'Try a different search term' : 'Users will appear here once registered'} />
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {filteredUsers.map((user: Profile) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userEmail}>{user.email || 'No email'}</Text>
                {user.firm_name ? <Text style={styles.userFirmName}>{user.firm_name}</Text> : null}
                {user.full_name ? <Text style={styles.userName}>{user.full_name}</Text> : null}
                <View style={[styles.roleBadge, { backgroundColor: getRoleBgColor(user.role) }]}>
                  <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                    {user.role.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.statusText}>{user.status || 'active'}</Text>
              </View>

              <View style={styles.userActions}>
                {user.role === 'user' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.promoteBtn]}
                    onPress={() => openAction(user, 'promote')}
                  >
                    <MaterialIcons name="admin-panel-settings" size={20} color={COLORS.primary} />
                    <Text style={styles.actionBtnText}>Promote</Text>
                  </TouchableOpacity>
                )}
                {user.role === 'admin' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.demoteBtn]}
                    onPress={() => openAction(user, 'demote')}
                  >
                    <MaterialIcons name="person-remove" size={20} color={COLORS.white} />
                    <Text style={[styles.actionBtnText, { color: COLORS.white }]}>Demote</Text>
                  </TouchableOpacity>
                )}
                {user.status === 'inactive' ? (
                  <TouchableOpacity style={[styles.actionBtn, styles.promoteBtn]} onPress={() => openAction(user, 'enable')}>
                    <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />
                    <Text style={styles.actionBtnText}>Enable</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.demoteBtn]}
                    onPress={() => openAction(user, 'disable')}
                    disabled={user.role === 'admin' && users.filter((candidate) => candidate.role === 'admin').length === 1}
                  >
                    <MaterialIcons name="block" size={20} color={COLORS.white} />
                    <Text style={[styles.actionBtnText, { color: COLORS.white }]}>Disable</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.resetBtn]}
                  onPress={() => openAction(user, 'reset')}
                >
                  <MaterialIcons name="lock-reset" size={20} color={COLORS.gold} />
                  <Text style={[styles.actionBtnText, { color: COLORS.gold }]}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: SIZES.md,
    paddingVertical: SPACING.xs,
  },
  list: {
    flex: 1,
    padding: SPACING.lg,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  userFirmName: {
    fontSize: SIZES.sm,
    fontWeight: '700',
    color: COLORS.lightGold,
    marginTop: SPACING.xs,
  },
  userName: {
    fontSize: SIZES.sm,
    color: COLORS.secondaryText,
    marginTop: SPACING.xs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    marginTop: SPACING.xs,
  },
  roleText: {
    fontSize: SIZES.xs,
    fontWeight: '600',
  },
  statusText: {
    fontSize: SIZES.xs,
    color: COLORS.secondaryText,
    marginTop: SPACING.xs,
    textTransform: 'capitalize',
  },
  userActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  promoteBtn: {
    backgroundColor: COLORS.gold,
  },
  demoteBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  resetBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  actionBtnText: {
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
});
