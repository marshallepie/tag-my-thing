import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

// Add this at the top of useAuth
const [instanceId] = useState(() => Math.random().toString(36).slice(2));

useEffect(() => {
  console.log(`🚀 useAuth: Initializing instance ${instanceId}`);
  // ... rest of initialization
}, []);

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

  // Update user activity - simplified
  const updateUserActivity = useCallback(async () => {
    try {
      await supabase.rpc('update_user_activity');
    } catch (error) {
      console.error('Error updating user activity:', error);
      // Don't throw - this is not critical
    }
  }, []);

  // // Fetch user profile with timeout and error handling
  // const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
  //   console.log('🔍 fetchProfile: Starting for userId:', userId);
  //   const startTime = performance.now();
    
  //   try {
  //     // Create timeout promise (8 seconds - shorter timeout)
  //     const timeoutPromise = new Promise<never>((_, reject) => {
  //       setTimeout(() => reject(new Error('Profile fetch timeout')), 8000);
  //     });
      
  //     // Race the Supabase query against the timeout
  //     const queryPromise = supabase
  //       .from('user_profiles')
  //       .select('*')
  //       .eq('id', userId)
  //       .maybeSingle();

  //     const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

  //     const duration = (performance.now() - startTime).toFixed(1);
  //     console.log('🔍 fetchProfile: Query completed in', duration + 'ms');

  //     if (error) {
  //       console.error('❌ fetchProfile: Supabase error:', error);
  //       return null;
  //     }

  //     if (data && mountedRef.current) {
  //       console.log('✅ fetchProfile: Profile loaded for:', data.email);
        
  //       // Update activity in background - don't await
  //       updateUserActivity().catch(err => 
  //         console.warn('⚠️ Background activity update failed:', err)
  //       );
  //     }

  //     return data;
  //   } catch (error) {
  //     const duration = (performance.now() - startTime).toFixed(1);
      
  //     if (error instanceof Error && error.message.includes('timeout')) {
  //       console.error('⏰ fetchProfile: Query timed out after', duration + 'ms');
  //     } else {
  //       console.error('❌ fetchProfile: Exception after', duration + 'ms:', error);
  //     }
  //     return null;
  //   }
  // }, [updateUserActivity]);

  // In useAuth.ts, add a simple cache/deduplication mechanism
let profileCache = new Map<string, Promise<UserProfile | null>>();

const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
  // Check if we already have a pending request for this user
  if (profileCache.has(userId)) {
    return profileCache.get(userId)!;
  }

  console.log('🔍 fetchProfile: Starting for userId:', userId);
  const startTime = performance.now();
  
  const profilePromise = (async () => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000); // Reduced to 5s
      });
      
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      
      const duration = (performance.now() - startTime).toFixed(1);
      console.log('🔍 fetchProfile: Query completed in', duration + 'ms');

      if (error) {
        console.error('❌ fetchProfile: Supabase error:', error);
        return null;
      }

      if (data && mountedRef.current) {
        console.log('✅ fetchProfile: Profile loaded for:', data.email);
       // updateUserActivity().catch(err => 
         // console.warn('⚠️ Background activity update failed:', err)
        //);
      }

      return data;
    } catch (error) {
      const duration = (performance.now() - startTime).toFixed(1);
      console.error('⏰ fetchProfile: Query failed after', duration + 'ms:', error);
      return null;
    } finally {
      // Clear cache after completion
      profileCache.delete(userId);
    }
  })();

  profileCache.set(userId, profilePromise);
  return profilePromise;
}, [updateUserActivity]);

  // Initialize auth system
  useEffect(() => {
    if (!mountedRef.current) return;

    let authSubscription: any;

    const initializeAuth = async () => {
      try {
        console.log('🚀 useAuth: Initializing auth system');
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Initial session error:', error);
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
          });
          return;
        }

        if (session?.user) {
          console.log('👤 Initial session found for user:', session.user.id);
          const profile = await fetchProfile(session.user.id);
          
          setAuthState({
            user: session.user,
            profile,
            loading: false,
            initialized: true,
          });
        } else {
          console.log('🚫 No initial session found');
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
          });
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          initialized: true,
        });
      }
    };

    // Set up auth state listener
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Auth state change:', event, 'User ID:', session?.user?.id);
          
          if (!mountedRef.current) return;

          if (event === 'SIGNED_OUT' || !session?.user) {
            console.log('🚪 Processing sign out');
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              initialized: true,
            });
            return;
          }

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('🔑 Processing sign in/token refresh for:', session.user.id);
            
            // Set loading state
            setAuthState(prev => ({ ...prev, loading: true }));
            
            // Fetch profile
            const profile = await fetchProfile(session.user.id);
            
            // Update state
            setAuthState({
              user: session.user,
              profile,
              loading: false,
              initialized: true,
            });
            
            console.log('✅ Auth state updated after', event);
          }
        }
      );
      
      return subscription;
    };

    // Initialize
    initializeAuth();
    authSubscription = setupAuthListener();

    // Cleanup
    return () => {
      mountedRef.current = false;
      authSubscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Refresh profile function
  const refreshProfile = useCallback(async () => {
    if (!authState.user?.id || !mountedRef.current) return null;

    console.log('🔄 Refreshing profile for user:', authState.user.id);
    const profile = await fetchProfile(authState.user.id);
    
    if (mountedRef.current) {
      setAuthState(prev => ({ ...prev, profile }));
    }
    
    return profile;
  }, [authState.user?.id, fetchProfile]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      console.log('🚪 Starting sign out process');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Immediately clear auth state
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
      });
      
      console.log('✅ Sign out completed');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      
      // Force clear everything on error
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

  // UNIFIED DERIVED PROPERTIES
  // Simplified role and permission system
  const isAuthenticated = !!authState.user;
  const hasProfile = !!authState.profile;
  
  // Role checks - simplified hierarchy
  const isStandardUser = authState.profile?.role === 'standard' || !authState.profile?.role; // Default to standard
  const isModerator = authState.profile?.role === 'moderator';
  const isAdmin = authState.profile?.role === 'admin';
  
  // Feature flags instead of complex roles
  const isBusinessUser = authState.profile?.is_business_user || false;
  const hasReferralAccess = true; // Everyone has referral access in unified system
  const canModerate = isModerator || isAdmin;
  const canAdmin = isAdmin;
  
  // Legacy compatibility (deprecated but kept for transition)
  const isInfluencer = hasReferralAccess;
  const isAdminInfluencer = isAdmin; // Admins have all privileges

  return {
    // Core auth state
    user: authState.user,
    profile: authState.profile,
    loading: authState.loading,
    initialized: authState.initialized,
    
    // Authentication status
    isAuthenticated,
    hasProfile,
    
    // Simplified role system
    isStandardUser,
    isModerator,
    isAdmin,
    
    // Feature-based permissions
    isBusinessUser,
    hasReferralAccess,
    canModerate,
    canAdmin,
    
    // Legacy compatibility (deprecated)
    isInfluencer,
    isAdminInfluencer,
    
    // Actions
    signOut,
    refreshProfile,
  };
};