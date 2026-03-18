-- ============================================================================
-- Simple Fix for Bakeshop Memberships RLS - Run This First
-- ============================================================================
-- This is a simplified version that fixes the RLS policies step by step
-- ============================================================================

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Users can create their own membership or owners can create for their bakeshops" ON public.bakeshop_memberships;
DROP POLICY IF EXISTS "Users can create their own membership" ON public.bakeshop_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships or all memberships for their bakeshops" ON public.bakeshop_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.bakeshop_memberships;
DROP POLICY IF EXISTS "Users can view memberships for bakeshops they belong to" ON public.bakeshop_memberships;
DROP POLICY IF EXISTS "Users can update their own membership or owners can update for their bakeshops" ON public.bakeshop_memberships;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.bakeshop_memberships;

-- Step 2: Create simplified INSERT policy
CREATE POLICY "Users can create their own membership"
    ON public.bakeshop_memberships FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Step 3: Create simplified SELECT policy
CREATE POLICY "Users can view their own memberships"
    ON public.bakeshop_memberships FOR SELECT
    USING (user_id = auth.uid());

-- Step 4: Create simplified UPDATE policy
CREATE POLICY "Users can update their own membership"
    ON public.bakeshop_memberships FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Step 5: Create get_bakeshop_memberships function
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
    IF NOT EXISTS (
        SELECT 1 FROM public.bakeshop_memberships
        WHERE bakeshop_id = p_bakeshop_id
        AND user_id = auth.uid()
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'User is not a member of this bakeshop';
    END IF;
    
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

-- Step 6: Create recovery function
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
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.bakeshops WHERE id = p_bakeshop_id AND is_active = true) THEN
    RAISE EXCEPTION 'Bakeshop not found or inactive';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.bakeshop_memberships
    WHERE user_id = p_user_id
    AND bakeshop_id = p_bakeshop_id
    AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Membership already exists');
  END IF;

  INSERT INTO public.bakeshop_memberships (
    user_id, bakeshop_id, user_role, is_active, joined_at
  ) VALUES (
    p_user_id, p_bakeshop_id, p_role, true, NOW()
  );

  RETURN jsonb_build_object('success', true, 'message', 'Membership created successfully');
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_missing_membership(UUID, UUID, user_role) TO authenticated;
