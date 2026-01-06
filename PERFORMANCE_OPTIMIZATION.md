# Performance Optimization Plan

## Executive Summary

This document outlines a comprehensive performance optimization plan for the Mosavali farm management application. The app currently suffers from slow load times due to a monolithic 516 kB JavaScript bundle, inefficient data fetching patterns, and missing React optimizations.

**Key Metrics to Improve:**
- Initial bundle size: 516 kB → ~200 kB (60% reduction)
- Time to Interactive: ~3-4s → ~1-1.5s
- Supabase queries per page: 3-8 → 1-3
- React re-renders: Excessive → Minimal

---

## Table of Contents

1. [Analysis Summary](#1-analysis-summary)
2. [Implementation Phases](#2-implementation-phases)
3. [Phase 1: Code Splitting](#3-phase-1-code-splitting)
4. [Phase 2: Data Fetching Optimizations](#4-phase-2-data-fetching-optimizations)
5. [Phase 3: React Component Optimizations](#5-phase-3-react-component-optimizations)
6. [Phase 4: Build Configuration](#6-phase-4-build-configuration)
7. [Dependency Decisions](#7-dependency-decisions)
8. [Testing Strategy](#8-testing-strategy)
9. [Guideline Updates](#9-guideline-updates)
10. [Rollback Plan](#10-rollback-plan)

---

## 1. Analysis Summary

### Current Issues

| Category | Issue | Impact | Priority |
|----------|-------|--------|----------|
| Bundle | All 33 pages eagerly imported | 516 kB single chunk | Critical |
| Bundle | Tailwind loaded from CDN | Extra 60 kB + latency | High |
| Data | No pagination on list/report pages | Memory + query time | High |
| Data | N+1 queries in expense detail | 4 sequential queries | High |
| Data | Master data re-fetched per form | Duplicate queries | Medium |
| React | Missing useMemo for reduce operations | Re-computation on render | Medium |
| React | Inline onClick handlers | Breaks memoization | Medium |
| React | Index-based keys in lists | Inefficient reconciliation | Low |
| Build | No chunk splitting configured | Large vendor bundle | Medium |

### Files Most Affected

| File | Lines | Issues |
|------|-------|--------|
| `index.tsx` | 157 | All imports eagerly loaded |
| `app/app/reports/page.tsx` | 178 | No pagination, reduce in render |
| `app/app/expenses/[id]/page.tsx` | 161 | N+1 query pattern |
| `app/app/fields/[id]/page.tsx` | 205 | Reduce in render, inline handlers |
| `components/ui/Button.tsx` | 22 | Missing React.memo |

---

## 2. Implementation Phases

### Phase Order and Dependencies

```
Phase 1: Code Splitting (index.tsx)
    ↓
Phase 2: Data Fetching (hooks, pages)
    ↓
Phase 3: React Optimizations (components, pages)
    ↓
Phase 4: Build Configuration (vite.config.ts, index.html)
```

### Risk Assessment

| Phase | Risk Level | Rollback Complexity |
|-------|------------|---------------------|
| Phase 1 | Medium | Easy - revert index.tsx |
| Phase 2 | Low | Easy - revert individual files |
| Phase 3 | Low | Easy - remove memo wrappers |
| Phase 4 | Medium | Easy - revert config files |

---

## 3. Phase 1: Code Splitting

### 3.1 Objective

Convert eager imports to lazy imports using `React.lazy()` and `Suspense`.

### 3.2 Current State

```tsx
// index.tsx - ALL pages imported at top level
import Dashboard from './app/app/page';
import FieldsList from './app/app/fields/page';
import NewFieldPage from './app/app/fields/new/page';
// ... 30+ more imports
```

### 3.3 Target State

```tsx
// index.tsx - Dynamic imports with lazy loading
const Dashboard = lazy(() => import('./app/app/page'));
const FieldsList = lazy(() => import('./app/app/fields/page'));
const NewFieldPage = lazy(() => import('./app/app/fields/new/page'));

// Wrap with Suspense in Router
<Suspense fallback={<PageLoader />}>
  {page}
</Suspense>
```

### 3.4 Implementation Steps

1. **Create PageLoader component** (`components/PageLoader.tsx`)
   - Simple spinner with Georgian text
   - Matches app styling (green theme)

2. **Convert all page imports to lazy()**
   - Keep Landing and Login eager (initial route)
   - Lazy load all `/app/*` routes

3. **Add Suspense boundary in Router**
   - Single boundary around `renderContent()`
   - Use PageLoader as fallback

4. **Test each route loads correctly**

### 3.5 Best Practice Validation

| Practice | Followed? | Notes |
|----------|-----------|-------|
| Error boundary around Suspense | Yes | Already exists |
| Meaningful loading state | Yes | PageLoader shows spinner |
| Preload critical routes | Consider | Dashboard could preload on auth |
| Named exports work with lazy | Verify | All pages use default export |

### 3.6 Affected Files

- `index.tsx` (major refactor)
- `components/PageLoader.tsx` (new file)

---

## 4. Phase 2: Data Fetching Optimizations

### 4.1 Objective

Reduce database queries through caching, pagination, and query optimization.

### 4.2 Changes

#### 4.2.1 Master Data Hook

**Problem:** Seasons, crops, fields, work types fetched repeatedly on every form.

**Solution:** Create `useMasterData()` hook that caches data at app level.

```tsx
// lib/hooks/useMasterData.ts
export function useMasterData() {
  const [data, setData] = useState<MasterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Check sessionStorage cache first
      const cached = sessionStorage.getItem('masterData');
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const [seasons, crops, fields, warehouses, workTypes] = await Promise.all([
        supabase.from('seasons').select('*').order('year', { ascending: false }),
        supabase.from('crops').select('*'),
        supabase.from('fields').select('id, name'),
        supabase.from('warehouses').select('id, name'),
        supabase.from('work_types').select('*'),
      ]);

      const masterData = {
        seasons: seasons.data || [],
        crops: crops.data || [],
        fields: fields.data || [],
        warehouses: warehouses.data || [],
        workTypes: workTypes.data || [],
        loadedAt: Date.now(),
      };

      sessionStorage.setItem('masterData', JSON.stringify(masterData));
      setData(masterData);
      setLoading(false);
    };

    load();
  }, []);

  const refresh = () => {
    sessionStorage.removeItem('masterData');
    // Trigger reload
  };

  return { ...data, loading, refresh };
}
```

**Files to Update:**
- `app/app/expenses/new/page.tsx`
- `app/app/expenses/[id]/edit/page.tsx`
- `app/app/lots/new/page.tsx`
- `app/app/lots/[id]/edit/page.tsx`
- `app/app/works/new/page.tsx`
- `app/app/works/[id]/edit/page.tsx`
- `app/app/sales/new/page.tsx`

#### 4.2.2 User Profile Context

**Problem:** Profile fetched on every form submission to get `farm_id`.

**Solution:** Store profile in React Context on auth.

```tsx
// lib/contexts/UserContext.tsx
export const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').single();
      setProfile(data);
    };
    loadProfile();
  }, []);

  return (
    <UserContext.Provider value={{ profile }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
```

**Files to Update:**
- `app/app/layout.tsx` - Wrap with UserProvider
- All form pages that fetch profile

#### 4.2.3 Pagination for List Pages

**Problem:** Lists load ALL records with no limit.

**Solution:** Add `.limit(50)` to list queries. Full pagination can be Phase 2.5 if needed.

**Files to Update:**
- `app/app/fields/page.tsx` - Add `.limit(50)`
- `app/app/lots/page.tsx` - Add `.limit(50)`
- `app/app/sales/page.tsx` - Add `.limit(50)`
- `app/app/works/page.tsx` - Add `.limit(50)`
- `app/app/expenses/page.tsx` - Add `.limit(50)`
- `app/app/warehouses/page.tsx` - Add `.limit(50)`

#### 4.2.4 Fix N+1 in Expense Detail

**Problem:** Expense detail makes up to 4 sequential queries.

**Solution:** Fetch all possible targets in parallel.

```tsx
// Current: Sequential
if (type === 'FIELD') await supabase.from('fields')...
else if (type === 'WORK') await supabase.from('works')...
else if (type === 'LOT') await supabase.from('lots')...

// Fixed: Parallel with Promise.all
const [fieldRes, workRes, lotRes] = await Promise.all([
  type === 'FIELD' ? supabase.from('fields').select('name').eq('id', targetId).single() : null,
  type === 'WORK' ? supabase.from('works').select('work_types(name), fields(name)').eq('id', targetId).single() : null,
  type === 'LOT' ? supabase.from('lots').select('lot_code').eq('id', targetId).single() : null,
]);
```

**Files to Update:**
- `app/app/expenses/[id]/page.tsx`

#### 4.2.5 Reports Page Optimization

**Problem:** Fetches ALL sales, expenses, and lots for aggregation.

**Solution:** Use database aggregation instead of client-side reduce.

**Option A (Preferred):** Create a database view or RPC for aggregates.
**Option B (Simpler):** Keep current approach but add reasonable limits.

For Phase 2, we'll use Option B with limits. View can be added later if needed.

**Files to Update:**
- `app/app/reports/page.tsx` - Add limits, memoize calculations

### 4.3 Best Practice Validation

| Practice | Decision | Rationale |
|----------|----------|-----------|
| Cache invalidation | Session-based | Simple, cleared on logout/refresh |
| Context vs prop drilling | Context for profile | Used everywhere, rarely changes |
| Pagination vs infinite scroll | Simple limit first | Farmers unlikely to have 100s of records |
| Database aggregation | Defer | Adds complexity, current data volume is small |

---

## 5. Phase 3: React Component Optimizations

### 5.1 Objective

Reduce unnecessary re-renders through memoization.

### 5.2 Changes

#### 5.2.1 Memoize UI Components

**Components to wrap with React.memo:**

```tsx
// components/ui/Button.tsx
export const Button = React.memo<ButtonProps>(({ variant = 'primary', ...props }) => {
  // ... existing code
});

// components/ui/Input.tsx
export const Input = React.memo<InputProps>(({ label, error, ...props }) => {
  // ... existing code
});

// components/ui/Select.tsx
export const Select = React.memo<SelectProps>(({ label, options, ...props }) => {
  // ... existing code
});

// components/MobileNav.tsx
export const MobileNav = React.memo(() => {
  // ... existing code
});
```

**Files to Update:**
- `components/ui/Button.tsx`
- `components/ui/Input.tsx`
- `components/ui/Select.tsx`
- `components/ui/TextArea.tsx`
- `components/MobileNav.tsx`

#### 5.2.2 Memoize Expensive Calculations

**Problem:** Reduce operations happen on every render.

```tsx
// Current (app/app/fields/[id]/page.tsx:146)
{lots.reduce((sum, l) => sum + l.harvested_kg, 0).toLocaleString()}

// Fixed
const totalHarvested = useMemo(
  () => lots.reduce((sum, l) => sum + l.harvested_kg, 0),
  [lots]
);
// Then in JSX: {totalHarvested.toLocaleString()}
```

**Files to Update:**
- `app/app/fields/[id]/page.tsx` - Memoize harvest total
- `app/app/reports/page.tsx` - Memoize totalKg, financials
- `app/app/works/[id]/page.tsx` - Memoize expense total

#### 5.2.3 Fix List Keys

**Problem:** Using array index as key.

```tsx
// Current (app/app/reports/page.tsx:117)
{stock.map((item, idx) => <tr key={idx}>...)}

// Fixed - use unique ID
{stock.map((item) => <tr key={`${item.lot_id}-${item.bin_id}`}>...)}
```

**Files to Update:**
- `app/app/reports/page.tsx` - Use composite key for stock items
- `app/app/lots/[id]/page.tsx` - Use item.bin_id or similar

#### 5.2.4 Extract Inline Handlers (Selective)

**Decision:** Only extract handlers that are passed to memoized children or cause measurable re-renders. Simple inline handlers are acceptable.

**Do NOT change:**
- Simple `onClick={() => router.push(...)}` - Acceptable pattern
- Tab switching handlers - Not performance critical

**Consider changing if performance testing shows issues:**
- Handlers passed to mapped list items
- Handlers in frequently re-rendered components

### 5.3 Best Practice Validation

| Practice | Decision | Rationale |
|----------|----------|-----------|
| Wrap all components in memo | No | Only wrap primitives and hot paths |
| useCallback everywhere | No | Adds complexity, measure first |
| useMemo for all calculations | Selective | Only expensive operations |
| Fix all index keys | Yes | Low effort, prevents subtle bugs |

---

## 6. Phase 4: Build Configuration

### 6.1 Objective

Optimize production bundle through proper Vite configuration.

### 6.2 Changes

#### 6.2.1 Remove Tailwind CDN

**Current (`index.html:7`):**
```html
<script src="https://cdn.tailwindcss.com"></script>
```

**Problem:**
- Loads full Tailwind JIT compiler (~60 kB)
- No tree-shaking of unused classes
- CDN dependency (latency, reliability)

**Solution:** We're already loading styles via `index.css`. The CDN is redundant.

**Action:** Remove the CDN script tag.

**Verification:**
- Build app and verify all styles work
- Compare bundle size before/after

#### 6.2.2 Clean Up index.html

**Current issues:**
- Duplicate script tag for index.tsx (lines 27-28)
- Import map references React 18 but we use React 19
- Import map is unused in Vite build

**Action:** Simplify to:
```html
<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>მოსავალი (Harvest)</title>
  <link rel="stylesheet" href="/index.css">
</head>
<body class="bg-gray-50 text-gray-900 font-sans min-h-screen">
  <div id="root"></div>
  <script type="module" src="/index.tsx"></script>
</body>
</html>
```

#### 6.2.3 Add Vite Build Optimizations

**Add to `vite.config.ts`:**

```typescript
build: {
  // Enable minification
  minify: 'esbuild',

  // Disable source maps in production
  sourcemap: false,

  // Split chunks for better caching
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-supabase': ['@supabase/supabase-js'],
        'vendor-icons': ['lucide-react'],
      }
    }
  },

  // Report compressed size
  reportCompressedSize: true,
}
```

#### 6.2.4 Simplify Environment Variables

**Current:** 8 env variable definitions with NEXT_PUBLIC_ and VITE_ prefixes.

**Simplified:**
```typescript
define: {
  'process.env.SUPABASE_URL': JSON.stringify(getEnv('VITE_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL')),
  'process.env.SUPABASE_ANON_KEY': JSON.stringify(getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')),
}
```

Then update `lib/supabaseClient.ts` to use simplified names.

### 6.3 Best Practice Validation

| Practice | Decision | Rationale |
|----------|----------|-----------|
| Remove unused dependencies | Defer | Next.js removal is separate task |
| Enable tree-shaking | Yes (default) | Vite handles this |
| Vendor chunk splitting | Yes | Better cache utilization |
| CSS code splitting | Default | Vite handles this |

---

## 7. Dependency Decisions

### 7.1 Next.js Dependency

**Current state:** Next.js is installed but only used for:
- Type definitions (useRouter, useParams)
- Shimmed via aliases in vite.config.ts

**Decision:** Keep for now, remove in separate cleanup task.

**Rationale:**
- Removal requires updating all imports
- Risk of breaking something
- Not blocking performance improvements
- Can be done after optimizations are verified

### 7.2 Tailwind

**Current state:**
- CDN script in index.html (should remove)
- Tailwind classes used throughout codebase
- No tailwind.config.js or PostCSS setup

**Decision:** Remove CDN, rely on Vite's CSS handling.

**Note:** The CDN is actually not needed because Vite processes the Tailwind classes at build time via the CSS file. The CDN was likely added during initial development.

---

## 8. Testing Strategy

### 8.1 Performance Tests

Create new test file: `e2e/performance.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('initial page load under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/#/app');
    await page.waitForSelector('[data-testid="dashboard"]');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(3000);
  });

  test('navigation between pages is instant', async ({ page }) => {
    await page.goto('/#/app');
    await page.waitForSelector('[data-testid="dashboard"]');

    const start = Date.now();
    await page.click('a[href="#/app/fields"]');
    await page.waitForSelector('[data-testid="fields-list"]');
    const navTime = Date.now() - start;

    expect(navTime).toBeLessThan(500);
  });

  test('lazy loaded pages show loading state', async ({ page }) => {
    // Clear cache to force lazy load
    await page.goto('/#/app/reports');

    // Should briefly show loading
    // Then show content
    await page.waitForSelector('[data-testid="reports-page"]');
  });
});
```

### 8.2 Regression Tests

Verify existing functionality still works:

```typescript
test.describe('Regression after optimization', () => {
  test('can create and view a field', async ({ page }) => {
    // Existing test should pass
  });

  test('can create and view a sale', async ({ page }) => {
    // Existing test should pass
  });

  test('reports page displays data correctly', async ({ page }) => {
    // Verify memoization didn't break rendering
  });

  test('master data loads correctly in forms', async ({ page }) => {
    // Verify useMasterData hook works
  });
});
```

### 8.3 Bundle Size Verification

Add npm script:

```json
{
  "scripts": {
    "build:analyze": "vite build && npx vite-bundle-visualizer"
  }
}
```

Document expected sizes:
- Before: ~516 kB total
- After: ~200-250 kB initial, additional chunks on navigation

### 8.4 Test Data IDs

Add data-testid attributes to key elements:

| Element | data-testid |
|---------|-------------|
| Dashboard container | dashboard |
| Fields list | fields-list |
| Reports page | reports-page |
| Page loader | page-loader |
| Form submit buttons | submit-{entity} |

---

## 9. Guideline Updates

### 9.1 CLAUDE.md Updates

Add new section on performance:

```markdown
## Performance Guidelines

### Code Splitting
- All pages in `/app/app/` are lazy loaded via React.lazy()
- Use PageLoader component for Suspense fallback
- Landing and Login pages are eagerly loaded

### Data Fetching
- Use `useMasterData()` hook for seasons, crops, fields, etc.
- Use `useUser()` hook for profile/farm_id
- Add `.limit(50)` to list queries
- Use `Promise.all()` for parallel queries

### React Optimizations
- UI components (Button, Input, Select) are memoized
- Use `useMemo` for expensive calculations (reduce, filter, sort)
- Use stable keys (IDs) not array indices
```

### 9.2 UI Patterns Update

Add to `.claude/ui-patterns.md`:

```markdown
## Performance

### Memoization
UI primitive components are wrapped with React.memo:
- Button, Input, Select, TextArea

### Expensive Calculations
Wrap with useMemo when:
- reduce() on arrays
- filter() or sort() on arrays
- Complex formatting

```tsx
const total = useMemo(
  () => items.reduce((sum, i) => sum + i.amount, 0),
  [items]
);
```
```

### 9.3 New File: .claude/performance.md

Create dedicated performance documentation:

```markdown
# Performance Patterns

## Lazy Loading

Pages are lazy loaded via React.lazy():
```tsx
const MyPage = lazy(() => import('./path/to/page'));
```

## Data Caching

### Master Data
Use `useMasterData()` hook for reference data:
```tsx
const { seasons, crops, fields, loading } = useMasterData();
```

Cached in sessionStorage, refreshed on:
- Manual refresh() call
- Page reload
- Logout

### User Profile
Use `useUser()` hook:
```tsx
const { profile } = useUser();
const farmId = profile?.farm_id;
```

## Query Optimization

### List Pages
Always add limit:
```tsx
const { data } = await supabase.from('items')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(50);
```

### Parallel Queries
Use Promise.all for independent queries:
```tsx
const [fields, seasons] = await Promise.all([
  supabase.from('fields').select('*'),
  supabase.from('seasons').select('*'),
]);
```

## Memoization

### When to use useMemo
- Array aggregations (reduce, filter, sort)
- Expensive string formatting
- Derived data from state

### When NOT to use useMemo
- Simple property access
- Already primitive values
- Rarely re-rendered components
```

---

## 10. Rollback Plan

### Per-Phase Rollback

| Phase | Rollback Steps |
|-------|----------------|
| Phase 1 | Revert index.tsx to eager imports, remove PageLoader |
| Phase 2 | Revert individual files, remove hooks |
| Phase 3 | Remove React.memo wrappers, revert useMemo |
| Phase 4 | Revert vite.config.ts, restore index.html |

### Git Strategy

```bash
# Before each phase
git checkout -b perf/phase-1-code-splitting

# After phase completion and testing
git checkout master
git merge perf/phase-1-code-splitting

# If issues found
git revert HEAD  # or specific commit
```

### Verification After Rollback

1. Run full test suite: `npm test`
2. Manual smoke test of key flows
3. Verify bundle size matches previous

---

## Implementation Checklist

### Phase 1: Code Splitting
- [ ] Create PageLoader component
- [ ] Convert all page imports to lazy()
- [ ] Add Suspense boundary in Router
- [ ] Add data-testid to key elements
- [ ] Test all routes load correctly
- [ ] Verify error boundary still works
- [ ] Measure bundle size improvement

### Phase 2: Data Fetching
- [ ] Create useMasterData hook
- [ ] Create UserContext and useUser hook
- [ ] Update AppLayout to provide UserContext
- [ ] Update all form pages to use hooks
- [ ] Add .limit(50) to list pages
- [ ] Fix N+1 in expense detail
- [ ] Test all forms still work
- [ ] Test data caching works

### Phase 3: React Optimizations
- [ ] Wrap UI components with React.memo
- [ ] Add useMemo to expensive calculations
- [ ] Fix index-based keys
- [ ] Verify no visual regressions
- [ ] Profile with React DevTools

### Phase 4: Build Configuration
- [ ] Remove Tailwind CDN from index.html
- [ ] Clean up duplicate script tags
- [ ] Add build optimizations to vite.config.ts
- [ ] Simplify environment variables
- [ ] Run production build
- [ ] Verify all styles work
- [ ] Measure final bundle size

### Documentation
- [ ] Update CLAUDE.md
- [ ] Update .claude/ui-patterns.md
- [ ] Create .claude/performance.md
- [ ] Add performance tests
- [ ] Document bundle size before/after

---

## Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial bundle | < 250 kB | `npm run build` output |
| TTI | < 2 seconds | Lighthouse or manual |
| Queries per page | < 3 average | Network tab |
| Test pass rate | 100% | `npm test` |
| Visual regressions | 0 | Manual review |
