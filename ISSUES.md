# Mosavali Codebase Issues Report

This document contains issues found during code audit. Issues are prioritized by severity.

---

## Critical Issues

### 1. Warehouse Stock Query Missing `warehouse_id` in View

**File:** `app/app/warehouses/[id]/page.tsx:37-39`
**Related:** `supabase/migrations/02_logic.txt` (v_bin_lot_stock view)

**Problem:** The warehouse detail page queries stock by `warehouse_id`:
```typescript
const { data: s } = await supabase.from('v_bin_lot_stock')
    .select('*, lots(lot_code, crops(name_ka), varieties(name))')
    .eq('warehouse_id', id);
```

However, the `v_bin_lot_stock` view only contains: `farm_id, bin_id, lot_id, stock_kg`

**Impact:** This query will return empty results because `warehouse_id` doesn't exist in the view.

**Fix Required:** Either:
1. Modify the view to include `warehouse_id` by joining with `bins` table
2. Or modify the query to join with bins in the application layer

---

### 2. Sale Stock Selection Bug - Duplicate Lot IDs

**File:** `app/app/sales/new/page.tsx:114-117`

**Problem:** When selecting stock for sale, the code finds stock by `lot_id` only:
```typescript
onChange={e => {
    const item = stock.find(s => s.lot_id === e.target.value);
    if(item) handleStockSelect(item);
}}
```

But the same lot can exist in multiple bins (after transfers). The `option value` is only `lot_id`, not a composite key.

**Impact:** User may select wrong bin when the same lot exists in multiple locations.

**Fix Required:** Use composite key `lot_id + bin_id` for value:
```typescript
value={s.lot_id + '-' + s.bin_id}
```

---

## High Priority Issues

### 3. Missing Error Handling on Profile Fetch in `setAsCurrent`

**File:** `app/app/settings/seasons/page.tsx:51-56`

**Problem:** The `setAsCurrent` function doesn't handle profile fetch errors:
```typescript
const setAsCurrent = async (id: string) => {
    const { data: profile } = await supabase.from('profiles').select('farm_id').single();
    // If profile is null, the next line will fail silently or error
    await supabase.from('seasons').update({ is_current: false }).eq('farm_id', profile.farm_id);
```

**Impact:** If profile fetch fails, subsequent operations will fail without user feedback.

**Fix Required:** Add error handling similar to other form pages.

---

### 4. Null Reference Errors on Nested Properties

**Files:** Multiple detail and list pages

**Problem:** Many pages access nested properties without null checks:
- `lot.crops.name_ka` - `app/app/lots/page.tsx:38`
- `lot.varieties.name` - `app/app/lots/page.tsx:38`
- `work.work_types.name` - `app/app/works/page.tsx:37`
- `sale.buyers.name` - `app/app/sales/page.tsx:50`
- `item.bins.warehouses.name` - `app/app/reports/page.tsx:111`

**Impact:** If any foreign key relationship is null, the page will crash.

**Fix Required:** Add optional chaining (`?.`) for all nested property access:
```typescript
{lot.crops?.name_ka} - {lot.varieties?.name}
```

---

### 5. Bin Insert Missing farm_id Validation

**File:** `app/app/warehouses/[id]/page.tsx:46-52`

**Problem:** When adding a bin to a warehouse, there's no validation that the warehouse belongs to the current user's farm:
```typescript
const handleAddBin = async () => {
    if (!newBinName) return;
    setAddingBin(true);
    const { error } = await supabase.from('bins').insert({
        warehouse_id: id,
        name: newBinName
    });
```

**Impact:** RLS should protect this, but there's no user feedback if the operation fails due to RLS.

**Fix Required:** Add error handling for the insert operation.

---

## Medium Priority Issues

### 6. TypeScript `any` Types Everywhere

**Files:** All pages using Supabase data

**Problem:** Almost all state variables use `any[]` type:
```typescript
const [lots, setLots] = useState<any[]>([]);
const [works, setWorks] = useState<any[]>([]);
```

**Impact:** No compile-time type checking, making refactoring error-prone.

**Fix Required:** Use proper types from `types.ts` or create extended types for joined data.

---

### 7. Missing Loading States on List Pages

**Files:**
- `app/app/fields/page.tsx`
- `app/app/lots/page.tsx`
- `app/app/warehouses/page.tsx`
- `app/app/sales/page.tsx`

**Problem:** These pages don't show a loading indicator while fetching data. Only `works/page.tsx` and `expenses/page.tsx` have loading state.

**Impact:** Poor UX - users see empty list briefly before data loads.

**Fix Required:** Add loading state and show loading indicator.

---

### 8. Login Page Sign-Up Doesn't Handle Email Confirmation

**File:** `app/login/page.tsx:34-42`

**Problem:** The sign-up success message assumes registration is complete:
```typescript
if (error) {
    setError(error.message);
} else {
    setMessage('რეგისტრაცია წარმატებულია! გთხოვთ გაიაროთ ავტორიზაცია.');
    setIsSignUp(false);
}
```

**Impact:** If Supabase has email confirmation enabled, user won't know they need to confirm email first.

**Fix Required:** Check if email confirmation is required and update message accordingly.

---

### 9. Reports Page Nested Property Access Without Null Checks

**File:** `app/app/reports/page.tsx:109-114`

**Problem:** The stock table accesses deeply nested properties:
```typescript
<td className="px-6 py-3 font-medium">{item.bins.warehouses.name} - {item.bins.name}</td>
<td className="px-6 py-3">{item.lots.lot_code}</td>
<td className="px-6 py-3">{item.lots.crops.name_ka} / {item.lots.varieties.name}</td>
```

**Impact:** Will crash if any relationship is null.

**Fix Required:** Add optional chaining and fallback values.

---

## Low Priority Issues

### 10. Unused Import: `Tractor` in MobileNav

**File:** `components/MobileNav.tsx:4`

**Problem:** `Tractor` is imported but never used.

**Fix Required:** Remove unused import.

---

### 11. Hard-coded Georgian Strings Not in strings.ts

**Files:** Multiple pages

**Examples:**
- `"Loading..."` - Should be Georgian
- `"ჩანაწერები არ არის"` - Not in STRINGS
- `"ცარიელია"` - Not in STRINGS
- `"იტვირთება..."` - Not in STRINGS
- Various labels and placeholders

**Impact:** Inconsistent text management, harder to maintain.

**Fix Required:** Move all strings to `lib/strings.ts`.

---

### 12. Input Component Always Has mb-4 Margin

**File:** `components/ui/Input.tsx:10`

**Problem:** The Input component always adds `mb-4` margin:
```typescript
<div className="mb-4">
```

**Impact:** Sometimes this causes unwanted spacing (like in seasons settings where `className="mb-0"` is passed to override).

**Fix Required:** Make margin configurable via props or remove default margin.

---

## Fixed Issues (This Session)

1. **Typo in settings page** - Changed "Versio 1.0.0" to "ვერსია 1.0.0"
2. **Incorrect empty state text** - Removed `{STRINGS.SEARCH}...` from empty state messages in:
   - `fields/page.tsx`
   - `lots/page.tsx`
   - `warehouses/page.tsx`
   - `sales/page.tsx`

---

## Recommendations

1. **Add TypeScript strict mode** - Enable `strict: true` in tsconfig to catch type errors
2. **Create response types for Supabase queries** - Define types for joined data
3. **Implement error boundary** - Add React error boundary to catch and display errors gracefully
4. **Add form validation library** - Consider using react-hook-form or similar for consistent validation
5. **Add unit tests** - No tests exist currently; add tests for critical business logic
