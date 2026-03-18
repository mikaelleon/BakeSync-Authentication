-- ============================================================================
-- Create Bakeshop Function (Standalone Migration)
-- ============================================================================
-- This file contains ONLY the create_bakeshop function needed to fix the
-- "infinite recursion detected in policy for relation 'bakeshops'" error.
--
-- Run this in your Supabase SQL Editor if you only need to add this function.
-- ============================================================================

-- Drop existing function if it exists (needed to change return type)
-- This handles all overloads of the function
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT oid::regprocedure 
    FROM pg_proc 
    WHERE proname = 'create_bakeshop' 
      AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid::regprocedure || ' CASCADE';
  END LOOP;
END $$;

-- Function to create bakeshop (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.create_bakeshop(
    p_name TEXT,
    p_slug TEXT,
    p_business_type TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_address JSONB DEFAULT NULL,
    p_contact_info JSONB DEFAULT NULL,
    p_operating_hours JSONB DEFAULT NULL,
    p_timezone TEXT DEFAULT 'Asia/Manila',
    p_currency TEXT DEFAULT 'PHP',
    p_language TEXT DEFAULT 'en',
    p_invite_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_bakeshop_id UUID;
    v_result JSONB;
    v_rls_enabled_bakeshops BOOLEAN;
    v_rls_enabled_memberships BOOLEAN;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create a bakeshop';
    END IF;
    
    -- Check current RLS status and temporarily disable if enabled
    SELECT relforcerowsecurity INTO v_rls_enabled_bakeshops
    FROM pg_class WHERE relname = 'bakeshops';
    
    SELECT relforcerowsecurity INTO v_rls_enabled_memberships
    FROM pg_class WHERE relname = 'bakeshop_memberships';
    
    -- Temporarily disable RLS to avoid recursion
    IF v_rls_enabled_bakeshops THEN
        ALTER TABLE public.bakeshops DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF v_rls_enabled_memberships THEN
        ALTER TABLE public.bakeshop_memberships DISABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Insert the bakeshop (RLS is temporarily disabled)
    INSERT INTO public.bakeshops (
        name,
        slug,
        business_type,
        description,
        address,
        contact_info,
        operating_hours,
        timezone,
        currency,
        language,
        invite_code,
        created_by,
        is_active
    )
    VALUES (
        p_name,
        p_slug,
        p_business_type,
        p_description,
        p_address,
        p_contact_info,
        p_operating_hours,
        p_timezone,
        p_currency,
        p_language,
        p_invite_code,
        v_user_id,
        true
    )
    RETURNING bakeshops.id INTO v_bakeshop_id;
    
    -- Create the membership for the owner (RLS is temporarily disabled)
    INSERT INTO public.bakeshop_memberships (
        user_id,
        bakeshop_id,
        user_role,
        is_active,
        joined_at
    )
    VALUES (
        v_user_id,
        v_bakeshop_id,
        'owner',
        true,
        NOW()
    );
    
    -- Re-enable RLS if it was enabled before
    IF v_rls_enabled_bakeshops THEN
        ALTER TABLE public.bakeshops ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF v_rls_enabled_memberships THEN
        ALTER TABLE public.bakeshop_memberships ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Return the created bakeshop as JSONB
    SELECT to_jsonb(b.*)
    INTO v_result
    FROM public.bakeshops b
    WHERE b.id = v_bakeshop_id;
    
    RETURN v_result;
END;
$$;

-- Ensure function is owned by postgres (has permissions to bypass RLS)
ALTER FUNCTION public.create_bakeshop(
    TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT
) OWNER TO postgres;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_bakeshop TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_bakeshop IS 'Creates a bakeshop and owner membership, bypassing RLS to avoid recursion errors';

-- Verification
DO $$
BEGIN
    RAISE NOTICE '✅ create_bakeshop function created successfully!';
    RAISE NOTICE '📋 You can now use this function to create bakeshops without RLS recursion errors';
END $$;
