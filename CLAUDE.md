# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

მოსავალი (Mosavali/Harvest) is a farm management system for Georgian farmers growing barley and wheat. The entire UI is in Georgian language.

## Development Commands

```bash
npm install     # Install dependencies
npm run dev     # Start dev server on port 3000
npm run build   # Production build
npm run preview # Preview production build
```

## Architecture

**Tech Stack:** Vite + React 19 + TypeScript + Supabase (Postgres)

**Key Directories:**
- `app/` - Next.js-style file-based routing (pages and layouts)
- `app/app/` - Authenticated app routes (protected by session check in layout)
- `lib/` - Shared utilities (Supabase client, UI strings)
- `components/` - Reusable UI components
- `supabase/migrations/` - Database schema and logic (run manually in Supabase SQL Editor)

**Data Flow:**
- All data operations go through `lib/supabaseClient.ts`
- UI strings are centralized in `lib/strings.ts` (Georgian language)
- TypeScript types mirror database schema in `types.ts`

## Database Business Rules

Critical constraints enforced at the database level via triggers:

1. **No Mixing Rule** - A warehouse bin can only hold one lot at a time. Attempting to add a different lot raises an exception.

2. **No Negative Stock** - Movements that would result in negative inventory are blocked.

3. **Atomic Sales** - Use the `create_sale_atomic()` RPC function for sales. This creates both the sale record and inventory movement in a single transaction.

4. **Farm Isolation** - RLS policies ensure users only see data from their own farm.

## Database Setup

Run these files in order in Supabase SQL Editor:
1. `01_core_schema.txt` - Tables and enums
2. `02_logic.txt` - Views, triggers, RPC functions
3. `03_rls.txt` - Row Level Security
4. `04_seed.txt` - Default crops and work types
5. `05_auth.txt` - Auth trigger for profile creation

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Key Entities

- **Fields** (მიწები) - Land parcels with area and ownership status
- **Lots** (მოსავალი) - Harvest batches linked to field, crop, variety, season
- **Warehouses/Bins** (საწყობები/სექციები) - Storage locations; bins track active lot
- **Sales** (გაყიდვები) - Sales records with payment tracking
- **Works** (სამუშაოები) - Farm activities with planned/completed status
- **Expenses** (ხარჯები) - Cost tracking allocatable to fields, lots, works, etc.

## Inventory System

Stock is calculated from `inventory_movements` table, not stored directly. The view `v_bin_lot_stock` aggregates movements to show current stock per bin/lot. Movement types: RECEIVE, TRANSFER, SALE_OUT, ADJUSTMENT.

## Coding Guidelines

### Source of Truth
- `PRD.txt` is the source of truth for features, workflows, rules, schema, and acceptance criteria
- `Dictionary.txt` (if present) is the source of truth for Georgian UI text
- `lib/strings.ts` contains all UI strings - import from there, never hardcode text
- Do not invent features, fields, screens, or rules not in PRD.txt

### No Guessing Policy
- If requirements are ambiguous or missing, STOP and ask clarifying questions before writing code
- If proceeding without answers: state uncertainty explicitly, choose simplest safe interpretation, mark as `TODO/ASSUMPTION`

### Language Requirements
- UI must be 100% Georgian (ka-GE) - no English in UI including errors, empty states, placeholders
- Database error messages that surface to UI must also be Georgian
- All strings come from `lib/strings.ts`

### Dual Validation Pattern
Enforce business rules at BOTH levels:
1. **UI validation** - fast feedback to users
2. **Postgres triggers/functions** - authoritative enforcement

This applies to:
- No Mixing rule (bin can only hold one lot)
- No Negative Stock rule
- Any other business constraints

### Transaction Requirements
- Sale creation must be atomic: use `create_sale_atomic()` RPC
- Any multi-table mutations should use Postgres RPC or explicit transactions

### RLS (Row Level Security)
- RLS is enabled on ALL tables
- All policies restrict by `farm_id` linked to authenticated user profile
- Never bypass RLS; always query through the authenticated Supabase client

### UX Standards
- Mobile-first: large tap targets, minimal required fields
- Sensible defaults: today's date, current season, last used warehouse, default bin
- Display both kg and tons where relevant in reports

### Code Standards
- Explicit TypeScript types
- Consistent naming conventions
- Clear separation: UI components, data access, business logic
- Meaningful comments only where necessary
- Add indexes for common filters and report queries
