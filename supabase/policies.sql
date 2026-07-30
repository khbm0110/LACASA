-- Politiques RLS (Row Level Security) - a adapter selon vos besoins.
-- Active RLS sur toutes les tables sensibles.

-- IMPORTANT : la table "staff" et les fonctions is_staff()/is_admin() sont
-- maintenant definies dans schema.sql (executez-le en premier). Ici on ne
-- fait qu activer la RLS et poser les politiques d acces.

alter table staff enable row level security;
create policy "staff read own row" on staff for select using (auth.uid() = id);
create policy "admin manage staff" on staff for all using (is_admin());

alter table menu_items enable row level security;
alter table reservations enable row level security;
alter table orders enable row level security;
alter table site_content enable row level security;
alter table ui_translations enable row level security;
alter table restaurant_info enable row level security;

-- Lecture publique du menu et du contenu du site
create policy "public read menu" on menu_items for select using (true);
create policy "public read content" on site_content for select using (true);
create policy "public read translations" on ui_translations for select using (true);
create policy "public read info" on restaurant_info for select using (true);

-- Le public peut CREER une reservation ou une commande, mais pas les lire/modifier
create policy "public insert reservations" on reservations for insert with check (true);
create policy "public insert orders" on orders for insert with check (true);

-- Seule l equipe (table staff) peut tout gerer
create policy "admin full access menu" on menu_items for all using (is_staff());
create policy "admin full access reservations" on reservations for all using (is_staff());
create policy "admin full access orders" on orders for all using (is_staff());
create policy "admin full access content" on site_content for all using (is_staff());
create policy "admin full access translations" on ui_translations for all using (is_staff());
create policy "admin full access info" on restaurant_info for all using (is_staff());

alter table restaurant_tables enable row level security;
create policy "public read tables" on restaurant_tables for select using (true);
create policy "admin full access tables" on restaurant_tables for all using (is_staff());

alter table google_reviews enable row level security;
create policy "public read google reviews" on google_reviews for select using (true);
create policy "admin full access google reviews" on google_reviews for all using (is_staff());

-- Lot "Experience client" ------------------------------------------------
alter table profiles enable row level security;
alter table promo_codes enable row level security;

-- Un client ne voit / modifie que son propre profil
create policy "customer read own profile" on profiles for select using (auth.uid() = id);
create policy "customer update own profile" on profiles for update using (auth.uid() = id);
-- L equipe (staff) peut voir tous les profils (pour le CRM)
create policy "staff read all profiles" on profiles for select using (is_staff());

-- Codes promo lisibles par tous (necessaire pour verifier un code au checkout),
-- modifiables seulement par l equipe
create policy "public read promo codes" on promo_codes for select using (true);
create policy "staff manage promo codes" on promo_codes for all using (is_staff());

-- Un client peut voir ses propres commandes et reservations
-- (en plus de la regle qui permet a l equipe de tout voir, ci-dessus)
create policy "customer read own orders" on orders for select using (auth.uid() = customer_id);
create policy "customer read own reservations" on reservations for select using (auth.uid() = customer_id);

-- Lot "Contenu & marketing" ------------------------------------------------
alter table gallery_images enable row level security;
alter table events enable row level security;
alter table blog_posts enable row level security;

create policy "public read gallery" on gallery_images for select using (true);
create policy "staff manage gallery" on gallery_images for all using (is_staff());

create policy "public read active events" on events for select using (active = true);
create policy "staff manage events" on events for all using (is_staff());

create policy "public read published posts" on blog_posts for select using (published = true);
create policy "staff manage posts" on blog_posts for all using (is_staff());

-- Lot "WhatsApp, contact & analytics" ------------------------------------------------
alter table contact_messages enable row level security;
alter table page_views enable row level security;

create policy "public insert contact" on contact_messages for insert with check (true);
create policy "staff manage contact" on contact_messages for all using (is_staff());

create policy "public insert page views" on page_views for insert with check (true);
create policy "staff read page views" on page_views for select using (is_staff());

-- Lot "Stockage" ------------------------------------------------
-- Bucket public "media" : lecture publique, ecriture reservee a l'equipe.
create policy "public read media" on storage.objects for select using (bucket_id = 'media');
create policy "staff upload media" on storage.objects for insert with check (bucket_id = 'media' and is_staff());
create policy "staff update media" on storage.objects for update using (bucket_id = 'media' and is_staff());
create policy "staff delete media" on storage.objects for delete using (bucket_id = 'media' and is_staff());
