# CLAUDE.md

Farm management system for Georgian farmers. **UI is 100% Georgian.**

## Commands

```bash
npm run dev     # Dev server :3000
npm run build   # Production build
```

## Architecture

**Stack:** Next.js + React 19 + TypeScript + Supabase (Postgres)

| Directory | Purpose |
|-----------|---------|
| `app/` | File-based routing |
| `app/app/` | Authenticated routes |
| `lib/` | Supabase client, strings |
| `components/` | UI components |
| `types.ts` | TypeScript types |

## Key Rules (Always Apply)

1. **All strings from `lib/strings.ts`** - never hardcode Georgian text
2. **Dual validation** - UI + Postgres triggers for business rules
3. **Complete CRUD** - every Add needs Edit + Delete with ConfirmDialog
4. **RLS enabled** - all queries via authenticated Supabase client

## Entities

- **Fields** (მიწები) - land parcels
- **Lots** (მოსავალი) - harvest batches
- **Warehouses/Bins** (საწყობები) - storage
- **Sales** (გაყიდვები) - with payments
- **Works** (სამუშაოები) - farm activities
- **Expenses** (ხარჯები) - cost tracking

## Business Rules (DB-Enforced)

- **No Mixing** - bin holds one lot only
- **No Negative Stock** - blocked by trigger
- **Atomic Sales** - use `create_sale_atomic()` RPC

## Extended Documentation

**Read these ONLY when working on that specific area:**

| File | Read When... | Skip When... |
|------|--------------|--------------|
| [strings.md](.claude/strings.md) | Adding ANY user-visible text | Reading/debugging existing code |
| [crud-patterns.md](.claude/crud-patterns.md) | Creating new entity pages/forms | Styling or DB work |
| [ui-patterns.md](.claude/ui-patterns.md) | Building UI, need component API | CRUD flow questions |
| [database.md](.claude/database.md) | Schema, triggers, direct queries | Frontend-only changes |
| [testing.md](.claude/testing.md) | Writing or running E2E tests | Not testing |

## Source of Truth

- `PRD.txt` - features, workflows, acceptance criteria
- `lib/strings.ts` - all UI strings
- Ask if requirements are unclear
