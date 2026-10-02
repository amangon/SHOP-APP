import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, withTimeout } from '../lib/supabase';
import { Profile, AuthState } from '../types';
import { fetchProfile } from '../services/auth';

interface AuthContextType extends AuthState {
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  const applySession = useCallback(async (nextSession: Session) => {
    if (!mountedRef.current) return;
    setSession(nextSession);
    setIsAuthenticated(true);

    try {
      console.log('[AUTH] Fetching profile...');
      const profile = await withTimeout(
        fetchProfile(nextSession.user.id),
        15000,
        'Profile fetch'
      );
      if (profile && mountedRef.current) {
        console.log('[AUTH] Profile loaded, role:', profile.role);
        setUser(profile);
      }
    } catch (error) {
      console.error('[AUTH] Profile fetch failed:', error);
    }
  }, []);

  const checkUser = useCallback(async () => {
    try {
      console.log('[AUTH] Checking session...');
      const { data: { session } } = await withTimeout(
        supabase.auth.getSession(),
        15000,
        'Auth session check'
      );
      if (session?.user) {
        await applySession(session);
      } else if (mountedRef.current) {
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      initializedRef.current = true;
      console.log('[AUTH] Session check complete');
    } catch (error) {
      console.error('[AUTH] Session check error:', error);
      if (mountedRef.current) {
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    mountedRef.current = true;
    console.log('[AUTH] AuthProvider mounted');
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          return;
        }
        if (session?.user) {
          await applySession(session);
        } else if (initializedRef.current && mountedRef.current) {
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        }
        if (mountedRef.current) setLoading(false);
      }
    );

    return () => {
      console.log('[AUTH] AuthProvider unmounting');
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [applySession, checkUser]);

  const refreshProfile = useCallback(async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (currentSession?.user) {
        await applySession(currentSession);
      } else if (!session) {
        // Do not clear a valid auth state because a profile focus refresh was transient.
        return;
      }
    } catch (error) {
      console.error('Profile refresh failed; keeping current auth state:', error);
    }
  }, [applySession, session]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    setUser(null);
    setSession(null);
    setIsAuthenticated(false);
  };

  const isAdmin = user?.role === 'admin';
  const isTech = user?.role === 'tech';
  const canManageContent = isAdmin || isTech;

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isTech,
    canManageContent,
    refreshProfile,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
