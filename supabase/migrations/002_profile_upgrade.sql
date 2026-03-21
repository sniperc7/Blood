-- Profile fields upgrade

alter table profiles
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists last_name text,
  add column if not exists location_city text,
  add column if not exists location_country text,
  add column if not exists job_role text,
  add column if not exists company_name text,
  add column if not exists company_city text,
  add column if not exists company_country text,
  add column if not exists college_name text,
  add column if not exists college_city text,
  add column if not exists college_country text,
  add column if not exists college_major text,
  add column if not exists countries_visited text[] default '{}',
  add column if not exists phone text,
  add column if not exists linkedin_url text,
  add column if not exists instagram_url text,
  add column if not exists facebook_url text;
