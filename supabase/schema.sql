-- La Casa Di Carta - schema Supabase (PostgreSQL)
-- A executer dans Supabase > SQL Editor
--
-- Ce fichier est concu pour etre reexecute en entier a tout moment (par
-- exemple apres avoir recupere une nouvelle version du projet) sans
-- provoquer d erreur, meme s il a deja ete execute avant : chaque
-- create table/colonne utilise "if not exists", chaque fonction utilise
-- "or replace", et les deux seules commandes qui n ont pas d equivalent
-- "if not exists" en PostgreSQL (les triggers et l ajout de tables au
-- flux temps reel) sont protegees manuellement (drop trigger if exists /
-- verification prealable). Executez-le simplement a chaque mise a jour.

create extension if not exists "uuid-ossp";

-- Table "staff" : distingue l equipe (admin/manager/cuisine/staff) des
-- simples clients qui ont un compte. Definie ici (pas dans policies.sql)
-- pour garantir qu elle existe avant toute fonction ou politique qui en
-- depend, puisque schema.sql s execute AVANT policies.sql.
create table if not exists staff (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'staff', -- 'admin' | 'manager' | 'cuisine' | 'staff'
  created_at timestamptz default now()
);

create or replace function is_staff()
returns boolean as $$
  select exists (select 1 from staff where id = auth.uid());
$$ language sql security definer stable;

create or replace function is_admin()
returns boolean as $$
  select exists (select 1 from staff where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

-- Apres avoir cree votre premier compte admin dans Supabase Auth, ajoutez-le
-- manuellement a cette table (SQL Editor) pour debloquer l acces admin :
--   insert into staff (id, role) values ('UUID-DU-COMPTE', 'admin');


-- Menu -----------------------------------------------------------
create table if not exists menu_items (
  id uuid primary key default uuid_generate_v4(),
  category text not null,
  name text not null,
  price numeric not null,
  description text,
  is_featured boolean default false,
  available_for_delivery boolean default true,
  image_url text,
  created_at timestamptz default now()
);

-- Reservations -----------------------------------------------------
create table if not exists reservations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  date date not null,
  time time not null,
  guests int not null,
  notes text,
  status text not null default 'pending', -- pending | confirmed | cancelled
  created_at timestamptz default now()
);

-- Commandes livraison ------------------------------------------------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  phone text not null,
  address text not null,
  notes text,
  items jsonb not null default '[]',
  total numeric not null default 0,
  status text not null default 'new', -- awaiting_confirmation | new | preparing | ready | out_for_delivery | delivered | cancelled
  -- Les commandes livraison (order_type = 'delivery') sont inserees avec le
  -- statut "awaiting_confirmation" par le site public - elles ne passent a
  -- "new" (et donc n apparaissent sur l ecran cuisine) qu apres validation
  -- par un admin dans Admin > Confirmation des commandes. Les commandes
  -- sur place (order_type = 'dine_in', via QR code table) sont inserees
  -- directement avec le statut "new" car le client est deja au restaurant.
  created_at timestamptz default now()
);

-- Contenu editable du site (multilingue) ------------------------------
create table if not exists site_content (
  key text primary key,
  value jsonb not null default '{}' -- { "fr": "...", "ar": "...", "es": "...", "en": "..." }
);

