# String Management

> **When to read:** Adding ANY user-visible text to the UI
> **Skip if:** Reading/debugging existing code, no new text being added

**All UI text must be in Georgian and come from `lib/strings.ts`**

## Workflow

1. Check if string exists in `lib/strings.ts`
2. If not, ADD it first with descriptive name
3. Import and use the constant

## Usage

```typescript
import { STRINGS } from '../../lib/strings';

// ✅ GOOD
<div>{STRINGS.LOADING}</div>
<button>{STRINGS.ADD}</button>
alert(STRINGS.SAVE_ERROR);

// ❌ BAD - never hardcode
<div>იტვირთება...</div>
<button>დამატება</button>
```

## What Goes in strings.ts

- Page titles, headers
- Button labels
- Form labels, placeholders
- Error/success messages
- Empty states
- Confirmation dialogs
- Table headers
- Status labels

## Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Page title | `PAGE_*` | `PAGE_BUYERS` |
| Delete confirm | `DELETE_*_CONFIRM` | `DELETE_FIELD_CONFIRM` |
| Error | `*_ERROR` | `SAVE_ERROR` |
| Not found | `*_NOT_FOUND` | `LOT_NOT_FOUND` |
| Placeholder | `*_PLACEHOLDER` | `BUYER_NAME_PLACEHOLDER` |

## Grouping

Add comments to group related strings:
```typescript
// Form labels
WEIGHT: 'წონა',
SALE_DATE: 'გაყიდვის თარიღი',

// Error messages
SAVE_ERROR: 'შენახვა ვერ მოხერხდა',
```
