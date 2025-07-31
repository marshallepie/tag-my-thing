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
    console.log('useAuth - fetchProfile ENTRY - Starting profile fetch for userId:', userId);
    console.log('useAuth - fetchProfile - Current timestamp:', new Date().toISOString());
    
    try {
      console.log('useAuth - fetchProfile - About to execute Supabase query');
      console.log('useAuth - fetchProfile - Query details: SELECT * FROM user_profiles WHERE id =', userId);
      
      const queryStartTime = performance.now();
      
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Profile fetch timeout after 10 seconds'));
        }, 10000); // 10 second timeout
      });
      
      // Create the actual query promise
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      // Race the query against the timeout
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      
      const queryEndTime = performance.now();
      const queryDuration = queryEndTime - queryStartTime;
      console.log('useAuth - fetchProfile - Query completed in', queryDuration.toFixed(2), 'ms');

      console.log('useAuth - fetchProfile - Raw query response:', {
        data: data,
        error: error,
        hasData: !!data,
        hasError: !!error
      });
      
      if (error) {
        console.error('useAuth - fetchProfile ERROR - Supabase query failed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      if (data) {
        console.log('useAuth - fetchProfile SUCCESS - Profile found:', {
          id: data.id,
          email: data.email,
          role: data.role,
          full_name: data.full_name,
          is_business_user: data.is_business_user
        });
      } else {
        console.log('useAuth - fetchProfile - No profile found for userId:', userId);
      }
      
      console.log('useAuth - fetchProfile EXIT - Returning:', data ? 'profile object' : 'null');
      return data;
    } catch (error) {
      // Check if this is a timeout error
      if (error instanceof Error && error.message.includes('timeout')) {
        console.error('useAuth - fetchProfile TIMEOUT - Query timed out after 10 seconds:', {
          userId: userId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        // Return null to allow the app to continue without profile data
        return null;
      }
      
      console.error('useAuth - fetchProfile EXCEPTION - Unexpected error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: userId
      });
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
        console.log('useAuth - Session user details:', {
          id: session.user.id,
          email: session.user.email,
          created_at: session.user.created_at
        });
        
        const user = session.user;
        console.log('useAuth - About to call fetchProfile for user:', user.id);
        const profile = await fetchProfile(user.id);
        console.log('useAuth - fetchProfile returned:', profile ? 'profile found' : 'null profile');

        setAuthState({
          user,
          profile,
          loading: false,
          initialized: true,
        });

        console.log('useAuth - Auth state updated successfully:', {
          hasUser: !!user,
          hasProfile: !!profile,
          isAuthenticated: !!(user && profile),
          profileRole: profile?.role,
          profileEmail: profile?.email
        });
      }
    } catch (error) {
      console.error('useAuth - CRITICAL ERROR in handleAuthStateChange:', {
        event: event,
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        hasSession: !!session,
        sessionUserId: session?.user?.id
      });
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