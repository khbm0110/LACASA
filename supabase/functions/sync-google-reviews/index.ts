// Supabase Edge Function - a deployer avec `supabase functions deploy sync-google-reviews`
// Recupere les avis Google reels via l API Google Places Details et les
// ecrit dans la table "google_reviews". A appeler par un Cron (ex: 1x/jour)
// via Supabase Scheduled Triggers, pour ne jamais exposer la cle API Google
// au navigateur du visiteur.
//
// Variables d environnement a definir dans Supabase (Project Settings > Functions):
//   GOOGLE_PLACES_API_KEY   - votre cle API Google Places (restreinte cote serveur)
//   GOOGLE_PLACE_ID         - le Place ID de "La Casa Di Carta" sur Google Maps
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY - fournis automatiquement par Supabase

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async () => {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY")
  const placeId = Deno.env.get("GOOGLE_PLACE_ID")
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!apiKey || !placeId || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Variables d environnement manquantes" }), { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`
  const res = await fetch(url)
  const json = await res.json()

  if (!json.result) {
    return new Response(JSON.stringify({ error: "Reponse Google Places invalide", json }), { status: 500 })
  }

  const { rating, user_ratings_total, reviews = [] } = json.result

  // Met a jour la note globale et le nombre d avis dans restaurant_info
  await supabase.from("restaurant_info").update({
    google_rating: rating,
    google_review_count: user_ratings_total
  }).eq("id", 1)

  // Remplace les avis mis en cache par les plus recents (l API Google
  // Places ne renvoie que jusqu a 5 avis par appel, c est une limite de Google)
  await supabase.from("google_reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  const rows = reviews.map((r: any) => ({
    author_name: r.author_name,
    rating: r.rating,
    text: r.text,
    time: new Date(r.time * 1000).toISOString()
  }))
  if (rows.length > 0) await supabase.from("google_reviews").insert(rows)

  return new Response(JSON.stringify({ ok: true, count: rows.length }), { status: 200 })
})
