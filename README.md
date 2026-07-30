# La Casa Di Carta - Site + Admin (React + Supabase)

Projet React (Vite) pour le restaurant La Casa Di Carta (Rabat) :
site public avec reservation, livraison, menu, avis, carte, PWA installable,
et un espace d administration relie a Supabase pour tout gerer sans code.

## Ce qui est deja fait

### Corrections recentes
- **Menu admin invisible sur mobile** (corrige) : la barre laterale etait
  completement cachee sous la largeur `md` sans aucune alternative. Une
  barre superieure avec un bouton "Menu" deroulant a ete ajoutee pour mobile.
- **Traductions incompletes** (partiellement corrige) : seuls `Header` et la
  page d accueil (`Home`) utilisaient le systeme de traduction au depart.
  Desormais **Footer, Menu, Reserver, Livraison et Infos/Carte** sont aussi
  traduits (fr/ar/es/en). Pages encore en francais uniquement : Galerie,
  Evenements, Blog, Contact, Mon compte, Suivi de commande, Avis, Table (QR).
  **Limite importante** : les plats du menu, articles de blog et evenements
  viennent de la base de donnees et restent dans la langue ou vous les avez
  saisis (pas de traduction automatique du contenu) - seuls les libelles
  d interface (boutons, titres fixes) sont traduits.
- **Colonne `notes` manquante sur `orders`** (corrige) : la page livraison
  envoyait un champ `notes` que la table ne definissait pas, ce qui faisait
  echouer toute commande avec le message generique "Une erreur est survenue".
  Si vous avez deja execute `schema.sql` avant cette correction, executez
  directement dans Supabase > SQL Editor :
  `alter table orders add column if not exists notes text;`
- **Double reservation de la meme table** (corrige) : rien n empechait deux
  clients de reserver la meme table sur le meme creneau. Desormais :
  - cote formulaire, les tables deja prises a moins de 2h de l heure choisie
    apparaissent desactivees dans la liste
  - cote base de donnees, un index unique bloque en dur toute deuxieme
    reservation active (pending/confirmed) sur la meme table + date + heure,
    meme en cas de double-clic simultane de deux clients differents
