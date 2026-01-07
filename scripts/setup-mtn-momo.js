#!/usr/bin/env node

/**
 * MTN MOMO API Setup Script
 *
 * This script helps you create the API User and API Key needed for MTN MOMO integration.
 *
 * Prerequisites:
 * 1. Subscribe to MTN MOMO Collection API at https://momodeveloper.mtn.com/
 * 2. Copy your Primary Key (or Secondary Key) from the portal
 *
 * Usage:
 *   node scripts/setup-mtn-momo.js <PRIMARY_KEY> [environment]
 *
 * Example:
 *   node scripts/setup-mtn-momo.js abc123def456 sandbox
 */

import https from 'https';
import { randomUUID } from 'crypto';

// Command line arguments
const args = process.argv.slice(2);
const SUBSCRIPTION_KEY = args[0];
const ENVIRONMENT = args[1] || 'sandbox'; // sandbox or production

// Configuration
const BASE_URL = ENVIRONMENT === 'sandbox'
  ? 'sandbox.momodeveloper.mtn.com'
  : 'momodeveloper.mtn.com';

// Generate a UUID for the API User
const API_USER_ID = randomUUID();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateInput() {
  if (!SUBSCRIPTION_KEY) {
    log('\n❌ Error: Missing Subscription Key', 'red');
    log('\nUsage:', 'yellow');
    log('  node scripts/setup-mtn-momo.js <PRIMARY_KEY> [environment]', 'cyan');
    log('\nExample:', 'yellow');
    log('  node scripts/setup-mtn-momo.js abc123def456 sandbox', 'cyan');
    log('\nGet your Primary Key from: https://momodeveloper.mtn.com/', 'blue');
    process.exit(1);
  }
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            statusCode: res.statusCode,
            data: data ? JSON.parse(data) : null,
          });
        } else {
          reject({
            statusCode: res.statusCode,
            error: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

async function createAPIUser() {
  log('\n📝 Step 1: Creating API User...', 'cyan');

  const options = {
    hostname: BASE_URL,
    path: '/v1_0/apiuser',
    method: 'POST',
    headers: {
      'X-Reference-Id': API_USER_ID,
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
      'Content-Type': 'application/json',
    },
  };

  const postData = {
    providerCallbackHost: 'example.com', // Valid domain required by MTN MOMO
  };

  try {
    await makeRequest(options, postData);
    log(`✅ API User created successfully!`, 'green');
    log(`   API User ID: ${API_USER_ID}`, 'bright');
    return API_USER_ID;
  } catch (error) {
    if (error.statusCode === 409) {
      log(`⚠️  API User already exists (this is OK)`, 'yellow');
      return API_USER_ID;
    }
    log(`❌ Failed to create API User: ${error.error}`, 'red');
    throw error;
  }
}

async function createAPIKey(apiUserId) {
  log('\n🔑 Step 2: Creating API Key...', 'cyan');

  const options = {
    hostname: BASE_URL,
    path: `/v1_0/apiuser/${apiUserId}/apikey`,
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
    },
  };

  try {
    const response = await makeRequest(options);
    const apiKey = response.data.apiKey;
    log(`✅ API Key created successfully!`, 'green');
    log(`   API Key: ${apiKey}`, 'bright');
    return apiKey;
  } catch (error) {
    log(`❌ Failed to create API Key: ${error.error}`, 'red');
    throw error;
  }
}

async function verifyAPIUser(apiUserId) {
  log('\n🔍 Step 3: Verifying API User...', 'cyan');

  const options = {
    hostname: BASE_URL,
    path: `/v1_0/apiuser/${apiUserId}`,
    method: 'GET',
    headers: {
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
    },
  };

  try {
    const response = await makeRequest(options);
    log(`✅ API User verified successfully!`, 'green');
    log(`   Provider Callback Host: ${response.data.providerCallbackHost}`, 'bright');
    log(`   Target Environment: ${response.data.targetEnvironment || 'sandbox'}`, 'bright');
    return response.data;
  } catch (error) {
    log(`❌ Failed to verify API User: ${error.error}`, 'red');
    throw error;
  }
}

function displayResults(apiUserId, apiKey) {
  log('\n' + '='.repeat(80), 'green');
  log('🎉 SUCCESS! Your MTN MOMO API credentials are ready!', 'green');
  log('='.repeat(80), 'green');

  log('\n📋 Add these to your .env file:', 'yellow');
  log('\n' + '-'.repeat(80), 'cyan');
  log(`MTN_MOMO_SUBSCRIPTION_KEY=${SUBSCRIPTION_KEY}`);
  log(`MTN_MOMO_API_USER=${apiUserId}`);
  log(`MTN_MOMO_API_KEY=${apiKey}`);
  log(`MTN_MOMO_ENVIRONMENT=${ENVIRONMENT}`);
  log(`MTN_MOMO_BASE_URL=https://${BASE_URL}`);
  log('-'.repeat(80) + '\n', 'cyan');

  log('🔧 Set Supabase Edge Function secrets:', 'yellow');
  log('\n' + '-'.repeat(80), 'cyan');
  log(`supabase secrets set MTN_MOMO_SUBSCRIPTION_KEY=${SUBSCRIPTION_KEY}`);
  log(`supabase secrets set MTN_MOMO_API_USER=${apiUserId}`);
  log(`supabase secrets set MTN_MOMO_API_KEY=${apiKey}`);
  log(`supabase secrets set MTN_MOMO_ENVIRONMENT=${ENVIRONMENT}`);
  log(`supabase secrets set MTN_MOMO_BASE_URL=https://${BASE_URL}`);
  log('-'.repeat(80) + '\n', 'cyan');

  log('📝 Next Steps:', 'yellow');
  log('  1. Copy the environment variables above to your .env file');
  log('  2. Run the Supabase secrets commands to configure your Edge Functions');
  log('  3. Deploy your Edge Functions: supabase functions deploy');
  log('  4. Test the integration with sandbox phone numbers\n');

  log('📚 Documentation:', 'blue');
  log('  See MTN_MOMO_INTEGRATION.md for detailed integration guide\n');
}

async function main() {
  try {
    log('\n' + '='.repeat(80), 'bright');
    log('🚀 MTN MOMO API Setup Script', 'bright');
    log('='.repeat(80) + '\n', 'bright');

    validateInput();

    log(`Environment: ${ENVIRONMENT}`, 'cyan');
    log(`Base URL: ${BASE_URL}`, 'cyan');
    log(`Subscription Key: ${SUBSCRIPTION_KEY.substring(0, 8)}...`, 'cyan');

    const apiUserId = await createAPIUser();
    const apiKey = await createAPIKey(apiUserId);
    await verifyAPIUser(apiUserId);

    displayResults(apiUserId, apiKey);

  } catch (error) {
    log('\n❌ Setup failed!', 'red');
    if (error.message) {
      log(`Error: ${error.message}`, 'red');
    }
    log('\nTroubleshooting:', 'yellow');
    log('  1. Verify your Subscription Key is correct');
    log('  2. Check you have an active Collection API subscription');
    log('  3. Ensure your internet connection is stable');
    log('  4. Visit https://momodeveloper.mtn.com/ for help\n');
    process.exit(1);
  }
}

// Run the script
main();
