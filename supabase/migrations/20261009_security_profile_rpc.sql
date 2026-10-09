-- Restrict profile RPCs to authenticated callers and let RLS protect profile reads.
-- get_my_profile only reads the current user's row, so SECURITY INVOKER is sufficient.
alter function public.get_my_profile() security invoker;

revoke execute on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated;

-- These helper functions are used by RLS policies and Storage policies.
-- Keep them executable for signed-in staff checks, but not for anonymous callers.
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_editor() from public, anon;
revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_editor() to authenticated;
grant execute on function public.is_staff() to authenticated;
