# 🦜 Birdman Booking API Documentation

Complete API reference and testing guide for the Birdman of Chennai booking system.

---

## Base URL

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

---

## Authentication

Currently, all booking endpoints are public (Sprint 1). Admin endpoints will require authentication in future sprints.

---

## Endpoints

### 1. Create Booking

**POST** `/api/bookings`

Creates a new booking and sends a confirmation email.

#### Request Body

```json
{
  "visitorName": "Rajesh Kumar",
  "phone": "+91-9876543210",
  "email": "rajesh@example.com",
  "numberOfGuests": 4,
  "bookingDate": "2026-04-15",
  "bookingTime": "06:00"
}
```

#### Validation Rules

- `visitorName`: 2-100 characters, required
- `phone`: Indian format `+91-XXXXXXXXXX`, required
- `email`: Valid email address, required
- `numberOfGuests`: Integer, 1-10, required
- `bookingDate`: `YYYY-MM-DD` format, must be future date, required
- `bookingTime`: `HH:MM` format (24-hour), required

#### Success Response (201 Created)

```json
{
  "success": true,
  "booking": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "visitorName": "Rajesh Kumar",
    "bookingDate": "2026-04-15",
    "bookingTime": "06:00",
    "numberOfGuests": 4,
    "status": "confirmed"
  },
  "emailSent": true
}
```

#### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "phone",
      "message": "Phone must be in format +91-XXXXXXXXXX"
    }
  ]
}
```

#### cURL Example

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "visitorName": "Rajesh Kumar",
    "phone": "+91-9876543210",
    "email": "rajesh@example.com",
    "numberOfGuests": 4,
    "bookingDate": "2026-04-15",
    "bookingTime": "06:00"
  }'
```

---

### 2. List All Bookings

**GET** `/api/bookings`

Retrieves all bookings with optional filters (Admin only - currently unprotected).

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `status` | string | Filter by status: `confirmed`, `cancelled`, `completed` | all |
| `date` | string | Filter by booking date (YYYY-MM-DD) | all |
| `limit` | number | Number of results (1-100) | 50 |
| `offset` | number | Pagination offset | 0 |

#### Success Response (200 OK)

```json
{
  "success": true,
  "bookings": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "visitorName": "Rajesh Kumar",
      "phone": "+91-9876543210",
      "email": "rajesh@example.com",
      "numberOfGuests": 4,
      "bookingDate": "2026-04-15",
      "bookingTime": "06:00",
      "confirmationSent": true,
      "reminderSent": false,
      "status": "confirmed",
      "createdAt": "2026-03-20T10:30:00.000Z",
      "updatedAt": "2026-03-20T10:30:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 1
  }
}
```

#### cURL Examples

```bash
# Get all bookings
curl http://localhost:3000/api/bookings

# Get confirmed bookings for a specific date
curl "http://localhost:3000/api/bookings?status=confirmed&date=2026-04-15"

# Get bookings with pagination
curl "http://localhost:3000/api/bookings?limit=10&offset=0"

# Get cancelled bookings
curl "http://localhost:3000/api/bookings?status=cancelled"
```

---

### 3. Get Single Booking

**GET** `/api/bookings/:id`

Retrieves a specific booking by ID.

#### Success Response (200 OK)

```json
{
  "success": true,
  "booking": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "visitorName": "Rajesh Kumar",
    "phone": "+91-9876543210",
    "email": "rajesh@example.com",
    "numberOfGuests": 4,
    "bookingDate": "2026-04-15",
    "bookingTime": "06:00",
    "confirmationSent": true,
    "reminderSent": false,
    "status": "confirmed",
    "createdAt": "2026-03-20T10:30:00.000Z",
    "updatedAt": "2026-03-20T10:30:00.000Z"
  }
}
```

#### Error Response (404 Not Found)

```json
{
  "success": false,
  "error": "Booking not found"
}
```

#### cURL Example

```bash
curl http://localhost:3000/api/bookings/550e8400-e29b-41d4-a716-446655440000
```

---

### 4. Reschedule Booking

**PATCH** `/api/bookings/:id`

Updates the date and/or time of an existing booking. Sends a reschedule notification email.

#### Request Body

```json
{
  "bookingDate": "2026-04-20",
  "bookingTime": "17:00"
}
```

**Note:** At least one field (`bookingDate` or `bookingTime`) must be provided.

#### Success Response (200 OK)

```json
{
  "success": true,
  "booking": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "visitorName": "Rajesh Kumar",
    "bookingDate": "2026-04-20",
    "bookingTime": "17:00",
    "numberOfGuests": 4,
    "status": "confirmed"
  },
  "emailSent": true
}
```

#### Error Responses

**400 Bad Request** - Cannot reschedule cancelled/completed booking
```json
{
  "success": false,
  "error": "Cannot reschedule a cancelled booking"
}
```

**404 Not Found** - Booking doesn't exist
```json
{
  "success": false,
  "error": "Booking not found"
}
```

#### cURL Example

```bash
curl -X PATCH http://localhost:3000/api/bookings/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "bookingDate": "2026-04-20",
    "bookingTime": "17:00"
  }'
```

---

### 5. Cancel Booking

**DELETE** `/api/bookings/:id`

Cancels an existing booking by setting its status to `cancelled`.

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "cancelled"
  }
}
```

#### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "Booking is already cancelled"
}
```

#### cURL Example

```bash
curl -X DELETE http://localhost:3000/api/bookings/550e8400-e29b-41d4-a716-446655440000
```

