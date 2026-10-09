-- Legacy published videos were missing published_at and therefore were hidden by the video archive query.
-- Preserve their original creation timestamps instead of assigning a new publication date.
update public.videos
set published_at = coalesce(created_at, now())
where status = 'published'
  and published_at is null;
