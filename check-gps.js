import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('Using URL:', supabaseUrl);
console.log('Using Key:', supabaseKey ? 'Key present' : 'Key missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGPSFeatures() {
  console.log('Checking GPS features...');
  
  // Check if GPS columns exist in user_profiles
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('location_tracking_enabled, current_latitude, current_longitude')
      .limit(1);
      
    if (profileError) {
      console.log('GPS columns do not exist in user_profiles:', profileError.message);
    } else {
      console.log('GPS columns already exist in user_profiles!');
    }
  } catch (error) {
    console.error('Error checking user_profiles GPS columns:', error);
  }
  
  // Check if GPS columns exist in assets
  try {
    const { data: assetData, error: assetError } = await supabase
      .from('assets')
      .select('latitude, longitude')
      .limit(1);
      
    if (assetError) {
      console.log('GPS columns do not exist in assets:', assetError.message);
    } else {
      console.log('GPS columns already exist in assets!');
    }
  } catch (error) {
    console.error('Error checking assets GPS columns:', error);
  }
}

checkGPSFeatures();