// Referral System Debugging Utilities
import { supabase } from '../lib/supabase';

export interface ReferralDebugResult {
  step: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  data?: any;
  timestamp: string;
}

export class ReferralDebugger {
  private results: ReferralDebugResult[] = [];

  private log(step: string, status: 'success' | 'error' | 'warning' | 'info', message: string, data?: any) {
    const result: ReferralDebugResult = {
      step,
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    
    const emoji = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }[status];
    
    console.log(`${emoji} REFERRAL DEBUG [${step}]: ${message}`, data ? data : '');
  }

  async debugReferralFlow(referralCode: string, newUserEmail: string): Promise<ReferralDebugResult[]> {
    this.results = [];
    
    try {
      // Step 1: Check if referral code exists
      this.log('LOOKUP_REFERRER', 'info', `Looking up referrer with code: ${referralCode}`);
      
      const { data: referrer, error: referrerError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role')
        .eq('referral_code', referralCode)
        .maybeSingle();

      if (referrerError) {
        this.log('LOOKUP_REFERRER', 'error', 'Database error looking up referrer', referrerError);
        return this.results;
      }

      if (!referrer) {
        this.log('LOOKUP_REFERRER', 'error', `No referrer found with code: ${referralCode}`);
        return this.results;
      }

      this.log('LOOKUP_REFERRER', 'success', `Found referrer: ${referrer.email}`, referrer);

      // Step 2: Check if new user exists
      this.log('LOOKUP_NEW_USER', 'info', `Looking up new user: ${newUserEmail}`);
      
      const { data: newUser, error: newUserError } = await supabase
        .from('user_profiles')
        .select('id, email, created_at')
        .eq('email', newUserEmail)
        .maybeSingle();

      if (newUserError) {
        this.log('LOOKUP_NEW_USER', 'error', 'Database error looking up new user', newUserError);
        return this.results;
      }

      if (!newUser) {
        this.log('LOOKUP_NEW_USER', 'error', `New user not found: ${newUserEmail}`);
        return this.results;
      }

      this.log('LOOKUP_NEW_USER', 'success', `Found new user: ${newUser.email}`, newUser);

      // Step 3: Check if referral record exists
      this.log('CHECK_REFERRAL_RECORD', 'info', 'Checking for existing referral record');
      
      const { data: existingReferral, error: referralCheckError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', newUser.id)
        .maybeSingle();

      if (referralCheckError) {
        this.log('CHECK_REFERRAL_RECORD', 'error', 'Error checking referral record', referralCheckError);
      } else if (existingReferral) {
        this.log('CHECK_REFERRAL_RECORD', 'success', 'Referral record exists', existingReferral);
      } else {
        this.log('CHECK_REFERRAL_RECORD', 'warning', 'No referral record found - this might be the issue');
      }

      // Step 4: Check referral settings
      this.log('CHECK_SETTINGS', 'info', 'Checking referral settings configuration');
      
      const { data: settings, error: settingsError } = await supabase
        .from('referral_settings')
        .select('*')
        .eq('active', true)
        .order('referral_level');

      if (settingsError) {
        this.log('CHECK_SETTINGS', 'error', 'Error fetching referral settings', settingsError);
      } else if (!settings || settings.length === 0) {
        this.log('CHECK_SETTINGS', 'error', 'No active referral settings found');
      } else {
        this.log('CHECK_SETTINGS', 'success', `Found ${settings.length} active referral levels`, settings);
      }

      // Step 5: Check for existing rewards
      this.log('CHECK_REWARDS', 'info', 'Checking for existing referral rewards');
      
      const { data: existingRewards, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('referred_id', newUser.id);

      if (rewardsError) {
        this.log('CHECK_REWARDS', 'error', 'Error checking referral rewards', rewardsError);
      } else if (existingRewards && existingRewards.length > 0) {
        this.log('CHECK_REWARDS', 'success', `Found ${existingRewards.length} existing rewards`, existingRewards);
      } else {
        this.log('CHECK_REWARDS', 'warning', 'No referral rewards found - rewards may not have been processed');
      }

      // Step 6: Check wallet balances
      this.log('CHECK_WALLETS', 'info', 'Checking wallet balances');
      
      const { data: referrerWallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', referrer.id)
        .single();

      if (walletError) {
        this.log('CHECK_WALLETS', 'error', 'Error checking referrer wallet', walletError);
      } else {
        this.log('CHECK_WALLETS', 'success', `Referrer wallet balance: ${referrerWallet.balance} TMT`, referrerWallet);
      }

      // Step 7: Check transaction history
      this.log('CHECK_TRANSACTIONS', 'info', 'Checking transaction history');
      
      const { data: transactions, error: transactionError } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', referrer.id)
        .eq('source', 'referral')
        .order('created_at', { ascending: false })
        .limit(5);

      if (transactionError) {
        this.log('CHECK_TRANSACTIONS', 'error', 'Error checking transactions', transactionError);
      } else if (transactions && transactions.length > 0) {
        this.log('CHECK_TRANSACTIONS', 'success', `Found ${transactions.length} referral transactions`, transactions);
      } else {
        this.log('CHECK_TRANSACTIONS', 'warning', 'No referral transactions found');
      }

    } catch (error) {
      this.log('FATAL_ERROR', 'error', 'Unexpected error during debug', error);
    }

    return this.results;
  }

  async testReferralFunction(newUserEmail: string): Promise<ReferralDebugResult[]> {
    this.results = [];
    
    try {
      this.log('TEST_RPC', 'info', `Testing RPC function with user: ${newUserEmail}`);
      
      // Get user ID
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', newUserEmail)
        .single();

      if (userError || !user) {
        this.log('TEST_RPC', 'error', 'User not found for testing', userError);
        return this.results;
      }

      // Test the RPC function directly
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('process_referral_rewards_v2', {
          referred_user_id: user.id
        });

      if (rpcError) {
        this.log('TEST_RPC', 'error', 'RPC function failed', rpcError);
      } else {
        this.log('TEST_RPC', 'success', 'RPC function executed successfully', rpcResult);
      }

    } catch (error) {
      this.log('TEST_RPC', 'error', 'Exception testing RPC function', error);
    }

    return this.results;
  }

  getResults(): ReferralDebugResult[] {
    return this.results;
  }

  printSummary(): void {
    console.log('\n🔍 REFERRAL DEBUG SUMMARY:');
    console.log('========================');
    
    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    
    console.log(`✅ Successful steps: ${successCount}`);
    console.log(`❌ Failed steps: ${errorCount}`);
    console.log(`⚠️ Warnings: ${warningCount}`);
    console.log(`📊 Total steps: ${this.results.length}`);
    
    if (errorCount > 0) {
      console.log('\n❌ ERRORS FOUND:');
      this.results
        .filter(r => r.status === 'error')
        .forEach(r => console.log(`   ${r.step}: ${r.message}`));
    }
    
    if (warningCount > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.results
        .filter(r => r.status === 'warning')
        .forEach(r => console.log(`   ${r.step}: ${r.message}`));
    }
    
    console.log('\n========================\n');
  }
}

// Export convenience functions
export const debugReferralFlow = async (referralCode: string, newUserEmail: string) => {
  const debugger = new ReferralDebugger();
  const results = await debugger.debugReferralFlow(referralCode, newUserEmail);
  debugger.printSummary();
  return results;
};

export const testReferralFunction = async (newUserEmail: string) => {
  const debugger = new ReferralDebugger();
  const results = await debugger.testReferralFunction(newUserEmail);
  debugger.printSummary();
  return results;
};

// Global debug functions for browser console
(window as any).debugReferralFlow = debugReferralFlow;
(window as any).testReferralFunction = testReferralFunction;