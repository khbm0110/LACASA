import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"

const EMPTY_GROUP = { name: "", min_select: 0, max_select: 1, required: false }

export default function Modifiers() {
  const [groups, setGroups] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [groupForm, setGroupForm] = useState(EMPTY_GROUP)
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [newOptionName, setNewOptionName] = useState({})
  const [newOptionPrice, setNewOptionPrice] = useState({})
  const [assignMenuId, setAssignMenuId] = useState("")
  const [assignedGroupIds, setAssignedGroupIds] = useState(new Set())
  const confirm = useConfirm()
  const toast = useToast()

  const load = async () => {
    const [{ data: g }, { data: mi }] = await Promise.all([
      supabase.from("modifier_groups").select("*, modifiers(*)").order("created_at"),
      supabase.from("menu_items").select("id, name, category").order("category"),
    ])
    setGroups((g || []).map((grp) => ({ ...grp, modifiers: (grp.modifiers || []).sort((a, b) => a.sort_order - b.sort_order) })))
    setMenuItems(mi || [])
    if (mi && mi.length > 0 && !assignMenuId) setAssignMenuId(mi[0].id)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    async function loadAssignments() {
      if (!assignMenuId) { setAssignedGroupIds(new Set()); return }
      const { data } = await supabase.from("menu_item_modifier_groups").select("modifier_group_id").eq("menu_item_id", assignMenuId)
      setAssignedGroupIds(new Set((data || []).map((r) => r.modifier_group_id)))
    }
    loadAssignments()
  }, [assignMenuId])

  // --- Groupes ---
  const updateGroupField = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    setGroupForm((f) => ({ ...f, [key]: value }))
  }

  const submitGroup = async (e) => {
    e.preventDefault()
    const { error } = editingGroupId
      ? await supabase.from("modifier_groups").update(groupForm).eq("id", editingGroupId)
      : await supabase.from("modifier_groups").insert([groupForm])
    if (error) { toast.error("Echec de l enregistrement."); return }
    setGroupForm(EMPTY_GROUP)
    setEditingGroupId(null)
    load()
    toast.success(editingGroupId ? "Groupe mis a jour." : "Groupe ajoute.")
  }

  const editGroup = (g) => {
    setGroupForm({ name: g.name, min_select: g.min_select, max_select: g.max_select, required: g.required })
    setEditingGroupId(g.id)
  }

  const removeGroup = async (id) => {
    const ok = await confirm({ title: "Supprimer ce groupe de modificateurs ?", message: "Ses options seront egalement supprimees." })
    if (!ok) return
    const { error } = await supabase.from("modifier_groups").delete().eq("id", id)
    if (error) { toast.error("Echec de la suppression."); return }
    load()
    toast.success("Groupe supprime.")
  }

  // --- Options ---
  const addOption = async (groupId) => {
    const name = (newOptionName[groupId] || "").trim()
    if (!name) return
    const price = Number(newOptionPrice[groupId] || 0)
    const { error } = await supabase.from("modifiers").insert([{ group_id: groupId, name, price_delta: price }])
    if (error) { toast.error("Echec de l ajout de l option."); return }
    setNewOptionName((s) => ({ ...s, [groupId]: "" }))
    setNewOptionPrice((s) => ({ ...s, [groupId]: "" }))
    load()
  }

  const removeOption = async (id) => {
    const { error } = await supabase.from("modifiers").delete().eq("id", id)
    if (error) { toast.error("Echec de la suppression."); return }
    load()
  }

  // --- Assignation plat <-> groupes ---
  const toggleAssign = async (groupId) => {
    if (assignedGroupIds.has(groupId)) {
      await supabase.from("menu_item_modifier_groups").delete().eq("menu_item_id", assignMenuId).eq("modifier_group_id", groupId)
    } else {
      await supabase.from("menu_item_modifier_groups").insert([{ menu_item_id: assignMenuId, modifier_group_id: groupId }])
    }
    const { data } = await supabase.from("menu_item_modifier_groups").select("modifier_group_id").eq("menu_item_id", assignMenuId)
    setAssignedGroupIds(new Set((data || []).map((r) => r.modifier_group_id)))
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Modificateurs</h1>
      <p className="text-inkdim text-sm mb-8">
        Des options attachees a un plat (taille, supplements...) avec un supplement de prix optionnel.
      </p>

      <form onSubmit={submitGroup} className="bg-bgsoft border border-line rounded-2xl p-6 grid sm:grid-cols-2 gap-3 mb-8">
        <input required placeholder="Nom du groupe (ex: Taille, Supplements)" value={groupForm.name} onChange={updateGroupField("name")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato sm:col-span-2" />
        <input type="number" min="0" placeholder="Min a choisir" value={groupForm.min_select} onChange={updateGroupField("min_select")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input type="number" min="1" placeholder="Max a choisir (1 = choix unique)" value={groupForm.max_select} onChange={updateGroupField("max_select")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <label className="flex items-center gap-2 text-sm text-inkdim">
          <input type="checkbox" checked={!!groupForm.required} onChange={updateGroupField("required")} /> Obligatoire
        </label>
        <div className="sm:col-span-2 flex gap-3">
          <button className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]">
            {editingGroupId ? "Mettre a jour" : "Ajouter le groupe"}
          </button>
          {editingGroupId && (
            <button type="button" onClick={() => { setGroupForm(EMPTY_GROUP); setEditingGroupId(null) }} className="px-5 py-2.5 rounded-full text-sm border border-line">
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-4 mb-10">
        {groups.map((g) => (
          <div key={g.id} className="bg-bgsoft border border-line rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-medium">{g.name}</span>
                <span className="text-inkdim text-xs ml-2">
                  {g.required ? "Obligatoire" : "Optionnel"} · {g.min_select}-{g.max_select} choix
                </span>
              </div>
              <div className="flex gap-3 text-sm">
                <button onClick={() => editGroup(g)} className="text-inkdim hover:text-ink">Modifier</button>
                <button onClick={() => removeGroup(g.id)} className="text-red-400 hover:text-red-300">Supprimer</button>
              </div>
            </div>

            <div className="grid gap-1.5 mb-3">
              {g.modifiers.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm bg-bg border border-line rounded-lg px-3 py-1.5">
                  <span>{m.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gold text-xs">{m.price_delta > 0 ? `+${m.price_delta}` : m.price_delta} MAD</span>
                    <button onClick={() => removeOption(m.id)} className="text-red-400 hover:text-red-300">✕</button>
                  </div>
                </div>
              ))}
              {g.modifiers.length === 0 && <p className="text-inkdim text-xs">Aucune option.</p>}
            </div>

            <div className="flex gap-2">
              <input placeholder="Nom de l option" value={newOptionName[g.id] || ""} onChange={(e) => setNewOptionName((s) => ({ ...s, [g.id]: e.target.value }))}
                className="flex-1 bg-bg border border-line rounded-xl px-3 py-2 text-sm outline-none focus:border-tomato" />
              <input type="number" step="0.01" placeholder="+/- MAD" value={newOptionPrice[g.id] || ""} onChange={(e) => setNewOptionPrice((s) => ({ ...s, [g.id]: e.target.value }))}
                className="w-24 bg-bg border border-line rounded-xl px-3 py-2 text-sm outline-none focus:border-tomato" />
              <button type="button" onClick={() => addOption(g.id)} className="px-3 py-2 rounded-xl text-sm border border-line hover:border-tomato">+</button>
            </div>
          </div>
        ))}
        {groups.length === 0 && <p className="text-inkdim text-sm">Aucun groupe de modificateurs pour le moment.</p>}
      </div>

      <div className="bg-bgsoft border border-line rounded-2xl p-6">
        <h2 className="font-serif text-xl mb-4">Appliquer des groupes a un plat</h2>
        <select value={assignMenuId} onChange={(e) => setAssignMenuId(e.target.value)}
          className="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato mb-4">
          {menuItems.map((m) => <option key={m.id} value={m.id}>{m.category} — {m.name}</option>)}
        </select>
        <div className="grid gap-2">
          {groups.map((g) => (
            <label key={g.id} className="flex items-center gap-2 text-sm text-inkdim">
              <input type="checkbox" checked={assignedGroupIds.has(g.id)} onChange={() => toggleAssign(g.id)} />
              {g.name}
            </label>
          ))}
          {groups.length === 0 && <p className="text-inkdim text-xs">Creez d abord un groupe ci-dessus.</p>}
        </div>
      </div>
    </div>
  )
}
