-- Delete user account: keochan.artizea@gmail.com and all associated data
-- This script should be run with service role permissions to bypass RLS

-- First, let's find the user ID and check what data exists
SELECT 'Finding user account...' as info;

SELECT 
    'User Profile:' as info,
    id, 
    email, 
    name, 
    created_at
FROM public.profiles 
WHERE email = 'keochan.artizea@gmail.com';

-- Check bakeshop memberships
SELECT 
    'Bakeshop Memberships:' as info,
    bm.id as membership_id,
    bm.bakeshop_id,
    bm.user_role,
    b.name as bakeshop_name
FROM public.bakeshop_memberships bm
JOIN public.profiles p ON p.id = bm.user_id
LEFT JOIN public.bakeshops b ON b.id = bm.bakeshop_id
WHERE p.email = 'keochan.artizea@gmail.com';

-- Check bakeshops owned by this user
SELECT 
    'Owned Bakeshops:' as info,
    b.id,
    b.name,
    b.slug,
    b.created_by
FROM public.bakeshops b
JOIN public.profiles p ON p.id = b.created_by
WHERE p.email = 'keochan.artizea@gmail.com';

-- Check other tables that might reference this user
SELECT 
    'User Preferences:' as info,
    up.user_id,
    up.theme,
    up.created_at
FROM public.user_preferences up
JOIN public.profiles p ON p.id = up.user_id
WHERE p.email = 'keochan.artizea@gmail.com';

SELECT 
    'User Activities:' as info,
    ua.id,
    ua.activity_type,
    ua.created_at
FROM public.user_activities ua
JOIN public.profiles p ON p.id = ua.user_id
WHERE p.email = 'keochan.artizea@gmail.com';

SELECT 
    'Team Invitations:' as info,
    ti.id,
    ti.email,
    ti.role,
    ti.status
FROM public.team_invitations ti
WHERE ti.email = 'keochan.artizea@gmail.com';

SELECT 
    'Notifications:' as info,
    n.id,
    n.title,
    n.created_at
FROM public.notifications n
JOIN public.profiles p ON p.id = n.user_id
WHERE p.email = 'keochan.artizea@gmail.com';

-- Now proceed with deletion (in correct order to avoid foreign key constraints)

-- Step 1: Delete from auth.users (Supabase Auth table)
-- Note: This requires service role access
DELETE FROM auth.users 
WHERE email = 'keochan.artizea@gmail.com';

-- Step 2: Delete notifications
DELETE FROM public.notifications 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email = 'keochan.artizea@gmail.com'
);

-- Step 3: Delete user activities
DELETE FROM public.user_activities 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email = 'keochan.artizea@gmail.com'
);

-- Step 4: Delete user preferences
DELETE FROM public.user_preferences 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email = 'keochan.artizea@gmail.com'
);

-- Step 5: Delete team invitations (both sent and received)
DELETE FROM public.team_invitations 
WHERE email = 'keochan.artizea@gmail.com'
   OR invited_by IN (
       SELECT id FROM public.profiles 
       WHERE email = 'keochan.artizea@gmail.com'
   );

-- Step 6: Delete bakeshop memberships
DELETE FROM public.bakeshop_memberships 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email = 'keochan.artizea@gmail.com'
);

-- Step 7: Delete bakeshops owned by this user
-- First, get the bakeshop IDs owned by this user
WITH user_bakeshops AS (
    SELECT b.id as bakeshop_id
    FROM public.bakeshops b
    JOIN public.profiles p ON p.id = b.created_by
    WHERE p.email = 'keochan.artizea@gmail.com'
)
-- Delete any remaining memberships for these bakeshops
DELETE FROM public.bakeshop_memberships 
WHERE bakeshop_id IN (SELECT bakeshop_id FROM user_bakeshops);

-- Delete any related data that might reference these bakeshops
-- (Add other tables that might reference bakeshops here if they exist)

-- Then delete the bakeshops themselves
DELETE FROM public.bakeshops 
WHERE created_by IN (
    SELECT id FROM public.profiles 
    WHERE email = 'keochan.artizea@gmail.com'
);

-- Step 8: Delete onboarding completion records
DELETE FROM public.onboarding_completion 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email = 'keochan.artizea@gmail.com'
);

-- Step 9: Finally, delete the profile
DELETE FROM public.profiles 
WHERE email = 'keochan.artizea@gmail.com';

-- Verification: Check that all data has been deleted
SELECT 'Verification - Checking for remaining data...' as info;

SELECT 
    'Remaining Profiles:' as info,
    COUNT(*) as count
FROM public.profiles 
WHERE email = 'keochan.artizea@gmail.com';

SELECT 
    'Remaining Bakeshop Memberships:' as info,
    COUNT(*) as count
FROM public.bakeshop_memberships bm
JOIN public.profiles p ON p.id = bm.user_id
WHERE p.email = 'keochan.artizea@gmail.com';

SELECT 
    'Remaining Bakeshops:' as info,
    COUNT(*) as count
FROM public.bakeshops b
JOIN public.profiles p ON p.id = b.created_by
WHERE p.email = 'keochan.artizea@gmail.com';

SELECT 'Account deletion completed!' as info;
