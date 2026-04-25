# Supabase Email Template Configuration

This guide explains how to customize the password reset email template in Supabase.

## Password Reset Email Template

The custom HTML email template is located at:
```
emails/supabase-reset-password-template.html
```

## How to Apply the Template in Supabase

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `ympyaabsjfaoxvbtxbox`
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Select Reset Password Template
1. Click on **Reset Password** template
2. You'll see the default template with variables like `{{ .ConfirmationURL }}`

### Step 3: Replace with Custom Template
1. Copy the contents of `emails/supabase-reset-password-template.html`
2. Paste it into the Supabase email template editor
3. Click **Save**

## Template Variables Used

The template uses Supabase's Go template variables:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | The magic link URL for password reset |
| `{{ .SiteURL }}` | Your site URL (from Supabase config) |
| `{{ .Email }}` | Recipient's email address (optional) |
| `{{ .Token }}` | The raw token (optional) |
| `{{ .TokenHash }}` | Hashed token (optional) |

## Template Features

✅ **Professional Design**: Matches Birdman brand colors (#2E7D32 green)  
✅ **Mobile Responsive**: Works on all devices  
✅ **Clear CTA**: Large "Reset Password" button  
✅ **Security Info**: Shows 1-hour expiry warning  
✅ **Alternative Link**: Plain text link for clients blocking buttons  
✅ **Footer**: Business address and site link  

## Preview

The email includes:
- 🔒 Header with security icon
- Greeting: "Hello Admin,"
- Clear explanation of the reset request
- Prominent green "Reset Password" button
- Security warning (1-hour expiry)
- Alternative plain text link
- Professional footer with business details

## Testing

After applying the template:
1. Go to `/admin/login`
2. Click "Forgot Password?"
3. Enter admin email: `admin@birdmanofchennai.com`
4. Check the email to verify the new design

## Customization

To customize further, edit `emails/supabase-reset-password-template.html`:

### Colors
- Primary Green: `#2E7D32`
- Dark Green: `#1B5E20`
- Background: `#f8f1d4` (cream)
- Warning Yellow: `#FFC107`

### Text
Modify the greeting, message, or footer text as needed.

### Logo
To add a logo, replace the emoji with an `<img>` tag:
```html
<img src="https://yourdomain.com/logo.png" alt="Logo" style="height: 40px;">
```

## Troubleshooting

**Issue**: Template variables not rendering  
**Solution**: Ensure you're using `{{ .VariableName }}` syntax exactly

**Issue**: Styles not applying  
**Solution**: Use inline styles only. Supabase strips `<style>` tags sometimes.

**Issue**: Button not working  
**Solution**: Ensure `{{ .ConfirmationURL }}` is wrapped in `<a href="...">`

## Notes

- Supabase sends emails through their SMTP servers
- The GMAIL_USER credentials in `.env.local` are for booking emails only
- Password reset emails are always sent by Supabase's system
- Templates are project-specific in Supabase dashboard

## Related Files

- Email template: `emails/supabase-reset-password-template.html`
- Reset password page: `src/app/admin/reset-password/page.tsx`
- Login page (forgot password): `src/app/admin/login/page.tsx`
