# Calendar Page Test Coverage

This directory contains comprehensive test coverage for the Calendar Management System.

## Test Files

### Component Tests

#### `calendar/CalendarGrid.test.tsx`
Tests for the main calendar grid component that displays the month view.

**Coverage:**
- Loading skeleton display
- Monthly data fetching from API
- Weekday headers rendering
- Calendar cell rendering with booking data
- Cell click interactions
- Month change triggers refetch
- API error handling
- 42-cell grid generation (6 weeks)
- Default values for dates without data

#### `calendar/CalendarCell.test.tsx`
Tests for individual date cells in the calendar grid.

**Coverage:**
- Date number display
- Color coding based on capacity (white, light green, dark green, gray)
- Booking count display with Feather icon
- Capacity display when ≥90%
- Disabled overlay for past/closed dates
- Click handlers
- Disabled state for non-current month dates
- Today ring indicator
- Opacity for non-current month
- Text color variations
- Hover effects
- Responsive heights

#### `calendar/CalendarHeader.test.tsx`
Tests for the calendar navigation header.

**Coverage:**
- Month and year display
- Previous/Next month buttons
- Today button
- Button click handlers
- Calendar legend rendering
- Month update on prop change
- Navigation icons
- Responsive layout

#### `calendar/DayDetailsModal.test.tsx`
Tests for the day details modal with form controls.

**Coverage:**
- Modal visibility control
- Body scroll lock/unlock
- Day details fetching
- Date formatting in header
- Booking statistics display
- Toggle component for open/closed status
- Time picker for operating hours
- Range slider for capacity
- Close button functionality
- Backdrop click to close
- Save functionality with API call
- Error handling for save failures
- Loading skeleton
- Fetch error handling
- Dynamic percentage calculation
- Status card color (normal vs full)

### Page Tests

#### `pages/calendar-page.test.tsx`
Integration tests for the main calendar page.

**Coverage:**
- Header, grid, and legend rendering
- Current month display
- Month navigation (previous/next)
- Day click opens modal
- Modal close functionality
- Calendar refresh after save
- Selected date state management
- Calendar update on month change
- Layout structure
- Refresh key increment

### API Tests

#### `api/calendar.test.ts`
Tests for all calendar API endpoints.

**Coverage:**

**GET /api/calendar/month:**
- Valid year/month returns stats
- Missing parameters validation
- Year range validation (2000-2100)
- Month range validation (1-12)
- Database error handling

**GET /api/calendar/day/[date]:**
- Valid date returns details
- Invalid date format validation
- Invalid date value validation
- Database error handling
- Next.js 15+ params Promise handling

**GET /api/calendar/settings:**
- Valid date returns settings
- Missing date parameter validation

**POST /api/calendar/settings:**
- Valid data saves successfully
- Missing date validation
- Invalid capacity validation
- Time format normalization (HH:MM → HH:MM:SS)

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test CalendarGrid.test.tsx

# Run tests in watch mode
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run CI tests
npm run test:ci
```

## Test Utilities

Tests use the following utilities from `__tests__/helpers/test-utils.ts`:
- Mock data generators
- Date utilities
- Custom render functions

## Mocking Strategy

- **Components**: Child components are mocked in parent tests to isolate behavior
- **API Calls**: `global.fetch` is mocked to avoid real API calls
- **Database**: Query functions from `@/lib/db/queries` are mocked
- **Toast**: Sonner toast is mocked to verify notifications
- **Icons**: Lucide React icons render as SVG elements in tests

## Coverage Goals

- **Components**: 80%+ line coverage
- **API Routes**: 90%+ line coverage
- **Integration**: All user workflows covered

## Known Test Considerations

1. **Timezone Handling**: Tests use local date formatting to match production behavior
2. **Next.js 15+ Params**: API tests account for params being Promises in dynamic routes
3. **Modal Scroll Lock**: Tests verify body overflow manipulation
4. **Smart Positioning**: TimePicker dropdown positioning not directly tested (requires DOM measurements)
