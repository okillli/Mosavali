# Performance Patterns

This document covers performance optimization patterns used in the Mosavali application.

## Code Splitting

All authenticated pages are lazy loaded using `React.lazy()` to reduce initial bundle size:

```tsx
// index.tsx
const Dashboard = lazy(() => import('./app/app/page'));
const FieldsList = lazy(() => import('./app/app/fields/page'));
```

Pages are wrapped in a `Suspense` boundary with `PageLoader` as the fallback:

```tsx
<Suspense fallback={<PageLoader />}>
  {page}
</Suspense>
```

**Rules:**
- Landing and Login pages are eagerly loaded (needed for initial route)
- All `/app/*` routes are lazy loaded
- Each page becomes its own chunk in the production build

---

## Data Caching

### Master Data Hook

Use `useMasterData()` for reference data that rarely changes:

```tsx
import { useMasterData } from '@/lib/hooks';

function MyForm() {
  const { seasons, crops, fields, warehouses, workTypes, loading, refresh } = useMasterData();

  if (loading) return <PageLoader />;

  return (
    <Select
      options={seasons.map(s => ({ value: s.id, label: String(s.year) }))}
    />
  );
}
```

**Caching behavior:**
- Data is cached in `sessionStorage` under key `mosavali_master_data`
- Cache is automatically cleared on page reload or browser close
- Call `refresh()` to manually invalidate cache (e.g., after adding new season)

### User Profile Context

Use `useUser()` for user profile data:

```tsx
import { useUser } from '@/lib/contexts';

function MyComponent() {
  const { profile, loading } = useUser();

  // Access farm_id without extra query
  const farmId = profile?.farm_id;
}
```

**Setup:**
The `UserProvider` must wrap the app in `app/app/layout.tsx`:

```tsx
import { UserProvider } from '@/lib/contexts';

export default function AppLayout({ children }) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}
```

---

## Query Optimization

### List Pages

Always add `.limit()` to prevent loading too much data:

```tsx
const { data } = await supabase.from('items')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(50);
```

### Parallel Queries

Use `Promise.all()` for independent queries:

```tsx
const [fieldsRes, seasonsRes, cropsRes] = await Promise.all([
  supabase.from('fields').select('*'),
  supabase.from('seasons').select('*'),
  supabase.from('crops').select('*'),
]);
```

### Avoid N+1 Queries

**Bad - Sequential queries:**
```tsx
const { data: expense } = await supabase.from('expenses').select('*').eq('id', id).single();

// N+1: Additional query based on result
if (expense.allocation_type === 'FIELD') {
  await supabase.from('fields').select('name').eq('id', expense.target_id).single();
}
```

**Good - Use joins or parallel queries:**
```tsx
// Option 1: Join in single query
const { data } = await supabase.from('expenses')
  .select('*, fields(name), works(work_types(name)), lots(lot_code)')
  .eq('id', id)
  .single();

// Option 2: Parallel queries if needed
const [expense, fieldRes] = await Promise.all([
  supabase.from('expenses').select('*').eq('id', id).single(),
  supabase.from('fields').select('name').eq('id', targetId).single(),
]);
```

---

## React Memoization

### UI Components

Primitive UI components are wrapped with `React.memo`:

```tsx
// components/ui/Button.tsx
export const Button = React.memo<ButtonProps>(function Button({ variant, ...props }) {
  // ...
});
```

Components memoized:
- `Button`
- `Input`
- `Select`
- `TextArea`
- `MobileNav`

### Expensive Calculations

Use `useMemo` for array operations (reduce, filter, sort):

```tsx
// Good - memoized calculation
const totalHarvested = useMemo(
  () => lots.reduce((sum, l) => sum + l.harvested_kg, 0),
  [lots]
);

// In JSX
<span>{totalHarvested.toLocaleString()} კგ</span>
```

**When to use useMemo:**
- `reduce()` on arrays
- `filter()` or `sort()` on arrays
- Complex string formatting
- Derived/computed data from state

**When NOT to use useMemo:**
- Simple property access
- Already primitive values
- Rarely re-rendered components

### List Keys

Always use stable, unique IDs for list keys:

```tsx
// Good - unique ID
{items.map(item => (
  <div key={item.id}>...</div>
))}

// Good - composite key when no single ID
{stockItems.map(item => (
  <tr key={`${item.lot_id}-${item.bin_id}`}>...</tr>
))}

// Bad - array index (causes re-render issues)
{items.map((item, idx) => (
  <div key={idx}>...</div>  // Avoid!
))}
```

---

## Build Configuration

### Chunk Splitting

Vite is configured to split vendor chunks for better caching:

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-supabase': ['@supabase/supabase-js'],
        'vendor-icons': ['lucide-react'],
      }
    }
  }
}
```

### Production Settings

- Minification: `esbuild` (fast)
- Source maps: Disabled in production
- Chunk size warning: 300 kB

---

## Performance Testing

### Bundle Size

Run `npm run build` to check bundle sizes:

```bash
npm run build
# Check output for chunk sizes
```

Target sizes:
- Initial bundle: < 250 kB
- Individual page chunks: < 50 kB each
- Vendor chunks: ~150 kB total

### Runtime Performance

Add `data-testid` attributes for performance testing:

```tsx
<div data-testid="dashboard">...</div>
<div data-testid="fields-list">...</div>
<div data-testid="page-loader">...</div>
```

E2E tests can verify:
- Initial load time < 3 seconds
- Navigation between pages < 500ms
- Lazy loaded pages show loading state
