-- Politiques RLS (Row Level Security) - a adapter selon vos besoins.
-- Active RLS sur toutes les tables sensibles.
--
-- Ce fichier est lui aussi concu pour etre reexecute en entier a tout
-- moment sans erreur : chaque "create policy" est precedee d un "drop
-- policy if exists" du meme nom (PostgreSQL n a pas de "create policy if
-- not exists"), donc rejouer tout le fichier remplace simplement les
-- politiques existantes par la meme definition (ou par une nouvelle si
-- vous l avez modifiee).

-- IMPORTANT : la table "staff" et les fonctions is_staff()/is_admin() sont
-- maintenant definies dans schema.sql (executez-le en premier). Ici on ne
-- fait qu activer la RLS et poser les politiques d acces.

alter table staff enable row level security;
drop policy if exists "staff read own row" on staff;
create policy "staff read own row" on staff for select using (auth.uid() = id);
drop policy if exists "admin manage staff" on staff;
create policy "admin manage staff" on staff for all using (is_admin());

alter table menu_items enable row level security;
alter table reservations enable row level security;
alter table orders enable row level security;
alter table site_content enable row level security;
alter table ui_translations enable row level security;
alter table restaurant_info enable row level security;

-- Lecture publique du menu et du contenu du site
drop policy if exists "public read menu" on menu_items;
create policy "public read menu" on menu_items for select using (true);
drop policy if exists "public read content" on site_content;
create policy "public read content" on site_content for select using (true);
drop policy if exists "public read translations" on ui_translations;
create policy "public read translations" on ui_translations for select using (true);
drop policy if exists "public read info" on restaurant_info;
create policy "public read info" on restaurant_info for select using (true);

-- Le public peut CREER une reservation ou une commande, mais pas les lire/modifier
drop policy if exists "public insert reservations" on reservations;
create policy "public insert reservations" on reservations for insert with check (true);
drop policy if exists "public insert orders" on orders;
create policy "public insert orders" on orders for insert with check (true);

-- Seule l equipe (table staff) peut tout gerer
drop policy if exists "admin full access menu" on menu_items;
create policy "admin full access menu" on menu_items for all using (is_staff());
drop policy if exists "admin full access reservations" on reservations;
create policy "admin full access reservations" on reservations for all using (is_staff());
drop policy if exists "admin full access orders" on orders;
create policy "admin full access orders" on orders for all using (is_staff());
drop policy if exists "admin full access content" on site_content;
create policy "admin full access content" on site_content for all using (is_staff());
drop policy if exists "admin full access translations" on ui_translations;
create policy "admin full access translations" on ui_translations for all using (is_staff());
drop policy if exists "admin full access info" on restaurant_info;
create policy "admin full access info" on restaurant_info for all using (is_staff());

alter table restaurant_tables enable row level security;
drop policy if exists "public read tables" on restaurant_tables;
create policy "public read tables" on restaurant_tables for select using (true);
drop policy if exists "admin full access tables" on restaurant_tables;
create policy "admin full access tables" on restaurant_tables for all using (is_staff());

alter table google_reviews enable row level security;
drop policy if exists "public read google reviews" on google_reviews;
create policy "public read google reviews" on google_reviews for select using (true);
drop policy if exists "admin full access google reviews" on google_reviews;
create policy "admin full access google reviews" on google_reviews for all using (is_staff());

-- Lot "Experience client" ------------------------------------------------
alter table profiles enable row level security;
alter table promo_codes enable row level security;

-- Un client ne voit / modifie que son propre profil
drop policy if exists "customer read own profile" on profiles;
create policy "customer read own profile" on profiles for select using (auth.uid() = id);
drop policy if exists "customer update own profile" on profiles;
create policy "customer update own profile" on profiles for update using (auth.uid() = id);
-- L equipe (staff) peut voir tous les profils (pour le CRM)
drop policy if exists "staff read all profiles" on profiles;
create policy "staff read all profiles" on profiles for select using (is_staff());

-- Codes promo lisibles par tous (necessaire pour verifier un code au checkout),
-- modifiables seulement par l equipe
drop policy if exists "public read promo codes" on promo_codes;
create policy "public read promo codes" on promo_codes for select using (true);
drop policy if exists "staff manage promo codes" on promo_codes;
create policy "staff manage promo codes" on promo_codes for all using (is_staff());

-- Un client peut voir ses propres commandes et reservations
-- (en plus de la regle qui permet a l equipe de tout voir, ci-dessus)
drop policy if exists "customer read own orders" on orders;
create policy "customer read own orders" on orders for select using (auth.uid() = customer_id);
drop policy if exists "customer read own reservations" on reservations;
create policy "customer read own reservations" on reservations for select using (auth.uid() = customer_id);

-- Lot "Contenu & marketing" ------------------------------------------------
alter table gallery_images enable row level security;
alter table events enable row level security;
alter table blog_posts enable row level security;

drop policy if exists "public read gallery" on gallery_images;
create policy "public read gallery" on gallery_images for select using (true);
drop policy if exists "staff manage gallery" on gallery_images;
create policy "staff manage gallery" on gallery_images for all using (is_staff());

drop policy if exists "public read active events" on events;
create policy "public read active events" on events for select using (active = true);
drop policy if exists "staff manage events" on events;
create policy "staff manage events" on events for all using (is_staff());

