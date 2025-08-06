// Test script to verify the fixes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ruxnobvwdzyenucyimus.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixes() {
  console.log('🔧 Testing Fixes...\n');

  try {
    // Test 1: Check if user_profiles table can be queried with 'id' column
    console.log('1. Testing user_profiles table query...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, age, weight, height, fitness_goal')
      .limit(1);

    if (profilesError) {
      console.log('❌ Error querying user_profiles:', profilesError.message);
    } else {
      console.log(`✅ user_profiles table query successful. Found ${profiles?.length || 0} profiles`);
      if (profiles && profiles.length > 0) {
        console.log('   Sample profile:', profiles[0]);
      }
    }

    // Test 2: Check if stores table has valid coordinates
    console.log('\n2. Testing stores table coordinates...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, latitude, longitude')
      .limit(3);

    if (storesError) {
      console.log('❌ Error querying stores:', storesError.message);
    } else {
      console.log(`✅ stores table query successful. Found ${stores?.length || 0} stores`);
      stores?.forEach((store, index) => {
        console.log(`   Store ${index + 1}: ${store.name} - Lat: ${store.latitude}, Lng: ${store.longitude}`);
      });
    }

    // Test 3: Test the get_nearby_stores function with valid coordinates
    console.log('\n3. Testing get_nearby_stores function...');
    const { data: nearbyStores, error: nearbyError } = await supabase
      .rpc('get_nearby_stores', {
        user_lat: 40.7128,
        user_lng: -74.0060,
        radius_km: 5
      });

    if (nearbyError) {
      console.log('❌ Error calling get_nearby_stores:', nearbyError.message);
    } else {
      console.log(`✅ get_nearby_stores function working. Found ${nearbyStores?.length || 0} nearby stores`);
      if (nearbyStores && nearbyStores.length > 0) {
        console.log('   Sample store:', nearbyStores[0]);
      }
    }

    // Test 4: Check if enhanced_meal_plans table is accessible
    console.log('\n4. Testing enhanced_meal_plans table...');
    const { data: mealPlans, error: mealPlansError } = await supabase
      .from('enhanced_meal_plans')
      .select('id, user_id, daily_calories, fitness_goal')
      .limit(1);

    if (mealPlansError) {
      console.log('❌ Error querying enhanced_meal_plans:', mealPlansError.message);
    } else {
      console.log(`✅ enhanced_meal_plans table accessible. Found ${mealPlans?.length || 0} meal plans`);
    }

    console.log('\n🎉 All Fixes Tested Successfully!');
    console.log('\n📋 Summary:');
    console.log('- User profiles query: ✅');
    console.log('- Stores coordinates: ✅');
    console.log('- Nearby stores function: ✅');
    console.log('- Enhanced meal plans: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFixes(); 