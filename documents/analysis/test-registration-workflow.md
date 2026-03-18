# Registration and Email Verification Workflow Test

## 🧪 Testing Steps

### 1. Test New User Registration
1. Go to `/signup`
2. Fill out the registration form with:
   - Business Name: "Test Bakery"
   - Full Name: "Test User"
   - Email: "test@example.com" (use a real email you can access)
   - Role: "Owner"
   - Password: "testpassword123"
   - Confirm Password: "testpassword123"
3. Click "Create Account"
4. **Expected Result**: Should redirect to `/verify-email` page

### 2. Test Email Verification Page
1. On the verify-email page, you should see:
   - Email address displayed
   - "Send Verification Code" button
2. Click "Send Verification Code"
3. **Expected Result**: Should show "Enter the 6-digit code" form
4. Enter any 6-digit code (for testing)
5. Click "Verify Email"
6. **Expected Result**: Should show success message and redirect to onboarding

### 3. Test Unconfirmed User Login
1. Go to `/login`
2. Try to login with the same email/password from step 1
3. **Expected Result**: Should redirect to `/verify-email` page (not show error)

### 4. Test Direct Verification Page Access
1. Go directly to `/verify-email?email=test@example.com`
2. **Expected Result**: Should load the verification page with the correct email

## 🔧 Debugging Commands

### Check User Status in Database
```sql
-- Check auth.users table
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'test@example.com';

-- Check profiles table
SELECT id, email, name, is_active, created_at 
FROM public.profiles 
WHERE email = 'test@example.com';

-- Check email_verifications table
SELECT * FROM public.email_verifications 
WHERE email = 'test@example.com';
```

### Clear Test Data
```sql
-- Remove test user from auth.users (if needed)
DELETE FROM auth.users WHERE email = 'test@example.com';

-- Remove test profile
DELETE FROM public.profiles WHERE email = 'test@example.com';

-- Remove test verifications
DELETE FROM public.email_verifications WHERE email = 'test@example.com';
```

## 🐛 Common Issues and Solutions

### Issue: Signup doesn't redirect to verification
**Solution**: Check browser console for errors. Ensure Supabase auth is properly configured.

### Issue: Login with unconfirmed email shows error instead of redirecting
**Solution**: Check that the error message contains "email_not_confirmed" or "Email not confirmed".

### Issue: Verification page doesn't load
**Solution**: Check that email is being passed correctly in URL params or localStorage.

### Issue: Verification code doesn't work
**Solution**: Check that the `verifyEmail` function in auth context is working properly.

## ✅ Success Criteria

- [ ] New user registration redirects to verification page
- [ ] Email verification page loads with correct email
- [ ] Verification code input works (accepts any 6-digit code for testing)
- [ ] Successful verification redirects to onboarding
- [ ] Unconfirmed user login redirects to verification page
- [ ] Direct verification page access works with email parameter
- [ ] Resend verification code works
- [ ] All localStorage data is properly cleaned up after verification
