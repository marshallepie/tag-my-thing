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

// Simplified global state without complex listeners
let globalAuthState: AuthState = {
  user: null,
  profile: null,
  loading: true,
  initialized: false,
};

// Simple state update function
const setGlobalAuthState = (newState: Partial<AuthState>) => {
  globalAuthState = { ...globalAuthState, ...newState };
};

// Flag to prevent multiple initializations
let isInitialized = false;

export const useAuth = () => {
  const [localState, setLocalState] = useState<AuthState>(globalAuthState);
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

  // Initialize auth once
  useEffect(() => {
    if (isInitialized) {
      setLocalState(globalAuthState);
      return;
    }

    isInitialized = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Initial session error:', error);
          setGlobalAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
          });
          setLocalState(globalAuthState);
          return;
        }

        if (session?.user) {
          // Small delay to allow database trigger to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const profile = await fetchProfile(session.user.id);
          
          setGlobalAuthState({
            user: session.user,
            profile,
            loading: false,
            initialized: true,
          });
        } else {
          setGlobalAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
          });
        }

        setLocalState(globalAuthState);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setGlobalAuthState({
          user: null,
          profile: null,
          loading: false,
          initialized: true,
        });
        setLocalState(globalAuthState);
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
          setGlobalAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
          });
          setLocalState(globalAuthState);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('useAuth: Processing SIGNED_IN or TOKEN_REFRESHED event. Fetching profile...');
          setGlobalAuthState({ loading: true });
          setLocalState(globalAuthState);

          // Small delay for database operations
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const profile = await fetchProfile(session.user.id);
          
          console.log('useAuth: Profile fetched:', profile?.email, 'Role:', profile?.role);
          
          setGlobalAuthState({
            user: session.user,
            profile,
            loading: false,
            initialized: true,
          });
          console.log('useAuth: Auth state updated after sign-in');
          setLocalState(globalAuthState);
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
    if (!localState.user?.id) return null;

    const profile = await fetchProfile(localState.user.id);
    setGlobalAuthState({ profile });
    setLocalState(globalAuthState);
    return profile;
  }, [localState.user?.id, fetchProfile]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      
      setGlobalAuthState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
      });
      setLocalState(globalAuthState);
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear state
      localStorage.clear();
      sessionStorage.clear();
      setGlobalAuthState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
      });
      setLocalState(globalAuthState);
    }
  }, []);

  // Derived properties
  const isAuthenticated = !!(localState.user && localState.profile);
  const isAdmin = localState.profile?.role === 'admin';
  const isModerator = localState.profile?.role === 'moderator' || localState.profile?.role === 'admin';
  const isInfluencer = localState.profile?.role === 'influencer';
  const isAdminInfluencer = localState.profile?.role === 'admin_influencer';
  const isBusinessUser = localState.profile?.is_business_user || false;

  return {
    user: localState.user,
    profile: localState.profile,
    loading: localState.loading,
    initialized: localState.initialized,
    isAuthenticated,
    isAdmin,
    isModerator,
    isInfluencer,
    isAdminInfluencer,
    isBusinessUser,
    signOut,
    refreshProfile,
  };
};