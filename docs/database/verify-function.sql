-- ============================================================================
-- Verify create_bakeshop Function Exists
-- ============================================================================
-- Run this in Supabase SQL Editor to check if the function exists and has
-- the correct permissions.
-- ============================================================================

-- Check if function exists
SELECT 
    proname as function_name,
    pronargs as parameter_count,
    prorettype::regtype as return_type,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'create_bakeshop'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check function permissions
SELECT 
    p.proname as function_name,
    r.rolname as role_name,
    has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
CROSS JOIN pg_roles r
WHERE p.proname = 'create_bakeshop'
AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND r.rolname IN ('authenticated', 'anon', 'service_role')
ORDER BY r.rolname;

-- Check if required tables exist
SELECT 
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('bakeshops', 'bakeshop_memberships')
ORDER BY table_name;

-- If function doesn't exist, you'll see no results above.
-- If you see the function but permissions are false, that's the issue.
