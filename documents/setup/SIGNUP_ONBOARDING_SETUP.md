# BakeSync ERP - Sign-up and Onboarding Setup Guide

## Overview

This guide explains how to set up the complete sign-up and multi-step onboarding flow for BakeSync ERP, including user registration, business setup, and team management features.

## Features Implemented

### 1. User Registration System
- **Sign-up Form**: Complete registration form with business details
- **Role Selection**: Choose between Owner, Baker, or Cashier roles
- **Email Verification**: Integrated with Supabase Auth
- **Automatic Profile Creation**: User profiles created automatically

### 2. Multi-Step Onboarding Flow
- **Step 1**: Business Details Questionnaire
- **Step 2**: Initial Inventory Setup
- **Step 3**: Preferred Suppliers Setup
- **Step 4**: Team Members & Role Assignment
- **Step 5**: Setup Complete Summary

### 3. Team Management System
- **Invitation System**: Send invitations to team members
- **Role Assignment**: Assign Baker or Cashier roles
- **Status Tracking**: Track invitation status (pending, accepted, declined)
- **Email Integration**: Send invitation emails

### 4. Business Profile Management
- **Business Information**: Store business details and preferences
- **Bakeshop Type**: Categorize business type
- **Location Data**: Store business location information

## File Structure

```
app/
├── signup/
│   └── page.tsx                 # Sign-up form
├── onboarding/
│   └── page.tsx                 # Main onboarding flow
└── login/
    └── page.tsx                 # Updated login with signup link

components/
└── onboarding/
    ├── index.ts                 # Component exports
    ├── step1-business-details.tsx
    ├── step2-inventory-setup.tsx
    ├── step3-suppliers-setup.tsx
    ├── step4-team-members.tsx
    └── step5-complete.tsx

lib/
├── auth-context.tsx             # Updated with signup functionality
└── user-management.ts           # User management utilities

Database:
├── supabase_schema.sql          # Main database schema
├── supabase_rls_policies.sql    # Row Level Security policies
└── supabase-signup-setup.sql    # Sign-up and onboarding setup
```

## Setup Instructions

### 1. Database Setup

Run the following SQL scripts in your Supabase SQL Editor in order:

```sql
-- 1. Main schema and RLS policies
\i supabase_schema.sql
\i supabase_rls_policies.sql

-- 2. Sign-up and onboarding features
\i supabase-signup-setup.sql
```

### 2. Supabase Configuration

#### Enable Email Authentication
1. Go to Supabase Dashboard → Authentication → Settings
2. Enable "Email" provider
3. Configure email templates for:
   - Sign-up confirmation
   - Password reset
   - Team invitations

#### Configure Email Templates
1. Go to Authentication → Email Templates
2. Customize the following templates:
   - **Confirm signup**: Include business name and onboarding link
   - **Magic Link**: For team invitations
   - **Reset Password**: Standard password reset

#### Set up Row Level Security
The RLS policies are automatically created by the setup scripts. Key policies include:
- Users can only access their own data
- Business owners can manage team invitations
- Team members can view business profiles
- Onboarding progress is user-specific

### 3. Environment Variables

Ensure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Email Configuration (Optional)

For team invitations, configure email sending:

1. Go to Supabase Dashboard → Settings → API
2. Configure SMTP settings for sending emails
3. Or use a service like SendGrid, Resend, or similar

## Usage Guide

### 1. User Registration Flow

1. **Access Sign-up**: Navigate to `/signup`
2. **Fill Form**: Complete business details, personal info, and role
3. **Email Verification**: User receives confirmation email
4. **Auto-redirect**: Redirected to onboarding flow

### 2. Onboarding Process

#### Step 1: Business Details
- Business name (required)
- Bakeshop type (optional)
- Location (optional)
- Progress: 20%

#### Step 2: Inventory Setup
- Add inventory categories
- Add sample items to each category
- Set quantities and units
- Progress: 40%

#### Step 3: Suppliers Setup
- Add supplier information
- Contact person details
- Email and phone numbers
- Progress: 60%

#### Step 4: Team Members
- Invite team members by email
- Assign roles (Baker/Cashier)
- Track invitation status
- Progress: 80%

#### Step 5: Complete
- Review setup summary
- Access dashboard
- Progress: 100%

### 3. Team Management

#### Sending Invitations
```typescript
// In your component
const sendInvitation = async (email: string, role: string) => {
  const { data, error } = await supabase.rpc('send_team_invitation', {
    invited_email: email,
    role_name: role
  })
  
  if (error) {
    console.error('Failed to send invitation:', error)
  } else {
    console.log('Invitation sent:', data)
  }
}
```

