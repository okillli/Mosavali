# Database

> **When to read:** Schema changes, writing RPC, running direct queries, debugging data
> **Skip if:** Frontend-only changes → see [ui-patterns.md](ui-patterns.md)

## Direct Query Access

Use PostgreSQL MCP for direct queries (bypasses RLS):

```
mcp__postgres__query({ sql: "SELECT * FROM fields LIMIT 5" })
```

Useful for: debugging, checking constraints, verifying triggers

## Schema Setup

Run in Supabase SQL Editor (in order):
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

| Rule | Effect |
|------|--------|
| No Mixing | Bin holds one lot only |
| No Negative Stock | Blocks movements causing negative |
| Farm Isolation | RLS filters by `farm_id` |

## Atomic Operations

Sales MUST use RPC:
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
