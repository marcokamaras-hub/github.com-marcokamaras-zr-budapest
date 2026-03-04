-- ============================================================
-- Zielinski & Rozen Budapest — Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  sku             text,
  ean             text,
  price           numeric(10,2) not null,         -- always in EUR
  stock           integer not null default 0,
  category        text not null,
  size            text,
  description     text,                            -- EN
  description_hu  text,                            -- HU
  image_url       text,
  is_active       boolean not null default true,
  lightspeed_id   text,                            -- for stock sync matching
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists products_category_idx on products(category);
create index if not exists products_is_active_idx on products(is_active);
create index if not exists products_sku_idx on products(sku);
create index if not exists products_ean_idx on products(ean);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on products;
create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists orders (
  id                    uuid primary key default gen_random_uuid(),
  order_number          text unique not null,
  customer_name         text not null,
  customer_email        text,
  customer_phone        text not null,
  delivery_method       text not null check (delivery_method in ('delivery', 'pickup')),
  delivery_date         date,
  delivery_address      text,
  delivery_city         text,
  delivery_postal_code  text,
  notes                 text,
  items                 jsonb not null default '[]',
  subtotal              numeric(10,2),
  delivery_fee          numeric(10,2),
  total                 numeric(10,2),
  currency              text not null default 'EUR',
  status                text not null default 'pending'
    check (status in ('pending','confirmed','preparing','shipped','delivered','cancelled')),
  payment_status        text not null default 'unpaid'
    check (payment_status in ('unpaid','pending','paid','failed','refunded')),
  revolut_order_id      text,
  session_id            text,                      -- for order lookup without auth
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists orders_status_idx on orders(status);
create index if not exists orders_customer_email_idx on orders(customer_email);
create index if not exists orders_session_id_idx on orders(session_id);
create index if not exists orders_created_at_idx on orders(created_at desc);

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- ============================================================
-- WISHLISTS  (anonymous, keyed by session_id)
-- ============================================================
create table if not exists wishlists (
  id               uuid primary key default gen_random_uuid(),
  session_id       text not null,
  product_id       uuid references products(id) on delete cascade,
  product_name     text,
  product_price    numeric(10,2),
  product_image    text,
  product_category text,
  created_at       timestamptz not null default now()
);

create index if not exists wishlists_session_idx on wishlists(session_id);

-- ============================================================
-- BUNDLES  (custom gift sets, anonymous)
-- ============================================================
create table if not exists bundles (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  name        text not null,
  products    jsonb not null default '[]',
  total_price numeric(10,2),
  is_template boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists bundles_session_idx on bundles(session_id);

-- ============================================================
-- SYNC LOG  (for Lightspeed sync tracking)
-- ============================================================
create table if not exists sync_log (
  id              uuid primary key default gen_random_uuid(),
  synced_at       timestamptz not null default now(),
  products_synced integer,
  status          text not null check (status in ('success','error')),
  error_message   text
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table products  enable row level security;
alter table orders    enable row level security;
alter table wishlists enable row level security;
alter table bundles   enable row level security;
alter table sync_log  enable row level security;

-- ─── Drop all policies first (idempotent re-runs) ───────────
drop policy if exists "Public read active products"                  on products;
drop policy if exists "Authenticated admin full access to products"  on products;
drop policy if exists "Anyone can create an order"                   on orders;
drop policy if exists "Anon can read orders"                         on orders;
drop policy if exists "Authenticated admin can update orders"        on orders;
drop policy if exists "Authenticated admin can delete orders"        on orders;
drop policy if exists "Anyone can manage wishlists"                  on wishlists;
drop policy if exists "Anyone can manage bundles"                    on bundles;
drop policy if exists "Authenticated admin can manage sync_log"      on sync_log;

-- ─── PRODUCTS ───────────────────────────────────────────────
-- Storefront: read active products only (anon)
create policy "Public read active products"
  on products for select
  using (is_active = true);

-- Admin (authenticated via Supabase Auth magic link): full CRUD
create policy "Authenticated admin full access to products"
  on products for all
  to authenticated
  using (true)
  with check (true);

-- ─── ORDERS ─────────────────────────────────────────────────
-- Anyone (anon) can place an order
create policy "Anyone can create an order"
  on orders for insert
  with check (true);

-- Customers can read their own orders (filtered by session_id in app layer)
-- We permit anon reads; the API always adds .eq('session_id', ...) filter
create policy "Anon can read orders"
  on orders for select
  using (true);

-- Only authenticated admin can update / delete orders
create policy "Authenticated admin can update orders"
  on orders for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated admin can delete orders"
  on orders for delete
  to authenticated
  using (true);

-- ─── WISHLISTS ───────────────────────────────────────────────
-- Session-keyed; security enforced via .eq('session_id', ...) in API layer
create policy "Anyone can manage wishlists"
  on wishlists for all
  using (true)
  with check (true);

-- ─── BUNDLES ─────────────────────────────────────────────────
-- Session-keyed; security enforced via .eq('session_id', ...) in API layer
create policy "Anyone can manage bundles"
  on bundles for all
  using (true)
  with check (true);

-- ─── SYNC LOG ────────────────────────────────────────────────
-- Admin only
create policy "Authenticated admin can manage sync_log"
  on sync_log for all
  to authenticated
  using (true)
  with check (true);