- **Son d alerte trop faible + pas de rappel** (corrige) : le son est
  desormais un carillon a trois notes nettement plus audible, et se
  repete automatiquement toutes les 20 secondes tant qu au moins une
  alerte n a pas ete fermee dans le tableau de bord (bouton "Tout marquer
  comme vu" disponible). Note navigateur : le son peut rester bloque tant
  qu aucune interaction (clic) n a eu lieu sur la page depuis son chargement -
  c est une restriction standard des navigateurs, pas un bug.
- **Aucune indication de perte de connexion** (corrige) : un bandeau rouge
  apparait desormais en haut de l ecran (site public et admin) des que le
  navigateur perd la connexion internet, et disparait automatiquement au
  retour de la connexion. Supabase Realtime se reconnecte alors de lui-meme.

- **Page d accueil complete** (`/`) : hero 3D, acces rapide (reserver/livraison/menu/itineraire),
  plats mis en avant, **avis Google**, **carte + infos pratiques**, et un
  **formulaire de reservation rapide** — tout est sur la meme page, en plus
  des pages dediees `/menu`, `/reserver`, `/livraison`, `/avis`, `/a-propos`
  pour ceux qui veulent le detail
- Multilingue : francais par defaut, arabe / espagnol / anglais consultables et modifiables
- Espace admin (`/admin`) protege par Supabase Auth :
  - Tableau de bord
  - Gestion du menu (ajout / modification / suppression de plats)
  - Reservations (voir, confirmer, annuler)
  - Commandes livraison (suivi de statut)
  - Contenu du site (textes multilingues de la page d accueil)
  - Traductions (upload d un fichier JSON pour ajouter/remplacer une langue)
  - **Tables & QR codes** : creation des tables physiques, generation automatique
    d un QR code par table (via l API qrserver.com) qui ouvre `/table/{id}` -
    une page publique ou le client scanne, voit le menu et commande directement
    depuis sa table (commande marquee `order_type = "dine_in"`)
  - **Comptabilite** : chiffre d affaires (livraison vs sur place), panier moyen,
    ventes par jour, export CSV des transactions sur 7/30/90 jours
  - **Reservation avec table reelle** : le formulaire public `/reserver` propose
    la liste des tables definies dans l admin (numero, capacite, zone)
  - **Page de commande livraison amelioree** (`/livraison`) : recherche de plats,
    filtres par categorie, panier detaille avec sous-total, frais de livraison
    (offerts au-dela d un montant), commande minimum, et instructions de livraison
  - **Notifications instantanees**, en deux couches :
    1. **Alertes en direct dans l admin** (`useLiveAlerts`) via Supabase Realtime :
       des que le tableau de bord est ouvert, un son + une notification navigateur
       + un badge signalent toute nouvelle reservation ou commande - fonctionne
       des que Supabase est configure, sans service externe
    2. **Email / WhatsApp meme hors ligne** (`supabase/functions/notify-staff`) :
       Edge Function a brancher sur un Database Webhook Supabase pour prevenir
       l equipe par email (Resend) et/ou WhatsApp (Twilio) meme si personne ne
       regarde le tableau de bord
  - **Lot "Experience client"** :
    - **Comptes clients** (`/compte`) : inscription/connexion (Supabase Auth),
      tableau de bord avec historique des commandes et reservations
    - **Suivi de commande en direct** (`/suivi/{id}`) : lien ouvert apres chaque
      commande, met a jour le statut en temps reel (Realtime) sans rafraichir
    - **Programme de fidelite** : 1 point tous les 10 MAD depenses, credite
      automatiquement (trigger SQL) quand une commande passe au statut "delivered"
    - **Codes promo** (`/admin/codes-promo`) : pourcentage ou montant fixe,
      commande minimum, date d expiration - utilisables sur la page livraison
    - **Securite admin corrigee** : une vraie table `staff` distingue desormais
      l equipe des simples clients connectes (voir `is_staff()` dans policies.sql) -
      important, voir l etape 3 ci-dessous

- **Lot "Cuisine & operations"** :
  - **Ecran cuisine / KDS** (`/admin/cuisine`) : tableau en direct (Realtime)
    des commandes par etape - Nouvelles / En preparation / Prêtes - avec de
    gros boutons pour faire avancer chaque commande, pense pour une tablette
    en cuisine
  - **Roles & permissions d equipe** (`/admin/equipe`, reserve aux admins) :
    quatre roles - `admin` (tout), `manager` (tout sauf gestion d equipe),
    `cuisine` (ecran cuisine uniquement), `staff` (menu, reservations,
    livraisons, tables). Un compte doit d abord exister (via `/compte` ou
    `/admin/login`) puis etre ajoute a l equipe par son UUID
  - **CRM clients** (`/admin/clients`) : liste des clients ayant un compte,
    avec nombre de commandes, total depense, points de fidelite et derniere
    visite - recherche par nom/telephone

- **Lot "Contenu & marketing"** :
  - **Galerie photo** (`/galerie` + `/admin/galerie`) : ajout par URL d image
    (hebergez vos photos sur Supabase Storage - bucket public - ou tout autre
    service, puis collez l URL), filtrable par categorie
  - **Evenements & Offres** (`/evenements` + `/admin/evenements`) : offres
    permanentes ou evenements a date fixe, avec image et description
  - **Blog & Actualites** (`/blog` + `/admin/blog`) : articles avec slug
    genere automatiquement depuis le titre, brouillon/publie, image de
    couverture
  - **SEO** : balises meta (titre + description) mises a jour automatiquement
    par page via `useSEO` (sans dependance externe), donnees structurees
    JSON-LD "Restaurant" dans `index.html` (aide Google a afficher horaires,
    adresse, type de cuisine dans les resultats de recherche), `robots.txt`
    et `sitemap.xml` de base (a completer avec votre vrai domaine)

- **Lot "WhatsApp, contact & analytics"** :
  - **Bouton WhatsApp flottant** sur tout le site public - ouvre une
    conversation pre-remplie vers le numero defini dans `restaurant_info.whatsapp`
    (modifiable directement dans la table Supabase, aucune cle API requise)
  - **Formulaire de contact** (`/contact` + `/admin/messages`) : messages
    stockes en base, statut nouveau/lu/repondu
  - **Analytics** (`/admin/analytics`) : pages les plus visitees (compteur
    interne `page_views`, sans compte externe), plats les plus vendus,
    nouveaux clients, usage des codes promo - pour un suivi de trafic plus
    complet (sources, appareils...), ajoutez plutot Google Analytics ou
    Plausible via un script dans `index.html`
- PWA : manifest + service worker via `vite-plugin-pwa`, installable sur mobile
- Schema SQL complet + politiques de securite (RLS) dans `/supabase`

## Ce qu il reste a faire de votre cote (necessite un environnement avec internet)

1. **Creer un projet Supabase** sur https://supabase.com
2. Dans **SQL Editor**, executer dans l ordre :
   - `supabase/schema.sql`
   - `supabase/policies.sql`
3. Dans **Authentication > Users**, creer votre (vos) compte(s) admin, puis
   **copier leur UUID** et l ajouter a la table `staff` (SQL Editor) :
   ```sql
   insert into staff (id, role) values ('UUID-COPIE-ICI', 'admin');
   ```
   Sans cette etape, le compte peut se connecter mais n aura acces a rien dans
   `/admin` (c est la nouvelle protection qui separe l equipe des clients).
4. Copier `.env.example` vers `.env` et renseigner :
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
5. Installer les dependances puis lancer le projet :
   ```bash
   npm install
   npm run dev
   ```
6. Ajouter vos icones PWA reelles dans `public/icons/` (192x192 et 512x512)
7. Remplacer les plats, avis, textes d exemple par vos vraies donnees
   (soit via l admin, soit directement dans Supabase)
   - **Note** : l adresse, le telephone, les horaires et le numero WhatsApp
     affiches sur le site viennent de la table `restaurant_info` (une seule
     ligne, id=1). Il n y a pas encore de page admin dediee pour les modifier -
     éditez-les directement depuis Supabase > Table Editor > restaurant_info
8. **Avis Google reels** (optionnel mais recommande) : la page d accueil affiche
   des avis d exemple tant que la table `google_reviews` est vide. Pour brancher
   les vrais avis Google :
   - Recuperez le **Place ID** de "La Casa Di Carta" (via https://developers.google.com/maps/documentation/places/web-service/place-id)
   - Activez l API **Places API** dans Google Cloud Console et generez une cle API
   - Deployez `supabase/functions/sync-google-reviews` (`supabase functions deploy sync-google-reviews`)
   - Definissez les variables d environnement `GOOGLE_PLACES_API_KEY` et `GOOGLE_PLACE_ID`
     dans Supabase (Project Settings > Edge Functions)
   - Programmez son execution quotidienne via Supabase Scheduled Triggers
   - La cle API Google **n est jamais exposee au navigateur** — tout passe par la fonction serveur
9. Deployer (Vercel, Netlify, ou autre) et pointer votre nom de domaine
   - Remplacez `VOTRE-DOMAINE.com` dans `public/sitemap.xml` et `public/robots.txt`
     par votre vrai domaine une fois deploye
10. **Notifications email/WhatsApp** (optionnel) : deployez `supabase/functions/notify-staff`,
    definissez les variables d environnement necessaires (Resend et/ou Twilio,
    voir les commentaires en tete du fichier), puis creez deux Database Webhooks
    dans Supabase (Dashboard > Database > Webhooks) : un sur `reservations` (INSERT)
    et un sur `orders` (INSERT), pointant tous les deux vers cette fonction.
    Les alertes en direct dans l admin (son + notification navigateur) fonctionnent
    elles automatiquement, sans configuration supplementaire.

## Notes importantes
- Les prix, plats et avis actuellement dans le code sont des **exemples de demonstration**
  a remplacer par votre vraie carte.
- Le bouton "Ajouter a l ecran d accueil" (PWA) fonctionne automatiquement une fois
  le site deploye en HTTPS - il ne fonctionne pas en previsualisation locale sans build.
- Ce projet n a pas ete execute avec `npm install` / `npm run build` dans cet environnement
  (pas d acces reseau ici) : verifiez le build une fois transfere sur votre machine.
