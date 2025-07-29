import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Centralized profile fetching function
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('useAuth - fetchProfile started for userId:', userId);
      
      // First check if user exists in auth.users
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        console.error('useAuth - Auth user not found:', authError);
        setProfile(null);
        return null;
      }
      
      // Try to fetch profile with better error handling
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no rows

      if (error) {
        console.error('useAuth - Error fetching profile:', error);
        
        // If profile doesn't exist (PGRST116) or other errors
        if (error.code === 'PGRST116' || error.code === 'PGRST301' || !data) {
          console.log('useAuth - Profile not found, this might be expected during signup');
          setProfile(null);
          return null;
        }
        
        throw error;
      } else {
        if (data) {
          setProfile(data);
          console.log('useAuth - Profile fetched successfully for user:', userId, 'role:', data.role);
          return data;
        } else {
          console.log('useAuth - No profile data returned');
          setProfile(null);
          return null;
        }
      }
    } catch (error) {
      console.error('useAuth - Error fetching profile:', error);
      setProfile(null);
      return null;
    }
  }, []);

  // Refresh profile function for external use
  const refreshProfile = useCallback(async () => {
    console.log('refreshProfile - Starting for user:', user?.id);
    if (user?.id) {
      const result = await fetchProfile(user.id);
      console.log('refreshProfile - Completed with result:', result);
      return result;
    }
    console.log('refreshProfile - No user ID available');
    return null;
  }, [user?.id, fetchProfile]);

  // Clear auth state
  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setLoading(false);
    setInitialized(true);
  }, []);

  // Set authenticated state
  const setAuthenticatedState = useCallback(async (authUser: User) => {
    setUser(authUser);
    
    const profileData = await fetchProfile(authUser.id);
    setLoading(false);
    setInitialized(true);
    
    return profileData;
  }, [fetchProfile]);

  useEffect(() => {
    console.log('useAuth - useEffect starting');
    
    let mounted = true;
    let initializationTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('useAuth - Getting initial session');
        setSessionChecked(false);
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        setSessionChecked(true);
        
        if (error) {
          console.error('useAuth - Session error:', error);
          
          // Handle invalid refresh token by clearing stale session data
          if (error.message && (
            error.message.includes('Refresh Token Not Found') ||
            error.message.includes('Invalid Refresh Token') ||
            error.message.includes('refresh_token_not_found')
          )) {
            console.log('useAuth - Invalid refresh token detected, clearing session');
            try {
              await supabase.auth.signOut();
              localStorage.clear();
              sessionStorage.clear();
            } catch (signOutError) {
              console.error('useAuth - Error during signOut:', signOutError);
            }
          }
          
          if (mounted) {
            clearAuthState();
          }
          return;
        }
        
        console.log('useAuth - Initial session check:', { hasSession: !!session, userId: session?.user?.id });
        
        if (session?.user && mounted) {
          console.log('useAuth - Setting authenticated state for user:', session.user.id);
          await setAuthenticatedState(session.user);
        } else if (mounted) {
          console.log('useAuth - No session found, clearing auth state');
          clearAuthState();
        }
      } catch (error) {
        console.error('useAuth - Session fetch error:', error);
        
        if (mounted) {
          clearAuthState();
        }
      }
    };

    // Set a timeout to prevent infinite loading
    initializationTimeout = setTimeout(() => {
      if (mounted && !sessionChecked) {
        console.warn('useAuth - Session check timeout, forcing initialization');
        clearAuthState();
      }
    }, 10000); // 10 second timeout
    // Initialize auth state
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('useAuth - Auth state change:', { event, hasSession: !!session, userId: session?.user?.id });
        
        if (event === 'SIGNED_OUT' || !session?.user) {
          console.log('useAuth - User signed out, clearing state');
          clearAuthState();
          return;
        }

        if (event === 'SIGNED_IN') {
          console.log('useAuth - User signed in/token refreshed, setting authenticated state');
          setLoading(true);
          
          // Set authenticated state immediately
          if (mounted) {
            await setAuthenticatedState(session.user);
          }
        }
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('useAuth - Token refreshed, updating user without loading state');
          // Update user object with new token but don't trigger loading state
          if (mounted) {
            setUser(session.user);
            // Profile data doesn't change during token refresh, so no need to refetch
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(initializationTimeout);
      subscription.unsubscribe();
    };
  }, [clearAuthState, setAuthenticatedState]);

  const signOut = async () => {
    try {
      console.log('useAuth - Signing out user');
      setLoading(true);
      
      await supabase.auth.signOut();
      
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear state immediately
      clearAuthState();
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('useAuth - Sign out error:', error);
      
      // Force clear even if signOut fails
      localStorage.clear();
      sessionStorage.clear();
      clearAuthState();
      window.location.href = '/';
    }
  };

  return {
    user,
    profile,
    loading,
    initialized,
    signOut,
    refreshProfile,
    isAuthenticated: !!user && !!profile,
    isAdmin: profile?.role === 'admin',
    isModerator: profile?.role === 'moderator' || profile?.role === 'admin',
    isInfluencer: profile?.role === 'influencer',
    isAdminInfluencer: profile?.role === 'admin_influencer',
    isBusinessUser: profile?.is_business_user || false,
  };
};