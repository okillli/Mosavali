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

Set these environment variables in `.env.local`:
- `E2E_TEST_EMAIL` - Test user email
- `E2E_TEST_PASSWORD` - Test user password

See `.env.example` for template.

### Writing Tests

```typescript
import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

test('should create field', async ({ page }) => {
  // Login using centralized auth helper
  await login(page);

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
