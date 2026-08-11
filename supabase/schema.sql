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

-- ============================================================
-- Lot "Inventaire, fournisseurs & achats"
--
-- Concu des le depart pour le multi-etablissement : chaque table porte
-- une colonne branch_id (nullable, pointant vers "branches"). Pour
-- l instant un seul etablissement existe (cree automatiquement ci-dessous)
-- et toutes les lignes lui sont rattachees par defaut - il suffira, le
-- jour ou un 2e etablissement ouvre, de creer une nouvelle ligne dans
-- "branches" et de filtrer les ecrans par etablissement selectionne,
-- sans migration de schema.
-- ============================================================

create table if not exists branches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  phone text,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Cree l etablissement par defaut une seule fois (si aucun n existe encore)
insert into branches (name, address)
select 'Etablissement principal', (select address from restaurant_info where id = 1)
where not exists (select 1 from branches);

-- Retourne l etablissement par defaut (le plus ancien) - utilise comme
-- valeur par defaut des colonnes branch_id tant qu un seul etablissement
-- existe. Le jour du multi-etablissement, chaque ecran passera
-- explicitement le branch_id choisi au lieu de dependre de ce defaut.
create or replace function default_branch_id()
returns uuid as $$
  select id from branches order by created_at asc limit 1;
$$ language sql stable;

-- Fournisseurs ------------------------------------------------------
create table if not exists suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  notes text,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Articles de stock (ingredients / consommables) ----------------------
create table if not exists inventory_items (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id) default default_branch_id(),
  name text not null,
  category text, -- ex: Viandes, Legumes, Boissons, Emballages...
  unit text not null default 'unite', -- kg | g | l | ml | unite
  current_stock numeric not null default 0,
  min_stock_alert numeric not null default 0, -- seuil d alerte stock bas
  cost_per_unit numeric not null default 0, -- dernier cout d achat connu
  supplier_id uuid references suppliers(id),
  created_at timestamptz default now()
);

-- Bons d achat --------------------------------------------------------
create table if not exists purchases (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id) default default_branch_id(),
  supplier_id uuid references suppliers(id),
  invoice_number text,
  purchase_date date not null default current_date,
  status text not null default 'pending', -- pending | received | cancelled
  total numeric not null default 0,
  notes text,
  created_by uuid references staff(id),
  created_at timestamptz default now(),
  received_at timestamptz
);

create table if not exists purchase_items (
  id uuid primary key default uuid_generate_v4(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id),
  quantity numeric not null,
  unit_cost numeric not null default 0,
  subtotal numeric generated always as (quantity * unit_cost) stored
);

-- Journal des mouvements de stock (source de verite du stock actuel) ---
create table if not exists stock_adjustments (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id) default default_branch_id(),
  inventory_item_id uuid not null references inventory_items(id),
  type text not null, -- purchase_in | manual_in | waste | correction
  quantity numeric not null, -- positif = entree, negatif = sortie
  reason text,
  purchase_id uuid references purchases(id),
  staff_id uuid references staff(id),
  created_at timestamptz default now()
);

-- Chaque mouvement inséré met a jour le stock actuel de l article -----
create or replace function apply_stock_adjustment()
returns trigger as $$
begin
  update inventory_items set current_stock = current_stock + new.quantity
  where id = new.inventory_item_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_stock_adjustment on stock_adjustments;
create trigger on_stock_adjustment
  after insert on stock_adjustments
  for each row execute function apply_stock_adjustment();

