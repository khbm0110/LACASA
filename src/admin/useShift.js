import { useCallback, useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

// Gere la session de caisse ("shift") du POS pour l etablissement actif :
// verifie s il y en a une ouverte, permet d en ouvrir une (fond de
// caisse de depart) et de la fermer (comptage reel, calcul de l ecart
// via la fonction SQL close_shift). Tant qu aucune caisse n est ouverte,
// le POS ne doit pas permettre d encaisser une vente.
export function useShift(branchId) {
  const [userId, setUserId] = useState(null)
  const [shift, setShift] = useState(undefined) // undefined = chargement, null = aucune ouverte
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null))
  }, [])

  const reload = useCallback(async () => {
    if (!branchId) return
    setShift(undefined)
    const { data } = await supabase.from("shifts").select("*")
      .eq("branch_id", branchId).eq("status", "open")
      .order("opened_at", { ascending: false }).limit(1).maybeSingle()
    setShift(data || null)
  }, [branchId])

  useEffect(() => { reload() }, [reload])

  const openShift = async (openingCash) => {
    setBusy(true)
    const { data, error } = await supabase.from("shifts").insert([{
      branch_id: branchId, opened_by: userId, opening_cash: Number(openingCash) || 0,
    }]).select().single()
    setBusy(false)
    if (!error && data) setShift(data)
    return { data, error }
  }

  // Totaux en direct de la session en cours, pour afficher le rapport "X"
  // avant fermeture (memes montants que ceux recalcules par close_shift).
  // Se base sur order_payments (et non orders.payment_provider) pour bien
  // repartir les commandes payees en partie especes / en partie carte.
  const fetchLiveSummary = async () => {
    if (!shift) return null
    const [{ data: orders }, { data: payments }, { data: refunds }] = await Promise.all([
      supabase.from("orders").select("id, status").eq("shift_id", shift.id),
      supabase.from("orders").select("id, order_payments(method, amount)").eq("shift_id", shift.id),
      supabase.from("order_refunds").select("amount, payment_method, order_id, orders!inner(shift_id)").eq("orders.shift_id", shift.id),
    ])
    const cancelledIds = new Set((orders || []).filter((o) => o.status === "cancelled").map((o) => o.id))
    const allPayments = (payments || []).filter((o) => !cancelledIds.has(o.id)).flatMap((o) => o.order_payments || [])
    const cashSales = allPayments.filter((p) => p.method === "cash").reduce((s, p) => s + Number(p.amount), 0)
    const cardSales = allPayments.filter((p) => p.method === "card_tpe").reduce((s, p) => s + Number(p.amount), 0)
    const cashRefunds = (refunds || []).filter((r) => r.payment_method === "cash").reduce((s, r) => s + Number(r.amount), 0)
    const cardRefunds = (refunds || []).filter((r) => r.payment_method === "card_tpe").reduce((s, r) => s + Number(r.amount), 0)
    const salesCount = (orders || []).filter((o) => !cancelledIds.has(o.id)).length
    const expectedCash = Number(shift.opening_cash) + cashSales - cashRefunds
    return { cashSales, cardSales, cashRefunds, cardRefunds, salesCount, expectedCash }
  }

  const closeShift = async (closingCash, notes) => {
    if (!shift) return { error: "Aucune caisse ouverte." }
    setBusy(true)
    const { error } = await supabase.rpc("close_shift", {
      p_shift_id: shift.id, p_closing_cash: Number(closingCash) || 0, p_closed_by: userId, p_notes: notes || null,
    })
    setBusy(false)
    if (!error) setShift(null)
    return { error }
  }

  return { userId, shift, busy, openShift, closeShift, fetchLiveSummary, reload }
}
