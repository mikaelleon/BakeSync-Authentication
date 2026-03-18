-- ============================================================================
-- Complete Fix for Bakeshop Memberships RLS Infinite Recursion
-- ============================================================================
-- This script completely fixes the infinite recursion error by:
-- 1. Dropping ALL existing policies on bakeshop_memberships
-- 2. Creating simplified policies that avoid circular dependencies
-- 3. Ensuring the function exists for viewing all memberships
-- ============================================================================

-- Step 1: Drop ALL existing policies (comprehensive cleanup)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'bakeshop_memberships'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.bakeshop_memberships';
    END LOOP;
END $$;

-- Step 2: Create simplified INSERT policy (no recursion possible)
CREATE POLICY "Users can create their own membership"
    ON public.bakeshop_memberships FOR INSERT
    WITH CHECK (
        -- Only allow users to create their own membership
        -- This is safe and prevents recursion
        user_id = auth.uid()
    );

-- Step 3: Create simplified SELECT policy (no recursion possible)
CREATE POLICY "Users can view their own memberships"
    ON public.bakeshop_memberships FOR SELECT
    USING (
        -- Only allow users to see their own memberships
        -- This is safe and prevents recursion
        user_id = auth.uid()
    );

-- Step 4: Create simplified UPDATE policy (no recursion possible)
CREATE POLICY "Users can update their own membership"
    ON public.bakeshop_memberships FOR UPDATE
    USING (
        -- Users can update their own membership
        user_id = auth.uid()
    )
    WITH CHECK (
        -- Ensure they can only update their own membership
        user_id = auth.uid()
    );

-- Step 5: Ensure get_bakeshop_memberships function exists (for viewing all members)
DROP FUNCTION IF EXISTS public.get_bakeshop_memberships(UUID);

CREATE OR REPLACE FUNCTION public.get_bakeshop_memberships(p_bakeshop_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    bakeshop_id UUID,
    user_role user_role,
    is_active BOOLEAN,
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    profile_id UUID,
    profile_email TEXT,
    profile_name TEXT,
    profile_last_login_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify the user is a member of the bakeshop
    -- This check bypasses RLS due to SECURITY DEFINER
    IF NOT EXISTS (
        SELECT 1 FROM public.bakeshop_memberships
        WHERE bakeshop_id = p_bakeshop_id
        AND user_id = auth.uid()
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'User is not a member of this bakeshop';
    END IF;
    
    -- Return all memberships for the bakeshop with profile information
    -- This query bypasses RLS due to SECURITY DEFINER
    RETURN QUERY
    SELECT 
        bm.id,
        bm.user_id,
        bm.bakeshop_id,
        bm.user_role,
        bm.is_active,
        bm.joined_at,
        bm.created_at,
        bm.updated_at,
        p.id AS profile_id,
        p.email AS profile_email,
        p.name AS profile_name,
        p.last_login_at AS profile_last_login_at
    FROM public.bakeshop_memberships bm
    LEFT JOIN public.profiles p ON p.id = bm.user_id
    WHERE bm.bakeshop_id = p_bakeshop_id
    AND bm.is_active = true
    ORDER BY bm.joined_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_bakeshop_memberships(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_bakeshop_memberships IS 'Returns all memberships for a bakeshop with profile information. User must be a member of the bakeshop. Bypasses RLS to show all members including owner.';

-- Step 6: Create recovery function for missing memberships
DROP FUNCTION IF EXISTS public.create_missing_membership(UUID, UUID, user_role);

CREATE OR REPLACE FUNCTION public.create_missing_membership(
  p_user_id UUID,
  p_bakeshop_id UUID,
  p_role user_role
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify bakeshop exists
  IF NOT EXISTS (SELECT 1 FROM public.bakeshops WHERE id = p_bakeshop_id AND is_active = true) THEN
    RAISE EXCEPTION 'Bakeshop not found or inactive';
  END IF;

  -- Check if membership already exists
  IF EXISTS (
    SELECT 1 FROM public.bakeshop_memberships
    WHERE user_id = p_user_id
    AND bakeshop_id = p_bakeshop_id
    AND is_active = true
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Membership already exists'
    );
  END IF;

  -- Create the membership (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.bakeshop_memberships (
    user_id,
    bakeshop_id,
    user_role,
    is_active,
    joined_at
  ) VALUES (
    p_user_id,
    p_bakeshop_id,
    p_role,
    true,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Membership created successfully'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_missing_membership(UUID, UUID, user_role) TO authenticated;

COMMENT ON FUNCTION public.create_missing_membership IS 'Creates a missing membership for recovery when membership creation failed during signup.';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ All bakeshop_memberships policies dropped and recreated!';
    RAISE NOTICE '📋 INSERT policy: Users can only create their own memberships';
    RAISE NOTICE '📋 SELECT policy: Users can only view their own memberships';
    RAISE NOTICE '📋 UPDATE policy: Users can only update their own memberships';
    RAISE NOTICE '🔒 All policies avoid circular dependencies - no recursion possible';
    RAISE NOTICE '📊 Use get_bakeshop_memberships() function to view all memberships';
    RAISE NOTICE '🔧 Use create_missing_membership() function to recover failed memberships';
END $$;
