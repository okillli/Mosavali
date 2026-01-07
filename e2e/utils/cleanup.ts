/**
 * E2E Test Data Cleanup Utility
 *
 * Uses Supabase REST API with service role key to clean up test data
 * created during E2E tests. This bypasses RLS.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Prefix used to identify E2E test data
export const E2E_PREFIX = 'E2E';

interface CleanupResult {
  table: string;
  deleted: number;
  error?: string;
}

/**
 * Delete records from a table matching a pattern
 */
async function deleteByPattern(
  table: string,
  column: string,
  pattern: string
): Promise<CleanupResult> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return { table, deleted: 0, error: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' };
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${column}=like.*${pattern}*`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Prefer': 'return=representation',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { table, deleted: 0, error };
    }

    const deleted = await response.json();
    return { table, deleted: Array.isArray(deleted) ? deleted.length : 0 };
  } catch (error) {
    return { table, deleted: 0, error: String(error) };
  }
}

/**
 * Delete a specific record by ID
 */
async function deleteById(table: string, id: string): Promise<CleanupResult> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return { table, deleted: 0, error: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' };
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Prefer': 'return=representation',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { table, deleted: 0, error };
    }

    const deleted = await response.json();
    return { table, deleted: Array.isArray(deleted) ? deleted.length : 0 };
  } catch (error) {
    return { table, deleted: 0, error: String(error) };
  }
}

/**
 * Clean up all E2E test data from the database
 * Call this in afterAll() or as a global teardown
 */
export async function cleanupAllE2EData(): Promise<CleanupResult[]> {
  const results: CleanupResult[] = [];

  // Order matters due to foreign key constraints
  // Delete child records first, then parent records

  // 1. Delete E2E inventory movements (references lots, bins)
  // No name column, skip pattern-based cleanup

  // 2. Delete E2E sales (references lots, bins, buyers)
  // No name column, skip pattern-based cleanup

  // 3. Delete E2E expenses (has description column)
  results.push(await deleteByPattern('expenses', 'description', E2E_PREFIX));

  // 4. Delete E2E works (has description column)
  results.push(await deleteByPattern('works', 'description', E2E_PREFIX));

  // 5. Delete E2E lots (has lot_code column)
  results.push(await deleteByPattern('lots', 'lot_code', E2E_PREFIX));

  // 6. Delete E2E bins (has name column) - must be before warehouses
  results.push(await deleteByPattern('bins', 'name', E2E_PREFIX));

  // 7. Delete E2E warehouses (has name column)
  results.push(await deleteByPattern('warehouses', 'name', E2E_PREFIX));

  // 8. Delete E2E fields (has name column)
  results.push(await deleteByPattern('fields', 'name', E2E_PREFIX));

  // 9. Delete E2E buyers (has name column)
  results.push(await deleteByPattern('buyers', 'name', E2E_PREFIX));

  // 10. Delete test seasons (year >= 3000, used by settings tests)
  results.push(await deleteTestSeasons());

  // 11. Delete "Test-*" prefixed fields (from high-priority tests)
  results.push(await deleteByPattern('fields', 'name', 'Test-'));

  return results;
}

/**
 * Delete test seasons with year >= 3000
 */
async function deleteTestSeasons(): Promise<CleanupResult> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return { table: 'seasons', deleted: 0, error: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' };
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/seasons?year=gte.3000`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Prefer': 'return=representation',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { table: 'seasons', deleted: 0, error };
    }

    const deleted = await response.json();
    return { table: 'seasons', deleted: Array.isArray(deleted) ? deleted.length : 0 };
  } catch (error) {
    return { table: 'seasons', deleted: 0, error: String(error) };
  }
}

/**
 * Clean up a specific warehouse and its bins
 */
export async function cleanupWarehouse(warehouseId: string): Promise<CleanupResult[]> {
  const results: CleanupResult[] = [];

  // First delete bins belonging to this warehouse
  if (SUPABASE_URL && SERVICE_ROLE_KEY) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/bins?warehouse_id=eq.${warehouseId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Prefer': 'return=representation',
          },
        }
      );
      const deleted = await response.json();
      results.push({ table: 'bins', deleted: Array.isArray(deleted) ? deleted.length : 0 });
    } catch (error) {
      results.push({ table: 'bins', deleted: 0, error: String(error) });
    }
  }

  // Then delete the warehouse
  results.push(await deleteById('warehouses', warehouseId));

  return results;
}

/**
 * Clean up E2E warehouses only
 */
export async function cleanupE2EWarehouses(): Promise<CleanupResult[]> {
  const results: CleanupResult[] = [];

  // Delete E2E bins first (foreign key constraint)
  results.push(await deleteByPattern('bins', 'name', E2E_PREFIX));

  // Delete E2E warehouses
  results.push(await deleteByPattern('warehouses', 'name', E2E_PREFIX));

  return results;
}

/**
 * Log cleanup results
 */
export function logCleanupResults(results: CleanupResult[]): void {
  console.log('\n🧹 E2E Cleanup Results:');
  for (const result of results) {
    if (result.error) {
      console.log(`   ❌ ${result.table}: ${result.error}`);
    } else if (result.deleted > 0) {
      console.log(`   ✅ ${result.table}: ${result.deleted} records deleted`);
    }
  }
}
