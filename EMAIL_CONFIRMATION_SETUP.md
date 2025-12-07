# Email Confirmation Setup Guide

## Problem: Not Receiving Confirmation Emails

If you're not receiving confirmation emails from Supabase, here are the solutions:

## Solution 1: Disable Email Confirmation (Recommended for Development)

This is the easiest solution for development and testing:

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Settings** (or **Providers** → **Email**)
4. Find the **"Email Auth"** section
5. **Disable** "Enable email confirmations" toggle
6. Click **Save**

After this, users can sign in immediately without email confirmation.

## Solution 2: Check Email Settings

If you want to keep email confirmation enabled:

### Check Spam Folder
- Supabase emails sometimes go to spam
- Check your spam/junk folder for emails from `noreply@mail.app.supabase.io`

### Verify Email Provider
- Supabase's default email service has rate limits
- For production, you should set up custom SMTP

### Manual Confirmation (For Testing)
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find the user by email
3. Click on the user
4. Click **"Confirm email"** or **"Send confirmation email"**

## Solution 3: Set Up Custom SMTP (For Production)

For production apps, set up your own email service:

1. Go to **Supabase Dashboard** → **Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Configure with your email provider:
   - **Gmail**: Use App Password
   - **SendGrid**: Use API key
   - **Mailgun**: Use API credentials
   - **AWS SES**: Use IAM credentials

## Current Behavior

The app now handles both scenarios:
- **Email confirmation enabled**: Shows message to check email
- **Email confirmation disabled**: Auto-logs in after signup

## Testing Without Email

If you need to test without setting up email:

1. **Disable email confirmation** (Solution 1 above)
2. Or **manually confirm users** in Supabase dashboard (Solution 2)

## Troubleshooting

### Still not receiving emails?
1. Check Supabase dashboard → **Authentication** → **Users** to see if user was created
2. Check if email confirmation is actually enabled
3. Try manually confirming the user in the dashboard
4. For development, just disable email confirmation

### Rate Limits
Supabase's free tier has email rate limits. If you hit them:
- Wait a few minutes
- Or disable email confirmation for development
- Or set up custom SMTP

