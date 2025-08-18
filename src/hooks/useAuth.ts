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
    console.log('🔍 fetchProfile: Starting for userId:', userId);
    const startTime = performance.now();
    
    try {
      console.log('🔍 fetchProfile: Making Supabase query...');
      
      // Create timeout promise (10 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout after 10 seconds')), 10000);
      });
      
      // Race the Supabase query against the timeout
      const { data, error } = await Promise.race([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        timeoutPromise
      ]) as any;

      const duration = (performance.now() - startTime).toFixed(1);
      console.log('🔍 fetchProfile: Query completed in', duration + 'ms');

      if (error) {
        console.error('❌ fetchProfile: Supabase error:', error);
        return null;
      }

      console.log(' fetchProfile: Data received:', data ? 'Profile found' : 'No profile');
      
      if (data && mountedRef.current) {
        console.log('🔍 fetchProfile: Updating user activity...');
        // Wrap updateUserActivity in try-catch to prevent blocking
        try {
          await updateUserActivity();
          console.log('🔍 fetchProfile: User activity updated successfully');
        } catch (activityError) {
          console.warn('⚠️ fetchProfile: Failed to update user activity:', activityError);
          // Don't fail the profile fetch if activity update fails
        }
      }

      console.log('🔍 fetchProfile: Returning profile:', data?.email || 'null');
      return data;
    } catch (error) {
      const duration = (performance.now() - startTime).toFixed(1);
      
      // Enhanced error logging for production debugging
      if (error instanceof Error && error.message.includes('timeout')) {
        console.error('⏰ fetchProfile: Query timed out after', duration + 'ms');
        console.error('⏰ This suggests network or database performance issues in production');
      } else {
        console.error('❌ fetchProfile: Exception after', duration + 'ms:', error);
      }
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
          console.log('🔍 useAuth: Processing SIGNED_IN or TOKEN_REFRESHED event. Fetching profile...');
          const profileStartTime = performance.now();
          
          setAuthState(prev => ({ ...prev, loading: true }));
          console.log('🔍 useAuth: Set loading state to true');

          console.log('🔍 useAuth: About to call fetchProfile...');
          const profile = await fetchProfile(session.user.id);
          const profileDuration = (performance.now() - profileStartTime).toFixed(1);
          
          console.log('🔍 useAuth: fetchProfile completed in', profileDuration + 'ms');
          console.log('🔍 useAuth: Profile result:', profile ? `Email: ${profile.email}, Role: ${profile.role}` : 'null');
          
          console.log('🔍 useAuth: About to update auth state...');
          setAuthState({
            user: session.user,
            profile,
            loading: false,
            initialized: true,
          });
          console.log('🔍 useAuth: Auth state updated after sign-in');
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