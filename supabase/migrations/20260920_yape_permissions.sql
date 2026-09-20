begin;

alter table public.bids enable row level security;
revoke all on table public.bids from anon, authenticated;
grant select (id, title, url, image_url, amount, status, created_at) on public.bids to anon, authenticated;
grant all on table public.bids to service_role;

-- Restrictive policy also limits any older permissive read policies.
create policy bids_public_confirmed_only on public.bids
as restrictive for select to anon, authenticated
using (status in ('king', 'active', 'approved'));
create policy bids_public_read on public.bids
for select to anon, authenticated
using (status in ('king', 'active', 'approved'));

create unique index bids_yape_operation_unique
on public.bids (operation_number)
where operation_number is not null and operation_number <> '' and operation_number <> 'Pendiente';

commit;
