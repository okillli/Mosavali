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

## Key Rules

1. **All strings from `lib/strings.ts`** - never hardcode Georgian text
2. **Dual validation** - UI + Postgres triggers for business rules
3. **Complete CRUD** - every Add needs Edit + Delete with confirmation
4. **RLS enabled** - all queries via authenticated Supabase client

## Entities

- **Fields** (მიწები) - land parcels
- **Lots** (მოსავალი) - harvest batches
- **Warehouses/Bins** (საწყობები) - storage
- **Sales** (გაყიდვები) - with payments
- **Works** (სამუშაოები) - farm activities
- **Expenses** (ხარჯები) - cost tracking

## Business Rules

- **No Mixing** - bin holds one lot only
- **No Negative Stock** - blocked by trigger
- **Atomic Sales** - use `create_sale_atomic()` RPC

## Extended Documentation

Read these when working on specific areas:

| File | When to Read |
|------|--------------|
| [.claude/strings.md](.claude/strings.md) | Adding/editing UI text |
| [.claude/crud-patterns.md](.claude/crud-patterns.md) | Creating forms, pages, delete flows |
| [.claude/database.md](.claude/database.md) | Schema changes, RPC, migrations |
| [.claude/testing.md](.claude/testing.md) | Writing/running E2E tests |

## Source of Truth

- `PRD.txt` - features, workflows, acceptance criteria
- `lib/strings.ts` - all UI strings
- Ask if requirements are unclear
