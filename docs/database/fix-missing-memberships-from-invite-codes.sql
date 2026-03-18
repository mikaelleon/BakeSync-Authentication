-- ============================================================================
-- Fix Missing Memberships from Invite Codes
-- ============================================================================
-- This script finds users who used invite codes but don't have memberships
-- and creates the missing memberships for them.
-- ============================================================================

-- Find users who used invite codes but don't have memberships
-- This is a recovery script for users who signed up but membership creation failed

-- Step 1: Find role invite codes that were used
WITH used_codes AS (
  SELECT 
    ric.bakeshop_id,
    ric.role,
    ric.usage_count,
    b.name as bakeshop_name,
    b.slug as bakeshop_slug
  FROM public.role_invite_codes ric
  INNER JOIN public.bakeshops b ON b.id = ric.bakeshop_id
  WHERE ric.usage_count > 0
    AND ric.is_active = true
    AND b.is_active = true
)
-- Step 2: Find users who might have used these codes but don't have memberships
-- Note: This is a manual recovery - you'll need to identify which users used which codes
SELECT 
  'To fix a specific user, run:' as instruction,
  'INSERT INTO public.bakeshop_memberships (user_id, bakeshop_id, user_role, is_active, joined_at)' as sql_start,
  'VALUES (''USER_ID_HERE'', ''BAKESHOP_ID_HERE'', ''baker'' or ''cashier'', true, NOW());' as sql_end,
  'WHERE:' as where_clause,
  'USER_ID_HERE = the user ID from auth.users or profiles table' as user_id_help,
  'BAKESHOP_ID_HERE = the bakeshop_id from the used_codes above' as bakeshop_id_help
FROM used_codes
LIMIT 1;

-- ============================================================================
-- Manual Recovery Function
-- ============================================================================
-- This function can be used to manually create a membership for a user
-- who used an invite code but membership creation failed
-- ============================================================================

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

COMMENT ON FUNCTION public.create_missing_membership IS 'Creates a missing membership for a user who used an invite code but membership creation failed. Use this for recovery.';

-- ============================================================================
-- Query to find users who might need recovery
-- ============================================================================
-- Run this query to see which bakeshops have used invite codes
-- Then check if users exist who should be members but aren't
-- ============================================================================

SELECT 
  b.id as bakeshop_id,
  b.name as bakeshop_name,
  b.slug as bakeshop_slug,
  ric.role,
  ric.usage_count,
  ric.invite_code,
  COUNT(bm.id) as current_members
FROM public.role_invite_codes ric
INNER JOIN public.bakeshops b ON b.id = ric.bakeshop_id
LEFT JOIN public.bakeshop_memberships bm ON bm.bakeshop_id = ric.bakeshop_id 
  AND bm.user_role = ric.role::user_role
  AND bm.is_active = true
WHERE ric.usage_count > 0
  AND ric.is_active = true
GROUP BY b.id, b.name, b.slug, ric.role, ric.usage_count, ric.invite_code
ORDER BY b.name, ric.role;

-- ============================================================================
-- Instructions
-- ============================================================================
-- 1. Run the query above to see which bakeshops have used invite codes
-- 2. For each bakeshop with used codes, check if there are users who should be members
-- 3. Use the create_missing_membership function to create missing memberships:
--    SELECT create_missing_membership('user-id-here', 'bakeshop-id-here', 'baker'::user_role);
-- ============================================================================
