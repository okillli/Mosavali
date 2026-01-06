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

---

## MANDATORY RULES (Never Skip)

These rules apply to ALL code changes. Violations are bugs.

### 1. All Strings from `lib/strings.ts`
- **NEVER** hardcode Georgian text in components
- Check if string exists → if not, ADD it first → then use constant
- Applies to: labels, buttons, errors, placeholders, messages, everything

```typescript
// ✅ CORRECT
<button>{STRINGS.SAVE}</button>

// ❌ WRONG - will be rejected
<button>შენახვა</button>
```

### 2. Complete CRUD with Confirmations
- Every **Add** action requires **Edit** and **Delete**
- Every **Delete** MUST use `ConfirmDialog` with specific message
- Include entity name in message: `"წაშალოთ მიწა 'ჩემი მინდორი'?"`
- Warn about related data before delete

### 3. Dual Validation
- Business rules enforced at BOTH levels:
  - **UI** - immediate user feedback
  - **Postgres triggers** - authoritative enforcement
- Applies to: No Mixing, No Negative Stock, all constraints

### 4. RLS Always Active
- All queries via authenticated Supabase client
- Never bypass Row Level Security
- All tables filter by `farm_id`

### 5. Atomic Sales
- Sales MUST use `create_sale_atomic()` RPC
- Never create sales with separate insert statements

### 6. Mobile-First Design
- **Mobile is the primary experience** (farmers use phones in the field)
- All layouts must work on mobile first, enhance for desktop
- Minimum 44px touch targets (`py-3` or `p-4` on buttons)
- Single column on mobile → `md:grid-cols-2` for desktop
- Full-width buttons on mobile forms
- See [ui-patterns.md](.claude/ui-patterns.md#mobile-first-primary-target) for details

---

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

---

## Reference Documentation

**Read these ONLY when working on that specific area:**

| File | Read When... | Skip When... |
|------|--------------|--------------|
| [strings.md](.claude/strings.md) | Need string naming conventions | Just using existing strings |
| [crud-patterns.md](.claude/crud-patterns.md) | Creating new entity pages/forms | Styling or DB work |
| [ui-patterns.md](.claude/ui-patterns.md) | Need component API, styling | CRUD flow questions |
| [database.md](.claude/database.md) | Schema, triggers, direct queries | Frontend-only changes |
| [testing.md](.claude/testing.md) | Writing or running E2E tests | Not testing |

---

## Source of Truth

- `PRD.txt` - features, workflows, acceptance criteria
- `lib/strings.ts` - all UI strings
- Ask if requirements are unclear
