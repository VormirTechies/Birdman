# Email Templates Preview Pages

This directory contains preview pages for all email templates used in the Birdman of Chennai application.

## Available Routes

Visit these URLs in your browser to preview each email template:

- **Main Index**: http://localhost:3000/emails
  - Lists all available email templates

- **Booking Confirmation**: http://localhost:3000/emails/confirmation
  - Preview the email sent after successful booking

- **Booking Reminder**: http://localhost:3000/emails/reminder
  - Preview the reminder email sent on the day of visit

- **Booking Reschedule**: http://localhost:3000/emails/reschedule
  - Preview the email sent when a booking is rescheduled

- **Booking Cancellation**: http://localhost:3000/emails/cancellation
  - Preview the email sent when a booking is cancelled

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/emails

3. Click on any template to preview it with dummy data

4. Each preview page shows:
   - The rendered email template
   - The dummy data being used
   - A back link to the main index

## Email Templates Location

The actual email template files are located in:
```
/emails/
  ├── booking-confirmation.tsx
  ├── booking-reminder.tsx
  ├── booking-reschedule.tsx
  └── booking-cancellation.tsx
```

## Testing Changes

When you make changes to any email template:

1. The preview page will automatically refresh (with hot reload)
2. You can test different data by modifying the `dummyData` object in each preview page
3. Check responsiveness by resizing the browser window

## Notes

- These preview pages are for development/testing only
- Dummy data is hardcoded in each page for consistent previews
- The actual emails sent to users will use real booking data from the database
