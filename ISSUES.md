# Mosavali Codebase Issues Report

This document contains issues found during code audit. Issues are prioritized by severity.

**Last Updated:** January 6, 2026

---

## Critical Issues

### 1. Warehouse Stock Query Missing `warehouse_id` in View - FIXED

**File:** `app/app/warehouses/[id]/page.tsx:37-39`
**Related:** `supabase/migrations/02_logic.txt` (v_bin_lot_stock view)

**Problem:** The warehouse detail page queries stock by `warehouse_id` but the view doesn't have this column.

**Fix Applied:** Changed to filter by `bin_id` using the warehouse's bin IDs with `.in('bin_id', binIds)` filter.

---

### 2. Sale Stock Selection Bug - Duplicate Lot IDs - FIXED

**File:** `app/app/sales/new/page.tsx:114-117`

**Problem:** When selecting stock for sale, the code used only `lot_id` but same lot can exist in multiple bins.

**Fix Applied:** Changed option value to composite key `${s.lot_id}|${s.bin_id}` and updated the `find()` logic to parse both values.

---

## High Priority Issues

### 3. Missing Error Handling on Profile Fetch in `setAsCurrent` - FIXED

**File:** `app/app/settings/seasons/page.tsx:51-56`

**Problem:** The `setAsCurrent` function didn't handle profile fetch errors.

**Fix Applied:** Added error handling with alert message when profile fetch fails.

---

### 4. Null Reference Errors on Nested Properties - FIXED

**Files:** Multiple detail and list pages

**Problem:** Many pages accessed nested properties without null checks.

**Fix Applied:** Added optional chaining (`?.`) and fallback values (`|| '-'`) to all nested property access:
- `app/app/lots/page.tsx`
- `app/app/works/page.tsx`
- `app/app/sales/page.tsx`
- `app/app/reports/page.tsx`
- `app/app/fields/[id]/page.tsx`
- `app/app/lots/[id]/page.tsx`
- `app/app/sales/[id]/page.tsx`
- `app/app/sales/new/page.tsx`
- `app/app/warehouses/[id]/page.tsx`
- `app/app/page.tsx` (dashboard)

---

### 5. Bin Insert Missing Error Feedback - FIXED

**File:** `app/app/warehouses/[id]/page.tsx:46-52`

**Problem:** When adding a bin, there was no error feedback if insert failed.

**Fix Applied:** Added error handling with console.error and alert message.

---

## Medium Priority Issues

### 6. TypeScript `any` Types Everywhere - FIXED

**Files:** All pages using Supabase data

**Problem:** Almost all state variables used `any[]` type.

**Fix Applied:** Added extended types in `types.ts` for Supabase joined queries:
- `WorkType`, `Work`, `Expense` base types
- `BinWithWarehouse`, `LotWithCropVariety`, `StockViewWithRelations`
- `SaleWithRelations`, `WorkWithRelations`, `VarietyWithCrop`, `ExpenseWithRelations`

Updated 17 page components with proper TypeScript types.

---

### 7. Missing Loading States on List Pages - FIXED

**Files:**
- `app/app/fields/page.tsx`
- `app/app/lots/page.tsx`
- `app/app/warehouses/page.tsx`
- `app/app/sales/page.tsx`

**Fix Applied:** Added `loading` state with Georgian "იტვირთება..." loading indicator.

---

### 8. Login Page Sign-Up Doesn't Handle Email Confirmation - DOCUMENTED (Not Fixed)

**File:** `app/login/page.tsx:34-42`

**Problem:** Success message assumes registration is complete, doesn't check for email confirmation.

**Status:** Not fixed - requires checking Supabase auth settings. Low impact if email confirmation is disabled.

---

### 9. Reports Page Nested Property Access - FIXED

**File:** `app/app/reports/page.tsx`

**Fix Applied:** Covered under Issue #4 - null reference fixes.

---

## Low Priority Issues

### 10. Unused Import: `Tractor` in MobileNav - FIXED

**File:** `components/MobileNav.tsx:4`

**Fix Applied:** Removed unused `Tractor` import.

---

### 11. Hard-coded Georgian Strings Not in strings.ts - FIXED

**Files:** Multiple pages

**Problem:** Many Georgian strings were hard-coded directly in components.

**Fix Applied:** Moved 25+ strings to `lib/strings.ts`:
- Loading states (`იტვირთება...`)
- Empty states (`ცარიელია`, `მონაცემები არ არის`)
- Profile errors (`პროფილის მონაცემები ვერ მოიძებნა`)
- Form placeholders and entity add errors
- UI labels across 29 page files

---

### 12. Input Component Always Has mb-4 Margin - FIXED

**File:** `components/ui/Input.tsx:10`

**Problem:** Input component always applied `mb-4` margin, requiring className overrides.

**Fix Applied:** Added `noMargin` prop to Input component. Updated 3 files to use `noMargin` prop instead of className overrides.

---

## Summary

| Priority | Total | Fixed | Documented |
|----------|-------|-------|------------|
| Critical | 2     | 2     | 0          |
| High     | 3     | 3     | 0          |
| Medium   | 4     | 3     | 1          |
| Low      | 3     | 3     | 0          |
| **Total**| **12**| **11**| **1**      |

## Previous Session Fixes

These were fixed in an earlier audit session:
- Typo "Versio 1.0.0" changed to "ვერსია 1.0.0"
- Removed incorrect `{STRINGS.SEARCH}...` from empty state messages

---

## Recommendations for Future Work

1. **TypeScript Strict Mode** - Enable `strict: true` in tsconfig
2. **Email Confirmation** - Update sign-up flow based on Supabase auth settings
