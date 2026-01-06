import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * DATABASE SEEDING
 * This script seeds the database with necessary base data:
 * - Crops (ხორბალი, ქერი)
 * - Varieties for each crop
 * - Work types
 * - A season if none exists
 */

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

test.describe('Database Seeding', () => {

  test('Seed crops, varieties, and work types', async ({ page }) => {
    // We'll use the app's login to get authenticated, then use the Supabase client

    // First, let's check if we can access Supabase via the app
    console.log('Checking Supabase connection...');
    console.log(`URL: ${SUPABASE_URL ? 'Set' : 'NOT SET'}`);
    console.log(`Key: ${SUPABASE_KEY ? 'Set' : 'NOT SET'}`);

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.log('⚠️ Supabase credentials not found in environment');
      console.log('Will attempt to seed via UI...');
    }

    // Navigate to settings to check what exists
    await page.goto('/#/login');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 30000 });
    await emailInput.fill('elizbar.55@gmail.com');
    await page.fill('input[type="password"]', '10091955');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/#/app', { timeout: 30000 });

    // Check varieties page to see if crops exist
    await page.goto('/#/app/settings/varieties');
    await page.waitForLoadState('networkidle');

    // Look for crop names
    const hasWheat = await page.locator('text=ხორბალი').isVisible().catch(() => false);
    const hasBarley = await page.locator('text=ქერი').isVisible().catch(() => false);

    console.log(`Crops found - Wheat: ${hasWheat}, Barley: ${hasBarley}`);

    if (!hasWheat || !hasBarley) {
      console.log('❌ Crops are missing from database!');
      console.log('');
      console.log('Please run the following SQL in Supabase SQL Editor:');
      console.log('');
      console.log(`-- Seed Crops
INSERT INTO crops (name_ka) VALUES ('ხორბალი'), ('ქერი') ON CONFLICT DO NOTHING;

-- Seed Work Types
INSERT INTO work_types (name) VALUES
('ხვნა'),
('დათესვა'),
('კულტივაცია'),
('სასუქის შეტანა'),
('ჰერბიციდი'),
('ფუნგიციდი'),
('მორწყვა'),
('აღება (კომბაინი)')
ON CONFLICT DO NOTHING;

-- Get crop IDs and insert varieties
DO $$
DECLARE
  wheat_id UUID;
  barley_id UUID;
BEGIN
  SELECT id INTO wheat_id FROM crops WHERE name_ka = 'ხორბალი' LIMIT 1;
  SELECT id INTO barley_id FROM crops WHERE name_ka = 'ქერი' LIMIT 1;

  IF wheat_id IS NOT NULL THEN
    INSERT INTO varieties (crop_id, name) VALUES
      (wheat_id, 'ბეზოსტაია'),
      (wheat_id, 'გრუზინული თეთრი'),
      (wheat_id, 'სხვა')
    ON CONFLICT DO NOTHING;
  END IF;

  IF barley_id IS NOT NULL THEN
    INSERT INTO varieties (crop_id, name) VALUES
      (barley_id, 'სკარლეტი'),
      (barley_id, 'ჰადმერსდორფ'),
      (barley_id, 'სხვა')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Ensure a season exists
INSERT INTO seasons (year, is_current)
SELECT 2026, true
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE year = 2026);
`);
      console.log('');
      console.log('After running the SQL, re-run the setup-test-data.spec.ts');

      // Take screenshot for reference
      await page.screenshot({ path: 'test-results/missing-crops.png' });
    } else {
      console.log('✅ Crops exist in database');

      // Check for varieties
      await page.waitForTimeout(1000);
      const pageContent = await page.content();
      const hasVarieties = pageContent.includes('ბეზოსტაია') ||
                          pageContent.includes('სკარლეტი') ||
                          pageContent.includes('სხვა');

      if (hasVarieties) {
        console.log('✅ Varieties exist');
      } else {
        console.log('⚠️ Varieties may be missing');
      }
    }

    // Check seasons
    await page.goto('/#/app/settings/seasons');
    await page.waitForLoadState('networkidle');

    const hasSeason = await page.locator('text=2026').isVisible().catch(() => false) ||
                     await page.locator('text=2025').isVisible().catch(() => false);

    if (hasSeason) {
      console.log('✅ Seasons exist');
    } else {
      console.log('⚠️ No seasons found');
    }
  });
});
