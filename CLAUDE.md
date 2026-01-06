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

### Reversibility Rule
Every action in the system must be reversible:
- If there is an **Add** action, there must also be **Edit** and **Delete** actions
- If there is a **Delete** action, there must also be **Add** and **Edit** actions
- All CRUD operations must be complete for each entity

**Dangerous Action Confirmations:**
- Delete operations MUST require a confirmation dialog
- The confirmation prompt must be meaningful and specific (e.g., "წაშალოთ მიწა 'ჩემი მინდორი'?" not just "დარწმუნებული ხართ?")
- Other destructive actions (bulk operations, status changes that affect related data) should also require confirmation

### CRUD Best Practices

**Standard Components (MUST use):**
- `ConfirmDialog` - For all delete/destructive action confirmations
- `EntityForm` pattern - Reusable form that works for both Add and Edit modes
- Shared UI components from `components/ui/` (Button, Input, Select, etc.)

**Page Structure for Each Entity:**
```
/app/[entity]/page.tsx          - List view with Add button
/app/[entity]/new/page.tsx      - Add form (uses shared EntityForm)
/app/[entity]/[id]/page.tsx     - Detail view with Edit/Delete buttons
/app/[entity]/[id]/edit/page.tsx - Edit form (uses shared EntityForm)
```

**Form Reusability Pattern:**
- Create ONE form component per entity that handles both Add and Edit
- Pass `mode: 'add' | 'edit'` and optional `initialData` props
- Form component handles validation, submission, and error display
- Example: `FieldForm.tsx` used by both `/fields/new` and `/fields/[id]/edit`

**Delete Flow:**
1. User clicks Delete button on detail page
2. ConfirmDialog opens with specific message: "წაშალოთ [entity type] '[entity name]'?"
3. If related data exists, warn user (e.g., "ამ მიწას აქვს 3 მოსავალი და 5 სამუშაო")
4. On confirm, call delete API and redirect to list page
5. Show success/error toast

**Edit Flow:**
1. Detail page has Edit button linking to `/[entity]/[id]/edit`
2. Edit page loads existing data into the shared form component
3. On save, update via API and redirect to detail page

**List Page Requirements:**
- "დამატება" (Add) button prominently placed
- Each row should link to detail page
- Optional: inline quick actions (edit icon, delete icon with confirmation)

**Detail Page Requirements:**
- "რედაქტირება" (Edit) button
- "წაშლა" (Delete) button (styled as danger/destructive)
- Back navigation to list

**API/Database Patterns:**
- Use soft delete when entity has related data that should be preserved
- Use hard delete for simple entities without dependencies
- Always check for related records before delete and warn user
- Use database CASCADE or RESTRICT appropriately

### Inline/Contextual Forms Pattern

When adding related entities from within a parent entity's detail page (e.g., adding expenses from work detail):

**When to Use Inline Forms:**
- Adding child/related records from parent detail page
- Simple forms with 3-5 fields
- When context inheritance makes sense (e.g., season from work)

**Context Inheritance Rules:**
- **Inherit from parent**: Fields that logically belong to the parent context
  - Example: `season_id` inherited from work when adding expense to work
  - Example: `field_id` inherited when adding work from field detail
- **Auto-set allocation**: When linking to parent, set `allocation_type` and `target_id` automatically
- **User inputs only**: Amount, date, description - fields that vary per record

**Inline Form UI Pattern:**
```
┌─────────────────────────────────────┐
│ Section Header (e.g., "ხარჯები")   │
├─────────────────────────────────────┤
│ [List of existing related items]   │
│ - Item 1 (clickable → detail)      │
│ - Item 2 (clickable → detail)      │
├─────────────────────────────────────┤
│ Total: X ₾ (if applicable)         │
├─────────────────────────────────────┤
│ [+ დამატება] button (dashed border)│
│                                     │
│ ▼ When clicked, expands to form:   │
│ ┌─────────────────────────────────┐ │
│ │ Field 1: [________]             │ │
│ │ Field 2: [________]             │ │
│ │ [გაუქმება] [შენახვა]            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Implementation Checklist:**
- [ ] State for form visibility (`showForm`)
- [ ] State for form data with sensible defaults
- [ ] State for saving indicator (`isSaving`)
- [ ] Fetch related items in parent's `fetchData()`
- [ ] Auto-inherit context fields (season_id, allocation_type, target_id)
- [ ] Error handling with Georgian message (`STRINGS.SAVE_ERROR`)
- [ ] Reset form and refresh list on successful save
- [ ] Collapsible with cancel button

**Don't Require User to Select:**
- Season (inherit from parent or use current)
- Allocation type (set based on context)
- Target entity (set to parent's ID)

### Linked Entities Display Pattern

When showing related entities on a detail page:

**Display Requirements:**
- Show list of related items with key info (description, date, amount)
- Items should be clickable → navigate to their detail page
- Show aggregate (total, count) where meaningful
- Empty state with Georgian text when no items exist

**Example - Expenses on Work Detail:**
```typescript
// Fetch in parent's fetchData()
const { data: expenses } = await supabase.from('expenses')
    .select('*')
    .eq('allocation_type', 'WORK')
    .eq('target_id', id)
    .order('expense_date', { ascending: false });

// Calculate total
const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount_gel), 0);
```

### Code Standards
- Explicit TypeScript types
- Consistent naming conventions
- Clear separation: UI components, data access, business logic
- Meaningful comments only where necessary
- Add indexes for common filters and report queries