-- Fichiers de traduction d interface uploades depuis l admin ------------
create table if not exists ui_translations (
  lang text primary key, -- 'ar' | 'es' | 'en'
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Infos restaurant (adresse, telephone, horaires) ----------------------
create table if not exists restaurant_info (
  id int primary key default 1,
  address text,
  phone text,
  hours text,
  avg_price text,
  google_rating numeric,
  google_review_count int
);

insert into restaurant_info (id, address, phone, hours, avg_price, google_rating, google_review_count)
values (1, 'Rue d Oran, Rabat', '+212537262658', 'Tous les jours, 8h - 23h', '150-250 MAD', 4.2, 324)
on conflict (id) do nothing;

-- Tables physiques du restaurant (pour QR code et attribution de reservation)
create table if not exists restaurant_tables (
  id uuid primary key default uuid_generate_v4(),
  number text not null,
  capacity int not null default 2,
  zone text,
  created_at timestamptz default now()
);

alter table reservations add column if not exists table_id uuid references restaurant_tables(id);
alter table orders add column if not exists table_id uuid references restaurant_tables(id);
alter table orders add column if not exists order_type text not null default 'delivery'; -- delivery | dine_in | takeaway (takeaway = vente comptoir via Admin > Point de vente)
alter table orders add column if not exists notes text;


-- Avis Google mis en cache localement (synchronises via une Edge Function,
-- voir supabase/functions/sync-google-reviews). On ne stocke jamais la cle
-- API Google Places cote client, uniquement le resultat deja recupere.
create table if not exists google_reviews (
  id uuid primary key default uuid_generate_v4(),
  author_name text,
  rating int,
  text text,
  time timestamptz,
  created_at timestamptz default now()
);

-- Active Supabase Realtime sur ces tables pour permettre au tableau de
-- bord admin de recevoir les nouvelles reservations/commandes en direct
-- (utilise par src/admin/hooks/useLiveAlerts.js). Enveloppe dans un test
-- d existence car "alter publication ... add table" echoue si la table y
-- est deja (pas de "if not exists" pour cette commande en PostgreSQL).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reservations'
  ) then
    alter publication supabase_realtime add table reservations;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table orders;
  end if;
end $$;

-- ============================================================
-- Lot "Experience client" : comptes clients, suivi de commande,
-- fidelite, codes promo
-- ============================================================

-- Profil client (etend auth.users de Supabase Auth)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  loyalty_points int not null default 0,
  created_at timestamptz default now()
);

-- Cree automatiquement un profil quand un client s inscrit
create or replace function handle_new_customer()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'phone');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_customer();

-- Codes promo
create table if not exists promo_codes (
  code text primary key,
  discount_type text not null default 'percent', -- 'percent' ou 'fixed'
  value numeric not null,
  min_order numeric default 0,
  active boolean not null default true,
  expires_at date,
  created_at timestamptz default now()
);

-- Lien commande <-> client + promo + tracking
alter table orders add column if not exists customer_id uuid references auth.users(id);
alter table orders add column if not exists promo_code text;
alter table orders add column if not exists discount numeric default 0;
alter table orders add column if not exists status_history jsonb default '[]';
-- Etapes possibles : new -> preparing -> ready -> out_for_delivery -> delivered
--                              (ou "served" pour une commande sur place) / cancelled

alter table reservations add column if not exists customer_id uuid references auth.users(id);

-- Filet de securite au niveau base de donnees : empeche deux reservations
-- actives (pending/confirmed) sur la MEME table, MEME date, MEME heure -
-- utile si deux personnes valident en meme temps (la verification cote
-- application, avec une marge de 2h, reste la premiere ligne de defense
-- mais ne peut pas a elle seule eviter toutes les conditions de course).
create unique index if not exists uniq_active_table_slot
on reservations (table_id, date, time)
where table_id is not null and status in ('pending', 'confirmed');

-- Points de fidelite attribues automatiquement a la livraison (1 point / 10 MAD)
create or replace function award_loyalty_points()
returns trigger as $$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' and new.customer_id is not null then
    update profiles set loyalty_points = loyalty_points + floor(new.total / 10)
    where id = new.customer_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_order_delivered on orders;
create trigger on_order_delivered
  after update on orders
  for each row execute function award_loyalty_points();

-- ============================================================
-- Lot "Cuisine & operations" : suivi cuisine (KDS), roles equipe, CRM
-- ============================================================

-- (is_admin() est defini plus haut, avec la table staff)

-- ============================================================
-- Lot "Contenu & marketing" : galerie photo, evenements/offres, blog
-- ============================================================

