# ═══════════════════════════════════════════════════════════════════════════
# BIRDMAN API TEST SCRIPT (PowerShell)
# Quick validation of all booking API endpoints
# ═══════════════════════════════════════════════════════════════════════════

# Configuration
$BASE_URL = if ($env:API_BASE_URL) { $env:API_BASE_URL } else { "http://localhost:3000" }
$CRON_SECRET = if ($env:CRON_SECRET) { $env:CRON_SECRET } else { "your_cron_secret_here" }

Write-Host "🦜 Birdman Booking API Test Suite" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Base URL: $BASE_URL`n"

$TestsPassed = 0
$TestsFailed = 0

# Function to test endpoint
function Test-API {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Endpoint,
        [string]$Data = "",
        [hashtable]$Headers = @{}
    )
    
    Write-Host "Testing: $TestName... " -NoNewline
    
    $Uri = "$BASE_URL$Endpoint"
    $AllHeaders = @{ "Content-Type" = "application/json" }
    foreach ($key in $Headers.Keys) {
        $AllHeaders[$key] = $Headers[$key]
    }
    
    try {
        if ($Data) {
            $Response = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $AllHeaders -Body $Data -ErrorAction Stop
        } else {
            $Response = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $AllHeaders -ErrorAction Stop
        }
        
        $StatusCode = $Response.StatusCode
        $Body = $Response.Content | ConvertFrom-Json
        
        Write-Host "PASSED" -ForegroundColor Green
        Write-Host " (HTTP $StatusCode)"
        $Body | ConvertTo-Json -Depth 10
        Write-Host ""
        
        $script:TestsPassed++
        return $Body
    } catch {
        Write-Host "FAILED" -ForegroundColor Red
        Write-Host " (HTTP $($_.Exception.Response.StatusCode.value__))"
        Write-Host $_.Exception.Message -ForegroundColor Yellow
        Write-Host ""
        
        $script:TestsFailed++
        return $null
    }
}

# ─── Test 1: Create Valid Booking ────────────────────────────────────────────
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "1. CREATE BOOKING (Valid)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

$BookingData = @{
    visitorName = "Test Visitor"
    phone = "+91-9876543210"
    email = "test@example.com"
    numberOfGuests = 3
    bookingDate = "2026-06-15"
    bookingTime = "06:00"
} | ConvertTo-Json

$CreateResponse = Test-API -TestName "Create valid booking" -Method "POST" -Endpoint "/api/bookings" -Data $BookingData

$BookingId = $CreateResponse.booking.id
if ($BookingId) {
    Write-Host "Saved Booking ID: $BookingId`n" -ForegroundColor Cyan
}

# ─── Test 2: Create Booking with Invalid Phone ───────────────────────────────
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "2. CREATE BOOKING (Invalid Phone - Should Fail)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

$InvalidBooking = @{
    visitorName = "Test User"
    phone = "invalid-phone"
    email = "test@example.com"
    numberOfGuests = 2
    bookingDate = "2026-06-15"
    bookingTime = "06:00"
} | ConvertTo-Json

Test-API -TestName "Invalid phone format" -Method "POST" -Endpoint "/api/bookings" -Data $InvalidBooking

# ─── Test 3: List All Bookings ───────────────────────────────────────────────
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "3. LIST ALL BOOKINGS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Test-API -TestName "List all bookings" -Method "GET" -Endpoint "/api/bookings"

# ─── Test 4: List Bookings with Filters ──────────────────────────────────────
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "4. LIST BOOKINGS (Filtered by Status)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Test-API -TestName "Filter by confirmed status" -Method "GET" -Endpoint "/api/bookings?status=confirmed&limit=5"

# ─── Test 5: Get Single Booking ──────────────────────────────────────────────
if ($BookingId) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "5. GET SINGLE BOOKING" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    
    Test-API -TestName "Get booking by ID" -Method "GET" -Endpoint "/api/bookings/$BookingId"
}

# ─── Test 6: Reschedule Booking ──────────────────────────────────────────────
if ($BookingId) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "6. RESCHEDULE BOOKING" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    
    $RescheduleData = @{
        bookingDate = "2026-06-20"
        bookingTime = "17:00"
    } | ConvertTo-Json
    
    Test-API -TestName "Reschedule booking" -Method "PATCH" -Endpoint "/api/bookings/$BookingId" -Data $RescheduleData
}

# ─── Test 7: Cancel Booking ──────────────────────────────────────────────────
if ($BookingId) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "7. CANCEL BOOKING" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    
    Test-API -TestName "Cancel booking" -Method "DELETE" -Endpoint "/api/bookings/$BookingId"
}

# ─── Test 8: Cron Job (Send Reminders) ───────────────────────────────────────
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "8. CRON JOB (Send Reminders)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

$AuthHeaders = @{ "Authorization" = "Bearer $CRON_SECRET" }
Test-API -TestName "Send reminders (authorized)" -Method "GET" -Endpoint "/api/cron/send-reminders" -Headers $AuthHeaders

# ─── Test 9: Cron Job Unauthorized ───────────────────────────────────────────
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "9. CRON JOB (Unauthorized - Should Fail)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Test-API -TestName "Send reminders (no auth)" -Method "GET" -Endpoint "/api/cron/send-reminders"

# ─── Summary ─────────────────────────────────────────────────────────────────
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Tests Passed: $TestsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $TestsFailed" -ForegroundColor $(if ($TestsFailed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($TestsFailed -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some tests failed. Check logs above." -ForegroundColor Yellow
    exit 1
}
