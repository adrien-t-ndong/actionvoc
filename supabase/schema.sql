-- Users (géré par Supabase Auth, on étend avec un profil)
create table profiles (
  id uuid references auth.users primary key,
  email text,
  full_name text,
  plan text default 'free', -- 'free' | 'pro'
  meetings_count integer default 0,
  stripe_customer_id text,
  created_at timestamp default now()
);

-- Meetings
create table meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text,
  type text default 'internal', -- 'internal' | 'client' | 'sales'
  duration_seconds integer,
  summary text,
  decisions jsonb default '[]',
  transcript text,
  audio_url text,
  created_at timestamp default now()
);

-- Actions / Tasks
create table actions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  owner_name text,
  due_date date,
  priority text default 'medium', -- 'high' | 'medium' | 'low'
  status text default 'open', -- 'open' | 'done'
  reminder_sent boolean default false,
  created_at timestamp default now()
);

-- Email recipients per meeting
create table meeting_recipients (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade,
  email text not null,
  sent_at timestamp
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table meetings enable row level security;
alter table actions enable row level security;
alter table meeting_recipients enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- RLS Policies for meetings
create policy "Users can view own meetings"
  on meetings for select
  using (auth.uid() = user_id);

create policy "Users can insert own meetings"
  on meetings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own meetings"
  on meetings for update
  using (auth.uid() = user_id);

create policy "Users can delete own meetings"
  on meetings for delete
  using (auth.uid() = user_id);

-- RLS Policies for actions
create policy "Users can view own actions"
  on actions for select
  using (auth.uid() = user_id);

create policy "Users can insert own actions"
  on actions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own actions"
  on actions for update
  using (auth.uid() = user_id);

create policy "Users can delete own actions"
  on actions for delete
  using (auth.uid() = user_id);

-- RLS Policies for meeting_recipients
create policy "Users can view recipients for own meetings"
  on meeting_recipients for select
  using (
    exists (
      select 1 from meetings
      where meetings.id = meeting_recipients.meeting_id
      and meetings.user_id = auth.uid()
    )
  );

create policy "Users can insert recipients for own meetings"
  on meeting_recipients for insert
  with check (
    exists (
      select 1 from meetings
      where meetings.id = meeting_recipients.meeting_id
      and meetings.user_id = auth.uid()
    )
  );

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call function on new user (drop first to allow re-running this file)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for audio recordings (run this in Supabase dashboard)
-- insert into storage.buckets (id, name, public) values ('audio-recordings', 'audio-recordings', true);
