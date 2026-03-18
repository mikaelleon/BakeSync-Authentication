-- ============================================================================
-- Fix create_role_invite_code Function
-- ============================================================================
-- This script ensures the create_role_invite_code function exists and is
-- properly configured. This function is needed for the "Generate Invite Code"
-- buttons to work.
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_role_invite_code(UUID, VARCHAR, UUID, TIMESTAMP WITH TIME ZONE, INTEGER);

-- Function to create or regenerate a role invite code
CREATE OR REPLACE FUNCTION public.create_role_invite_code(
  p_bakeshop_id UUID,
  p_role VARCHAR(20),
  p_created_by UUID,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_max_uses INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code VARCHAR(6);
  v_result JSONB;
BEGIN
  -- Check if user is owner (bypasses RLS due to SECURITY DEFINER)
  IF NOT EXISTS (
    SELECT 1 FROM public.bakeshop_memberships
    WHERE bakeshop_id = p_bakeshop_id
    AND user_id = p_created_by
    AND user_role = 'owner'
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only owners can create role invite codes';
  END IF;
  
  -- Validate role
  IF p_role NOT IN ('baker', 'cashier') THEN
    RAISE EXCEPTION 'Role must be either baker or cashier';
  END IF;
  
  -- Deactivate existing active code for this role
  UPDATE public.role_invite_codes
  SET is_active = false, updated_at = NOW()
  WHERE bakeshop_id = p_bakeshop_id
  AND role = p_role
  AND is_active = true;
  
  -- Generate new code using the helper function
  v_code := generate_unique_role_invite_code();
  
  -- Insert new code
  INSERT INTO public.role_invite_codes (
    bakeshop_id,
    role,
    invite_code,
    created_by,
    expires_at,
    max_uses,
    is_active
  ) VALUES (
    p_bakeshop_id,
    p_role,
    v_code,
    p_created_by,
    p_expires_at,
    p_max_uses,
    true
  );
  
  -- Return result
  SELECT jsonb_build_object(
    'success', true,
    'invite_code', v_code,
    'role', p_role,
    'expires_at', p_expires_at,
    'max_uses', p_max_uses
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_role_invite_code(UUID, VARCHAR, UUID, TIMESTAMP WITH TIME ZONE, INTEGER) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_role_invite_code IS 'Creates or regenerates a role-specific invite code. Only bakeshop owners can create invite codes.';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ create_role_invite_code function created/updated!';
    RAISE NOTICE '📋 Function is now available for generating role invite codes';
    RAISE NOTICE '🔒 Only owners can create invite codes';
END $$;
