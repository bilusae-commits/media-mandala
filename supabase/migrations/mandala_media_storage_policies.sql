-- MANDALA MEDIA STORAGE
-- Run this migration in the connected Supabase project if the project connection
-- does not allow automated migrations from ChatGPT.

insert into storage.buckets (id, name, public)
values ('mandala-media', 'mandala-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "mandala media public read" on storage.objects;
drop policy if exists "mandala media staff upload" on storage.objects;
drop policy if exists "mandala media staff update" on storage.objects;
drop policy if exists "mandala media admin delete" on storage.objects;

create policy "mandala media public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'mandala-media');

create policy "mandala media staff upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'mandala-media' and (public.is_admin() or public.is_editor()));

create policy "mandala media staff update"
on storage.objects for update
to authenticated
using (bucket_id = 'mandala-media' and (public.is_admin() or public.is_editor()))
with check (bucket_id = 'mandala-media' and (public.is_admin() or public.is_editor()));

create policy "mandala media admin delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'mandala-media' and public.is_admin());