create table if not exists gallery_images (
  id uuid primary key default uuid_generate_v4(),
  url text not null,
  caption text,
  category text default 'Restaurant', -- Restaurant | Plats | Evenements ...
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  image_url text,
  event_date date,
  is_offer boolean not null default false, -- true = offre permanente, false = evenement date
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists blog_posts (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null,
  cover_image text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- Lot "WhatsApp, contact & analytics"
-- ============================================================

alter table restaurant_info add column if not exists whatsapp text;
update restaurant_info set whatsapp = '212537262658' where id = 1 and whatsapp is null;

create table if not exists contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  subject text,
  message text not null,
  status text not null default 'new', -- new | read | replied
  created_at timestamptz default now()
);

-- Compteur de pages vues, tres leger, pour avoir un minimum d analytics de
-- trafic sans compte externe. Pour des analytics plus pousses (sources de
-- trafic, taux de rebond...), branchez plutot Google Analytics ou Plausible
-- (ajoutez simplement leur script dans index.html).
create table if not exists page_views (
  id uuid primary key default uuid_generate_v4(),
  path text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- Lot "Page d'accueil : sliders & selection admin"
-- ============================================================

-- Nombre d'avis Google a afficher sur l'accueil (reglable depuis Admin > Contenu)
alter table restaurant_info add column if not exists home_reviews_count int not null default 6;

-- Selection manuelle des photos de la galerie a afficher dans le slider
-- de la page d'accueil (coche depuis Admin > Galerie photo)
alter table gallery_images add column if not exists show_on_home boolean not null default false;

-- ============================================================
-- Stockage (Supabase Storage) : upload d'images depuis l'admin
-- (menu, galerie, evenements, blog) en plus du simple lien URL
-- ============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- ============================================================
-- Lot "Paiement en ligne (ChariBaaS)" : les commandes livraison ne
-- partent en cuisine qu une fois le paiement confirme par webhook,
-- ce qui evite les commandes non recuperees / non payees a la
-- livraison.
-- ============================================================
alter table orders add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded'));
alter table orders add column if not exists payment_provider text;
alter table orders add column if not exists payment_operation_id text;
-- Reference unique generee par notre site, envoyee a ChariBaaS (C-Request-Id /
-- ExternalReference) et utilisee pour retrouver la commande a la reception du webhook.
alter table orders add column if not exists payment_reference text unique;
alter table orders add column if not exists paid_at timestamptz;

-- ============================================================
-- Lot "Suivi de commande invite" : la table orders n a pas de regle de
-- lecture publique (volontairement, pour ne pas exposer toutes les
-- commandes/coordonnees clients via l API REST). Cette fonction permet
-- au client de relire UNIQUEMENT la commande dont il connait deja l id
-- (le lien /suivi/{id} recu apres commande), sans ouvrir la lecture de
-- toute la table.
-- ============================================================
create or replace function get_order_tracking(p_id uuid)
returns setof orders
language sql
security definer
set search_path = public
as $$
  select * from orders where id = p_id;
$$;

-- ============================================================
-- Lot "Interrupteurs de service" : permet de mettre en pause la
-- livraison, le paiement en ligne, ou les reservations depuis
-- Admin > Contenu du site, sans toucher au code (ex: rupture de stock
-- de livreurs, panne du prestataire de paiement, complet ce soir...).
-- ============================================================
alter table restaurant_info add column if not exists delivery_enabled boolean not null default true;
alter table restaurant_info add column if not exists online_payment_enabled boolean not null default true;
alter table restaurant_info add column if not exists reservations_enabled boolean not null default true;

-- ============================================================
-- Lot "Photo(s) du Hero (accueil)" : le visuel principal de la page
-- d accueil peut afficher une ou plusieurs photos de plats, choisies
-- depuis Admin > Contenu du site (lien ou televersement). S il y en a
-- plusieurs, elles defilent en fondu automatiquement.
-- ============================================================
create table if not exists hero_dishes (
  id uuid primary key default uuid_generate_v4(),
  url text not null,
  label text, -- ex: "Pizza al Forno", affiche en overlay (optionnel)
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table hero_dishes enable row level security;
