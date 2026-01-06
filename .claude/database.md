# Database

## Setup Order

Run in Supabase SQL Editor:
1. `supabase/migrations/01_core_schema.txt` - Tables, enums
2. `supabase/migrations/02_logic.txt` - Views, triggers, RPC
3. `supabase/migrations/03_rls.txt` - Row Level Security
4. `supabase/migrations/04_seed.txt` - Crops, work types
5. `supabase/migrations/05_auth.txt` - Auth trigger

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Business Rules (Trigger-Enforced)

| Rule | Trigger |
|------|---------|
| No Mixing | Bin can hold one lot only |
| No Negative Stock | Blocks movements causing negative |
| Farm Isolation | RLS by `farm_id` |

## Atomic Operations

**Sales must use RPC:**
```typescript
await supabase.rpc('create_sale_atomic', {
  p_lot_id: lotId,
  p_bin_id: binId,
  p_weight_kg: weight,
  // ...
});
```

## Inventory System

Stock is calculated, not stored:
- Source: `inventory_movements` table
- View: `v_bin_lot_stock` aggregates per bin/lot
- Types: `RECEIVE`, `TRANSFER`, `SALE_OUT`, `ADJUSTMENT`

## RLS

- Enabled on ALL tables
- Policies filter by `farm_id` from user profile
- Always use authenticated Supabase client

## Dual Validation

Enforce rules at BOTH levels:
1. **UI** - fast user feedback
2. **Postgres** - authoritative enforcement

Example: No Mixing checked in form + blocked by trigger
