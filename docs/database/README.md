# BakeSync ERP - Database Schema Setup Guide

This directory contains the complete database schema for the BakeSync ERP application.

## 📁 Files

- **`supabase-schema.sql`** - Complete database schema with tables, indexes, RLS policies, and triggers
- **`drop-all-tables.sql`** - Script to drop all tables, functions, and types (use with caution!)
- **`reset-database.sql`** - Complete reset script (drops everything and recreates)
- **`fix-bakeshop-memberships-rls.sql`** - Fix for infinite recursion error in bakeshop_memberships RLS policies
- **`fix-bakeshops-created-by-fkey.sql`** - Fix for foreign key constraint violation when creating bakeshops

## 🚀 Quick Setup

### Step 1: Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - **Name**: BakeSync ERP (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier is fine for development

### Step 2: Run the Schema Script

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open the `supabase-schema.sql` file from this directory
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press `Ctrl/Cmd + Enter`)

### Step 3: Verify Setup

After running the script, verify that all tables were created:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- profiles
- bakeshops
- bakeshop_memberships
- inventory
- recipes
- recipe_ingredients
- production_logs
- sales
- suppliers
- purchase_orders
- team_invitations
- notifications
- user_activity_logs
- user_preferences
- onboarding_completion

### Step 4: Configure Environment Variables

Update your `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these in your Supabase project settings under **API**.

## 📊 Schema Overview

### Core Tables

1. **profiles** - User profiles (extends Supabase Auth)
2. **bakeshops** - Business/bakeshop information
3. **bakeshop_memberships** - Links users to bakeshops with roles

### Business Data Tables

4. **inventory** - Inventory items (raw materials and finished goods)
5. **recipes** - Recipe information
6. **recipe_ingredients** - Recipe ingredient relationships
7. **production_logs** - Production batch records
8. **sales** - Sales transactions
9. **suppliers** - Supplier information
10. **purchase_orders** - Purchase order records

### System Tables

11. **team_invitations** - Team member invitations
12. **notifications** - System notifications
13. **user_activity_logs** - User activity tracking
14. **user_preferences** - User preferences
15. **onboarding_completion** - Onboarding progress tracking

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Restrict data access to users who belong to the same bakeshop
- Allow owners to manage their bakeshop data
- Prevent cross-tenant data access

### Key Security Policies

- **Profiles**: Users can only view/update their own profile
- **Bakeshops**: Users can only access bakeshops they belong to
- **Business Data**: All business data is isolated by `bakeshop_id`
- **Notifications**: Users can only see their own notifications

## 🔑 Key Features

### Automatic Profile Creation

When a user signs up via Supabase Auth, a profile is automatically created via trigger.

### Automatic Timestamps

All tables with `updated_at` columns automatically update when records are modified.

### Multi-Tenant Architecture

All business data is isolated by `bakeshop_id`, ensuring complete data separation between different bakeshops.

### Role-Based Access

Three user roles:
- **owner** - Full access to bakeshop data
- **baker** - Can manage recipes and production
- **cashier** - Can manage sales

## 📝 Notes

- The schema uses UUIDs for all primary keys
- JSONB columns are used for flexible data structures (address, contact_info, etc.)
- All foreign keys have proper CASCADE/SET NULL behaviors
- Indexes are created for optimal query performance

## 🔄 Resetting the Database

If you need to start fresh and drop all tables:

### Option 1: Drop All Tables Only

1. Open the SQL Editor in Supabase
2. Open `drop-all-tables.sql`
3. Copy and paste the contents
4. Run the script

This will remove all tables, functions, triggers, and types.

### Option 2: Complete Reset (Drop + Recreate)

1. Run `drop-all-tables.sql` first
2. Then run `supabase-schema.sql` to recreate everything

**⚠️ Warning**: This will delete ALL data in your database!

## 🔧 Fixing Common Errors

### RLS Policy Errors

If you encounter an "infinite recursion detected in policy for relation bakeshop_memberships" error:

1. Open the SQL Editor in Supabase
2. Run the `fix-bakeshop-memberships-rls.sql` script
3. This will update the RLS policies to avoid self-referencing queries

The fix changes the policies to check `bakeshops.created_by` instead of querying `bakeshop_memberships` from within its own policies.

### Foreign Key Constraint Errors

If you encounter a "violates foreign key constraint bakeshops_created_by_fkey" error when creating bakeshops:

1. Open the SQL Editor in Supabase
2. Run the `fix-bakeshops-created-by-fkey.sql` script
3. This will:
   - Diagnose the current constraint configuration
   - Fix the foreign key to reference `auth.users(id)` (recommended for Supabase)
   - Ensure the profile creation trigger is active
   - Clean up any orphaned data

This error typically occurs when the `created_by` field references a table where the user doesn't exist yet, or when the constraint is misconfigured.

## 🐛 Troubleshooting

### Error: "relation already exists"

If you see this error, the table already exists. You can either:
1. Drop the existing table: `DROP TABLE IF EXISTS public.table_name CASCADE;`
2. Or modify the script to use `CREATE TABLE IF NOT EXISTS` (already included)

### Error: "permission denied"

Make sure you're running the script with the correct permissions. The script should work with the default Supabase setup.

### RLS Policies Not Working

If RLS policies aren't working:
1. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. Check policy existence: `SELECT * FROM pg_policies WHERE schemaname = 'public';`

## 🔄 Migration Notes

If you're migrating from an existing database:

1. **Backup your data first!**
2. Review the schema differences
3. Create a migration script for data transformation
4. Test the migration on a staging environment first

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## ✅ Verification Checklist

After setup, verify:

- [ ] All tables created successfully
- [ ] RLS enabled on all tables
- [ ] Indexes created
- [ ] Triggers working (check `updated_at` updates)
- [ ] Profile auto-creation working (test signup)
- [ ] Can query data from your application

---

**Need Help?** Check the main project README or open an issue on GitHub.

