// Manual Referral Testing Utilities
import { supabase } from '../lib/supabase';

export interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: any;
}

export class ReferralTester {
  async runAllTests(referralCode: string = 'marshallepie', testEmail: string = 'test@example.com'): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    console.log('🧪 REFERRAL TESTING - Starting comprehensive test suite');
    console.log('🧪 Test parameters:', { referralCode, testEmail });

    // Test 1: Verify referral code exists
    try {
      const { data: referrer, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role')
        .eq('referral_code', referralCode)
        .maybeSingle();

      if (error) {
        results.push({
          test: 'referral_code_lookup',
          passed: false,
          message: `Database error: ${error.message}`,
          data: error
        });
      } else if (!referrer) {
        results.push({
          test: 'referral_code_lookup',
          passed: false,
          message: `Referral code '${referralCode}' not found`,
        });
      } else {
        results.push({
          test: 'referral_code_lookup',
          passed: true,
          message: `Found referrer: ${referrer.email}`,
          data: referrer
        });
      }
    } catch (error) {
      results.push({
        test: 'referral_code_lookup',
        passed: false,
        message: `Exception: ${error}`,
        data: error
      });
    }

    // Test 2: Check referral settings
    try {
      const { data: settings, error } = await supabase
        .from('referral_settings')
        .select('*')
        .eq('active', true)
        .order('referral_level');

      if (error) {
        results.push({
          test: 'referral_settings',
          passed: false,
          message: `Settings error: ${error.message}`,
          data: error
        });
      } else if (!settings || settings.length === 0) {
        results.push({
          test: 'referral_settings',
          passed: false,
          message: 'No active referral settings found'
        });
      } else {
        const totalReward = settings.reduce((sum, s) => sum + s.token_reward, 0);
        results.push({
          test: 'referral_settings',
          passed: true,
          message: `Found ${settings.length} levels, total possible reward: ${totalReward} TMT`,
          data: settings
        });
      }
    } catch (error) {
      results.push({
        test: 'referral_settings',
        passed: false,
        message: `Exception: ${error}`,
        data: error
      });
    }

    // Test 3: Check if test user exists
    try {
      const { data: testUser, error } = await supabase
        .from('user_profiles')
        .select('id, email, created_at')
        .eq('email', testEmail)
        .maybeSingle();

      if (error) {
        results.push({
          test: 'test_user_exists',
          passed: false,
          message: `Error checking test user: ${error.message}`,
          data: error
        });
      } else if (!testUser) {
        results.push({
          test: 'test_user_exists',
          passed: false,
          message: `Test user ${testEmail} does not exist. Create this user first.`
        });
      } else {
        results.push({
          test: 'test_user_exists',
          passed: true,
          message: `Test user exists: ${testUser.email}`,
          data: testUser
        });
      }
    } catch (error) {
      results.push({
        test: 'test_user_exists',
        passed: false,
        message: `Exception: ${error}`,
        data: error
      });
    }

    // Test 4: Test RPC function directly (if test user exists)
    const testUserResult = results.find(r => r.test === 'test_user_exists');
    if (testUserResult?.passed && testUserResult.data?.id) {
      try {
        console.log('🧪 Testing RPC function directly...');
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('process_referral_rewards_v2', {
            referred_user_id: testUserResult.data.id
          });

        if (rpcError) {
          results.push({
            test: 'rpc_function_test',
            passed: false,
            message: `RPC function failed: ${rpcError.message}`,
            data: rpcError
          });
        } else {
          results.push({
            test: 'rpc_function_test',
            passed: true,
            message: 'RPC function executed successfully',
            data: rpcResult
          });
        }
      } catch (error) {
        results.push({
          test: 'rpc_function_test',
          passed: false,
          message: `RPC exception: ${error}`,
          data: error
        });
      }
    }

    // Test 5: Check database trigger
    try {
      const { data: triggers, error } = await supabase
        .from('information_schema.triggers')
        .select('*')
        .eq('trigger_name', 'referral_completion_trigger');

      if (error) {
        results.push({
          test: 'trigger_exists',
          passed: false,
          message: `Error checking trigger: ${error.message}`,
          data: error
        });
      } else if (!triggers || triggers.length === 0) {
        results.push({
          test: 'trigger_exists',
          passed: false,
          message: 'referral_completion_trigger not found'
        });
      } else {
        results.push({
          test: 'trigger_exists',
          passed: true,
          message: 'Referral completion trigger exists',
          data: triggers
        });
      }
    } catch (error) {
      results.push({
        test: 'trigger_exists',
        passed: false,
        message: `Exception checking trigger: ${error}`,
        data: error
      });
    }

    // Print summary
    this.printTestSummary(results);
    
    return results;
  }

  private printTestSummary(results: TestResult[]): void {
    console.log('\n🧪 REFERRAL TEST SUMMARY:');
    console.log('=========================');
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${results.length}`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      results
        .filter(r => !r.passed)
        .forEach(r => console.log(`   ${r.test}: ${r.message}`));
    }
    
    console.log('\n=========================\n');
  }
}

// Export convenience function
export const runReferralTests = async (referralCode?: string, testEmail?: string) => {
  const tester = new ReferralTester();
  return await tester.runAllTests(referralCode, testEmail);
};

// Make available globally for browser console
(window as any).runReferralTests = runReferralTests;