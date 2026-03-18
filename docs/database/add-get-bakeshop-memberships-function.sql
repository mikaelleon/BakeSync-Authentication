-- ============================================================================
-- Add get_bakeshop_memberships Function
-- ============================================================================
-- This script adds the get_bakeshop_memberships function which allows
-- team members to view all memberships for their bakeshop (including owner).
-- This function bypasses RLS to return all memberships.
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_bakeshop_memberships(UUID);

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_bakeshop_memberships(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_bakeshop_memberships IS 'Returns all memberships for a bakeshop with profile information. User must be a member of the bakeshop. Bypasses RLS to show all members including owner.';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ get_bakeshop_memberships function created!';
    RAISE NOTICE '📋 Function allows team members to view all memberships for their bakeshop';
    RAISE NOTICE '👤 This includes the owner and all other team members';
    RAISE NOTICE '🔒 Function uses SECURITY DEFINER to bypass RLS safely';
END $$;
