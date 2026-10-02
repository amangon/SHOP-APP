import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Supabase URL configured:', supabaseUrl ? 'Yes' : 'No');

if (supabaseUrl === '') {
  console.warn('Supabase URL is not defined. Check EXPO_PUBLIC_SUPABASE_URL in environment variables.');
}
if (supabaseAnonKey === '') {
  console.warn('Supabase anon key is not defined. Check EXPO_PUBLIC_SUPABASE_ANON_KEY in environment variables.');
}

let secureStoreAvailable: boolean | null = null;

const ensureSecureStoreAvailable = async (): Promise<boolean> => {
  if (secureStoreAvailable === null) {
    try {
      secureStoreAvailable = await SecureStore.isAvailableAsync();
    } catch (error) {
      console.log('SecureStore availability check failed:', error);
      secureStoreAvailable = false;
    }
  }
  return secureStoreAvailable;
};

const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (await ensureSecureStoreAvailable()) {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.log('SecureStore getItem error:', error);
    }
    return null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (await ensureSecureStoreAvailable()) {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.log('SecureStore setItem error:', error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (await ensureSecureStoreAvailable()) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.log('SecureStore removeItem error:', error);
    }
  },
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'swarna-abhushan-android',
      },
    },
  }
);

export const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label}: timed out after ${ms}ms`)), ms)
    ),
  ]);
};

export type Database = any;