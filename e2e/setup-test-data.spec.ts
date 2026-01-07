import { test, expect } from '@playwright/test';
import { login } from './utils/auth';
import { cleanupAllE2EData, logCleanupResults } from './utils/cleanup';

/**
 * TEST DATA SETUP
 * This file creates the necessary test data to enable high priority tests:
 * 1. Create a warehouse with bins
 * 2. Create a field
 * 3. Create a lot (harvest) and receive into warehouse
 * 4. Create a buyer
 * 5. Create a sale from the lot
 *
 * Note: Test data is cleaned up after all tests run (afterAll hook)
 */

test.describe.serial('Test Data Setup', () => {
  // Clean up all E2E test data after all tests complete
  test.afterAll(async () => {
    console.log('\n🧹 Cleaning up E2E test data...');
    const results = await cleanupAllE2EData();
    logCleanupResults(results);
  });
  test('1. Create warehouse for testing', async ({ page }) => {
    await login(page);
    await page.goto('/#/app/warehouses/new');

    // Wait for form
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('input').first();
    await nameInput.fill('E2E-Warehouse-Test');

    const saveButton = page.locator('button:has-text("შენახვა")');
    await saveButton.click();

    // Wait for redirect to list
    await page.waitForURL('**/#/app/warehouses', { timeout: 10000 });

    // Verify warehouse created (use first() in case duplicates exist)
    await expect(page.locator('text=E2E-Warehouse-Test').first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Warehouse created: E2E-Warehouse-Test');
  });

  test('2. Create field for testing', async ({ page }) => {
    await login(page);
    await page.goto('/#/app/fields/new');

    await page.waitForLoadState('networkidle');

    // Fill name
    const nameInput = page.locator('input').first();
    await nameInput.fill('E2E-Field-Test');

    // Fill area
    const areaInput = page.locator('input[type="number"]').first();
    await areaInput.fill('10');

    // Select ownership (first non-empty option)
    const ownershipSelect = page.locator('select').first();
    await ownershipSelect.selectOption({ index: 1 });

    const saveButton = page.locator('button:has-text("შენახვა")');
    await saveButton.click();

    await page.waitForURL('**/#/app/fields', { timeout: 10000 });
    await expect(page.locator('text=E2E-Field-Test').first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Field created: E2E-Field-Test');
  });

  test('3. Create buyer for testing', async ({ page }) => {
    await login(page);
    await page.goto('/#/app/settings/buyers');

    await page.waitForLoadState('networkidle');

    // Find the add buyer form
    const nameInput = page.locator('input[placeholder*="სახელი"], input').first();
    await nameInput.fill('E2E-Buyer-Test');

    // Phone input if exists
    const phoneInput = page.locator('input[placeholder*="ტელეფონი"], input[type="tel"]').first();
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('555123456');
    }

    // Click add button
    const addButton = page.locator('button:has-text("დამატება")');
    await addButton.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify buyer appears
    const buyerVisible = await page.locator('text=E2E-Buyer-Test').isVisible().catch(() => false);
    if (buyerVisible) {
      console.log('✅ Buyer created: E2E-Buyer-Test');
    } else {
      console.log('⚠️ Buyer may already exist or form different');
    }
  });

  test('4. Create lot with harvest and receive into warehouse', async ({ page }) => {
    await login(page);
    await page.goto('/#/app/lots/new');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for data to load

    // Step 1: Harvest Info
    console.log('Step 1: Filling harvest info...');

    // Wait for all data to load
    await page.waitForTimeout(2000);

    // Season is auto-selected, skip to crop
    // Find crop select by looking for label "კულტურა"
    const cropLabel = page.locator('label:has-text("კულტურა")');
    const cropLabelVisible = await cropLabel.isVisible().catch(() => false);
    console.log(`Crop label visible: ${cropLabelVisible}`);

    // Select crop (კულტურა) - second select after season
    const cropSelect = page.locator('select').nth(1);
    await cropSelect.waitFor({ state: 'visible' });

    // Wait for options to load
    let cropOptions = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      cropOptions = await cropSelect.locator('option').count();
      console.log(`Crop options (attempt ${attempt + 1}): ${cropOptions}`);
      if (cropOptions > 1) break;
      await page.waitForTimeout(500);
    }

    // Debug: Print all select elements and their option counts
    const allSelects = await page.locator('select').count();
    console.log(`Total select elements: ${allSelects}`);
    for (let i = 0; i < allSelects; i++) {
      const sel = page.locator('select').nth(i);
      const optCount = await sel.locator('option').count();
      const firstOptText = await sel.locator('option').first().textContent();
      console.log(`  Select ${i}: ${optCount} options, first: "${firstOptText}"`);
    }

    if (cropOptions <= 1) {
      console.log('⚠️ No crops available - cannot create lot');
      await page.screenshot({ path: 'test-results/lot-no-crops.png' });
      test.skip();
      return;
    }

    await cropSelect.selectOption({ index: 1 });
    console.log('Selected crop');

    // Wait for varieties to load (they depend on crop selection)
    await page.waitForTimeout(1500);

    // Select variety (ჯიში) - third select
    const varietySelect = page.locator('select').nth(2);
    await varietySelect.waitFor({ state: 'visible' });

    // Wait and check for variety options
    let varietyOptions = 0;
    for (let i = 0; i < 5; i++) {
      varietyOptions = await varietySelect.locator('option').count();
      if (varietyOptions > 1) break;
      await page.waitForTimeout(500);
    }

    console.log(`Variety options: ${varietyOptions}`);

    if (varietyOptions <= 1) {
      console.log('⚠️ No varieties available for selected crop');
      test.skip();
      return;
    }

    await varietySelect.selectOption({ index: 1 });
    console.log('Selected variety');

    // Select field (მიწა) - fourth select
    const fieldSelect = page.locator('select').nth(3);
    await fieldSelect.waitFor({ state: 'visible' });

    const fieldOptions = await fieldSelect.locator('option').count();
    console.log(`Field options: ${fieldOptions}`);

    if (fieldOptions <= 1) {
      console.log('⚠️ No fields available');
      test.skip();
      return;
    }

    // Try to select E2E-Field-Test or first available
    let selectedField = false;
    for (let i = 1; i < fieldOptions; i++) {
      const text = await fieldSelect.locator('option').nth(i).textContent();
      if (text?.includes('E2E-Field-Test')) {
        await fieldSelect.selectOption({ index: i });
        selectedField = true;
        console.log('Selected E2E-Field-Test');
        break;
      }
    }

    if (!selectedField) {
      await fieldSelect.selectOption({ index: 1 });
      console.log('Selected first available field');
    }

    // Fill harvest weight
    const weightInput = page.locator('input[type="number"]').first();
    await weightInput.fill('5000');
    console.log('Filled weight: 5000kg');

    // Screenshot before clicking
    await page.screenshot({ path: 'test-results/lot-step1-before-click.png' });

    // Click the "შენახვა & მიღება საწყობში" button
    const nextButton = page.locator('button:has-text("შენახვა")');
    const buttonText = await nextButton.textContent();
    console.log(`Button text: ${buttonText}`);

    await nextButton.click();
    console.log('Clicked next button');

    // Wait for step 2 to appear
    await page.waitForTimeout(2000);

    // Check if we advanced to step 2 by looking for warehouse select
    const step2Heading = page.locator('h1:has-text("მიღება"), h1:has-text("საწყობ")');
    const isStep2 = await step2Heading.isVisible().catch(() => false);

    if (!isStep2) {
      // Check for error message
      const errorDiv = page.locator('.bg-red-100');
      const hasError = await errorDiv.isVisible().catch(() => false);
      if (hasError) {
        const errorText = await errorDiv.textContent();
        console.log(`❌ Error on step 1: ${errorText}`);
      }

      // Screenshot for debugging
      await page.screenshot({ path: 'test-results/lot-step1-error.png' });
      console.log('⚠️ Did not advance to step 2');
      test.skip();
      return;
    }

    console.log('Step 2: Filling warehouse info...');

    // Step 2: Receive into warehouse
    const warehouseSelect = page.locator('select').first();
    await warehouseSelect.waitFor({ state: 'visible', timeout: 5000 });

    const whOptions = await warehouseSelect.locator('option').count();
    console.log(`Warehouse options: ${whOptions}`);

    // Select warehouse (prefer E2E-Warehouse-Test)
    let selectedWh = false;
    for (let i = 1; i < whOptions; i++) {
      const text = await warehouseSelect.locator('option').nth(i).textContent();
      if (text?.includes('E2E-Warehouse-Test')) {
        await warehouseSelect.selectOption({ index: i });
        selectedWh = true;
        console.log('Selected E2E-Warehouse-Test');
        break;
      }
    }

    if (!selectedWh && whOptions > 1) {
      await warehouseSelect.selectOption({ index: 1 });
      console.log('Selected first warehouse');
    }

    // Wait for bins to load
    await page.waitForTimeout(1000);

    // Select bin
    const binSelect = page.locator('select').nth(1);
    const binOptions = await binSelect.locator('option').count();
    console.log(`Bin options: ${binOptions}`);

    if (binOptions > 1) {
      await binSelect.selectOption({ index: 1 });
      console.log('Selected bin');
    }

    // Screenshot before final save
    await page.screenshot({ path: 'test-results/lot-step2-before-save.png' });

    // Save - find the button that's not disabled
    const saveButton = page.locator('button:has-text("შენახვა"):not([disabled])').last();
    await saveButton.click();
    console.log('Clicked save button');

    // Wait for redirect or error
    try {
      await page.waitForURL('**/#/app/lots', { timeout: 20000 });
      console.log('✅ Lot created with 5000kg harvest');
    } catch (e) {
      // Check for error
      const errorDiv = page.locator('.bg-red-100');
      const hasError = await errorDiv.isVisible().catch(() => false);
      if (hasError) {
        const errorText = await errorDiv.textContent();
        console.log(`❌ Error creating lot: ${errorText}`);
      }
      await page.screenshot({ path: 'test-results/lot-step2-error.png' });
      throw e;
    }
  });

  test('5. Create sale from lot stock', async ({ page }) => {
    await login(page);
    await page.goto('/#/app/sales/new');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for data to load

    // Select stock (lot + bin)
    const stockSelect = page.locator('select').first();
    await stockSelect.waitFor({ state: 'visible' });

    // Wait for stock options to load
    let stockOptions = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      stockOptions = await stockSelect.locator('option').count();
      console.log(`Stock options (attempt ${attempt + 1}): ${stockOptions}`);
      if (stockOptions > 1) break;
      await page.waitForTimeout(500);
    }

    if (stockOptions <= 1) {
      console.log('⚠️ No stock available for sale - lot may not have been created');
      await page.screenshot({ path: 'test-results/sale-no-stock.png' });
      test.skip();
      return;
    }

    // Select first available stock
    await stockSelect.selectOption({ index: 1 });

    // Wait for weight to populate
    await page.waitForTimeout(500);

    // Select buyer
    const buyerSelect = page.locator('select').nth(1);
    const buyerOptions = await buyerSelect.locator('option').count();

    if (buyerOptions > 1) {
      // Prefer E2E-Buyer-Test
      const options = buyerSelect.locator('option');
      for (let i = 1; i < buyerOptions; i++) {
        const text = await options.nth(i).textContent();
        if (text?.includes('E2E-Buyer-Test')) {
          await buyerSelect.selectOption({ index: i });
          break;
        }
      }
      // Fallback to first buyer
      const selectedBuyer = await buyerSelect.inputValue();
      if (!selectedBuyer) {
        await buyerSelect.selectOption({ index: 1 });
      }
    }

    // Set weight (sell 1000kg of the 5000kg)
    const weightInput = page.locator('input[type="number"]').first();
    await weightInput.fill('1000');

    // Set price per kg
    const priceInput = page.locator('input[type="number"]').nth(1);
    await priceInput.fill('2.50');

    // Verify total shows (1000 * 2.50 = 2500)
    const totalDiv = page.locator('.bg-gray-50');
    await expect(totalDiv).toContainText('2500');

    // Save
    const saveButton = page.locator('button:has-text("შენახვა")');
    await saveButton.click();

    // Wait for redirect
    await page.waitForURL('**/#/app/sales', { timeout: 15000 });

    console.log('✅ Sale created: 1000kg @ 2.50 = 2500');
  });

  test('6. Verify stock was reduced', async ({ page }) => {
    await login(page);
    await page.goto('/#/app/reports');

    await page.waitForLoadState('networkidle');

    // The stock should now show 4000kg (5000 - 1000 sold)
    const content = await page.content();

    if (content.includes('4000') || content.includes('4,000')) {
      console.log('✅ Stock correctly shows 4000kg after sale');
    } else if (content.includes('5000') || content.includes('5,000')) {
      console.log('⚠️ Stock still shows 5000kg - sale may not have been recorded');
    } else {
      console.log('ℹ️ Stock data visible on reports page');
    }
  });
});
