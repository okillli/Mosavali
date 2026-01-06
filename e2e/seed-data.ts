/**
 * Database Seeder Script
 * Run with: npx tsx e2e/seed-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // 1. Seed Crops
    console.log('1. Seeding crops...');
    const { data: crops, error: cropsError } = await supabase
      .from('crops')
      .upsert([
        { name_ka: 'ხორბალი' },
        { name_ka: 'ქერი' }
      ], { onConflict: 'name_ka' })
      .select();

    if (cropsError) {
      console.log(`   Error: ${cropsError.message}`);
    } else {
      console.log(`   ✅ Crops seeded: ${crops?.length || 0}`);
    }

    // Get crop IDs
    const { data: allCrops } = await supabase.from('crops').select('*');
    const wheatId = allCrops?.find(c => c.name_ka === 'ხორბალი')?.id;
    const barleyId = allCrops?.find(c => c.name_ka === 'ქერი')?.id;

    console.log(`   Wheat ID: ${wheatId}`);
    console.log(`   Barley ID: ${barleyId}`);

    // 2. Seed Varieties
    console.log('\n2. Seeding varieties...');

    // Check existing varieties first
    const { data: existingVarieties } = await supabase.from('varieties').select('name, crop_id');
    const existingNames = new Set(existingVarieties?.map(v => `${v.crop_id}-${v.name}`) || []);

    if (wheatId) {
      const wheatVarieties = [
        { crop_id: wheatId, name: 'ბეზოსტაია' },
        { crop_id: wheatId, name: 'გრუზინული თეთრი' },
        { crop_id: wheatId, name: 'სხვა' }
      ].filter(v => !existingNames.has(`${v.crop_id}-${v.name}`));

      if (wheatVarieties.length > 0) {
        const { error: wheatVarError } = await supabase
          .from('varieties')
          .insert(wheatVarieties);

        if (wheatVarError) {
          console.log(`   Wheat varieties error: ${wheatVarError.message}`);
        } else {
          console.log(`   ✅ Wheat varieties seeded: ${wheatVarieties.length}`);
        }
      } else {
        console.log('   ℹ️ Wheat varieties already exist');
      }
    }

    if (barleyId) {
      const barleyVarieties = [
        { crop_id: barleyId, name: 'სკარლეტი' },
        { crop_id: barleyId, name: 'ჰადმერსდორფ' },
        { crop_id: barleyId, name: 'სხვა' }
      ].filter(v => !existingNames.has(`${v.crop_id}-${v.name}`));

      if (barleyVarieties.length > 0) {
        const { error: barleyVarError } = await supabase
          .from('varieties')
          .insert(barleyVarieties);

        if (barleyVarError) {
          console.log(`   Barley varieties error: ${barleyVarError.message}`);
        } else {
          console.log(`   ✅ Barley varieties seeded: ${barleyVarieties.length}`);
        }
      } else {
        console.log('   ℹ️ Barley varieties already exist');
      }
    }

    // 3. Seed Work Types
    console.log('\n3. Seeding work types...');
    const workTypes = [
      'ხვნა',
      'დათესვა',
      'კულტივაცია',
      'სასუქის შეტანა',
      'ჰერბიციდი',
      'ფუნგიციდი',
      'მორწყვა',
      'აღება (კომბაინი)'
    ];

    const { error: workError } = await supabase
      .from('work_types')
      .upsert(workTypes.map(name => ({ name })), { onConflict: 'name' });

    if (workError) {
      console.log(`   Error: ${workError.message}`);
    } else {
      console.log(`   ✅ Work types seeded: ${workTypes.length}`);
    }

    // 4. Seed Season (2026)
    console.log('\n4. Seeding season...');

    // Check if 2026 season exists
    const { data: existingSeasons } = await supabase.from('seasons').select('*');
    const has2026 = existingSeasons?.some(s => s.year === 2026);

    if (!has2026) {
      // First unset any current season
      await supabase.from('seasons').update({ is_current: false }).eq('is_current', true);

      const { error: seasonError } = await supabase
        .from('seasons')
        .insert([{ year: 2026, is_current: true }]);

      if (seasonError) {
        console.log(`   Error: ${seasonError.message}`);
      } else {
        console.log('   ✅ Season 2026 created and set as current');
      }
    } else {
      // Make sure 2026 is current
      await supabase.from('seasons').update({ is_current: false }).neq('year', 2026);
      await supabase.from('seasons').update({ is_current: true }).eq('year', 2026);
      console.log('   ℹ️ Season 2026 already exists, set as current');
    }

    // Verify data
    console.log('\n📊 Verification:');
    const { data: finalCrops } = await supabase.from('crops').select('*');
    const { data: finalVarieties } = await supabase.from('varieties').select('*');
    const { data: finalWorkTypes } = await supabase.from('work_types').select('*');
    const { data: finalSeasons } = await supabase.from('seasons').select('*');

    console.log(`   Crops: ${finalCrops?.length || 0}`);
    console.log(`   Varieties: ${finalVarieties?.length || 0}`);
    console.log(`   Work Types: ${finalWorkTypes?.length || 0}`);
    console.log(`   Seasons: ${finalSeasons?.length || 0}`);

    console.log('\n✅ Database seeding complete!');
    console.log('\nNow run: npx playwright test setup-test-data.spec.ts --project=chromium');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Also add a function to verify data is accessible
async function verifyAccess() {
  console.log('\n🔍 Verifying RLS access...');

  // Create a client with anon key (like the app uses)
  const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!ANON_KEY) {
    console.log('   Skipping anon key verification - VITE_SUPABASE_ANON_KEY not set');
    return;
  }
  const anonClient = createClient(SUPABASE_URL!, ANON_KEY);

  // Try to read crops with anon client
  const { data: anonCrops, error: anonError } = await anonClient.from('crops').select('*');
  console.log(`   Crops via anon key: ${anonCrops?.length || 0} (error: ${anonError?.message || 'none'})`);

  // Check if RLS is enabled on crops
  const { data: rlsInfo } = await supabase.rpc('get_rls_status').single();
  console.log(`   RLS status: ${JSON.stringify(rlsInfo)}`);
}

async function checkStock() {
  console.log('\n📦 Checking stock and lots...');

  // Check profiles to see farm_id
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log(`   Profiles: ${profiles?.length || 0}`);
  profiles?.forEach(p => console.log(`      - User ${p.id}: farm_id=${p.farm_id}`));

  // Check lots
  const { data: lots, error: lotsErr } = await supabase.from('lots').select('*');
  console.log(`   Lots: ${lots?.length || 0} (error: ${lotsErr?.message || 'none'})`);
  if (lots && lots.length > 0) {
    lots.forEach(l => console.log(`      - ${l.lot_code}: ${l.harvested_kg}kg, farm_id=${l.farm_id}`));
  }

  // Check inventory movements
  const { data: movements } = await supabase.from('inventory_movements').select('*');
  console.log(`   Movements: ${movements?.length || 0}`);
  if (movements && movements.length > 0) {
    movements.forEach(m => console.log(`      - ${m.type}: ${m.weight_kg}kg, farm_id=${m.farm_id}`));
  }

  // Check v_bin_lot_stock view
  const { data: stock, error: stockErr } = await supabase.from('v_bin_lot_stock').select('*');
  console.log(`   v_bin_lot_stock: ${stock?.length || 0} (error: ${stockErr?.message || 'none'})`);
  if (stock && stock.length > 0) {
    stock.forEach(s => console.log(`      - Bin ${s.bin_id}: ${s.stock_kg}kg, farm_id=${s.farm_id}`));
  }

  // Check as authenticated user
  console.log('\n🔐 Checking as authenticated user...');
  const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!ANON_KEY) {
    console.log('   Skipping authenticated user check - VITE_SUPABASE_ANON_KEY not set');
    return;
  }
  const anonClient = createClient(SUPABASE_URL!, ANON_KEY);

  // Sign in as test user
  const { data: authData, error: authErr } = await anonClient.auth.signInWithPassword({
    email: process.env.E2E_TEST_EMAIL || '',
    password: process.env.E2E_TEST_PASSWORD || ''
  });

  if (authErr) {
    console.log(`   Auth error: ${authErr.message}`);
    return;
  }

  console.log(`   Logged in as: ${authData.user?.email}`);

  // Check stock as authenticated user
  const { data: userStock, error: userStockErr } = await anonClient.from('v_bin_lot_stock').select('*');
  console.log(`   v_bin_lot_stock (as user): ${userStock?.length || 0} (error: ${userStockErr?.message || 'none'})`);
  userStock?.forEach(s => console.log(`      - ${s.stock_kg}kg, farm_id=${s.farm_id}`));

  // Check stock with joins (like sales/new page does)
  const { data: stockWithJoins, error: joinErr } = await anonClient.from('v_bin_lot_stock')
    .select('*, lots(lot_code, crop_id, variety_id), bins(name, warehouse_id, warehouses(name))');
  console.log(`   Stock with joins: ${stockWithJoins?.length || 0} (error: ${joinErr?.message || 'none'})`);
  if (stockWithJoins && stockWithJoins.length > 0) {
    stockWithJoins.forEach(s => {
      console.log(`      - ${s.stock_kg}kg, lot: ${s.lots?.lot_code || 'N/A'}, bin: ${s.bins?.name || 'N/A'}`);
    });
  }
}

seedDatabase()
  .then(() => verifyAccess().catch(e => console.log('RLS check skipped:', e.message)))
  .then(() => checkStock());
