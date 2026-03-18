# Email Verification Setup Guide

This guide explains how to set up email verification for new user registration in BakeSync ERP.

## Overview

The email verification system ensures that new users must verify their email address with a 6-digit code before they can proceed with the onboarding process. This prevents fake accounts and ensures data integrity.

## Features Implemented

- ✅ 6-digit verification code sent via email
- ✅ Email verification page with code input
- ✅ Resend verification code functionality
- ✅ Rate limiting for verification attempts
- ✅ Automatic redirect to onboarding after verification
- ✅ Clean data initialization (no mock data)
- ✅ Proper error handling and user feedback

## Setup Instructions

### 1. Deploy Supabase Configuration

Run the SQL script to configure email verification in your Supabase database:

```bash
# In your Supabase SQL Editor, run:
supabase-email-verification-setup.sql
```

### 2. Configure Supabase Authentication Settings

In your Supabase Dashboard:

1. Go to **Authentication** > **Settings**
2. Under **User Signups**, enable:
   - ✅ **Enable email confirmations**
   - ✅ **Enable email change confirmations**
3. Set **Email confirmation expiry** to `24 hours`
4. Under **Email**, configure your SMTP settings or use Supabase's default

### 3. Configure Email Templates

In your Supabase Dashboard:

1. Go to **Authentication** > **Email Templates**
2. Select **Confirm signup** template
3. Update the template with:

**Subject:** `Verify your email for BakeSync`

**Body:**
```html
<h2>Welcome to BakeSync!</h2>
<p>Please confirm your email address by entering this verification code:</p>
<h1 style="text-align: center; font-size: 32px; letter-spacing: 8px; color: #2563eb;">{{ .Token }}</h1>
<p>This code will expire in 24 hours.</p>
<p>If you didn't create an account with BakeSync, you can safely ignore this email.</p>
<p>Best regards,<br>The BakeSync Team</p>
```

### 4. Test the Verification Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/signup` and create a new account
3. Check your email for the verification code
4. Enter the 6-digit code on the verification page
5. Verify that you're redirected to the onboarding flow

## File Changes Made

### New Files Created

- `app/verify-email/page.tsx` - Email verification page
- `supabase-email-verification-setup.sql` - Supabase configuration
- `EMAIL_VERIFICATION_SETUP.md` - This setup guide

### Files Modified

- `lib/auth-context.tsx` - Added verification functions and updated User interface
- `app/signup/page.tsx` - Updated to redirect to verification page

## Technical Implementation

### Authentication Flow

1. **User Registration**: User fills out signup form
2. **Account Creation**: Supabase creates user account (unconfirmed)
3. **Email Sent**: Supabase sends verification email with 6-digit code
4. **Verification Page**: User is redirected to `/verify-email`
5. **Code Entry**: User enters the 6-digit verification code
6. **Verification**: Code is verified with Supabase
7. **Profile Creation**: User profile is created in database
8. **Onboarding**: User is redirected to onboarding flow

### Security Features

- **Rate Limiting**: Maximum 5 verification attempts per hour per email
- **Code Expiry**: Verification codes expire after 24 hours
- **Cleanup**: Unverified accounts are automatically deleted after 24 hours
- **RLS Policies**: Proper row-level security for pending users

### Database Schema

The system uses the following tables:
- `auth.users` - Supabase authentication table
- `public.users` - User profiles table
- `public.verification_attempts` - Rate limiting table
- `public.onboarding_progress` - Onboarding data

## Troubleshooting

### Common Issues

1. **Verification emails not sending**
   - Check SMTP configuration in Supabase Dashboard
   - Verify email templates are properly configured
   - Check spam folder

2. **Verification code not working**
   - Ensure code is entered within 24 hours
   - Check for typos in the 6-digit code
   - Try requesting a new code

3. **User stuck on verification page**
   - Clear browser cache and localStorage
   - Check browser console for errors
   - Verify Supabase configuration

### Debug Steps

1. Check Supabase logs in the Dashboard
2. Verify RLS policies are correctly applied
3. Test with different email addresses
4. Check network requests in browser dev tools

## Security Considerations

- Verification codes are single-use and expire
- Rate limiting prevents brute force attacks
- Unverified accounts are automatically cleaned up
- Email addresses are validated before sending codes
- All database operations use RLS policies

## Monitoring

The system includes monitoring features:
- Verification statistics view
- Rate limiting tracking
- Automatic cleanup of expired data
- Error logging and reporting

## Next Steps

After setting up email verification:

1. Test the complete flow with multiple users
2. Monitor verification rates and success rates
3. Consider adding email templates for different languages
4. Set up monitoring alerts for failed verifications
5. Consider adding SMS verification as an alternative

## Support

If you encounter issues:

1. Check the Supabase Dashboard logs
2. Verify all configuration steps are completed
3. Test with a fresh browser session
4. Review the troubleshooting section above

For additional help, refer to the Supabase documentation on email verification.
