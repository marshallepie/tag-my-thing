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
    console.log('🔍 REFERRAL DEBUG - processReferralSignup STARTED');
    console.log('🔍 Input params:', { referralCode, newUserId });
    console.log('🔍 Current user context:', { 
      authUserId: user?.id, 
      profileEmail: profile?.email,
      isAuthenticated 
    });
    
    try {
      // Add initial delay to ensure database session is fully established
      console.log('🔍 STEP 0: Waiting 1 second for database session to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ STEP 0 COMPLETE - Database session stabilized');

      // Log the referral code being used for lookup
      console.log('🔍 STEP 1: Looking up referrer with code:', referralCode);
      
      // Find referrer by code with better error handling
      const { data: referrer, error: referrerError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('referral_code', referralCode)
        .maybeSingle(); // Use maybeSingle to avoid errors when no rows found

      // Log detailed referrer lookup result
      console.log('🔍 STEP 1 RESULT - Referrer lookup:', { 
        referrer, 
        referrerError,
        hasReferrer: !!referrer,
        referrerId: referrer?.id,
        errorCode: referrerError?.code,
        errorMessage: referrerError?.message
      });

      if (referrerError || !referrer) {
        console.log('❌ REFERRAL DEBUG - Invalid referral code or referrer not found');
        console.log('❌ Code:', referralCode, 'Error:', referrerError);
        // Don't throw error, just log and return - this is not a critical failure
        return;
      }

      console.log('✅ STEP 1 SUCCESS - Found referrer:', referrer.id);

      // Add a longer delay to ensure the new user's profile is fully committed
      console.log('🔍 STEP 1.5: Waiting 3000ms for user profile to be fully committed...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ STEP 1.5 COMPLETE - Extended wait finished');

      // Verify the new user exists before creating referral record
      console.log('🔍 STEP 1.6: Verifying new user exists in database');
      const { data: newUserProfile, error: newUserError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('id', newUserId)
        .maybeSingle();

      console.log('🔍 STEP 1.6 RESULT - New user verification:', {
        newUserProfile,
        newUserError,
        hasNewUser: !!newUserProfile,
        errorCode: newUserError?.code,
        errorMessage: newUserError?.message
      });

      if (newUserError || !newUserProfile) {
        console.log('❌ REFERRAL DEBUG - New user not found in database yet');
        console.log('❌ This might be a timing issue - user profile not yet committed');
        
        // Try one more time with a longer delay
        console.log('🔍 STEP 1.7: Retrying after additional 5000ms delay...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const { data: retryUserProfile, error: retryUserError } = await supabase
          .from('user_profiles')
          .select('id, email')
          .eq('id', newUserId)
          .maybeSingle();

        console.log('🔍 STEP 1.7 RESULT - Retry user verification:', {
          retryUserProfile,
          retryUserError,
          hasRetryUser: !!retryUserProfile
        });

        if (retryUserError || !retryUserProfile) {
          console.log('❌ REFERRAL DEBUG - New user still not found after retry, aborting');
          return;
        }
        
        console.log('✅ STEP 1.7 SUCCESS - Found new user on retry');
      } else {
        console.log('✅ STEP 1.6 SUCCESS - New user found immediately');
      }

      // Log the values about to be inserted into referrals table
      const referralData = {
        referrer_id: referrer.id,
        referred_id: newUserId,
        referral_code: referralCode,
        referral_level: 1,
        status: 'completed',
        completed_at: new Date().toISOString()
      };
      console.log('🔍 STEP 2: About to insert referral record:', referralData);
      console.log('🔍 STEP 2: Current auth context before insert:', {
        authUid: (await supabase.auth.getUser()).data.user?.id,
        sessionValid: !!(await supabase.auth.getSession()).data.session,
        timestamp: new Date().toISOString()
      });

      // Create referral record
      const { error: referralError } = await supabase
        .from('referrals')
        .insert(referralData);

      // Log detailed referral insertion result
      console.log('🔍 STEP 2 RESULT - Referral record insertion:', { 
        referralError,
        success: !referralError,
        errorCode: referralError?.code,
        errorMessage: referralError?.message,
        errorDetails: referralError?.details
      });
      
      if (referralError) {
        console.error('❌ STEP 2 FAILED - Failed to insert referral record:', referralError);
        console.error('❌ Full error details:', JSON.stringify(referralError, null, 2));
        
        // Check if it's a duplicate key error (user already referred)
        if (referralError.code === '23505' && referralError.message?.includes('referrals_referred_id_key')) {
          console.log('⚠️ STEP 2 DUPLICATE - User already has a referral record, checking existing record');
          
          // Check if existing referral record exists and is completed
          const { data: existingReferral, error: existingError } = await supabase
            .from('referrals')
            .select('*')
            .eq('referred_id', newUserId)
            .single();
          
          console.log('🔍 STEP 2.1 - Existing referral check:', {
            existingReferral,
            existingError,
            isCompleted: existingReferral?.status === 'completed'
          });
          
          if (existingReferral && existingReferral.status === 'completed') {
            console.log('✅ STEP 2.1 SUCCESS - Referral already exists and is completed, proceeding to rewards');
          } else {
            console.log('❌ STEP 2.1 FAILED - Existing referral found but not completed');
            return;
          }
        } else {
          console.error('❌ STEP 2 FATAL - Non-duplicate error in referral insertion');
          throw referralError;
        }
      } else {
        console.log('✅ STEP 2 SUCCESS - Referral record created successfully');
      }

      // Immediate verification that the referral record was created
      console.log('🔍 STEP 2.5: Verifying referral record was actually inserted');
      const { data: verifyReferral, error: verifyError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', newUserId)
        .maybeSingle();
      
      console.log('🔍 STEP 2.5 RESULT - Referral verification:', {
        verifyReferral,
        verifyError,
        recordExists: !!verifyReferral,
        recordStatus: verifyReferral?.status,
        recordId: verifyReferral?.id
      });
      
      if (!verifyReferral) {
        console.error('❌ STEP 2.5 FAILED - Referral record not found after insertion');
        console.error('❌ This indicates a serious database consistency issue');
        return;
      }
      
      console.log('✅ STEP 2.5 SUCCESS - Referral record verified in database');

      // Add a longer delay to ensure the referral record is committed
      console.log('🔍 STEP 3: Waiting 2000ms for database commit...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ STEP 3 COMPLETE - Database commit wait finished');

      // Process rewards for the referral chain using multiple approaches
      console.log('🔍 STEP 4: Processing referral rewards via RPC function');
      
      // Approach 1: Try the RPC function
      let rewardProcessed = false;
      try {
        console.log('🔍 STEP 4A: Calling process_referral_rewards RPC with userId:', newUserId);
        console.log('🔍 STEP 4A: Current session before RPC call:', {
          sessionExists: !!(await supabase.auth.getSession()).data.session,
          userIdFromSession: (await supabase.auth.getUser()).data.user?.id
        });
        
        const { data: rpcData, error: rewardError } = await supabase.rpc('process_referral_rewards_v2', {
          referred_user_id: newUserId
        });

        console.log('🔍 STEP 4A RESULT - RPC reward processing:', { 
          rpcData,
          rewardError,
          success: !rewardError,
          errorMessage: rewardError?.message,
          errorCode: rewardError?.code
        });
        
        if (!rewardError) {
          console.log('✅ STEP 4A SUCCESS - RPC rewards processed successfully');
          console.log('✅ RPC Response Data:', rpcData);
          rewardProcessed = true;
        } else {
          console.error('❌ STEP 4A FAILED - RPC error:', rewardError);
        }
      } catch (rewardProcessingError) {
        console.error('❌ STEP 4A EXCEPTION - RPC reward processing exception:', rewardProcessingError);
      }
      
      // Approach 2: Manual reward processing if RPC failed
      if (!rewardProcessed) {
        console.log('🔍 STEP 4B: Attempting manual reward processing (RPC failed)');
        try {
          // Get reward amount for level 1
          console.log('🔍 STEP 4B-1: Getting reward setting for level 1');
          const { data: rewardSetting } = await supabase
            .from('referral_settings')
            .select('token_reward')
            .eq('referral_level', 1)
            .eq('active', true)
            .single();
          
          console.log('🔍 STEP 4B-1 RESULT:', { rewardSetting });
          
          if (rewardSetting?.token_reward) {
            // Check if reward already exists
            console.log('🔍 STEP 4B-2: Checking for existing reward');
            const { data: existingReward } = await supabase
              .from('referral_rewards')
              .select('id')
              .eq('referrer_id', referrer.id)
              .eq('referred_id', newUserId)
              .eq('referral_level', 1)
              .maybeSingle();
            
            console.log('🔍 STEP 4B-2 RESULT:', { existingReward });
            
            if (!existingReward) {
              // Use the verified referral record from step 2.5
              console.log('🔍 STEP 4B-2.5: Using verified referral record:', verifyReferral.id);
              
              console.log('🔍 STEP 4B-3: Creating manual reward record');
              // Create reward record
              const { error: rewardInsertError } = await supabase
                .from('referral_rewards')
                .insert({
                  referral_id: verifyReferral.id,
                  referrer_id: referrer.id,
                  referred_id: newUserId,
                  referral_level: 1,
                  token_amount: rewardSetting.token_reward,
                  status: 'paid',
                  paid_at: new Date().toISOString()
                });
              
              console.log('🔍 STEP 4B-3 RESULT:', { rewardInsertError });
              
              if (!rewardInsertError) {
                console.log('🔍 STEP 4B-4: Updating wallet balance');
                // Get current wallet balance first
                const { data: currentWallet, error: walletFetchError } = await supabase
                  .from('user_wallets')
                  .select('balance')
                  .eq('user_id', referrer.id)
                  .single();
                
                console.log('🔍 STEP 4B-4 WALLET FETCH:', { currentWallet, walletFetchError });
                
                if (currentWallet && !walletFetchError) {
                  const newBalance = currentWallet.balance + rewardSetting.token_reward;
                  console.log('🔍 STEP 4B-4: Updating wallet from', currentWallet.balance, 'to', newBalance);
                  
                  const { error: walletUpdateError } = await supabase
                    .from('user_wallets')
                    .update({ 
                      balance: newBalance,
                      updated_at: new Date().toISOString()
                    })
                    .eq('user_id', referrer.id);
                  
                  console.log('🔍 STEP 4B-4 RESULT:', { walletUpdateError });
                } else {
                  console.error('❌ STEP 4B-4 FAILED - Could not fetch current wallet balance');
                }
                
                // Create transaction record
                console.log('🔍 STEP 4B-5: Creating transaction record');
                const { error: transactionError } = await supabase
                  .from('token_transactions')
                  .insert({
                    user_id: referrer.id,
                    amount: rewardSetting.token_reward,
                    type: 'earned',
                    source: 'referral',
                    description: `Level 1 referral reward for user: ${newUserId}`
                  });
                
                console.log('🔍 STEP 4B-5 RESULT:', { transactionError });
                
                if (!transactionError) {
                  console.log('✅ STEP 4B SUCCESS - Manual reward processing successful');
                } else {
                  console.error('❌ STEP 4B PARTIAL - Some manual operations failed');
                }
                rewardProcessed = true;
              } else {
                console.error('❌ STEP 4B-3 FAILED - Reward insert error:', rewardInsertError);
              }
            } else {
              console.log('⚠️ STEP 4B-2 SKIP - Reward already exists');
              rewardProcessed = true; // Mark as processed since reward exists
            }
          } else {
            console.error('❌ STEP 4B-1 FAILED - No reward setting found for level 1');
          }
        } catch (manualError) {
          console.error('❌ STEP 4B EXCEPTION - Manual reward processing failed:', manualError);
        }
      }
      
      if (!rewardProcessed) {
        console.warn('⚠️ REFERRAL DEBUG - Reward processing failed, but referral was created');
        toast.success('Referral created! Rewards are being processed...');
      } else {
        console.log('✅ REFERRAL DEBUG - Reward processing completed successfully');
        toast.success('Referral processed successfully with rewards!');
      }

      console.log('✅ REFERRAL DEBUG - processReferralSignup COMPLETED');
      
      // Force refresh of referral data for all influencers
      console.log('🔍 FINAL STEP: Triggering data refresh in 2 seconds...');
      setTimeout(() => {
        if (user?.id && profile) {
          fetchReferralData(user.id, profile).catch(error => {
            console.error('❌ Data refresh failed:', error);
          });
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ REFERRAL DEBUG - FATAL ERROR in processReferralSignup:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        stack: error?.stack
      });
      
      // More specific error messages
      if (error?.code === '23505') {
        console.log('⚠️ REFERRAL DEBUG - Duplicate key error, user may already be referred');
        toast.info('User already has a referral record');
      } else if (error?.message?.includes('timeout')) {
        console.log('⚠️ REFERRAL DEBUG - Database timeout error');
        toast.error('Database timeout - referral may still be processing');
      } else {
        toast.error('Failed to process referral - please contact support');
      }
      
      console.error('❌ REFERRAL DEBUG - processReferralSignup FAILED');
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