drop policy if exists "public read published posts" on blog_posts;
create policy "public read published posts" on blog_posts for select using (published = true);
drop policy if exists "staff manage posts" on blog_posts;
create policy "staff manage posts" on blog_posts for all using (is_staff());

-- Lot "WhatsApp, contact & analytics" ------------------------------------------------
alter table contact_messages enable row level security;
alter table page_views enable row level security;

drop policy if exists "public insert contact" on contact_messages;
create policy "public insert contact" on contact_messages for insert with check (true);
drop policy if exists "staff manage contact" on contact_messages;
create policy "staff manage contact" on contact_messages for all using (is_staff());

drop policy if exists "public insert page views" on page_views;
create policy "public insert page views" on page_views for insert with check (true);
drop policy if exists "staff read page views" on page_views;
create policy "staff read page views" on page_views for select using (is_staff());

-- Lot "Stockage" ------------------------------------------------
-- Bucket public "media" : lecture publique, ecriture reservee a l'equipe.
drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "staff upload media" on storage.objects;
create policy "staff upload media" on storage.objects for insert with check (bucket_id = 'media' and is_staff());
drop policy if exists "staff update media" on storage.objects;
create policy "staff update media" on storage.objects for update using (bucket_id = 'media' and is_staff());
drop policy if exists "staff delete media" on storage.objects;
create policy "staff delete media" on storage.objects for delete using (bucket_id = 'media' and is_staff());

-- Lot "Suivi de commande invite" -----------------------------------------
-- La fonction elle-meme filtre deja par id exact (voir schema.sql) ; on
-- autorise juste tout le monde (y compris les visiteurs non connectes) a
-- l appeler - c est le lien /suivi/{id}, pas un id devinable, qui protege
-- l acces.
grant execute on function get_order_tracking(uuid) to anon, authenticated;

-- Lot "Photo(s) du Hero" ------------------------------------------------
drop policy if exists "public read hero dishes" on hero_dishes;
create policy "public read hero dishes" on hero_dishes for select using (true);
drop policy if exists "staff full access hero dishes" on hero_dishes;
create policy "staff full access hero dishes" on hero_dishes for all using (is_staff());

-- Lot "Inventaire, fournisseurs & achats" --------------------------------
-- Donnees purement internes (couts, stock, coordonnees fournisseurs) :
-- aucune lecture publique, seule l equipe (staff) y accede.
drop policy if exists "staff full access branches" on branches;
create policy "staff full access branches" on branches for all using (is_staff());
drop policy if exists "staff full access suppliers" on suppliers;
create policy "staff full access suppliers" on suppliers for all using (is_staff());
drop policy if exists "staff full access inventory items" on inventory_items;
create policy "staff full access inventory items" on inventory_items for all using (is_staff());
drop policy if exists "staff full access purchases" on purchases;
create policy "staff full access purchases" on purchases for all using (is_staff());
drop policy if exists "staff full access purchase items" on purchase_items;
create policy "staff full access purchase items" on purchase_items for all using (is_staff());
drop policy if exists "staff full access stock adjustments" on stock_adjustments;
create policy "staff full access stock adjustments" on stock_adjustments for all using (is_staff());

grant execute on function receive_purchase(uuid) to authenticated;

-- Lot "Recettes, modificateurs & formules" --------------------------------
-- Les recettes (couts/quantites de stock) restent internes.
drop policy if exists "staff full access menu item ingredients" on menu_item_ingredients;
create policy "staff full access menu item ingredients" on menu_item_ingredients for all using (is_staff());

-- Modificateurs et formules sont visibles publiquement (utilises sur le
-- site client pour composer une commande), mais seule l equipe les gere.
drop policy if exists "public read modifier groups" on modifier_groups;
create policy "public read modifier groups" on modifier_groups for select using (true);
drop policy if exists "staff full access modifier groups" on modifier_groups;
create policy "staff full access modifier groups" on modifier_groups for all using (is_staff());

drop policy if exists "public read modifiers" on modifiers;
create policy "public read modifiers" on modifiers for select using (true);
drop policy if exists "staff full access modifiers" on modifiers;
create policy "staff full access modifiers" on modifiers for all using (is_staff());

drop policy if exists "public read menu item modifier groups" on menu_item_modifier_groups;
create policy "public read menu item modifier groups" on menu_item_modifier_groups for select using (true);
drop policy if exists "staff full access menu item modifier groups" on menu_item_modifier_groups;
create policy "staff full access menu item modifier groups" on menu_item_modifier_groups for all using (is_staff());

drop policy if exists "public read combos" on combos;
create policy "public read combos" on combos for select using (true);
drop policy if exists "staff full access combos" on combos;
create policy "staff full access combos" on combos for all using (is_staff());

drop policy if exists "public read combo items" on combo_items;
create policy "public read combo items" on combo_items for select using (true);
drop policy if exists "staff full access combo items" on combo_items;
create policy "staff full access combo items" on combo_items for all using (is_staff());

-- Lot "Caisse & Remboursements/Annulations" ------------------------------
drop policy if exists "staff full access shifts" on shifts;
create policy "staff full access shifts" on shifts for all using (is_staff());
drop policy if exists "staff full access order refunds" on order_refunds;
create policy "staff full access order refunds" on order_refunds for all using (is_staff());
drop policy if exists "staff full access order payments" on order_payments;
create policy "staff full access order payments" on order_payments for all using (is_staff());

grant execute on function void_order(uuid, text) to authenticated;
grant execute on function close_shift(uuid, numeric, uuid, text) to authenticated;
