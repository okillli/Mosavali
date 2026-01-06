# Testing

> **When to read:** Writing or running E2E tests
> **Skip if:** Not testing

## E2E Tests (Playwright)

Location: `e2e/` directory

### Commands

```bash
npx playwright test              # Run all
npx playwright test --ui         # Interactive UI
npx playwright test --headed     # See browser
npx playwright test e2e/auth.spec.ts  # Single file
```

### Test Credentials

```
Email: elizbar.55@gmail.com
Password: 10091955
```

### Writing Tests

```typescript
import { test, expect } from '@playwright/test';

test('should create field', async ({ page }) => {
  // Login
  await page.goto('/');
  await page.fill('input[type="email"]', 'elizbar.55@gmail.com');
  await page.fill('input[type="password"]', '10091955');
  await page.click('button[type="submit"]');

  // Test
  await page.click('text=მიწები');
  await page.click('text=დაამატე');
  // ...
});
```

### Test Structure

```
e2e/
  auth.spec.ts      - Login/logout
  fields.spec.ts    - Field CRUD
  lots.spec.ts      - Lot operations
  sales.spec.ts     - Sales flow
```

## Component Testing

Use Vitest for unit/component tests if needed.
