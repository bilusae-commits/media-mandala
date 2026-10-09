-- Avoid per-row re-evaluation of auth.uid() in the own-profile read policy.
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
for select to authenticated
using (id = (select auth.uid()));
