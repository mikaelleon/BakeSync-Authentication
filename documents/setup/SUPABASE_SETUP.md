# Supabase Setup Guide for BakeSync ERP

This guide will help you connect your Next.js web app to Supabase for database and authentication.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js and pnpm installed
- Your Next.js project ready

## Step 1: Create Supabase Project

1. **Go to Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign in or create an account

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Fill in project details:
     - **Name**: `bakesync-erp`
     - **Database Password**: Choose a strong password (save this!)
     - **Region**: Choose closest to your users
   - Click "Create new project"

3. **Wait for Setup**
   - Project creation takes 1-2 minutes
   - You'll see a progress indicator

## Step 2: Get Project Credentials

1. **Go to Settings > API**
   - In your project dashboard, click the gear icon
   - Select "API" from the sidebar

2. **Copy Required Values**
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Save These Values**
   - You'll need them for your environment variables

## Step 3: Set Up Database Schema

1. **Go to SQL Editor**
   - In your Supabase dashboard, click "SQL Editor"
   - Click "New Query"

2. **Run the Schema**
   - Copy the contents of `supabase_schema.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

3. **Verify Tables**
   - Go to "Table Editor" to see your tables
   - You should see: users, recipes, inventory, suppliers, etc.

## Step 4: Configure Authentication

1. **Go to Authentication > Settings**
   - In your Supabase dashboard, click "Authentication"
   - Select "Settings" from the sidebar

2. **Configure Site URL**
   - Set **Site URL** to: `http://localhost:3000` (for development)
   - For production, use your actual domain

3. **Configure Redirect URLs**
   - Add: `http://localhost:3000/auth/callback`
   - Add: `http://localhost:3000/dashboard`

## Step 5: Install Dependencies

Run this command in your project root:

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

## Step 6: Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important**: Replace the placeholder values with your actual Supabase credentials.

## Step 7: Test the Connection

1. **Start your development server**:
   ```bash
   pnpm dev
   ```

2. **Check the browser console** for any connection errors

3. **Try logging in** with the demo accounts

## Step 8: Production Deployment

When deploying to production:

1. **Update Environment Variables**
   - Add your Supabase credentials to your hosting platform
   - Update Site URL in Supabase to your production domain

2. **Update Redirect URLs**
   - Add your production domain to Supabase Auth settings

## Troubleshooting

### Common Issues:

1. **"Invalid API key" error**
   - Check that your environment variables are correct
   - Make sure there are no extra spaces in your `.env.local` file

2. **CORS errors**
   - Verify your Site URL and Redirect URLs in Supabase Auth settings

3. **Database connection issues**
   - Check that your database schema was created successfully
   - Verify your project is not paused

### Getting Help:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## Next Steps

After completing this setup:

1. Test all the features in your app
2. Add sample data through the UI
3. Customize the database schema if needed
4. Set up proper RLS policies for your use case
5. Deploy to production

---

**Need help?** Check the troubleshooting section or refer to the Supabase documentation.
