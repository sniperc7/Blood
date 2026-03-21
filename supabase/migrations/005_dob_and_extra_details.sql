-- Add DOB to profiles
alter table profiles add column if not exists date_of_birth date;

-- Add DOB and extra details to family tree members
alter table family_tree_members
  add column if not exists date_of_birth date,
  add column if not exists location_city text,
  add column if not exists location_country text,
  add column if not exists profession text,
  add column if not exists company text,
  add column if not exists education text,
  add column if not exists notes text;

-- Add DOB and extra details to temp profiles
alter table temp_profiles
  add column if not exists date_of_birth date,
  add column if not exists profession text,
  add column if not exists notes text;
