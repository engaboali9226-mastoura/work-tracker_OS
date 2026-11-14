-- Usernames are the unique local part of a verified email address.
-- This lookup is invoked only by the hosting server before password verification.
create or replace function public.noor_username_login_email_r327(p_username text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when count(*) = 1 then min(candidate.email) end
  from (
    select u.email
    from auth.users as u
    where u.email_confirmed_at is not null
      and u.deleted_at is null
      and lower(split_part(u.email, '@', 1)) = lower(p_username)
    limit 2
  ) as candidate;
$$;

revoke all on function public.noor_username_login_email_r327(text) from public, anon, authenticated;
grant execute on function public.noor_username_login_email_r327(text) to service_role;
