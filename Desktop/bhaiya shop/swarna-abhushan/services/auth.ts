import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';

const APP_SCHEME = 'swarna-abhushan';

export const getPasswordResetRedirectUrl = (): string => {
  return Linking.createURL('reset-password', { scheme: APP_SCHEME });
};

export interface SignInResult {
  success: boolean;
  error: string | null;
  user: Profile | null;
}

export interface SignUpResult {
  success: boolean;
  error: string | null;
  user: any | null;
}

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<SignInResult> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      return { success: false, error: getFriendlyErrorMessage(authError), user: null };
    }

    if (!authData.user) {
      return { success: false, error: 'No user data returned', user: null };
    }

    const profile = await fetchProfile(authData.user.id);

  if (!profile) {
      // Auth succeeded but no profile row — create a minimal profile
      // from the auth user data so navigation can proceed
  const fallbackProfile: Profile = {
        id: authData.user.id,
        full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || null,
        firm_name: authData.user.user_metadata?.firm_name || null,
        email: authData.user.email || '',
        frames_name: authData.user.user_metadata?.frames_name || null,
        photo_url: null,
        role: authData.user.app_metadata?.role || 'user',
        created_at: authData.user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { success: true, error: null, user: fallbackProfile };
    }

    return { success: true, error: null, user: profile };
  } catch (error: any) {
    return { success: false, error: getFriendlyErrorMessage(error), user: null };
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone: string,
  firmName?: string
): Promise<SignUpResult> => {
  try {
    const metadata: Record<string, any> = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: `${firstName.trim()} ${lastName.trim()}`,
      phone: phone.trim(),
    };

    if (firmName !== undefined) {
      metadata.firm_name = firmName.trim();
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      return { success: false, error: error.message, user: null };
    }

    if (data.user) {
      const profilePayload: Record<string, any> = {
        id: data.user.id,
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        phone: phone.trim() || null,
        role: data.user.app_metadata?.role || 'user',
      };

      if (firmName !== undefined) {
        profilePayload.firm_name = firmName.trim() || null;
      }

      try {
        await supabase.from('profiles').upsert(profilePayload);
      } catch (profileError) {
        console.error('Profile creation failed after signup:', profileError);
      }
    }

    return { success: true, error: null, user: data.user };
  } catch (error: any) {
    return { success: false, error: error?.message || 'An unexpected error occurred', user: null };
  }
};

export const resetPassword = async (email: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const redirectTo = getPasswordResetRedirectUrl();
    console.log('PASSWORD RESET REDIRECT:', redirectTo);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      return { success: false, error: error.message };
    }

return { success: true, error: null };
   } catch (error: any) {
     return { success: false, error: error?.message || 'An unexpected error occurred' };
   }
 };

export const updatePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser?.email) {
      return { success: false, error: 'Your session has expired. Please sign in again.' };
    }

    // Reauthenticate before updating the password. The resulting session remains active.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword,
    });
    
    if (signInError) throw signInError;
    
    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (updateError) throw updateError;
    
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update password' };
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync('supabase.auth.token');
  } catch (error) {
    console.log('Sign out error:', error);
  }
};

export const fetchProfile = async (userId?: string): Promise<Profile | null> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      if (userError.name === 'AuthSessionMissingError') return null;
      throw userError;
    }
    const targetId = userId || user?.id;

    if (!targetId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();

    if (error) {
      console.error('Profile fetch failed:', error);
      return null;
    }
    if (!data) {
// No profile row — construct fallback from auth user
       if (user && user.id === targetId) {
         return {
           id: user.id,
           full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
           firm_name: user.user_metadata?.firm_name || null,
           email: user.email || '',
           frames_name: user.user_metadata?.frames_name || null,
           role: user.app_metadata?.role || 'user',
           created_at: user.created_at || new Date().toISOString(),
           updated_at: new Date().toISOString(),
         } as Profile;
       }
      return null;
    }
    const normalizedRole = String(data.role || 'user').trim().toLowerCase();
    console.log('Current user role:', normalizedRole);
    return { ...data, role: normalizedRole } as Profile;
  } catch (error: any) {
    if (error?.name === 'AuthSessionMissingError') return null;
    console.error('Profile fetch error:', error);
    return null;
  }
};

export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

const getFriendlyErrorMessage = (error: any): string => {
  const message = error?.message || '';
  if (
    message.includes('UnknownHostException') ||
    message.includes('fetch failed') ||
    message.includes('Network request failed')
  ) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  return message;
};
