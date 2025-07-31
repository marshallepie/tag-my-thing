import { useState, useEffect, useCallback } from 'react';
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

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('useAuth - Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('useAuth - Profile fetch error:', error);
        return null;
      }

      console.log('useAuth - Profile fetched:', data ? 'success' : 'not found');
      return data;
    } catch (error) {
      console.error('useAuth - Profile fetch exception:', error);
      return null;
    }
  }, []);

  // Handle authentication state changes
  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    console.log('useAuth - Auth state change:', event, 'hasSession:', !!session);

    // Set loading for all events that require async operations
    if (['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED'].includes(event)) {
      setAuthState(prev => ({ ...prev, loading: true }));
    }

    try {
      if (event === 'SIGNED_OUT' || !session?.user) {
        console.log('useAuth - User signed out or no session');
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          initialized: true,
        });
        return;
      }

      if (['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED'].includes(event)) {
        console.log('useAuth - Processing authenticated session');
        
        const user = session.user;
        const profile = await fetchProfile(user.id);

        setAuthState({
          user,
          profile,
          loading: false,
          initialized: true,
        });

        console.log('useAuth - Auth state updated:', {
          hasUser: !!user,
          hasProfile: !!profile,
          isAuthenticated: !!(user && profile)
        });
      }
    } catch (error) {
      console.error('useAuth - Error handling auth state change:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        initialized: true,
      }));
    }
  }, [fetchProfile]);

  // Initialize authentication
  useEffect(() => {
    console.log('useAuth - Initializing authentication');

    let mounted = true;

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        await handleAuthStateChange(event, session);
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('useAuth - Initial session error:', error);
          
          // Handle invalid refresh token
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token')) {
            console.log('useAuth - Clearing invalid session');
            await supabase.auth.signOut();
            localStorage.clear();
            sessionStorage.clear();
          }
          
          if (mounted) {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              initialized: true,
            });
          }
          return;
        }

        if (mounted) {
          await handleAuthStateChange('INITIAL_SESSION', session);
        }
      } catch (error) {
        console.error('useAuth - Initial session exception:', error);
        if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
          });
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  // Refresh profile function
  const refreshProfile = useCallback(async () => {
    if (!authState.user?.id) {
      console.log('useAuth - No user ID for profile refresh');
      return null;
    }

    console.log('useAuth - Refreshing profile');
    const profile = await fetchProfile(authState.user.id);
    
    setAuthState(prev => ({
      ...prev,
      profile,
    }));

    return profile;
  }, [authState.user?.id, fetchProfile]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      console.log('useAuth - Signing out');
      setAuthState(prev => ({ ...prev, loading: true }));
      
      await supabase.auth.signOut();
      
      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // The onAuthStateChange listener will handle state updates
    } catch (error) {
      console.error('useAuth - Sign out error:', error);
      
      // Force clear state even if signOut fails
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
  const isAuthenticated = !!(authState.user && authState.profile);
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
    isAdmin,
    isModerator,
    isInfluencer,
    isAdminInfluencer,
    isBusinessUser,
    signOut,
    refreshProfile,
  };
};