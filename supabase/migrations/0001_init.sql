-- ============================================================
-- SOGRA Hackathon — 로컬 선물 오마카세 DB 스키마
-- ============================================================

-- UUID 확장
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- users (Supabase auth.users 를 1:1 확장)
-- ─────────────────────────────────────────────
create type user_role as enum ('buyer', 'seller', 'admin');

create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  role         user_role not null default 'buyer',
  display_name text,
  created_at   timestamptz not null default now()
);

-- 회원가입 시 자동으로 public.users 행 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role, display_name)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer'),
    new.raw_user_meta_data->>'display_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- stores
-- ─────────────────────────────────────────────
create table public.stores (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  address     text not null,
  category    text not null,
  region      text not null default '대전충청',
  lat         double precision,
  lng         double precision,
  owner_id    uuid references public.users(id) on delete set null,
  description text,
  created_at  timestamptz not null default now()
);

create index stores_owner_idx on public.stores(owner_id);

-- ─────────────────────────────────────────────
-- products
-- ─────────────────────────────────────────────
create table public.products (
  id          uuid primary key default uuid_generate_v4(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  name        text not null,
  price       integer not null check (price >= 0),
  stock       integer not null default 0 check (stock >= 0),
  image_url   text,
  tags        text[] not null default '{}',
  description text,
  is_approved boolean not null default true, -- 시연 편의상 기본 승인
  created_at  timestamptz not null default now()
);

create index products_store_idx on public.products(store_id);
create index products_tags_idx on public.products using gin(tags);
create index products_price_idx on public.products(price);

-- ─────────────────────────────────────────────
-- orders + order_items
-- ─────────────────────────────────────────────
create type order_status as enum ('pending', 'paid', 'shipped', 'delivered', 'cancelled');

create table public.orders (
  id          uuid primary key default uuid_generate_v4(),
  buyer_id    uuid not null references public.users(id) on delete cascade,
  total_price integer not null check (total_price >= 0),
  status      order_status not null default 'pending',
  created_at  timestamptz not null default now()
);

create table public.order_items (
  id                 uuid primary key default uuid_generate_v4(),
  order_id           uuid not null references public.orders(id) on delete cascade,
  product_id         uuid not null references public.products(id),
  quantity           integer not null check (quantity > 0),
  price_at_purchase  integer not null check (price_at_purchase >= 0)
);

create index orders_buyer_idx on public.orders(buyer_id);
create index order_items_order_idx on public.order_items(order_id);

-- ─────────────────────────────────────────────
-- reviews
-- ─────────────────────────────────────────────
create table public.reviews (
  id         uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  content    text not null,
  rating     integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index reviews_product_idx on public.reviews(product_id);

-- ─────────────────────────────────────────────
-- login_attempts (BruteForce 방어)
-- ─────────────────────────────────────────────
create table public.login_attempts (
  id           bigserial primary key,
  identifier   text not null,  -- email or ip
  ip           text,
  success      boolean not null,
  attempted_at timestamptz not null default now()
);

create index login_attempts_id_time_idx
  on public.login_attempts(identifier, attempted_at desc);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
alter table public.users         enable row level security;
alter table public.stores        enable row level security;
alter table public.products      enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.reviews       enable row level security;
alter table public.login_attempts enable row level security;

-- users: 본인만 조회/수정, admin 은 전체
create policy "users_self_read"   on public.users for select using (auth.uid() = id);
create policy "users_self_update" on public.users for update using (auth.uid() = id);
create policy "users_admin_all"   on public.users for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- stores: 누구나 읽기, seller/admin 만 쓰기
create policy "stores_public_read" on public.stores for select using (true);
create policy "stores_owner_write" on public.stores for all
  using (owner_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (owner_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- products: 승인된 상품 전체 공개, 본인 가게 상품 또는 admin 만 수정
create policy "products_public_read" on public.products for select
  using (is_approved = true
    or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));
create policy "products_owner_write" on public.products for all
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- orders: 본인만 조회, 본인 주문만 작성
create policy "orders_self_read"  on public.orders for select using (buyer_id = auth.uid());
create policy "orders_self_write" on public.orders for insert with check (buyer_id = auth.uid());
create policy "orders_admin_all"  on public.orders for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- order_items: 본인 주문의 아이템만
create policy "order_items_self" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));
create policy "order_items_insert" on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));

-- reviews: 공개 읽기, 본인만 쓰기
create policy "reviews_public_read" on public.reviews for select using (true);
create policy "reviews_self_write"  on public.reviews for insert with check (user_id = auth.uid());
create policy "reviews_self_update" on public.reviews for update using (user_id = auth.uid());
create policy "reviews_self_delete" on public.reviews for delete using (user_id = auth.uid());

-- login_attempts: 서비스 키만 접근 (정책 없음 = 일반 사용자 접근 불가)
