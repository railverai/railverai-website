-- Run once in Supabase SQL Editor. No public table access.
create table if not exists public.enquiries (
 id uuid primary key default gen_random_uuid(),
 name text not null, email text not null, company text not null,
 country text not null, interest text not null, message text not null default '',
 created_at timestamptz not null default now(), status text not null default 'new'
);
create index if not exists enquiries_email_created on public.enquiries(email, created_at desc);
alter table public.enquiries enable row level security;
revoke all on public.enquiries from anon, authenticated;
grant select, insert on public.enquiries to service_role;
create or replace function public.submit_enquiry(payload jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare new_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(lower(payload->>'email'),0));
 if exists(select 1 from public.enquiries where email=lower(payload->>'email') and created_at>now()-interval '60 seconds') then
  raise exception 'rate_limited';
 end if;
 insert into public.enquiries(name,email,company,country,interest,message)
 values(payload->>'name',lower(payload->>'email'),payload->>'company',payload->>'country',payload->>'interest',payload->>'message') returning id into new_id;
 return new_id;
end;
$$;
revoke all on function public.submit_enquiry(jsonb) from public, anon, authenticated;
grant execute on function public.submit_enquiry(jsonb) to service_role;
