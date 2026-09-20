begin;
create table public.site_metrics (
  key text primary key,
  total bigint not null default 0 check (total >= 0)
);
insert into public.site_metrics(key) values ('visits');
alter table public.site_metrics enable row level security;
grant select on public.site_metrics to anon, authenticated;
grant all on public.site_metrics to service_role;
create policy metrics_read on public.site_metrics for select to anon, authenticated using (true);
create table public.metric_events (
  event_id uuid primary key,
  key text not null,
  visitor uuid not null,
  created_at timestamptz not null default now()
);
create index metric_events_recent on public.metric_events(visitor,key,created_at);
alter table public.metric_events enable row level security;
revoke all on public.metric_events from anon, authenticated;
grant all on public.metric_events to service_role;
create function public.record_site_metric(p_event uuid, p_visitor uuid, p_bid uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare metric_key text := case when p_bid is null then 'visits' else 'click:' || p_bid::text end;
begin
  if p_bid is not null and not exists(select 1 from public.bids where id=p_bid and status in ('king','active','approved')) then
    raise exception 'Unknown public bid';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_visitor::text || metric_key,0));
  delete from public.metric_events where created_at < now() - interval '1 day';
  if exists(select 1 from public.metric_events where event_id=p_event) then return; end if;
  if exists(select 1 from public.metric_events where visitor=p_visitor and key=metric_key
    and created_at > now() - case when p_bid is null then interval '2 seconds' else interval '10 seconds' end) then return; end if;
  insert into public.metric_events(event_id,key,visitor) values(p_event,metric_key,p_visitor) on conflict do nothing;
  if not found then return; end if;
  insert into public.site_metrics(key,total) values(metric_key,1)
    on conflict(key) do update set total=public.site_metrics.total+1;
end;
$$;
revoke all on function public.record_site_metric(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.record_site_metric(uuid,uuid,uuid) to service_role;
alter publication supabase_realtime add table public.site_metrics;
commit;
