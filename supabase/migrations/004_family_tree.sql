create table family_tree_members (
  id uuid default uuid_generate_v4() primary key,
  tree_owner_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  user_id uuid references profiles(id) on delete set null,
  -- relationship_label is how this person relates to the node they connect through
  -- e.g. "Father", "Younger Brother", "Son"
  relationship_label text not null,
  -- parent_member_id is who they connect through in the tree
  -- null means they connect directly to the tree owner
  parent_member_id uuid references family_tree_members(id) on delete set null,
  created_at timestamptz default now()
);

alter table family_tree_members enable row level security;

create policy "Users can view their own family tree"
  on family_tree_members for select using (auth.uid() = tree_owner_id);

create policy "Users can add to their own family tree"
  on family_tree_members for insert with check (auth.uid() = tree_owner_id);

create policy "Users can update their own family tree"
  on family_tree_members for update using (auth.uid() = tree_owner_id);

create policy "Users can delete from their own family tree"
  on family_tree_members for delete using (auth.uid() = tree_owner_id);