#### Accepting Invitations
```typescript
// In your component
const acceptInvitation = async (token: string) => {
  const { data, error } = await supabase.rpc('accept_team_invitation', {
    invitation_token: token
  })
  
  if (data.success) {
    // User role updated, redirect to dashboard
    router.push('/dashboard')
  }
}
```

## API Reference

### Database Functions

#### `send_team_invitation(email, role)`
Sends a team invitation to the specified email address.

**Parameters:**
- `email` (TEXT): Email address to invite
- `role` (user_role): Role to assign (baker, cashier)

**Returns:**
```json
{
  "success": true,
  "invitation_id": "uuid",
  "invitation_token": "string"
}
```

#### `accept_team_invitation(token)`
Accepts a team invitation using the invitation token.

**Parameters:**
- `token` (TEXT): Invitation token from email

**Returns:**
```json
{
  "success": true,
  "role": "baker"
}
```

#### `update_onboarding_progress(step, data)`
Updates the user's onboarding progress.

**Parameters:**
- `step` (INTEGER): Current step number (1-5)
- `data` (JSONB): Step-specific data

**Returns:**
```json
{
  "success": true,
  "current_step": 2,
  "completed_steps": [1, 2]
}
```

### Database Tables

#### `onboarding_progress`
Stores user onboarding progress and data.

```sql
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT '{}',
  business_name TEXT,
  bakeshop_type TEXT,
  location TEXT,
  inventory_categories JSONB DEFAULT '[]',
  suppliers JSONB DEFAULT '[]',
  team_members JSONB DEFAULT '[]',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `team_invitations`
Manages team member invitations.

```sql
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY,
  business_owner_id UUID REFERENCES users(id),
  invited_email TEXT NOT NULL,
  role user_role NOT NULL,
  status TEXT DEFAULT 'pending',
  invitation_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `business_profiles`
Stores business information.

```sql
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  business_name TEXT NOT NULL,
  bakeshop_type TEXT,
  location TEXT,
  description TEXT,
  website TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Customization

### 1. Onboarding Steps
To modify onboarding steps:
1. Edit the step components in `components/onboarding/`
2. Update the step logic in `app/onboarding/page.tsx`
3. Modify the progress calculation

### 2. Business Types
To add new bakeshop types:
1. Update the `bakeshopTypes` array in `step1-business-details.tsx`
2. Add corresponding database values if needed

### 3. Team Roles
To add new team roles:
1. Update the `user_role` enum in the database
2. Modify role selection in `step4-team-members.tsx`
3. Update permission system in `lib/permissions.ts`

### 4. Email Templates
To customize email templates:
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Modify the HTML templates
3. Use template variables like `{{ .ConfirmationURL }}`

## Testing

### 1. Test User Registration
1. Navigate to `/signup`
2. Fill out the form with test data
3. Verify email confirmation
4. Check user creation in Supabase

### 2. Test Onboarding Flow
1. Complete each step of onboarding
2. Verify data persistence
3. Test skip functionality
4. Verify final redirect to dashboard

### 3. Test Team Invitations
1. Create a business owner account
2. Invite team members
3. Check invitation emails
4. Test invitation acceptance

## Troubleshooting

### Common Issues

1. **Sign-up fails**
   - Check Supabase configuration
   - Verify email provider is enabled
   - Check RLS policies

2. **Onboarding data not saved**
   - Verify user authentication
   - Check database permissions
   - Review console errors

3. **Team invitations not working**
   - Check email configuration
   - Verify SMTP settings
   - Check invitation token generation

4. **Role permissions not working**
   - Verify RLS policies
   - Check user role assignment
   - Review permission functions

### Debug Commands

```sql
-- Check user registrations
SELECT * FROM public.users ORDER BY created_at DESC;

-- Check onboarding progress
SELECT * FROM public.onboarding_progress;

-- Check team invitations
SELECT * FROM public.team_invitations;

-- Check business profiles
SELECT * FROM public.business_profiles;
```

## Security Considerations

1. **Email Validation**: All email addresses are validated
2. **Role-based Access**: RLS policies enforce proper access control
3. **Token Security**: Invitation tokens are cryptographically secure
4. **Data Validation**: All user input is validated and sanitized
5. **Rate Limiting**: Consider implementing rate limiting for invitations

## Performance Optimization

1. **Lazy Loading**: Onboarding steps load only when needed
2. **Data Caching**: User data is cached in localStorage
3. **Database Indexing**: Proper indexes for fast queries
4. **Background Processing**: User profile creation happens in background

## Conclusion

The sign-up and onboarding system provides a complete user experience from registration to full bakery management setup. The multi-step flow ensures users can configure their system progressively while the team management features enable collaborative bakery operations.

For additional support or customization, refer to the Supabase documentation or contact the development team.
