-- ============================================================================
-- Fix Bakeshop Memberships Policies - Infinite Recursion Fix
-- ============================================================================
-- This script fixes the "infinite recursion detected in policy for relation 
-- 'bakeshop_memberships'" error by simplifying both INSERT and SELECT policies.
--
-- The issue: 
-- 1. INSERT policy was checking bakeshop ownership by querying bakeshops
-- 2. SELECT policy (used when returning inserted rows) also queries bakeshops
-- 3. Bakeshops SELECT policy queries memberships, creating circular dependency
--
-- The fix: 
-- - Simplify INSERT to only allow users to create their own memberships
-- - Simplify SELECT to prioritize user_id check and avoid bakeshop queries
-- - Owners should use the create_bakeshop function which handles membership creation
-- ============================================================================

-- Drop existing policies (including any that might have been created in previous runs)
DROP POLICY IF EXISTS "Users can create their own membership or owners can create for their bakeshops" ON public.bakeshop_memberships;
DROP POLICY IF EXISTS "Users can create their own membership" ON public.bakeshop_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships or all memberships for their bakeshops" ON public.bakeshop_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.bakeshop_memberships;
DROP POLICY IF EXISTS "Users can view memberships for bakeshops they belong to" ON public.bakeshop_memberships;

-- Create simplified INSERT policy that only allows users to create their own memberships
CREATE POLICY "Users can create their own membership"
    ON public.bakeshop_memberships FOR INSERT
    WITH CHECK (
        -- Users can create their own membership (for onboarding)
        -- Note: Owners should use the create_bakeshop function which handles membership creation
        user_id = auth.uid()
    );

-- Create simplified SELECT policy that avoids recursion
-- Users can see their own memberships (this is sufficient for most operations)
CREATE POLICY "Users can view their own memberships"
    ON public.bakeshop_memberships FOR SELECT
    USING (
        -- Users can always see their own memberships (no recursion)
        user_id = auth.uid()
    );

-- Create a function for members to view all memberships (bypasses RLS)
-- This function returns memberships with profile information
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
    IF NOT EXISTS (
        SELECT 1 FROM public.bakeshop_memberships
        WHERE bakeshop_id = p_bakeshop_id
        AND user_id = auth.uid()
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'User is not a member of this bakeshop';
    END IF;
    
    -- Return all memberships for the bakeshop with profile information
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
COMMENT ON FUNCTION public.get_bakeshop_memberships IS 'Returns all memberships for a bakeshop with profile information. User must be a member of the bakeshop.';

-- ============================================================================
-- Note: Viewing all memberships for a bakeshop
-- ============================================================================
-- To view all memberships for a bakeshop (e.g., in team management):
-- Use the get_bakeshop_memberships() function which bypasses RLS safely
-- Example: SELECT * FROM get_bakeshop_memberships('bakeshop-id-here')
-- ============================================================================

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Bakeshop memberships policies fixed!';
    RAISE NOTICE '📋 Users can now create and view their own memberships without recursion errors';
    RAISE NOTICE '🔒 Owners should use create_bakeshop() function for membership creation';
    RAISE NOTICE '📊 Use get_bakeshop_memberships() function to view all memberships for a bakeshop';
END $$;
