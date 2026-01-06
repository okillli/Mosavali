# Testing

## E2E Tests (Playwright)

Location: `e2e/` directory

### Run Tests

```bash
npx playwright test              # Run all tests
npx playwright test --ui         # Interactive UI mode
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
  // Login first
  await page.goto('/');
  await page.fill('input[type="email"]', 'elizbar.55@gmail.com');
  await page.fill('input[type="password"]', '10091955');
  await page.click('button[type="submit"]');

  // Navigate and test
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
  ...
```

## Component Testing

For unit/component tests, use Vitest if needed.
