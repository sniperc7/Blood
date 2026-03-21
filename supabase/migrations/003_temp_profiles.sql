create table temp_profiles (
  id uuid default uuid_generate_v4() primary key,
  created_by uuid references profiles(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  relationship text,
  circle text check (circle in ('family','friends','work','alumni','sports')) default 'family',
  claimed_by uuid references profiles(id) on delete set null,
  claimed boolean default false,
  created_at timestamptz default now()
);

alter table temp_profiles enable row level security;

create policy "Users can view temp profiles they created or that match their email"
  on temp_profiles for select using (auth.role() = 'authenticated');

create policy "Users can create temp profiles"
  on temp_profiles for insert with check (auth.uid() = created_by);

create policy "Users can update temp profiles they created"
  on temp_profiles for update using (auth.uid() = created_by or auth.uid() = claimed_by);
