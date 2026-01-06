# String Management

**All UI text must be in Georgian and come from `lib/strings.ts`**

## Rules

1. Check if string exists in `lib/strings.ts` before using
2. If not, ADD it first, then use the constant
3. Use descriptive names: `PAGE_BUYERS`, `DELETE_FIELD_CONFIRM`
4. Group with comments: `// Form labels`, `// Error messages`

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
- Status labels (PAID, UNPAID, PLANNED, COMPLETED)

## Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Page title | `PAGE_*` | `PAGE_BUYERS` |
| Delete confirm | `DELETE_*_CONFIRM` | `DELETE_FIELD_CONFIRM` |
| Error | `*_ERROR` | `SAVE_ERROR` |
| Not found | `*_NOT_FOUND` | `LOT_NOT_FOUND` |
| Placeholder | `*_PLACEHOLDER` | `BUYER_NAME_PLACEHOLDER` |
