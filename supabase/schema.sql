-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  location text,
  profession text,
  education text,
  expertise_tags text[] default '{}',
  cities_visited text[] default '{}',
  avatar_url text,
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by authenticated users"
  on profiles for select using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ─────────────────────────────────────────
-- CONNECTIONS
-- ─────────────────────────────────────────
create table connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  connected_user_id uuid references profiles(id) on delete cascade not null,
  relationship_type text,
  circle text check (circle in ('family','friends','work','alumni','sports')),
  created_at timestamptz default now(),
  unique(user_id, connected_user_id)
);

alter table connections enable row level security;

create policy "Users can view their own connections"
  on connections for select using (auth.uid() = user_id);

create policy "Users can manage their own connections"
  on connections for insert with check (auth.uid() = user_id);

create policy "Users can delete their own connections"
  on connections for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- POSTS (Ask Network)
-- ─────────────────────────────────────────
create table posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  circle text check (circle in ('family','friends','work','alumni','sports','all')),
  visibility text check (visibility in ('1st','2nd')) default '2nd',
  created_at timestamptz default now()
);

alter table posts enable row level security;

create policy "Authenticated users can view posts"
  on posts for select using (auth.role() = 'authenticated');

create policy "Users can create their own posts"
  on posts for insert with check (auth.uid() = author_id);

create policy "Users can delete their own posts"
  on posts for delete using (auth.uid() = author_id);

-- ─────────────────────────────────────────
-- TRUSTED CONTACTS
-- ─────────────────────────────────────────
create table trusted_contacts (
  id uuid default uuid_generate_v4() primary key,
  added_by uuid references profiles(id) on delete cascade not null,
  name text not null,
  category text not null,
  phone text,
  city text,
  created_at timestamptz default now()
);

alter table trusted_contacts enable row level security;

create policy "Authenticated users can view trusted contacts"
  on trusted_contacts for select using (auth.role() = 'authenticated');

create policy "Users can add trusted contacts"
  on trusted_contacts for insert with check (auth.uid() = added_by);

create policy "Users can delete their own trusted contacts"
  on trusted_contacts for delete using (auth.uid() = added_by);

-- ─────────────────────────────────────────
-- AUTO-CREATE PROFILE ON SIGNUP
-- ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
