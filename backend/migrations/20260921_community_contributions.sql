-- My Delhi — Community tips contribute / validate loop
-- Apply in Supabase SQL Editor. Does not drop existing tables.
-- Community tips NEVER become official government contacts automatically.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.community_tips (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null,
  title text not null,
  body text not null,
  when_to_act text,
  suggested_channel_label text,
  suggested_channel_url text,
  status text not null default 'pending'
    check (status in (
      'pending',
      'needs_more_votes',
      'community_supported',
      'staff_reviewed',
      'rejected',
      'archived'
    )),
  agree_count int not null default 0,
  disagree_count int not null default 0,
  contributor_device_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_note text,
  constraint community_tips_title_len check (char_length(title) between 8 and 120),
  constraint community_tips_body_len check (char_length(body) between 20 and 800)
);

create index if not exists community_tips_status_idx
  on public.community_tips(status, created_at desc);
create index if not exists community_tips_category_idx
  on public.community_tips(category_slug, status);

create table if not exists public.community_tip_votes (
  id uuid primary key default gen_random_uuid(),
  tip_id uuid not null references public.community_tips(id) on delete cascade,
  device_hash text not null,
  vote text not null check (vote in ('agree', 'disagree')),
  created_at timestamptz not null default now(),
  unique (tip_id, device_hash)
);

create index if not exists community_tip_votes_tip_idx
  on public.community_tip_votes(tip_id);

-- ---------------------------------------------------------------------------
-- Helpers: thresholds
-- agree >= 5 AND ratio >= 0.7 → community_supported
-- disagree >= 5 AND ratio < 0.4 → rejected
-- ---------------------------------------------------------------------------

create or replace function public.community_tip_recompute_status(p_tip_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agree int;
  v_disagree int;
  v_status text;
  v_total int;
  v_ratio numeric;
begin
  select agree_count, disagree_count, status
    into v_agree, v_disagree, v_status
  from public.community_tips
  where id = p_tip_id
  for update;

  if not found then
    return;
  end if;

  -- Staff reviewed / archived / rejected stay unless already rejected by votes
  if v_status in ('staff_reviewed', 'archived') then
    return;
  end if;

  v_total := v_agree + v_disagree;
  if v_total = 0 then
    update public.community_tips
      set status = 'pending', updated_at = now()
    where id = p_tip_id;
    return;
  end if;

  v_ratio := v_agree::numeric / v_total::numeric;

  if v_disagree >= 5 and v_ratio < 0.4 then
    update public.community_tips
      set status = 'rejected', updated_at = now()
    where id = p_tip_id;
    return;
  end if;

  if v_agree >= 5 and v_ratio >= 0.7 then
    update public.community_tips
      set status = 'community_supported', updated_at = now()
    where id = p_tip_id
      and status <> 'staff_reviewed';
    return;
  end if;

  update public.community_tips
    set status = 'needs_more_votes', updated_at = now()
  where id = p_tip_id
    and status not in ('staff_reviewed', 'rejected', 'archived');
end;
$$;

-- ---------------------------------------------------------------------------
-- submit_community_tip
-- ---------------------------------------------------------------------------

create or replace function public.submit_community_tip(
  p_device_hash text,
  p_category_slug text,
  p_title text,
  p_body text,
  p_when_to_act text default null,
  p_channel_label text default null,
  p_channel_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_title text := trim(p_title);
  v_body text := trim(p_body);
  v_url text := nullif(trim(coalesce(p_channel_url, '')), '');
begin
  if p_device_hash is null or char_length(p_device_hash) < 16 then
    raise exception 'invalid device';
  end if;
  if v_title is null or char_length(v_title) < 8 or char_length(v_title) > 120 then
    raise exception 'invalid title';
  end if;
  if v_body is null or char_length(v_body) < 20 or char_length(v_body) > 800 then
    raise exception 'invalid body';
  end if;

  -- Block panic / impersonation phrasing (simple server-side guard)
  if lower(v_title || ' ' || v_body) ~ '(official warning|government order|govt order|we declare|evacuate now by order)' then
    raise exception 'blocked phrasing';
  end if;

  if v_url is not null then
    if v_url !~* '^https?://' then
      raise exception 'invalid url';
    end if;
    -- Allow .gov.in and known store listings only
    if v_url !~* '\.gov\.in' and v_url !~* '(play\.google\.com|apps\.apple\.com)' then
      raise exception 'url not allowed';
    end if;
  end if;

  insert into public.community_tips (
    category_slug,
    title,
    body,
    when_to_act,
    suggested_channel_label,
    suggested_channel_url,
    status,
    contributor_device_hash
  ) values (
    lower(trim(p_category_slug)),
    v_title,
    v_body,
    nullif(trim(coalesce(p_when_to_act, '')), ''),
    nullif(trim(coalesce(p_channel_label, '')), ''),
    v_url,
    'needs_more_votes',
    p_device_hash
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- vote_community_tip — no self-vote; one vote per device
-- ---------------------------------------------------------------------------

create or replace function public.vote_community_tip(
  p_tip_id uuid,
  p_device_hash text,
  p_vote text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contrib text;
  v_status text;
  v_agree int;
  v_disagree int;
begin
  if p_device_hash is null or char_length(p_device_hash) < 16 then
    raise exception 'invalid device';
  end if;
  if p_vote not in ('agree', 'disagree') then
    raise exception 'invalid vote';
  end if;

  select contributor_device_hash, status
    into v_contrib, v_status
  from public.community_tips
  where id = p_tip_id
  for update;

  if not found then
    raise exception 'tip not found';
  end if;

  if v_status in ('rejected', 'archived') then
    raise exception 'tip closed';
  end if;

  if v_contrib = p_device_hash then
    raise exception 'cannot vote own tip';
  end if;

  insert into public.community_tip_votes (tip_id, device_hash, vote)
  values (p_tip_id, p_device_hash, p_vote)
  on conflict (tip_id, device_hash) do update
    set vote = excluded.vote;

  select
    coalesce(sum(case when vote = 'agree' then 1 else 0 end), 0),
    coalesce(sum(case when vote = 'disagree' then 1 else 0 end), 0)
  into v_agree, v_disagree
  from public.community_tip_votes
  where tip_id = p_tip_id;

  update public.community_tips
    set agree_count = v_agree,
        disagree_count = v_disagree,
        updated_at = now()
  where id = p_tip_id;

  perform public.community_tip_recompute_status(p_tip_id);

  select status, agree_count, disagree_count
    into v_status, v_agree, v_disagree
  from public.community_tips
  where id = p_tip_id;

  return jsonb_build_object(
    'status', v_status,
    'agree_count', v_agree,
    'disagree_count', v_disagree
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.community_tips enable row level security;
alter table public.community_tip_votes enable row level security;

drop policy if exists community_tips_public_read on public.community_tips;
create policy community_tips_public_read
  on public.community_tips for select
  using (
    status in ('needs_more_votes', 'community_supported', 'staff_reviewed')
  );

-- Inserts/votes go through security definer RPCs; no direct insert policy for anon.
grant usage on schema public to anon, authenticated;
grant select on public.community_tips to anon, authenticated;
grant execute on function public.submit_community_tip(text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.vote_community_tip(uuid, text, text) to anon, authenticated;
