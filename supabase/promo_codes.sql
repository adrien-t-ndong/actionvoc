-- Add bonus_meetings to profiles
alter table profiles add column if not exists bonus_meetings integer default 0;

-- Promo codes table
create table if not exists promo_codes (
  code text primary key,
  bonus_meetings integer not null,
  max_uses integer not null,
  uses_count integer default 0,
  active boolean default true,
  created_at timestamp default now()
);

-- Promo redemptions table
create table if not exists promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  code text references promo_codes(code) not null,
  redeemed_at timestamp default now(),
  unique(user_id, code)
);

-- RLS — no direct user access, all operations go through service role API routes
alter table promo_codes enable row level security;
alter table promo_redemptions enable row level security;

-- Insert first code
insert into promo_codes (code, bonus_meetings, max_uses)
values ('TIKTOK10', 10, 50)
on conflict (code) do nothing;