---

### 6. Send Reminder Emails (Cron Job)

**GET** `/api/cron/send-reminders`

Automated endpoint triggered by Vercel Cron at 10:00 AM daily (Chennai time). Sends reminder emails to all visitors with bookings today.

**Security:** Requires `Authorization: Bearer <CRON_SECRET>` header.

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Reminder job complete",
  "remindersSent": 5,
  "remindersFailed": 0,
  "totalBookings": 5,
  "date": "2026-03-25"
}
```

#### Error Response (401 Unauthorized)

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

#### cURL Example (Manual Testing)

```bash
curl http://localhost:3000/api/cron/send-reminders \
  -H "Authorization: Bearer your_cron_secret_here"
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `BOOKING_CREATE_ERROR` | Failed to create booking in database |
| `BOOKING_FETCH_ERROR` | Failed to retrieve booking(s) |
| `BOOKING_UPDATE_ERROR` | Failed to update booking |
| `BOOKING_CANCEL_ERROR` | Failed to cancel booking |
| `CRON_JOB_ERROR` | Cron job execution failed |

---

## Rate Limiting (Future Sprint)

Current implementation has no rate limiting. Future versions will enforce:

- **Booking creation:** 5 requests per minute per IP
- **Admin endpoints:** 60 requests per minute per user

---

## Testing Checklist

### 1. Create Booking
- [ ] Valid booking creation
- [ ] Invalid phone format
- [ ] Past booking date
- [ ] Invalid email
- [ ] Number of guests out of range
- [ ] Confirmation email sent

### 2. List Bookings
- [ ] Fetch all bookings
- [ ] Filter by status
- [ ] Filter by date
- [ ] Pagination works
- [ ] Invalid date format

### 3. Get Single Booking
- [ ] Valid booking ID
- [ ] Non-existent booking ID
- [ ] Invalid UUID format

### 4. Reschedule Booking
- [ ] Update date only
- [ ] Update time only
- [ ] Update both date and time
- [ ] Reschedule cancelled booking (should fail)
- [ ] Reschedule email sent

### 5. Cancel Booking
- [ ] Cancel confirmed booking
- [ ] Cancel already-cancelled booking (should fail)

### 6. Cron Job
- [ ] Manual trigger with valid secret
- [ ] Manual trigger with invalid secret
- [ ] No bookings for today
- [ ] Multiple bookings for today

---

## Postman Collection

Import this collection for quick API testing:

```json
{
  "info": {
    "name": "Birdman Booking API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Booking",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"visitorName\": \"Test Visitor\",\n  \"phone\": \"+91-9876543210\",\n  \"email\": \"test@example.com\",\n  \"numberOfGuests\": 2,\n  \"bookingDate\": \"2026-04-15\",\n  \"bookingTime\": \"06:00\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/bookings",
          "host": ["{{baseUrl}}"],
          "path": ["api", "bookings"]
        }
      }
    },
    {
      "name": "List Bookings",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/bookings?limit=10",
          "host": ["{{baseUrl}}"],
          "path": ["api", "bookings"],
          "query": [
            {
              "key": "limit",
              "value": "10"
            }
          ]
        }
      }
    },
    {
      "name": "Get Booking",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/bookings/:id",
          "host": ["{{baseUrl}}"],
          "path": ["api", "bookings", ":id"],
          "variable": [
            {
              "key": "id",
              "value": "{{bookingId}}"
            }
          ]
        }
      }
    },
    {
      "name": "Reschedule Booking",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"bookingDate\": \"2026-04-20\",\n  \"bookingTime\": \"17:00\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/bookings/:id",
          "host": ["{{baseUrl}}"],
          "path": ["api", "bookings", ":id"],
          "variable": [
            {
              "key": "id",
              "value": "{{bookingId}}"
            }
          ]
        }
      }
    },
    {
      "name": "Cancel Booking",
      "request": {
        "method": "DELETE",
        "url": {
          "raw": "{{baseUrl}}/api/bookings/:id",
          "host": ["{{baseUrl}}"],
          "path": ["api", "bookings", ":id"],
          "variable": [
            {
              "key": "id",
              "value": "{{bookingId}}"
            }
          ]
        }
      }
    },
    {
      "name": "Send Reminders (Cron)",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{cronSecret}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/cron/send-reminders",
          "host": ["{{baseUrl}}"],
          "path": ["api", "cron", "send-reminders"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "bookingId",
      "value": ""
    },
    {
      "key": "cronSecret",
      "value": ""
    }
  ]
}
```

---

## Email Templates

### Confirmation Email
Sent immediately after booking creation. Includes:
- Booking details (date, time, guests)
- Location and directions
- What to expect
- Important reminders

### Reminder Email
Sent at 10:00 AM on the booking day. Includes:
- Visit details for today
- Pre-visit checklist
- Important don'ts
- Arrival instructions

### Reschedule Email
Sent when booking date/time is updated. Includes:
- Old booking details (crossed out)
- New booking details
- Updated reminders

---

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Configure environment variables in `.env.local`

4. Run database migrations:
```bash
npm run db:push
```

5. Start development server:
```bash
npm run dev
```

6. Test API endpoints at `http://localhost:3000/api`

---

## Production Deployment

1. Set environment variables in Vercel dashboard
2. Deploy to Vercel: `vercel --prod`
3. Verify cron job is active in Vercel dashboard
4. Test all endpoints with production URL

---

## Support

For questions or issues, contact the Birdman of Chennai team.
