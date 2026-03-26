#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# BIRDMAN API TEST SCRIPT
# Quick validation of all booking API endpoints
# ═══════════════════════════════════════════════════════════════════════════

# Configuration
BASE_URL="${API_BASE_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-your_cron_secret_here}"

echo "🦜 Birdman Booking API Test Suite"
echo "=================================="
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_api() {
  local test_name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local headers=$5
  
  echo -n "Testing: $test_name... "
  
  if [ -n "$data" ]; then
    if [ -n "$headers" ]; then
      response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -H "$headers" \
        -d "$data")
    else
      response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data")
    fi
  else
    if [ -n "$headers" ]; then
      response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
        -H "$headers")
    else
      response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
    fi
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  echo "$body" | jq . > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}PASSED${NC} (HTTP $http_code)"
    echo "$body" | jq .
    ((TESTS_PASSED++))
    echo ""
    return 0
  else
    echo -e "${RED}FAILED${NC} (HTTP $http_code)"
    echo "$body"
    ((TESTS_FAILED++))
    echo ""
    return 1
  fi
}

# ─── Test 1: Create Valid Booking ────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. CREATE BOOKING (Valid)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BOOKING_DATA='{
  "visitorName": "Test Visitor",
  "phone": "+91-9876543210",
  "email": "test@example.com",
  "numberOfGuests": 3,
  "bookingDate": "2026-06-15",
  "bookingTime": "06:00"
}'

response=$(test_api "Create valid booking" "POST" "/api/bookings" "$BOOKING_DATA")

# Extract booking ID for later tests
BOOKING_ID=$(echo "$response" | jq -r '.booking.id' 2>/dev/null)

if [ "$BOOKING_ID" != "null" ] && [ -n "$BOOKING_ID" ]; then
  echo -e "${YELLOW}Saved Booking ID: $BOOKING_ID${NC}"
  echo ""
fi

# ─── Test 2: Create Booking with Invalid Phone ───────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. CREATE BOOKING (Invalid Phone - Should Fail)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

INVALID_BOOKING='{
  "visitorName": "Test User",
  "phone": "invalid-phone",
  "email": "test@example.com",
  "numberOfGuests": 2,
  "bookingDate": "2026-06-15",
  "bookingTime": "06:00"
}'

test_api "Invalid phone format" "POST" "/api/bookings" "$INVALID_BOOKING"

# ─── Test 3: List All Bookings ───────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. LIST ALL BOOKINGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "List all bookings" "GET" "/api/bookings"

# ─── Test 4: List Bookings with Filters ──────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. LIST BOOKINGS (Filtered by Status)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "Filter by confirmed status" "GET" "/api/bookings?status=confirmed&limit=5"

# ─── Test 5: Get Single Booking ──────────────────────────────────────────────
if [ -n "$BOOKING_ID" ] && [ "$BOOKING_ID" != "null" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "5. GET SINGLE BOOKING"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  test_api "Get booking by ID" "GET" "/api/bookings/$BOOKING_ID"
fi

# ─── Test 6: Reschedule Booking ──────────────────────────────────────────────
if [ -n "$BOOKING_ID" ] && [ "$BOOKING_ID" != "null" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "6. RESCHEDULE BOOKING"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  RESCHEDULE_DATA='{
    "bookingDate": "2026-06-20",
    "bookingTime": "17:00"
  }'
  
  test_api "Reschedule booking" "PATCH" "/api/bookings/$BOOKING_ID" "$RESCHEDULE_DATA"
fi

# ─── Test 7: Cancel Booking ──────────────────────────────────────────────────
if [ -n "$BOOKING_ID" ] && [ "$BOOKING_ID" != "null" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "7. CANCEL BOOKING"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  test_api "Cancel booking" "DELETE" "/api/bookings/$BOOKING_ID"
fi

# ─── Test 8: Cron Job (Send Reminders) ───────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. CRON JOB (Send Reminders)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "Send reminders (authorized)" "GET" "/api/cron/send-reminders" "" "Authorization: Bearer $CRON_SECRET"

# ─── Test 9: Cron Job Unauthorized ───────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. CRON JOB (Unauthorized - Should Fail)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "Send reminders (no auth)" "GET" "/api/cron/send-reminders"

# ─── Summary ─────────────────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some tests failed. Check logs above.${NC}"
  exit 1
fi
