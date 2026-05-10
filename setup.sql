-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ihrygixmwapccqtzdhos/sql

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  city text,
  country text,
  additional_info text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Allow service role (backend) to insert profiles
create policy "Service role can insert profiles"
  on profiles for insert
  with check (true);

-- Allow users to read their own profile
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
