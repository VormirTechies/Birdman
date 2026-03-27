# Testing Directory

This directory contains all unit, component, and integration tests for the Birdman of Chennai application.

## Structure

```
__tests__/
├── api/                  # API route tests
├── components/           # React component tests  
├── helpers/              # Test utilities & mocks
└── lib/                  # Business logic tests
```

## Running Tests

```bash
# Watch mode
npm run test

# UI mode
npm run test:ui

# Coverage
npm run test:coverage
```

## Writing Tests

See [TESTING.md](../TESTING.md) for comprehensive testing guide.

### Quick Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Test Utilities

Import test helpers from `helpers/test-utils.ts`:

```typescript
import { mockSession, mockBooking, getFutureDate } from './helpers/test-utils';
```

---

**Every test is a visitor's expectation. 🦜**
