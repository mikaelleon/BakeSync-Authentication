-- ============================================================================
-- Verify get_bakeshop_memberships Function
-- ============================================================================
-- This script checks if the get_bakeshop_memberships function exists
-- and shows its definition.
-- ============================================================================

-- Check if function exists
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'get_bakeshop_memberships'
AND pronamespace = 'public'::regnamespace;

-- If no results, the function doesn't exist
-- Run the fix-bakeshop-memberships-insert-policy.sql script to create it
