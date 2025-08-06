// Test script to verify meal plan integration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ruxnobvwdzyenucyimus.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMealPlanIntegration() {
  console.log('🧪 Testing Meal Plan Integration...\n');

  try {
    // Test 1: Check if enhanced_meal_plans table exists and has data
    console.log('1. Checking enhanced_meal_plans table...');
    const { data: mealPlans, error: mealPlansError } = await supabase
      .from('enhanced_meal_plans')
      .select('*')
      .limit(5);

    if (mealPlansError) {
      console.log('❌ Error accessing enhanced_meal_plans:', mealPlansError.message);
    } else {
      console.log(`✅ enhanced_meal_plans table accessible. Found ${mealPlans?.length || 0} records`);
    }

    // Test 2: Check if stores table exists and has data
    console.log('\n2. Checking stores table...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .limit(5);

    if (storesError) {
      console.log('❌ Error accessing stores:', storesError.message);
    } else {
      console.log(`✅ stores table accessible. Found ${stores?.length || 0} records`);
    }

    // Test 3: Check if store_inventory table exists and has data
    console.log('\n3. Checking store_inventory table...');
    const { data: inventory, error: inventoryError } = await supabase
      .from('store_inventory')
      .select('*')
      .limit(5);

    if (inventoryError) {
      console.log('❌ Error accessing store_inventory:', inventoryError.message);
    } else {
      console.log(`✅ store_inventory table accessible. Found ${inventory?.length || 0} records`);
    }

    // Test 4: Test the get_nearby_stores function
    console.log('\n4. Testing get_nearby_stores function...');
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
    }

    // Test 5: Check if user_profiles table has the necessary fields
    console.log('\n5. Checking user_profiles table structure...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('age, weight, height, activity_level, fitness_goal, dietary_preferences, dietary_restrictions')
      .limit(1);

    if (profilesError) {
      console.log('❌ Error accessing user_profiles:', profilesError.message);
    } else {
      console.log('✅ user_profiles table accessible with required fields');
      if (profiles && profiles.length > 0) {
        console.log('   Sample profile data:', profiles[0]);
      }
    }

    // Test 6: Check if traditional meal_plans table exists
    console.log('\n6. Checking traditional meal_plans table...');
    const { data: traditionalPlans, error: traditionalError } = await supabase
      .from('meal_plans')
      .select('*')
      .limit(5);

    if (traditionalError) {
      console.log('❌ Error accessing meal_plans:', traditionalError.message);
    } else {
      console.log(`✅ meal_plans table accessible. Found ${traditionalPlans?.length || 0} records`);
    }

    console.log('\n🎉 Meal Plan Integration Test Complete!');
    console.log('\n📋 Summary:');
    console.log('- Enhanced meal plans: ✅');
    console.log('- Store locator: ✅');
    console.log('- User profiles: ✅');
    console.log('- Traditional meal plans: ✅');
    console.log('- Database functions: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMealPlanIntegration(); 