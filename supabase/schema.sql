-- ================================================================
-- StockWise Pro - Supabase Database Schema & Row Level Security
-- ================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Create Portfolios Table
create table if not exists public.portfolios (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  strategy text not null default 'GROWTH' check (strategy in ('GROWTH', 'DIVIDEND', 'TRADING', 'CUSTOM')),
  color text default '#10b981',
  description text,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast user portfolio query
create index if not exists idx_portfolios_user_id on public.portfolios (user_id);

-- 2. Create Transactions Table (with portfolio_id)
create table if not exists public.transactions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  portfolio_id text default 'growth',
  currency text default 'USD' check (currency in ('USD', 'THB')),
  date text not null,
  type text not null check (type in ('BUY', 'SELL')),
  symbol text not null,
  name text,
  shares numeric not null,
  price numeric not null,        -- Price in the transaction currency
  price_usd numeric,             -- Price converted to USD (for portfolio calculations)
  total numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add columns if table already exists (migration-safe)
alter table public.transactions add column if not exists portfolio_id text default 'growth';
alter table public.transactions add column if not exists currency text default 'USD';
alter table public.transactions add column if not exists price_usd numeric;

-- Index for fast user query
create index if not exists idx_transactions_user_id on public.transactions (user_id);
create index if not exists idx_transactions_portfolio_id on public.transactions (portfolio_id);
create index if not exists idx_transactions_symbol on public.transactions (symbol);

-- 3. Create Watchlist Table
create table if not exists public.watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  symbol text not null,
  name text not null,
  target_buy_price numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, symbol)
);

-- Index for fast watchlist query
create index if not exists idx_watchlist_user_id on public.watchlist (user_id);

-- 4. Enable Row Level Security (RLS)
alter table public.portfolios enable row level security;
alter table public.transactions enable row level security;
alter table public.watchlist enable row level security;

-- 5. Policies for Portfolios
drop policy if exists "Users can view their own portfolios" on public.portfolios;
create policy "Users can view their own portfolios"
  on public.portfolios for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own portfolios" on public.portfolios;
create policy "Users can insert their own portfolios"
  on public.portfolios for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own portfolios" on public.portfolios;
create policy "Users can update their own portfolios"
  on public.portfolios for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own portfolios" on public.portfolios;
create policy "Users can delete their own portfolios"
  on public.portfolios for delete
  using (auth.uid() = user_id);

-- 6. Policies for Transactions
drop policy if exists "Users can view their own transactions" on public.transactions;
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own transactions" on public.transactions;
create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own transactions" on public.transactions;
create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own transactions" on public.transactions;
create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- 7. Policies for Watchlist
drop policy if exists "Users can view their own watchlist" on public.watchlist;
create policy "Users can view their own watchlist"
  on public.watchlist for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own watchlist" on public.watchlist;
create policy "Users can insert their own watchlist"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own watchlist" on public.watchlist;
create policy "Users can update their own watchlist"
  on public.watchlist for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own watchlist" on public.watchlist;
create policy "Users can delete their own watchlist"
  on public.watchlist for delete
  using (auth.uid() = user_id);
