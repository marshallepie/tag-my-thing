import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

interface ReferralStats {
  totalReferred: number;
  totalEarned: number;
  pendingRewards: number;
  levelBreakdown: {
    referral_level: number;
    count: number;
    earned: number;
  }[];
}

interface ReferralUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  referral_level: number;
  status: string;
  reward_amount: number;
}

interface ReferralSettings {
  referral_level: number;
  token_reward: number;
}

export const useReferrals = () => {
  const [stats, setStats] = useState<ReferralStats>({
    totalReferred: 0,
    totalEarned: 0,
    pendingRewards: 0,
    levelBreakdown: [1, 2, 3, 4, 5].map(referral_level => ({ referral_level, count: 0, earned: 0 }))
  });
  const [referredUsers, setReferredUsers] = useState<ReferralUser[]>([]);
  const [referralSettings, setReferralSettings] = useState<ReferralSettings[]>([
    { referral_level: 1, token_reward: 50 },
    { referral_level: 2, token_reward: 30 },
    { referral_level: 3, token_reward: 20 },
    { referral_level: 4, token_reward: 10 },
    { referral_level: 5, token_reward: 5 }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile, isAuthenticated, refreshProfile } = useAuth();

  const fetchReferralData = useCallback(async (currentUserId: string, currentUserProfile: any) => {
    if (!currentUserId || !currentUserProfile) {
      console.log('useReferrals - fetchReferralData: Missing user or profile data');
      setLoading(false);
      return;
    }

    console.log('useReferrals - fetchReferralData started for user:', currentUserId);
    
    try {
      setError(null);
      setLoading(true);
      
      // Fetch referral stats with proper error handling
      const [referralsResult, rewardsResult] = await Promise.allSettled([
        supabase
          .from('referrals')
          .select(`
            *,
            referred:user_profiles!referrals_referred_id_fkey(id, full_name, email, created_at)
          `)
          .eq('referrer_id', currentUserId),
        supabase
          .from('referral_rewards')
          .select('*')
          .eq('referrer_id', currentUserId)
      ]);

      // Handle referrals result
      let referrals: any[] = [];
      if (referralsResult.status === 'fulfilled') {
        const { data, error: fetchError } = referralsResult.value;
        if (fetchError) {
          console.error('Referrals fetch error:', fetchError);
          // Don't fail completely, just log and continue with empty data
          console.warn('Continuing with empty referrals data due to error');
          referrals = [];
        } else {
          referrals = data || [];
        }
      } else {
        console.error('Referrals promise rejected:', referralsResult.reason);
        // Don't fail completely, just log and continue with empty data
        console.warn('Continuing with empty referrals data due to promise rejection');
        referrals = [];
      }

      let rewards: any[] = [];
      if (rewardsResult.status === 'fulfilled') {
        const { data, error } = rewardsResult.value;
        if (error) {
          console.error('Rewards error:', error);
          // Don't fail completely, just log and continue with empty data
          console.warn('Continuing with empty rewards data due to error');
          rewards = [];
        } else {
          rewards = data || [];
        }
      } else {
        console.error('Rewards promise rejected:', rewardsResult.reason); // Log the actual rejection reason
        // Don't fail completely, just log and continue with empty data
        console.warn('Continuing with empty rewards data due to promise rejection');
        rewards = [];
      }

      console.log('useReferrals - Data fetched successfully:', {
        referrals: referrals.length,
        rewards: rewards.length
      });

      // Calculate stats safely with null checks
      const totalReferred = referrals.length;
      const totalEarned = rewards
        .filter(r => r && r.status === 'paid')
        .reduce((sum, r) => sum + (r.token_amount || 0), 0);
      const pendingRewards = rewards
        .filter(r => r && r.status === 'pending')
        .reduce((sum, r) => sum + (r.token_amount || 0), 0);

      // Level breakdown with safe filtering
      const levelBreakdown = [1, 2, 3, 4, 5].map(referral_level => {
        const levelReferrals = referrals.filter(r => r && r.referral_level === referral_level);
        const levelRewards = rewards.filter(r => r && r.referral_level === referral_level && r.status === 'paid');
        return {
          referral_level,
          count: levelReferrals.length,
          earned: levelRewards.reduce((sum, r) => sum + (r.token_amount || 0), 0)
        };
      });

      setStats({
        totalReferred,
        totalEarned,
        pendingRewards,
        levelBreakdown
      });

      // Format referred users safely with comprehensive null checks
      const users: ReferralUser[] = referrals
        .filter(r => r && r.referred && r.referred.id) // Filter out invalid entries
        .map(r => ({
          id: r.referred.id,
          full_name: r.referred.full_name || 'Unknown User',
          email: r.referred.email || 'No Email',
          created_at: r.referred.created_at || new Date().toISOString(),
          referral_level: r.referral_level || 1,
          status: r.status || 'pending',
          reward_amount: rewards.find(rw => rw && rw.referred_id === r.referred.id && rw.referral_level === (r.referral_level || 1))?.token_amount || 0
        }));

      setReferredUsers(users);
      console.log('useReferrals - Stats calculated successfully');
    } catch (error: any) {
      console.error('Error fetching referral data:', error);
      // Don't set error state that could cause infinite loops
      console.warn('Setting safe default values due to error');
      
      // Set safe default values on error
      setStats({
        totalReferred: 0,
        totalEarned: 0,
        pendingRewards: 0,
        levelBreakdown: [1, 2, 3, 4, 5].map(referral_level => ({ referral_level, count: 0, earned: 0 }))
      });
      setReferredUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReferralSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('referral_settings')
        .select('*')
        .eq('active', true)
        .order('referral_level');

      if (error) {
        console.error('Error fetching referral settings:', error);
        // Keep default settings on error
        return;
      }

      if (data && data.length > 0) {
        setReferralSettings(data);
      }
    } catch (error: any) {
      console.error('Error fetching referral settings:', error);
      // Keep default settings on error
    }
  }, []);

  // Initialize data fetching with better error handling
  useEffect(() => {
    // Only run if user and profile are available
    if (user?.id && profile) {
      console.log('useReferrals - useEffect triggered for user:', user.id);

      fetchReferralSettings();
      fetchReferralData(user.id, profile);
    } else {
      // Reset state if user logs out or profile is not available
      setStats({
        totalReferred: 0,
        totalEarned: 0,
        pendingRewards: 0,
        levelBreakdown: [1, 2, 3, 4, 5].map(referral_level => ({ referral_level, count: 0, earned: 0 }))
      });
      setReferredUsers([]);
      setLoading(false);
      setError(null);
      console.log('useReferrals - Not authenticated or no user/profile, resetting state.');
    }
  }, [user?.id, profile, fetchReferralSettings]);

  const generateReferralCode = async () => {
    // Add comprehensive safety checks
    if (!user || !profile) {
      console.log('generateReferralCode - No user or profile');
      return null;
    }

    // All users can now generate referral codes
    console.log('generateReferralCode - Starting for user:', user.id);

    console.log('generateReferralCode - Starting with profile:', profile);

    try {
      // Check if user already has a referral code
      if (profile.referral_code) {
        console.log('generateReferralCode - User already has code:', profile.referral_code);
        return profile.referral_code;
      }

      // Generate code client-side first, then try RPC as fallback
      console.log('generateReferralCode - Generating new code for user:', user.id);
      
      const baseName = (profile.full_name || profile.email.split('@')[0] || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 8);
      
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      let newCode = `${baseName}${randomSuffix}`;
      
      // Check if code already exists
      const { data: existingCode } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('referral_code', newCode)
        .maybeSingle();
      
      // If code exists, try RPC function
      if (existingCode) {
        console.log('generateReferralCode - Code exists, trying RPC');
        try {
          const { data, error } = await supabase.rpc('generate_referral_code', {
            user_id: user.id,
            username: profile.full_name || profile.email.split('@')[0]
          });
          
          if (!error && data) {
            newCode = data;
          }
        } catch (rpcError) {
          console.log('generateReferralCode - RPC failed, keeping generated code:', rpcError);
        }
      }
      
      console.log('generateReferralCode - Final code:', newCode);

      // Update user profile with referral code - wrap in try-catch
      try {
        console.log('generateReferralCode - Updating profile with code:', newCode);
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ referral_code: newCode })
          .eq('id', user.id);

        console.log('generateReferralCode - Update result:', { updateError });

        if (updateError) throw updateError;

        // Don't refresh profile here to avoid infinite loops
        // The profile will be updated through real-time subscriptions or next page load
        console.log('generateReferralCode - Profile update completed, skipping refresh to avoid loops');

        console.log('generateReferralCode - Completed successfully with code:', newCode);
        return newCode;
      } catch (updateError) {
        console.error('generateReferralCode - Profile update failed:', updateError);
        throw updateError;
      }
    } catch (error: any) {
      console.error('Error generating referral code:', error);
      toast.error('Failed to generate referral code');
      return null;
    }
  };

  const getReferralUrl = async () => {
    console.log('getReferralUrl - Starting');
    try {
      const code = await generateReferralCode();
      console.log('getReferralUrl - Got code:', code);
      if (!code) return null;

      // All referral links now point to influencer signup page
      const url = `${window.location.origin}/influencer-signup?ref=${code}`;
      console.log('getReferralUrl - Generated URL:', url);
      return url;
    } catch (error) {
      console.error('getReferralUrl - Error:', error);
      return null;
    }
  };

  const getReferralUrlForLandingPage = async (landingPagePath?: string) => {
    console.log('getReferralUrlForLandingPage - Starting with path:', landingPagePath);
    try {
      const code = await generateReferralCode();
      console.log('getReferralUrlForLandingPage - Got code:', code);
      if (!code) return null;

      // Use provided landing page path or default to influencer signup
      const basePath = landingPagePath || '/influencer-signup';
      const url = `${window.location.origin}${basePath}?ref=${code}`;
      console.log('getReferralUrlForLandingPage - Generated URL:', url);
      return url;
    } catch (error) {
      console.error('getReferralUrlForLandingPage - Error:', error);
      return null;
    }
  };

  const processReferralSignup = async (referralCode: string, newUserId: string) => {
    console.log('processReferralSignup - Starting with code:', referralCode, 'newUserId:', newUserId);
    
    try {
      // Log the referral code being used for lookup
      console.log('processReferralSignup - Looking up referrer with code:', referralCode);
      
      // Find referrer by code with better error handling
      const { data: referrer, error: referrerError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('referral_code', referralCode)
        .maybeSingle(); // Use maybeSingle to avoid errors when no rows found

      // Log detailed referrer lookup result
      console.log('processReferralSignup - Referrer lookup result:', { 
        referrer, 
        referrerError,
        hasReferrer: !!referrer,
        referrerId: referrer?.id 
      });

      if (referrerError || !referrer) {
        console.log('processReferralSignup - Invalid referral code or referrer not found:', referralCode, 'Error:', referrerError);
        // Don't throw error, just log and return - this is not a critical failure
        return;
      }

      console.log('processReferralSignup - Found referrer:', referrer.id);

      // Log the values about to be inserted into referrals table
      const referralData = {
        referrer_id: referrer.id,
        referred_id: newUserId,
        referral_code: referralCode,
        referral_level: 1,
        status: 'completed',
        completed_at: new Date().toISOString()
      };
      console.log('processReferralSignup - About to insert referral record:', referralData);

      // Create referral record
      const { error: referralError } = await supabase
        .from('referrals')
        .insert(referralData);

      // Log detailed referral insertion result
      console.log('processReferralSignup - Referral record insertion result:', { 
        referralError,
        success: !referralError,
        errorCode: referralError?.code,
        errorMessage: referralError?.message,
        errorDetails: referralError?.details
      });
      
      if (referralError) {
        console.error('processReferralSignup - Failed to insert referral record:', referralError);
        throw referralError;
      }

      console.log('processReferralSignup - Referral record created successfully');

      // Add a longer delay to ensure the referral record is committed
      console.log('processReferralSignup - Waiting 2000ms for database commit');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Process rewards for the referral chain using multiple approaches
      console.log('processReferralSignup - Processing referral rewards');
      
      // Approach 1: Try the RPC function
      let rewardProcessed = false;
      try {
        const { error: rewardError } = await supabase.rpc('process_referral_rewards', {
          referred_user_id: newUserId
        });

        console.log('processReferralSignup - RPC reward processing result:', { 
          rewardError,
          success: !rewardError,
          errorMessage: rewardError?.message
        });
        
        if (!rewardError) {
          console.log('processReferralSignup - RPC rewards processed successfully');
          rewardProcessed = true;
        }
      } catch (rewardProcessingError) {
        console.error('processReferralSignup - RPC reward processing exception:', rewardProcessingError);
      }
      
      // Approach 2: Manual reward processing if RPC failed
      if (!rewardProcessed) {
        console.log('processReferralSignup - Attempting manual reward processing');
        try {
          // Get reward amount for level 1
          const { data: rewardSetting } = await supabase
            .from('referral_settings')
            .select('token_reward')
            .eq('referral_level', 1)
            .eq('active', true)
            .single();
          
          if (rewardSetting?.token_reward) {
            // Check if reward already exists
            const { data: existingReward } = await supabase
              .from('referral_rewards')
              .select('id')
              .eq('referrer_id', referrer.id)
              .eq('referred_id', newUserId)
              .eq('referral_level', 1)
              .maybeSingle();
            
            if (!existingReward) {
              // Create reward record
              const { error: rewardInsertError } = await supabase
                .from('referral_rewards')
                .insert({
                  referral_id: (await supabase.from('referrals').select('id').eq('referred_id', newUserId).single()).data?.id,
                  referrer_id: referrer.id,
                  referred_id: newUserId,
                  referral_level: 1,
                  token_amount: rewardSetting.token_reward,
                  status: 'paid',
                  paid_at: new Date().toISOString()
                });
              
              if (!rewardInsertError) {
                // Update wallet balance
                await supabase
                  .from('user_wallets')
                  .update({ 
                    balance: supabase.sql`balance + ${rewardSetting.token_reward}`,
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', referrer.id);
                
                // Create transaction record
                await supabase
                  .from('token_transactions')
                  .insert({
                    user_id: referrer.id,
                    amount: rewardSetting.token_reward,
                    type: 'earned',
                    source: 'referral',
                    description: `Level 1 referral reward for user: ${newUserId}`
                  });
                
                console.log('processReferralSignup - Manual reward processing successful');
                rewardProcessed = true;
              }
            }
          }
        } catch (manualError) {
          console.error('processReferralSignup - Manual reward processing failed:', manualError);
        }
      }
      
      if (!rewardProcessed) {
        console.warn('processReferralSignup - Reward processing failed, but referral was created');
        toast.error('Referral created but reward processing failed');
      }

      console.log('processReferralSignup - Successfully processed referral');
      toast.success('Referral processed successfully!');
      
      // Force refresh of referral data for all influencers
      console.log('processReferralSignup - Triggering data refresh');
      setTimeout(() => {
        fetchReferralData().catch(error => {
          console.error('processReferralSignup - Data refresh failed:', error);
        });
      }, 2000); // Longer delay to ensure database operations complete
      
    } catch (error: any) {
      console.error('processReferralSignup - Caught error:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        stack: error?.stack
      });
      toast.error('Failed to process referral');
    }
  };

  return {
    stats,
    referredUsers,
    referralSettings,
    loading,
    error,
    generateReferralCode,
    getReferralUrl,
    getReferralUrlForLandingPage,
    processReferralSignup,
    refreshData: fetchReferralData,
    forceRefresh: () => {
      console.log('forceRefresh - Triggered');
      return fetchReferralData().catch(error => {
        console.error('forceRefresh - Failed:', error);
        setError('Failed to refresh data');
      });
    }
  };
};