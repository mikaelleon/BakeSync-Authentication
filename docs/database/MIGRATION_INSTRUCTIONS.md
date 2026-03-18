# Database Migration Instructions

## Quick Fix (Recommended)

If you're getting the error "Database function not found", you can quickly add just the `create_bakeshop` function:

### Quick Steps:

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** (in the left sidebar)

2. **Run the Quick Fix**
   - Open the file: `docs/database/create-bakeshop-function-only.sql`
   - Copy the **entire contents** of the file
   - Paste it into the Supabase SQL Editor
   - Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

3. **Verify the Function Exists**
   - After running, verify the function was created:
   ```sql
   SELECT proname 
   FROM pg_proc 
   WHERE proname = 'create_bakeshop';
   ```
   - You should see the function listed

4. **Try Onboarding Again**
   - Go back to your app and try completing the onboarding setup
   - The error should be resolved!

---

## Full Migration (Complete Setup)

If you want to set up the entire database from scratch or update everything:

### Steps:

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** (in the left sidebar)

2. **Run the Full Migration**
   - Open the file: `docs/database/supabase-schema.sql`
   - Copy the **entire contents** of the file
   - Paste it into the Supabase SQL Editor
   - Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

3. **Verify the Function Exists**
   - After running the migration, you can verify the function was created by running:
   ```sql
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'create_bakeshop';
   ```
   - You should see the function listed

### What This Migration Does:

- Creates all database tables (profiles, bakeshops, memberships, etc.)
- Adds all columns (invite_code, price, tags, category, etc.)
- Sets up all RLS policies (with fixes for infinite recursion)
- Creates the `create_bakeshop` function (bypasses RLS to prevent recursion errors)
- Creates team invitation functions
- Sets up all indexes and triggers

### Important Notes:

- This migration is **idempotent** - you can run it multiple times safely
- It uses `CREATE OR REPLACE` and `IF NOT EXISTS` statements
- If you get errors about existing objects, that's normal - the migration will update them

### After Migration:

Once the migration is complete, try completing the onboarding setup again. The "infinite recursion" error should be resolved.