-- Reception d un bon d achat : passe son statut a "received", cree un
-- mouvement d entree de stock pour chaque ligne, et met a jour le
-- dernier cout d achat connu de chaque article. Appelee depuis l admin
-- via supabase.rpc('receive_purchase', { p_purchase_id }).
create or replace function receive_purchase(p_purchase_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if not is_staff() then
    raise exception 'Acces reserve a l equipe.';
  end if;

  update purchases
  set status = 'received',
      received_at = now(),
      total = (select coalesce(sum(subtotal), 0) from purchase_items where purchase_id = p_purchase_id)
  where id = p_purchase_id and status = 'pending';

  for r in select * from purchase_items where purchase_id = p_purchase_id loop
    insert into stock_adjustments (inventory_item_id, type, quantity, reason, purchase_id)
    values (r.inventory_item_id, 'purchase_in', r.quantity, 'Reception achat', p_purchase_id);

    update inventory_items set cost_per_unit = r.unit_cost where id = r.inventory_item_id;
  end loop;
end;
$$;

alter table branches enable row level security;
alter table suppliers enable row level security;
alter table inventory_items enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table stock_adjustments enable row level security;

-- ============================================================
-- Lot "Recettes, modificateurs & formules"
-- ============================================================

-- Recettes : quantite d un article de stock consommee par unite vendue
-- d un plat. Sert au calcul du cout et a la deduction automatique du
-- stock quand une commande part en cuisine (voir deduct_recipe_stock).
create table if not exists menu_item_ingredients (
  id uuid primary key default uuid_generate_v4(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id),
  quantity numeric not null,
  unique (menu_item_id, inventory_item_id)
);

-- Groupes de modificateurs (ex: "Taille", "Supplements") -------------
create table if not exists modifier_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  min_select int not null default 0,
  max_select int not null default 1, -- 1 = choix unique, >1 = choix multiple
  required boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists modifiers (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references modifier_groups(id) on delete cascade,
  name text not null,
  price_delta numeric not null default 0,
  sort_order int not null default 0
);

-- Quels groupes de modificateurs s appliquent a quel plat
create table if not exists menu_item_modifier_groups (
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  modifier_group_id uuid not null references modifier_groups(id) on delete cascade,
  primary key (menu_item_id, modifier_group_id)
);

-- Formules / Combos : bundle de plats existants a prix fixe -----------
create table if not exists combos (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists combo_items (
  id uuid primary key default uuid_generate_v4(),
  combo_id uuid not null references combos(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id),
  quantity int not null default 1
);

alter table menu_item_ingredients enable row level security;
alter table modifier_groups enable row level security;
alter table modifiers enable row level security;
alter table menu_item_modifier_groups enable row level security;
alter table combos enable row level security;
alter table combo_items enable row level security;

-- Deduction automatique du stock quand une commande entre en cuisine
-- (passage au statut "new" - creation directe au POS, ou confirmation
-- d une commande livraison). Parcourt orders.items (jsonb) ; chaque
-- ligne peut porter "item_type": "menu_item" (defaut) ou "combo". Les
-- plats sans recette (aucune ligne dans menu_item_ingredients) ne
-- generent simplement aucun mouvement - pas d erreur.
create or replace function deduct_recipe_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  it jsonb;
  item_uuid uuid;
  item_type text;
  item_qty numeric;
  ci record;
begin
  if new.status = 'new' and (tg_op = 'INSERT' or old.status is distinct from 'new') then
    for it in select * from jsonb_array_elements(coalesce(new.items, '[]'::jsonb))
    loop
      item_uuid := nullif(it->>'item_id', '')::uuid;
      item_type := coalesce(it->>'item_type', 'menu_item');
      item_qty := coalesce((it->>'qty')::numeric, 1);
      if item_uuid is null then continue; end if;

      if item_type = 'combo' then
        for ci in select menu_item_id, quantity from combo_items where combo_id = item_uuid loop
          insert into stock_adjustments (inventory_item_id, type, quantity, reason)
          select mi.inventory_item_id, 'sale_out', -(mi.quantity * ci.quantity * item_qty), 'Vente commande ' || new.id
          from menu_item_ingredients mi where mi.menu_item_id = ci.menu_item_id;
        end loop;
      else
        insert into stock_adjustments (inventory_item_id, type, quantity, reason)
        select mi.inventory_item_id, 'sale_out', -(mi.quantity * item_qty), 'Vente commande ' || new.id
        from menu_item_ingredients mi where mi.menu_item_id = item_uuid;
      end if;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_new_deduct_stock on orders;
create trigger on_order_new_deduct_stock
  after insert or update on orders
  for each row execute function deduct_recipe_stock();

-- Rattachement des commandes et de l equipe a un etablissement (multi-branch)
alter table orders add column if not exists branch_id uuid references branches(id) default default_branch_id();
-- Nul = membre de l equipe rattache a tous les etablissements (ex: admin) ;
-- un role "staff" ou "manager" peut au contraire etre limite a un seul.
alter table staff add column if not exists branch_id uuid references branches(id);

-- ============================================================
-- Lot "Caisse (ouverture/fermeture) & Remboursements/Annulations"
-- ============================================================

-- Une "session de caisse" : ouverte par un membre de l equipe avec un
-- fond de caisse de depart, fermee en fin de service avec le montant
-- reellement compte - l ecart avec le montant attendu (fond de depart +
-- ventes especes - remboursements especes) est calcule automatiquement
-- (voir close_shift). Equivalent du rapport "Z" d une caisse enregistreuse.
create table if not exists shifts (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id) default default_branch_id(),
  opened_by uuid references staff(id),
  closed_by uuid references staff(id),
  opening_cash numeric not null default 0,
  closing_cash numeric,
  expected_cash numeric,
  cash_difference numeric,
  status text not null default 'open', -- open | closed
  notes text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

-- Chaque vente POS est rattachee a la session de caisse ouverte au
-- moment de l encaissement, pour pouvoir cloturer une caisse et
-- retrouver ensuite quelles ventes en faisaient partie.
alter table orders add column if not exists shift_id uuid references shifts(id);

-- Remboursements (partiels ou totaux) d une commande deja encaissee -
-- la commande reste dans l historique mais son montant rembourse
-- cumule est visible (orders.refunded_total, tenu a jour par trigger).
create table if not exists order_refunds (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  amount numeric not null,
  payment_method text not null default 'cash', -- cash | card_tpe - impacte le calcul de caisse
  reason text,
  staff_id uuid references staff(id),
  created_at timestamptz default now()
);

alter table orders add column if not exists refunded_total numeric not null default 0;
alter table orders add column if not exists voided_at timestamptz;
alter table orders add column if not exists void_reason text;

alter table shifts enable row level security;
alter table order_refunds enable row level security;

create or replace function apply_order_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders set refunded_total = refunded_total + new.amount where id = new.order_id;
  return new;
end;
$$;

drop trigger if exists on_order_refund on order_refunds;
create trigger on_order_refund
  after insert on order_refunds
  for each row execute function apply_order_refund();

-- Annule une commande (ex: erreur de saisie au POS, commande refusee par
-- le client). Passe son statut a "cancelled" (deja exclu des rapports de
-- vente existants - Analytics, Comptabilite...) et restitue le stock
-- deduit par sa recette si la commande etait deja partie en cuisine.
create or replace function void_order(p_order_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ord record;
  it jsonb;
  item_uuid uuid;
  item_type text;
  item_qty numeric;
  ci record;
  was_in_kitchen boolean;
begin
  if not is_staff() then
    raise exception 'Acces reserve a l equipe.';
  end if;

  select * into ord from orders where id = p_order_id;
  if ord.id is null then raise exception 'Commande introuvable'; end if;
  if ord.status = 'cancelled' then return; end if;

  was_in_kitchen := ord.status in ('new','preparing','ready','out_for_delivery','delivered');

  update orders set status = 'cancelled', voided_at = now(), void_reason = p_reason where id = p_order_id;

  if was_in_kitchen then
    for it in select * from jsonb_array_elements(coalesce(ord.items, '[]'::jsonb)) loop
      item_uuid := nullif(it->>'item_id', '')::uuid;
      item_type := coalesce(it->>'item_type', 'menu_item');
      item_qty := coalesce((it->>'qty')::numeric, 1);
      if item_uuid is null then continue; end if;

      if item_type = 'combo' then
        for ci in select menu_item_id, quantity from combo_items where combo_id = item_uuid loop
          insert into stock_adjustments (inventory_item_id, type, quantity, reason)
          select mi.inventory_item_id, 'correction', (mi.quantity * ci.quantity * item_qty), 'Annulation commande ' || p_order_id
          from menu_item_ingredients mi where mi.menu_item_id = ci.menu_item_id;
        end loop;
      else
        insert into stock_adjustments (inventory_item_id, type, quantity, reason)
        select mi.inventory_item_id, 'correction', (mi.quantity * item_qty), 'Annulation commande ' || p_order_id
        from menu_item_ingredients mi where mi.menu_item_id = item_uuid;
      end if;
    end loop;
  end if;
end;
$$;

grant execute on function void_order(uuid, text) to authenticated;

-- ============================================================
-- Lot "Paiement partage (split payment)"
-- ============================================================

-- Detail des methodes de paiement d une commande : la plupart des
-- commandes n auront qu une seule ligne ici (paiement simple), mais une
-- commande peut en avoir plusieurs si le client a paye en especes ET par
-- carte sur le meme ticket. orders.payment_provider vaut alors 'split'.
-- C est cette table (et non plus orders.payment_provider) qui sert de
-- source de verite pour calculer les especes attendues en caisse.
create table if not exists order_payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  method text not null, -- cash | card_tpe
  amount numeric not null,
  created_at timestamptz default now()
);
alter table order_payments enable row level security;

-- Remise manuelle appliquee au POS (distincte de "discount"/"promo_code",
-- deja utilises pour les codes promo de la livraison).
alter table orders add column if not exists subtotal numeric;
alter table orders add column if not exists discount_amount numeric not null default 0;
alter table orders add column if not exists discount_reason text;

-- Rattache chaque table a un etablissement (multi-branch) et permet au
-- POS de savoir quelle table a passe quelle commande "sur place".
alter table restaurant_tables add column if not exists branch_id uuid references branches(id) default default_branch_id();
alter table orders add column if not exists table_id uuid references restaurant_tables(id);

-- Suivi du paiement des fournisseurs, independant du statut de reception
-- (une livraison peut etre recue et facturee bien avant d etre reglee).
alter table purchases add column if not exists payment_status text not null default 'unpaid'; -- unpaid | paid
alter table purchases add column if not exists paid_at timestamptz;

create or replace function close_shift(p_shift_id uuid, p_closing_cash numeric, p_closed_by uuid default null, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opening numeric;
  v_cash_sales numeric;
  v_cash_refunds numeric;
  v_expected numeric;
begin
  if not is_staff() then
    raise exception 'Acces reserve a l equipe.';
  end if;

  select opening_cash into v_opening from shifts where id = p_shift_id;

  select coalesce(sum(p.amount), 0) into v_cash_sales
  from order_payments p
  join orders o on o.id = p.order_id
  where o.shift_id = p_shift_id and p.method = 'cash' and o.status <> 'cancelled';

  select coalesce(sum(r.amount), 0) into v_cash_refunds
  from order_refunds r join orders o on o.id = r.order_id
  where o.shift_id = p_shift_id and r.payment_method = 'cash';

  v_expected := coalesce(v_opening, 0) + v_cash_sales - v_cash_refunds;

  update shifts set
    status = 'closed',
    closing_cash = p_closing_cash,
    expected_cash = v_expected,
    cash_difference = p_closing_cash - v_expected,
    closed_by = p_closed_by,
    notes = p_notes,
    closed_at = now()
  where id = p_shift_id;
end;
$$;

grant execute on function close_shift(uuid, numeric, uuid, text) to authenticated;
