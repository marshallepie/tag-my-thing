import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
  });
  const mountedRef = useRef(true);

  // Update user activity
  const updateUserActivity = useCallback(async () => {
    try {
      await supabase.rpc('update_user_activity');
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }, []);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }

      if (data && mountedRef.current) {
        updateUserActivity();
      }

      return data;
    } catch (error) {
      console.error('Profile fetch exception:', error);
      return null;
    }
  }, [updateUserActivity]);

  // Initialize auth
  useEffect(() => {
    if (!mountedRef.current) return;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Initial session error:', error);
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
          });
          return;
        }

        if (session?.user) {
          // Small delay to allow database trigger to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const profile = await fetchProfile(session.user.id);
          
          setAuthState({
            user: session.user,
            profile,
            loading: false,
            initialized: true,
          });
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          initialized: true,
        });
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state change detected. Event:', event, 'Session user:', session?.user?.id);
        if (!mountedRef.current) return;

        console.log('Auth state change:', event);

        if (event === 'SIGNED_OUT' || !session?.user) {
          console.log('useAuth: Processing SIGNED_OUT event');
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
          });
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('useAuth: Processing SIGNED_IN or TOKEN_REFRESHED event. Fetching profile...');
          setAuthState(prev => ({ ...prev, loading: true }));

          // Small delay for database operations
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const profile = await fetchProfile(session.user.id);
          
          console.log('useAuth: Profile fetched:', profile?.email, 'Role:', profile?.role);
          
          setAuthState({
            user: session.user,
            profile,
            loading: false,
            initialized: true,
          });
          console.log('useAuth: Auth state updated after sign-in');
        }
      }
    );

    initializeAuth();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Refresh profile function
  const refreshProfile = useCallback(async () => {
    if (!authState.user?.id) return null;

    const profile = await fetchProfile(authState.user.id);
    setAuthState(prev => ({ ...prev, profile }));
    return profile;
  }, [authState.user?.id, fetchProfile]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear state
      localStorage.clear();
      sessionStorage.clear();
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
      });
    }
  }, []);

  // Derived properties
  const isAuthenticated = !!authState.user;
  const hasProfile = !!authState.profile;
  const isAdmin = authState.profile?.role === 'admin';
  const isModerator = authState.profile?.role === 'moderator' || authState.profile?.role === 'admin';
  const isInfluencer = authState.profile?.role === 'influencer';
  const isAdminInfluencer = authState.profile?.role === 'admin_influencer';
  const isBusinessUser = authState.profile?.is_business_user || false;

  return {
    user: authState.user,
    profile: authState.profile,
    loading: authState.loading,
    initialized: authState.initialized,
    isAuthenticated,
    hasProfile,
    isAdmin,
    isModerator,
    isInfluencer,
    isAdminInfluencer,
    isBusinessUser,
    signOut,
    refreshProfile,
  };
};