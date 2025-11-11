import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { fetchWalletData } from './useTokens';
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
          referrals = [];
        } else {
          referrals = data || [];
        }
      } else {
        console.error('Referrals promise rejected:', referralsResult.reason);
        referrals = [];
      }

      let rewards: any[] = [];
      if (rewardsResult.status === 'fulfilled') {
        const { data, error } = rewardsResult.value;
        if (error) {
          console.error('Rewards error:', error);
          rewards = [];
        } else {
          rewards = data || [];
        }
      } else {
        console.error('Rewards promise rejected:', rewardsResult.reason);
        rewards = [];
      }

      console.log('useReferrals - Data fetched successfully:', {
        referrals: referrals.length,
        rewards: rewards.length
      });

      // Create the users array first - handle missing profile data gracefully
      const users: ReferralUser[] = referrals
        .map(r => {
          const referredProfile = r.referred || {};
          const referredId = referredProfile.id || r.referred_id;
          
          // Find matching reward
          const matchingReward = rewards.find(rw => 
            rw && 
            rw.referred_id === referredId && 
            rw.referral_level === (r.referral_level || 1)
          );
          
          return {
            id: referredId || 'unknown',
            full_name: referredProfile.full_name || 'Unknown User',
            email: referredProfile.email || 'No Email Available',
            created_at: referredProfile.created_at || r.created_at || new Date().toISOString(),
            referral_level: r.referral_level || 1,
            status: r.status || 'pending',
            reward_amount: matchingReward?.token_amount || 0
          };
        })
        .filter(user => user.id !== 'unknown'); // Only filter out completely broken records

      // Now calculate stats based on the actual users we can display
      const totalReferred = users.length;
      const totalEarned = rewards
        .filter(r => r && r.status === 'paid')
        .reduce((sum, r) => sum + (r.token_amount || 0), 0);
      const pendingRewards = rewards
        .filter(r => r && r.status === 'pending')
        .reduce((sum, r) => sum + (r.token_amount || 0), 0);

      // Level breakdown based on users array
      const levelBreakdown = [1, 2, 3, 4, 5].map(referral_level => {
        const levelUsers = users.filter(u => u.referral_level === referral_level);
        const levelRewards = rewards.filter(r => r && r.referral_level === referral_level && r.status === 'paid');
        return {
          referral_level,
          count: levelUsers.length,
          earned: levelRewards.reduce((sum, r) => sum + (r.token_amount || 0), 0)
        };
      });

      setStats({
        totalReferred,
        totalEarned,
        pendingRewards,
        levelBreakdown
      });

      setReferredUsers(users);
      console.log('useReferrals - Stats calculated successfully');
    } catch (error: any) {
      console.error('Error fetching referral data:', error);
      
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
        return;
      }

      if (data && data.length > 0) {
        setReferralSettings(data);
      }
    } catch (error: any) {
      console.error('Error fetching referral settings:', error);
    }
  }, []);

  // Initialize data fetching with better error handling
  useEffect(() => {
    if (user?.id && profile) {
      console.log('useReferrals - useEffect triggered for user:', user.id);
      fetchReferralSettings();
      fetchReferralData(user.id, profile);
    } else {
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
    if (!user || !profile) {
      console.log('generateReferralCode - No user or profile');
      return null;
    }

    console.log('generateReferralCode - Starting for user:', user.id);
    console.log('generateReferralCode - Starting with profile:', profile);

    try {
      if (profile.referral_code) {
        console.log('generateReferralCode - User already has code:', profile.referral_code);
        return profile.referral_code;
      }

      console.log('generateReferralCode - Generating new code for user:', user.id);
      
      const baseName = (profile.full_name || profile.email.split('@')[0] || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 8);
      
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      let newCode = `${baseName}${randomSuffix}`;
      
      const { data: existingCode } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('referral_code', newCode)
        .maybeSingle();
      
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

      try {
        console.log('generateReferralCode - Updating profile with code:', newCode);
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ referral_code: newCode })
          .eq('id', user.id);

        console.log('generateReferralCode - Update result:', { updateError });

        if (updateError) throw updateError;

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

      const url = `${window.location.origin}/general-tagging?ref=${code}`;
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

      const basePath = landingPagePath || '/general-tagging';
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
      console.log('🔍 STEP 0: Waiting 1 second for database session to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ STEP 0 COMPLETE - Database session stabilized');

      console.log('🔍 STEP 1: Looking up referrer with code:', referralCode);
      
      const { data: referrer, error: referrerError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('referral_code', referralCode)
        .maybeSingle();

      console.log('🔍 STEP 1 RESULT - Referrer lookup:', { 
        referrer, 
        referrerError,
        hasReferrer: !!referrer,
        referrerId: referrer?.id,
        errorCode: referrerError?.code,
        errorMessage: referrerError?.message
      });

      let finalReferrer = referrer;
      
      if (referrerError || !referrer) {
        console.log('⚠️ REFERRAL DEBUG - Primary referrer not found, trying fallback');
        console.log('⚠️ Code:', referralCode, 'Error:', referrerError);
        
        console.log('🔍 STEP 1.1: Looking up fallback referrer (Marshall Epie)');
        const { data: fallbackReferrer, error: fallbackError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('email', 'marshallepie@marshallepie.com')
          .maybeSingle();
        
        console.log('🔍 STEP 1.1 RESULT - Fallback referrer lookup:', {
          fallbackReferrer,
          fallbackError,
          hasFallbackReferrer: !!fallbackReferrer
        });
        
        if (fallbackError || !fallbackReferrer) {
          console.log('❌ REFERRAL DEBUG - Both primary and fallback referrer lookup failed');
          console.log('❌ This indicates a serious database configuration issue');
          return;
        }
        
        finalReferrer = fallbackReferrer;
        console.log('✅ STEP 1.1 SUCCESS - Using fallback referrer:', finalReferrer.id);
      } else {
        console.log('✅ STEP 1 SUCCESS - Found primary referrer:', finalReferrer.id);
      }

      console.log('🔍 STEP 1.5: Waiting 3000ms for user profile to be fully committed...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ STEP 1.5 COMPLETE - Extended wait finished');

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

      const referralData = {
        referrer_id: finalReferrer.id,
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

      const { error: referralError } = await supabase
        .from('referrals')
        .insert(referralData);

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
        
        if (referralError.code === '23505' && referralError.message?.includes('referrals_referred_id_key')) {
          console.log('⚠️ STEP 2 DUPLICATE - User already has a referral record, checking existing record');
          
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

      console.log('🔍 STEP 3: Waiting 2000ms for database commit...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ STEP 3 COMPLETE - Database commit wait finished');

      console.log('🔍 STEP 4: Processing referral rewards via RPC function');
      
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
          
          console.log('🔄 STEP 4A-REFRESH: Refreshing wallet data after successful reward processing');
          try {
            const referrerWalletData = await fetchWalletData(finalReferrer.id);
            console.log('✅ STEP 4A-REFRESH SUCCESS: Wallet data refreshed for referrer', {
              referrerId: finalReferrer.id,
              newBalance: referrerWalletData.balance
            });
          } catch (walletRefreshError) {
            console.warn('⚠️ STEP 4A-REFRESH WARNING: Failed to refresh wallet data:', walletRefreshError);
          }
        } else {
          console.error('❌ STEP 4A FAILED - RPC error:', rewardError);
        }
      } catch (rewardProcessingError) {
        console.error('❌ STEP 4A EXCEPTION - RPC reward processing exception:', rewardProcessingError);
      }
      
      if (!rewardProcessed) {
        console.log('🔍 STEP 4B: Attempting manual reward processing (RPC failed)');
        try {
          console.log('🔍 STEP 4B-1: Getting reward setting for level 1');
          const { data: rewardSetting } = await supabase
            .from('referral_settings')
            .select('token_reward')
            .eq('referral_level', 1)
            .eq('active', true)
            .single();
          
          console.log('🔍 STEP 4B-1 RESULT:', { rewardSetting });
          
          if (rewardSetting?.token_reward) {
            console.log('🔍 STEP 4B-2: Checking for existing reward');
            const { data: existingReward } = await supabase
              .from('referral_rewards')
              .select('id')
              .eq('referrer_id', finalReferrer.id)
              .eq('referred_id', newUserId)
              .eq('referral_level', 1)
              .maybeSingle();
            
            console.log('🔍 STEP 4B-2 RESULT:', { existingReward });
            
            if (!existingReward) {
              console.log('🔍 STEP 4B-2.5: Using verified referral record:', verifyReferral.id);
              
              console.log('🔍 STEP 4B-3: Creating manual reward record');
              const { error: rewardInsertError } = await supabase
                .from('referral_rewards')
                .insert({
                  referral_id: verifyReferral.id,
                  referrer_id: finalReferrer.id,
                  referred_id: newUserId,
                  referral_level: 1,
                  token_amount: rewardSetting.token_reward,
                  status: 'paid',
                  paid_at: new Date().toISOString()
                });
              
              console.log('🔍 STEP 4B-3 RESULT:', { rewardInsertError });
              
              if (!rewardInsertError) {
                console.log('🔍 STEP 4B-4: Updating wallet balance');
                const { data: currentWallet, error: walletFetchError } = await supabase
                  .from('user_wallets')
                  .select('balance')
                  .eq('user_id', finalReferrer.id)
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
                    .eq('user_id', finalReferrer.id);
                  
                  console.log('🔍 STEP 4B-4 RESULT:', { walletUpdateError });
                } else {
                  console.error('❌ STEP 4B-4 FAILED - Could not fetch current wallet balance');
                }
                
                console.log('🔍 STEP 4B-5: Creating transaction record');
                const { error: transactionError } = await supabase
                  .from('token_transactions')
                  .insert({
                    user_id: finalReferrer.id,
                    amount: rewardSetting.token_reward,
                    type: 'earned',
                    source: 'referral',
                    description: `Level 1 referral reward for user: ${newUserId}`
                  });
                
                console.log('🔍 STEP 4B-5 RESULT:', { transactionError });
                
                if (!transactionError) {
                  console.log('✅ STEP 4B SUCCESS - Manual reward processing successful');
                  
                  console.log('🔄 STEP 4B-REFRESH: Refreshing wallet data after manual reward processing');
                  try {
                    const referrerWalletData = await fetchWalletData(finalReferrer.id);
                    console.log('✅ STEP 4B-REFRESH SUCCESS: Wallet data refreshed for referrer', {
                      referrerId: finalReferrer.id,
                      newBalance: referrerWalletData.balance
                    });
                  } catch (walletRefreshError) {
                    console.warn('⚠️ STEP 4B-REFRESH WARNING: Failed to refresh wallet data:', walletRefreshError);
                  }
                } else {
                  console.error('❌ STEP 4B PARTIAL - Some manual operations failed');
                }
                rewardProcessed = true;
              } else {
                console.error('❌ STEP 4B-3 FAILED - Reward insert error:', rewardInsertError);
              }
            } else {
              console.log('⚠️ STEP 4B-2 SKIP - Reward already exists');
              rewardProcessed = true;
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
      
      console.log('🔍 FINAL STEP: Triggering data refresh in 2 seconds...');
      setTimeout(() => {
        if (user?.id && profile) {
          fetchReferralData(user.id, profile).catch(error => {
            console.error('❌ Data refresh failed:', error);
          });
          
          if (user.id === finalReferrer.id) {
            fetchWalletData(user.id).catch(error => {
              console.error('❌ Wallet refresh failed:', error);
            });
          }
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
      if (!user?.id || !profile) {
        console.log('forceRefresh - No user or profile available');
        return Promise.resolve();
      }
      console.log('forceRefresh - Triggered with user:', user.id);
      return fetchReferralData(user.id, profile).catch(error => {
        console.error('forceRefresh - Failed:', error);
        setError('Failed to refresh data');
      });
    }
  };
};