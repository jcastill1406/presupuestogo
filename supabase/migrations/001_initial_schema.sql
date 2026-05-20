-- ============================================================
-- PresupuestoGo — Migración inicial
-- Ejecutar en: Supabase > SQL Editor > New query
-- ============================================================

-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- para búsqueda de texto

-- ============================================================
-- TABLA: profiles (extiende auth.users de Supabase)
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text,
  avatar_url   text,
  currency     text not null default 'CRC',
  locale       text not null default 'es-CR',
  push_token   text,
  notifications_enabled boolean not null default true,
  biometric_enabled     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- TABLA: accounts (cuentas bancarias y tarjetas)
-- ============================================================
create table if not exists public.accounts (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  name             text not null,
  type             text not null check (type in ('bank','credit','savings','cash','investment')),
  balance          numeric(15,2) not null default 0,
  credit_limit     numeric(15,2),
  bank_name        text,
  last_four        text,
  color            text default '#6c63ff',
  icon             text default 'ti-building-bank',
  is_active        boolean not null default true,
  include_in_total boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- TABLA: categories (algunas son del sistema, otras del usuario)
-- ============================================================
create table if not exists public.categories (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.profiles(id) on delete cascade,  -- null = sistema
  name       text not null,
  type       text not null default 'all' check (type in ('expense','income','transfer','all')),
  icon       text not null default 'ti-tag',
  color      text not null default '#6c63ff',
  is_system  boolean not null default false,
  created_at timestamptz not null default now()
);

-- Categorías del sistema (compartidas por todos los usuarios)
insert into public.categories (id, user_id, name, type, icon, color, is_system) values
  (uuid_generate_v4(), null, 'Alimentación',     'expense',  'ti-shopping-cart', '#ef4444', true),
  (uuid_generate_v4(), null, 'Transporte',        'expense',  'ti-car',           '#f59e0b', true),
  (uuid_generate_v4(), null, 'Servicios',         'expense',  'ti-home',          '#3b82f6', true),
  (uuid_generate_v4(), null, 'Entretenimiento',   'expense',  'ti-device-gamepad','#a855f7', true),
  (uuid_generate_v4(), null, 'Salud',             'expense',  'ti-heart',         '#22c55e', true),
  (uuid_generate_v4(), null, 'Restaurantes',      'expense',  'ti-utensils',      '#ec4899', true),
  (uuid_generate_v4(), null, 'Ropa y calzado',    'expense',  'ti-shirt',         '#06b6d4', true),
  (uuid_generate_v4(), null, 'Educación',         'expense',  'ti-school',        '#8b5cf6', true),
  (uuid_generate_v4(), null, 'Viajes',            'expense',  'ti-plane',         '#f97316', true),
  (uuid_generate_v4(), null, 'Deudas',            'expense',  'ti-receipt',       '#ef4444', true),
  (uuid_generate_v4(), null, 'Salario',           'income',   'ti-briefcase',     '#22c55e', true),
  (uuid_generate_v4(), null, 'Freelance',         'income',   'ti-laptop',        '#3b82f6', true),
  (uuid_generate_v4(), null, 'Alquiler cobrado',  'income',   'ti-home',          '#f59e0b', true),
  (uuid_generate_v4(), null, 'Inversiones',       'income',   'ti-chart-line',    '#a855f7', true),
  (uuid_generate_v4(), null, 'Transferencia',     'transfer', 'ti-arrows-right-left','#64748b',true)
on conflict do nothing;

-- ============================================================
-- TABLA: transactions
-- ============================================================
create table if not exists public.transactions (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  account_id            uuid not null references public.accounts(id) on delete cascade,
  category_id           uuid references public.categories(id) on delete set null,
  type                  text not null check (type in ('expense','income','transfer')),
  amount                numeric(15,2) not null check (amount > 0),
  description           text,
  notes                 text,
  date                  date not null default current_date,
  is_recurrent          boolean not null default false,
  recurrence_frequency  text check (recurrence_frequency in ('daily','weekly','biweekly','monthly','yearly')),
  recurrence_end_date   date,
  is_ignored            boolean not null default false,
  receipt_url           text,
  location              text,
  labels                text[] not null default '{}',
  remind_at             date,
  transfer_account_id   uuid references public.accounts(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Índices para búsquedas frecuentes
create index if not exists idx_transactions_user_date on public.transactions(user_id, date desc);
create index if not exists idx_transactions_account   on public.transactions(account_id);
create index if not exists idx_transactions_category  on public.transactions(category_id);
create index if not exists idx_transactions_labels    on public.transactions using gin(labels);

-- ============================================================
-- TABLA: budgets (presupuesto mensual por categoría)
-- ============================================================
create table if not exists public.budgets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month       smallint not null check (month between 1 and 12),
  year        smallint not null check (year >= 2020),
  amount      numeric(15,2) not null check (amount > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(user_id, category_id, month, year)
);

-- ============================================================
-- TABLA: goals (objetivos de ahorro)
-- ============================================================
create table if not exists public.goals (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  name           text not null,
  icon           text not null default 'ti-target',
  color          text not null default '#6c63ff',
  target_amount  numeric(15,2) not null check (target_amount > 0),
  current_amount numeric(15,2) not null default 0,
  deadline       date,
  status         text not null default 'active' check (status in ('active','completed','paused')),
  account_id     uuid references public.accounts(id) on delete set null,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- TABLA: reminders (recordatorios y alertas de pago)
-- ============================================================
create table if not exists public.reminders (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  title                 text not null,
  description           text,
  amount                numeric(15,2),
  due_date              date not null,
  type                  text not null default 'custom' check (type in ('payment','service','review','custom')),
  is_done               boolean not null default false,
  is_recurrent          boolean not null default false,
  recurrence_frequency  text check (recurrence_frequency in ('weekly','biweekly','monthly','yearly')),
  notify_days_before    smallint not null default 3,
  account_id            uuid references public.accounts(id) on delete set null,
  created_at            timestamptz not null default now()
);

-- ============================================================
-- TABLA: labels (etiquetas personalizadas)
-- ============================================================
create table if not exists public.labels (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  color      text not null default '#6c63ff',
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — cada usuario solo ve sus datos
-- ============================================================
alter table public.profiles    enable row level security;
alter table public.accounts    enable row level security;
alter table public.categories  enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets     enable row level security;
alter table public.goals       enable row level security;
alter table public.reminders   enable row level security;
alter table public.labels      enable row level security;

-- Políticas: solo el dueño accede a sus filas
create policy "profiles_own"     on public.profiles     for all using (auth.uid() = id);
create policy "accounts_own"     on public.accounts     for all using (auth.uid() = user_id);
create policy "transactions_own" on public.transactions for all using (auth.uid() = user_id);
create policy "budgets_own"      on public.budgets      for all using (auth.uid() = user_id);
create policy "goals_own"        on public.goals        for all using (auth.uid() = user_id);
create policy "reminders_own"    on public.reminders    for all using (auth.uid() = user_id);
create policy "labels_own"       on public.labels       for all using (auth.uid() = user_id);

-- Categorías: sistema visible para todos, propias solo para su dueño
create policy "categories_read" on public.categories
  for select using (is_system = true or auth.uid() = user_id);
create policy "categories_own"  on public.categories
  for all using (auth.uid() = user_id);

-- ============================================================
-- FUNCIÓN: crear perfil automáticamente al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- FUNCIÓN: actualizar balance de cuenta al insertar transacción
-- ============================================================
create or replace function public.update_account_balance()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.type = 'income' then
      update public.accounts set balance = balance + NEW.amount, updated_at = now()
      where id = NEW.account_id;
    elsif NEW.type = 'expense' then
      update public.accounts set balance = balance - NEW.amount, updated_at = now()
      where id = NEW.account_id;
    elsif NEW.type = 'transfer' then
      update public.accounts set balance = balance - NEW.amount, updated_at = now()
      where id = NEW.account_id;
      if NEW.transfer_account_id is not null then
        update public.accounts set balance = balance + NEW.amount, updated_at = now()
        where id = NEW.transfer_account_id;
      end if;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.type = 'income' then
      update public.accounts set balance = balance - OLD.amount, updated_at = now()
      where id = OLD.account_id;
    elsif OLD.type = 'expense' then
      update public.accounts set balance = balance + OLD.amount, updated_at = now()
      where id = OLD.account_id;
    elsif OLD.type = 'transfer' then
      update public.accounts set balance = balance + OLD.amount, updated_at = now()
      where id = OLD.account_id;
      if OLD.transfer_account_id is not null then
        update public.accounts set balance = balance - OLD.amount, updated_at = now()
        where id = OLD.transfer_account_id;
      end if;
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

create or replace trigger trg_update_balance
  after insert or delete on public.transactions
  for each row execute procedure public.update_account_balance();

-- ============================================================
-- VISTA: resumen mensual por usuario (útil para el dashboard)
-- ============================================================
create or replace view public.monthly_summary as
select
  user_id,
  extract(year  from date)::int as year,
  extract(month from date)::int as month,
  sum(case when type = 'income'   and not is_ignored then amount else 0 end) as total_income,
  sum(case when type = 'expense'  and not is_ignored then amount else 0 end) as total_expenses,
  count(case when type = 'expense' then 1 end) as expense_count
from public.transactions
group by user_id, year, month;

-- Seguridad en la vista
create policy "monthly_summary_own" on public.transactions
  for select using (auth.uid() = user_id);
