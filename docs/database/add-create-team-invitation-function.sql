-- ============================================================================
-- Add create_team_invitation Function
-- ============================================================================
-- This script adds the create_team_invitation function needed for
-- the "Send Invitation" button to work.
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_team_invitation(UUID, UUID, TEXT, user_role, TEXT);

CREATE OR REPLACE FUNCTION public.create_team_invitation(
  p_bakeshop_id UUID,
  p_invited_by UUID,
  p_email TEXT,
  p_role user_role,
  p_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_id UUID;
  v_token TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_result JSONB;
BEGIN
  -- Validate inputs
  IF p_bakeshop_id IS NULL THEN
    RAISE EXCEPTION 'Bakeshop ID is required';
  END IF;

  IF p_invited_by IS NULL THEN
    RAISE EXCEPTION 'Invited by user ID is required';
  END IF;

  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  IF p_role IS NULL THEN
    RAISE EXCEPTION 'Role is required';
  END IF;

  -- Validate role (only baker and cashier can be invited)
  IF p_role NOT IN ('baker', 'cashier') THEN
    RAISE EXCEPTION 'Invalid role. Only baker and cashier roles can be invited';
  END IF;

  -- Check if inviter is owner of the bakeshop (bypasses RLS due to SECURITY DEFINER)
  IF NOT EXISTS (
    SELECT 1 FROM public.bakeshop_memberships
    WHERE bakeshop_id = p_bakeshop_id
      AND user_id = p_invited_by
      AND user_role = 'owner'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only bakeshop owners can invite team members';
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.bakeshop_memberships
    WHERE bakeshop_id = p_bakeshop_id
      AND user_id IN (SELECT id FROM public.profiles WHERE email = p_email)
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User is already a member of this bakeshop';
  END IF;

  -- Check if there's already a pending invitation for this email and bakeshop
  IF EXISTS (
    SELECT 1 FROM public.team_invitations
    WHERE bakeshop_id = p_bakeshop_id
      AND email = p_email
      AND status = 'pending'
      AND expires_at > NOW()
  ) THEN
    RAISE EXCEPTION 'A pending invitation already exists for this email';
  END IF;

  -- Generate secure token
  v_token := encode(gen_random_bytes(32), 'base64');
  -- Remove any characters that might cause issues in URLs
  v_token := replace(replace(v_token, '+', '-'), '/', '_');
  v_token := substring(v_token from 1 for 43); -- Base64 encoded 32 bytes = 43 chars

  -- Set expiration (7 days from now)
  v_expires_at := NOW() + INTERVAL '7 days';

  -- Create invitation
  INSERT INTO public.team_invitations (
    bakeshop_id,
    email,
    role,
    token,
    message,
    invited_by,
    status,
    expires_at
  ) VALUES (
    p_bakeshop_id,
    p_email,
    p_role,
    v_token,
    p_message,
    p_invited_by,
    'pending',
    v_expires_at
  ) RETURNING id INTO v_invitation_id;

  -- Return result
  v_result := jsonb_build_object(
    'invitation_id', v_invitation_id,
    'token', v_token,
    'expires_at', v_expires_at
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_team_invitation(UUID, UUID, TEXT, user_role, TEXT) TO authenticated;

COMMENT ON FUNCTION public.create_team_invitation IS 'Creates a team invitation with a secure token. Only bakeshop owners can create invitations.';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ create_team_invitation function created!';
    RAISE NOTICE '📋 Function allows owners to send email invitations to team members';
    RAISE NOTICE '🔒 Function uses SECURITY DEFINER to bypass RLS safely';
END $$;
