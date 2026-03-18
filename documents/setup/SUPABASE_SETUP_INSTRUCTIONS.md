# Supabase Setup Instructions for BakeSync ERP

## Prerequisites
- Supabase account (sign up at https://supabase.com)
- Node.js and pnpm installed

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `bakesync-erp`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

## Step 3: Update Environment Variables

1. Open `.env.local` in your project root
2. Replace the placeholder values with your actual credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire contents of `supabase_schema.sql`
4. Click "Run" (or press Ctrl+Enter)
5. Wait for execution - you should see "Success. No rows returned" or similar

## Step 5: Create Demo Users in Supabase Auth

1. Go to **Authentication** → **Users** in your Supabase dashboard
2. Click "Add user" for each of these users:

### Owner User:
- **Email**: `owner@bakesync.com`
- **Password**: `owner123`
- **Email Confirm**: ✅ Check this box

### Baker User:
- **Email**: `baker@bakesync.com`
- **Password**: `baker123`
- **Email Confirm**: ✅ Check this box

### Cashier User:
- **Email**: `cashier@bakesync.com`
- **Password**: `cashier123`
- **Email Confirm**: ✅ Check this box

## Step 6: Insert Demo Data

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `insert_demo_users.sql`
3. Click "Run"
4. This will create user profiles and sample data

## Step 7: Install Dependencies

```bash
cd /home/dane/Downloads/bakesync-erp
pnpm install
```

## Step 8: Test Your Setup

1. Start your development server:
```bash
pnpm dev
```

2. Open your browser and go to `http://localhost:3000`

3. Try logging in with any of the demo accounts:
   - **Owner**: `owner@bakesync.com` / `owner123`
   - **Baker**: `baker@bakesync.com` / `baker123`
   - **Cashier**: `cashier@bakesync.com` / `cashier123`

## Step 9: Verify Everything Works

1. **Check the browser console** for any errors
2. **Try creating a recipe** - it should save to Supabase
3. **Check the Table Editor** in Supabase to see your data
4. **Try logging out and back in**

## Troubleshooting

### Common Issues:

1. **"Invalid API key" error**:
   - Check your `.env.local` file has the correct credentials
   - Make sure there are no extra spaces or quotes

2. **"Failed to load data" error**:
   - Check if the database schema was created successfully
   - Look at the Supabase logs in the dashboard

3. **Login not working**:
   - Verify users were created in both Auth and the users table
   - Check the browser console for error messages

4. **Database connection issues**:
   - Verify your Supabase project is active
   - Check your internet connection
   - Look at Supabase logs for any errors

### Getting Help:

1. **Check Supabase logs**: Go to **Logs** in your Supabase dashboard
2. **Check browser console**: Look for error messages
3. **Verify environment variables**: Make sure they're correct
4. **Test database connection**: Try running a simple query in SQL Editor

## What's Been Set Up

✅ **Database Schema**: Complete PostgreSQL schema with all tables, indexes, and relationships
✅ **Authentication**: Supabase Auth integration with role-based access
✅ **Data Operations**: Full CRUD operations for all entities
✅ **Demo Data**: Sample users, inventory, suppliers, products, and recipes
✅ **Error Handling**: Comprehensive error handling and loading states
✅ **Type Safety**: Full TypeScript integration

## Next Steps

Once everything is working:

1. **Customize RLS policies** based on your business requirements
2. **Add more sample data** as needed
3. **Configure email templates** for user invitations
4. **Set up backups** and monitoring
5. **Deploy to production** when ready

Your bakery ERP system is now fully powered by Supabase! 🚀
