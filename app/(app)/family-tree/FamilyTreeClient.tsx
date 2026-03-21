'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronRight, X, ArrowRight } from 'lucide-react'
import { INDIAN_RELATIONSHIPS, RELATIONSHIP_CATEGORIES } from '@/lib/data/relationships'

interface Member {
  id: string
  name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  location_city: string | null
  location_country: string | null
  profession: string | null
  company: string | null
  education: string | null
  notes: string | null
  user_id: string | null
  relationship_label: string
  parent_member_id: string | null
}

// Generation step per single relationship word
const GEN_STEP: Record<string, number> = {
  'Father': 1, 'Mother': 1,
  'Grandfather': 2, 'Grandmother': 2,
  'Uncle': 1, 'Aunt': 1,
  'Brother': 0, 'Sister': 0,
  'Cousin': 0, 'Husband': 0, 'Wife': 0,
  'Son': -1, 'Daughter': -1,
  'Nephew': -1, 'Niece': -1,
  'Grandson': -2, 'Granddaughter': -2,
  'Dada': 2, 'Dadi': 2, 'Nana': 2, 'Nani': 2,
  'Pardada': 3, 'Pardadi': 3, 'Parnana': 3, 'Parnani': 3,
  'Papa': 1, 'Pita': 1, 'Maa': 1, 'Mata': 1,
  'Bhaiya': 0, 'Bhai': 0, 'Behen': 0, 'Didi': 0,
  'Pati': 0, 'Patni': 0,
  'Beta': -1, 'Beti': -1,
  'Chacha': 1, 'Chachi': 1, 'Tau': 1, 'Taayi': 1,
  'Mama': 1, 'Mami': 1, 'Mausa': 1, 'Mausi': 1,
  'Bhatija': -1, 'Bhatiji': -1, 'Bhanja': -1, 'Bhanji': -1,
}

// Correctly handle chain labels like "Father's Brother" or "Mother's Brother's Son"
function getGenStep(rel: string): number {
  // Hindi label: "Chacha — Father's younger brother" → use first word only
  if (rel.includes(' — ')) {
    const word = rel.split(' — ')[0].trim().split(' ')[0]
    return GEN_STEP[word] ?? 0
  }
  // Chain label: "Father's Brother's Son" → sum each step
  if (rel.includes("'s ")) {
    return rel.split("'s ").reduce((sum, step) => sum + (GEN_STEP[step.trim()] ?? 0), 0)
  }
  return GEN_STEP[rel.trim()] ?? 0
}

function computeGenerations(members: Member[]): Map<string, number> {
  const memo = new Map<string, number>()
  const memberMap = new Map(members.map(m => [m.id, m]))
  function compute(id: string, depth = 0): number {
    if (memo.has(id)) return memo.get(id)!
    if (depth > 20) return 0
    const m = memberMap.get(id)
    if (!m) return 0
    const step = getGenStep(m.relationship_label)
    if (!m.parent_member_id) { memo.set(id, step); return step }
    const parentGen = compute(m.parent_member_id, depth + 1)
    const gen = parentGen + step
    memo.set(id, gen); return gen
  }
  for (const m of members) compute(m.id)
  return memo
}

// For a chain label, infer who the parent member is in the tree
// e.g. "Father's Brother" → find the member labeled "Father"
function findImpliedParent(m: Member, allMembers: Member[]): Member | null {
  if (m.parent_member_id) return allMembers.find(x => x.id === m.parent_member_id) ?? null
  const label = m.relationship_label
  if (!label.includes("'s ")) return null // single step — parent is user (null)
  const parts = label.split("'s ")
  const parentLabel = parts.slice(0, -1).join("'s ")
  return allMembers.find(x =>
    x.relationship_label === parentLabel ||
    x.relationship_label.startsWith(parentLabel + ' —')
  ) ?? null
}

const SPOUSE_MAP: Record<string, string> = {
  'Father': 'Mother', 'Mother': 'Father',
  'Husband': 'Wife', 'Wife': 'Husband',
  'Grandfather': 'Grandmother', 'Grandmother': 'Grandfather',
  'Nana': 'Nani', 'Nani': 'Nana', 'Dada': 'Dadi', 'Dadi': 'Dada',
}

function firstWord(rel: string) { return rel.split(/[\s'—]/)[0].trim() }
function isSpousePair(a: Member, b: Member): boolean {
  const ar = firstWord(a.relationship_label), br = firstWord(b.relationship_label)
  return SPOUSE_MAP[ar] === br || SPOUSE_MAP[br] === ar
}

// A family unit: a couple or single person, plus their children (recursive)
interface FamilyUnit {
  heads: Member[]
  children: FamilyUnit[]  // each child who themselves have children
  leafChildren: Member[]  // children with no further sub-units
  isUserParentUnit: boolean
}

function buildFamilyUnits(
  members: Member[],
  genMap: Map<string, number>,
): FamilyUnit[] {
  if (members.length === 0) return []

  const maxGen = Math.max(...[...genMap.values()])

  // Only process null-parent members as "top-level" heads
  // (members with parent_member_id set will be found as children)
  const nullParentByGen = new Map<number, Member[]>()
  for (const m of members) {
    if (m.parent_member_id !== null) continue
    const g = genMap.get(m.id) ?? 0
    if (!nullParentByGen.has(g)) nullParentByGen.set(g, [])
    nullParentByGen.get(g)!.push(m)
  }

  // Start at highest gen of null-parent members
  const topGen = maxGen > 0 ? Math.max(...[...nullParentByGen.keys()].filter(g => g > 0)) : 0

  function getChildrenOf(heads: Member[]): Member[] {
    return members.filter(m => {
      if (heads.some(h => h.id === m.parent_member_id)) return true
      const implied = findImpliedParent(m, members)
      return implied ? heads.some(h => h.id === implied.id) : false
    })
  }

  function isUserParentUnit(heads: Member[]): boolean {
    return heads.some(h => {
      const r = firstWord(h.relationship_label)
      return r === 'Father' || r === 'Mother' || r === 'Papa' || r === 'Maa' || r === 'Pita' || r === 'Mata'
    })
  }

  function buildUnit(head: Member, partner: Member | null): FamilyUnit {
    const heads = partner ? [head, partner] : [head]
    const rawChildren = getChildrenOf(heads)

    // Pair up children who are couples
    const used = new Set<string>()
    const childUnits: FamilyUnit[] = []
    const leafChildren: Member[] = []

    for (let i = 0; i < rawChildren.length; i++) {
      if (used.has(rawChildren[i].id)) continue
      let partner2: Member | null = null
      for (let j = i + 1; j < rawChildren.length; j++) {
        if (!used.has(rawChildren[j].id) && isSpousePair(rawChildren[i], rawChildren[j])) {
          partner2 = rawChildren[j]; used.add(rawChildren[j].id); break
        }
      }
      used.add(rawChildren[i].id)
      // Check if this child has further children
      const grandchildren = getChildrenOf(partner2 ? [rawChildren[i], partner2] : [rawChildren[i]])
      if (grandchildren.length > 0) {
        childUnits.push(buildUnit(rawChildren[i], partner2))
      } else {
        leafChildren.push(rawChildren[i])
        if (partner2) leafChildren.push(partner2)
      }
    }

    return {
      heads,
      children: childUnits,
      leafChildren,
      isUserParentUnit: isUserParentUnit(heads),
    }
  }

  // Build top-level units from the topGen null-parent members
  const topMembers = nullParentByGen.get(topGen) ?? []
  const used = new Set<string>()
  const topUnits: FamilyUnit[] = []

  // Also include gen 0 null-parent members if no ancestors exist
  if (topGen <= 0) {
    const gen0 = nullParentByGen.get(0) ?? []
    for (let i = 0; i < gen0.length; i++) {
      if (used.has(gen0[i].id)) continue
      let partner: Member | null = null
      for (let j = i + 1; j < gen0.length; j++) {
        if (!used.has(gen0[j].id) && isSpousePair(gen0[i], gen0[j])) {
          partner = gen0[j]; used.add(gen0[j].id); break
        }
      }
      used.add(gen0[i].id)
      topUnits.push(buildUnit(gen0[i], partner))
    }
    return topUnits
  }

  for (let i = 0; i < topMembers.length; i++) {
    if (used.has(topMembers[i].id)) continue
    let partner: Member | null = null
    for (let j = i + 1; j < topMembers.length; j++) {
      if (!used.has(topMembers[j].id) && isSpousePair(topMembers[i], topMembers[j])) {
        partner = topMembers[j]; used.add(topMembers[j].id); break
      }
    }
    used.add(topMembers[i].id)
    topUnits.push(buildUnit(topMembers[i], partner))
  }

  return topUnits
}

// ── Profile modal ──────────────────────────────────────────────────────────

function ProfileModal({ member, allMembers, userName, onClose, onAdd, onDelete }: {
  member: Member; allMembers: Member[]; userName: string;
  onClose: () => void; onAdd: (id: string, name: string) => void; onDelete: (id: string) => void;
}) {
  const impliedParent = findImpliedParent(member, allMembers)
  const parentName = impliedParent ? impliedParent.name : userName

  const coMembers = allMembers.filter(m =>
    m.id !== member.id && (
      (m.parent_member_id === member.parent_member_id && m.parent_member_id !== null) ||
      (findImpliedParent(m, allMembers)?.id === impliedParent?.id && impliedParent !== null)
    )
  )
  const inferred = coMembers.map(m => {
    const ar = firstWord(member.relationship_label), br = firstWord(m.relationship_label)
    if (SPOUSE_MAP[ar] === br || SPOUSE_MAP[br] === ar) return { label: 'Spouse', name: m.name }
    return { label: m.relationship_label, name: m.name }
  })

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">{member.name}</h2>
              <p className="text-sm text-gray-400">{member.relationship_label} of <span className="text-gray-600">{parentName}</span></p>
              {member.user_id && <span className="inline-flex items-center gap-0.5 mt-1 text-xs text-red-600 font-medium">🩸 verified</span>}
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-600 p-1"><X size={18} /></button>
          </div>
          {inferred.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Also in tree</p>
              {inferred.map((r, i) => <p key={i} className="text-xs text-gray-600"><span className="text-gray-400">{r.label}:</span> <span className="font-medium">{r.name}</span></p>)}
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            {member.date_of_birth && <Row label="Born" value={new Date(member.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />}
            {(member.location_city || member.location_country) && <Row label="Location" value={[member.location_city, member.location_country].filter(Boolean).join(', ')} />}
            {member.profession && <Row label="Profession" value={[member.profession, member.company].filter(Boolean).join(' · ')} />}
            {member.education && <Row label="Education" value={member.education} />}
            {member.email && <Row label="Email" value={member.email} />}
            {member.phone && <Row label="Phone" value={member.phone} />}
            {member.notes && <Row label="Notes" value={member.notes} />}
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => { onAdd(member.id, member.name); onClose() }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-gray-400 transition-colors">
              <Plus size={14} /> Add their relative
            </button>
            {member.user_id ? (
              <div className="flex flex-col items-center justify-center px-3 py-2 border border-gray-100 rounded-xl">
                <span className="text-[10px] text-red-400">🩸</span>
                <span className="text-[9px] text-gray-300 mt-0.5">verified</span>
              </div>
            ) : (
              <button onClick={() => { onDelete(member.id); onClose() }} className="flex items-center justify-center px-4 py-2.5 border border-red-100 rounded-xl text-sm text-red-400 hover:bg-red-50 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-gray-700 flex-1">{value}</span>
    </div>
  )
}

function MemberCard({ member, onTap }: { member: Member; onTap: (m: Member) => void }) {
  const verified = !!member.user_id
  return (
    <div onClick={() => onTap(member)}
      className={`border rounded-xl bg-white px-3 py-2.5 text-center cursor-pointer active:bg-gray-50 transition-colors select-none ${verified ? 'border-red-200 hover:border-red-400' : 'border-gray-200 hover:border-gray-400'}`}
      style={{ minWidth: 112, maxWidth: 136 }}>
      <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
      <p className="text-xs text-gray-400 truncate mt-0.5">{member.relationship_label}</p>
      {member.location_city && <p className="text-xs text-gray-300 truncate">{member.location_city}</p>}
      {verified && <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] text-red-600 font-medium">🩸 verified</span>}
    </div>
  )
}

function HeadsRow({ heads, onTap }: { heads: Member[]; onTap: (m: Member) => void }) {
  return (
    <div className="flex items-center">
      {heads.map((h, i) => (
        <span key={h.id} className="flex items-center">
          {i > 0 && <div style={{ width: 20, height: 1, background: '#d1d5db' }} />}
          <MemberCard member={h} onTap={onTap} />
        </span>
      ))}
    </div>
  )
}

// Renders a family unit recursively
function FamilyUnitView({
  unit, userName, onTap, isTopLevel, index, total,
}: {
  unit: FamilyUnit
  userName: string
  onTap: (m: Member) => void
  isTopLevel?: boolean
  index?: number
  total?: number
}) {
  const isFirst = (index ?? 0) === 0
  const isLast = (index ?? 0) === (total ?? 1) - 1
  const isOnly = (total ?? 1) === 1

  const hasChildren = unit.children.length > 0 || unit.leafChildren.length > 0 || unit.isUserParentUnit

  return (
    <div className="flex flex-col items-center">
      {/* Sibling connector from parent row (if not top level) */}
      {!isTopLevel && (
        <div className="relative w-full flex justify-center" style={{ height: 28 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: '50%', height: 1, background: isFirst || isOnly ? 'transparent' : '#d1d5db' }} />
          <div style={{ position: 'absolute', top: 0, left: '50%', right: 0, height: 1, background: isLast || isOnly ? 'transparent' : '#d1d5db' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', marginLeft: -0.5, width: 1, background: '#d1d5db' }} />
        </div>
      )}

      {/* Heads (couple or single) */}
      <HeadsRow heads={unit.heads} onTap={onTap} />

      {hasChildren && (
        <>
          <div style={{ width: 1, height: 28, background: '#d1d5db' }} />
          {/* Children row */}
          <div className="flex items-start">
            {/* User node (if this is user's parents' unit) */}
            {unit.isUserParentUnit && (
              <div className="flex flex-col items-center px-3">
                <div className="relative w-full flex justify-center" style={{ height: 28 }}>
                  {/* first child = no left line, unless there are siblings to the left */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: '50%', height: 1, background: 'transparent' }} />
                  <div style={{ position: 'absolute', top: 0, left: '50%', right: 0, height: 1, background: (unit.leafChildren.length > 0 || unit.children.length > 0) ? '#d1d5db' : 'transparent' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', marginLeft: -0.5, width: 1, background: '#d1d5db' }} />
                </div>
                <div className="border-2 border-gray-900 rounded-xl bg-gray-900 text-white px-3 py-2.5 text-center" style={{ minWidth: 112 }}>
                  <p className="text-sm font-semibold truncate">{userName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">You</p>
                </div>
              </div>
            )}

            {/* Leaf children (members with no further sub-units) */}
            {unit.leafChildren.map((child, i) => {
              const totalSiblings = unit.leafChildren.length + unit.children.length + (unit.isUserParentUnit ? 1 : 0)
              const offset = unit.isUserParentUnit ? 1 : 0
              return (
                <div key={child.id} className="flex flex-col items-center px-3">
                  <div className="relative w-full flex justify-center" style={{ height: 28 }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: '50%', height: 1, background: (offset + i === 0) ? 'transparent' : '#d1d5db' }} />
                    <div style={{ position: 'absolute', top: 0, left: '50%', right: 0, height: 1, background: (offset + i === totalSiblings - 1) ? 'transparent' : '#d1d5db' }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', marginLeft: -0.5, width: 1, background: '#d1d5db' }} />
                  </div>
                  <MemberCard member={child} onTap={onTap} />
                </div>
              )
            })}

            {/* Child units (members who have their own children) */}
            {unit.children.map((child, i) => {
              const totalSiblings = unit.leafChildren.length + unit.children.length + (unit.isUserParentUnit ? 1 : 0)
              const offset = (unit.isUserParentUnit ? 1 : 0) + unit.leafChildren.length
              return (
                <FamilyUnitView
                  key={child.heads.map(h => h.id).join('-')}
                  unit={child}
                  userName={userName}
                  onTap={onTap}
                  index={offset + i}
                  total={totalSiblings}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// Chain step options
const CHAIN_STEPS = [
  { label: 'Parents', steps: ['Father', 'Mother'] },
  { label: 'Siblings', steps: ['Brother', 'Sister'] },
  { label: 'Children', steps: ['Son', 'Daughter'] },
  { label: 'Spouse', steps: ['Husband', 'Wife'] },
  { label: 'Grandparents', steps: ['Grandfather', 'Grandmother'] },
  { label: 'Grandchildren', steps: ['Grandson', 'Granddaughter'] },
  { label: 'Extended', steps: ['Uncle', 'Aunt', 'Nephew', 'Niece'] },
]

function resolveChain(chain: string[]): { hindi: string; definition: string } | null {
  const english = chain.join("'s ")
  const match = INDIAN_RELATIONSHIPS.find(r =>
    r.english.toLowerCase() === english.toLowerCase() ||
    r.definition.toLowerCase() === english.toLowerCase()
  )
  return match ? { hindi: match.hindi, definition: match.definition } : null
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', date_of_birth: '',
  location_city: '', location_country: '', profession: '',
  company: '', education: '', notes: '',
}

export default function FamilyTreeClient({ members, userId, userName }: { members: Member[]; userId: string; userName: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [addError, setAddError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showProfile, setShowProfile] = useState<Member | null>(null)
  const [showExtra, setShowExtra] = useState(false)
  const [parentId, setParentId] = useState<string | null>(null)
  const [parentName, setParentName] = useState(userName)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [chain, setChain] = useState<string[]>([])
  const [pickingStep, setPickingStep] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const genMap = computeGenerations(members)
  const familyUnits = buildFamilyUnits(members, genMap)

  function setField(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function openAdd(pId: string | null, pName: string) {
    setParentId(pId); setParentName(pName)
    setForm({ ...EMPTY_FORM }); setChain([]); setPickingStep(false)
    setShowStartPicker(false); setShowExtra(false); setAddError(null)
    setShowModal(true)
  }

  const chainLabel = chain.join("'s ")
  const resolved = chain.length > 0 ? resolveChain(chain) : null
  const canSubmit = form.name.trim() !== '' && chain.length > 0

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setAddError(null)
    const supabase = createClient()
    startTransition(async () => {
      const { error } = await supabase.from('family_tree_members').insert({
        tree_owner_id: userId, name: form.name,
        email: form.email || null, phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        location_city: form.location_city || null, location_country: form.location_country || null,
        profession: form.profession || null, company: form.company || null,
        education: form.education || null, notes: form.notes || null,
        relationship_label: chainLabel, parent_member_id: parentId,
      })
      if (error) { setAddError(error.message); return }
      setShowModal(false); router.refresh()
    })
  }

  function handleDelete(id: string) {
    const supabase = createClient()
    startTransition(async () => {
      await supabase.from('family_tree_members').delete().eq('id', id)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="overflow-x-auto pb-8">
        <div className="flex flex-col items-center" style={{ minWidth: 'max-content' }}>

          {members.length === 0 ? (
            <>
              <div className="border-2 border-gray-900 rounded-xl bg-gray-900 text-white px-4 py-2.5 text-center" style={{ minWidth: 140 }}>
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs text-gray-400 mt-0.5">You</p>
              </div>
              <div style={{ width: 1, height: 28, background: '#d1d5db' }} />
              <button onClick={() => openAdd(null, userName)} className="border border-dashed border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-colors flex items-center gap-1.5">
                <Plus size={13} /> Add first relative
              </button>
            </>
          ) : familyUnits.length > 0 ? (
            <>
              {/* If all units are user-parent units with no ancestors, show user at top */}
              {familyUnits.every(u => u.isUserParentUnit) && !familyUnits.some(u => u.heads.some(h => (genMap.get(h.id) ?? 0) > 1)) ? (
                // No grandparents — show top level row as gen+1 with user below
                <div className="flex flex-col items-center">
                  {/* Gen+1 row: all top-level heads side by side */}
                  <div className="flex items-start justify-center">
                    {familyUnits.map((unit, i) => (
                      <div key={unit.heads.map(h => h.id).join('-')} className="flex flex-col items-center px-4">
                        <HeadsRow heads={unit.heads} onTap={setShowProfile} />
                      </div>
                    ))}
                  </div>
                  <div style={{ width: 1, height: 28, background: '#d1d5db' }} />
                  {/* Gen 0 row: user + siblings + cousins */}
                  <div className="flex items-start justify-center">
                    {/* User node */}
                    <div className="flex flex-col items-center px-3">
                      <div className="border-2 border-gray-900 rounded-xl bg-gray-900 text-white px-3 py-2.5 text-center" style={{ minWidth: 112 }}>
                        <p className="text-sm font-semibold truncate">{userName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">You</p>
                      </div>
                    </div>
                    {/* Other gen-0 members */}
                    {members.filter(m => (genMap.get(m.id) ?? 0) === 0).map(m => (
                      <div key={m.id} className="flex flex-col items-center px-3">
                        <MemberCard member={m} onTap={setShowProfile} />
                        {/* This member's children */}
                        {members.filter(c => c.parent_member_id === m.id).length > 0 && (
                          <>
                            <div style={{ width: 1, height: 20, background: '#d1d5db' }} />
                            <div className="flex items-start">
                              {members.filter(c => c.parent_member_id === m.id).map(c => (
                                <div key={c.id} className="px-2"><MemberCard member={c} onTap={setShowProfile} /></div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Has grandparents or multi-level — render full recursive units
                <div className="flex items-start justify-center">
                  {familyUnits.map((unit, i) => (
                    <FamilyUnitView
                      key={unit.heads.map(h => h.id).join('-')}
                      unit={unit} userName={userName} onTap={setShowProfile}
                      isTopLevel index={i} total={familyUnits.length}
                    />
                  ))}
                </div>
              )}

              <div className="mt-8">
                <button onClick={() => openAdd(null, userName)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
                  <Plus size={12} /> Add relative of {userName}
                </button>
              </div>
            </>
          ) : (
            // Fallback: just show user
            <div className="border-2 border-gray-900 rounded-xl bg-gray-900 text-white px-4 py-2.5 text-center" style={{ minWidth: 140 }}>
              <p className="text-sm font-semibold">{userName}</p>
              <p className="text-xs text-gray-400 mt-0.5">You</p>
            </div>
          )}
        </div>
      </div>

      {members.length > 0 && <p className="text-center text-xs text-gray-300 -mt-4 mb-4">Tap a person to view their profile</p>}

      {showProfile && (
        <ProfileModal member={showProfile} allMembers={members} userName={userName}
          onClose={() => setShowProfile(null)}
          onAdd={(id, name) => { setShowProfile(null); openAdd(id, name) }}
          onDelete={(id) => { setShowProfile(null); handleDelete(id) }}
        />
      )}

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[92vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Add relative</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-gray-600"><X size={18} /></button>
              </div>
              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <input placeholder="Their name *" required value={form.name} onChange={e => setField('name', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />

                {/* Relationship chain */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Relationship</p>
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">Starting from</p>
                    <button type="button" onClick={() => setShowStartPicker(s => !s)}
                      className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:border-gray-400">
                      <span>{parentName}</span><ChevronDown size={14} className="text-gray-400" />
                    </button>
                    {showStartPicker && (
                      <div className="border border-gray-200 rounded-lg mt-1 overflow-hidden max-h-40 overflow-y-auto">
                        <button type="button" onClick={() => { setParentId(null); setParentName(userName); setShowStartPicker(false) }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${parentId === null ? 'font-medium' : ''}`}>
                          {userName} (you)
                        </button>
                        {members.map(m => (
                          <button key={m.id} type="button"
                            onClick={() => { setParentId(m.id); setParentName(m.name); setShowStartPicker(false); setChain([]) }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-t border-gray-50 ${parentId === m.id ? 'font-medium' : ''}`}>
                            {m.name} <span className="text-xs text-gray-400 ml-1">{m.relationship_label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chain */}
                  <p className="text-xs text-gray-400 mb-2">{parentName}'s → build the chain</p>
                  <div className="flex items-center flex-wrap gap-1 mb-2 min-h-[32px]">
                    {chain.length === 0 && !pickingStep && <span className="text-xs text-gray-300 italic">Pick a relationship below</span>}
                    {chain.map((step, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <ArrowRight size={10} className="text-gray-300" />}
                        <span className="bg-gray-900 text-white text-xs px-2.5 py-1 rounded-full">{step}</span>
                      </span>
                    ))}
                    {chain.length > 0 && <button type="button" onClick={() => setChain(c => c.slice(0, -1))} className="text-xs text-gray-400 hover:text-red-400 ml-1">✕</button>}
                  </div>

                  {resolved && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">
                      <p className="text-xs text-amber-700"><span className="font-semibold">{resolved.hindi}</span><span className="text-amber-500 ml-1.5">— {resolved.definition}</span></p>
                    </div>
                  )}

                  {pickingStep ? (
                    <div className="border border-gray-200 rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-600">Pick next step</p>
                        <button type="button" onClick={() => setPickingStep(false)} className="text-gray-300 hover:text-gray-600"><X size={14} /></button>
                      </div>
                      {CHAIN_STEPS.map(group => (
                        <div key={group.label}>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{group.label}</p>
                          <div className="flex flex-wrap gap-1">
                            {group.steps.map(step => (
                              <button key={step} type="button" onClick={() => { setChain(c => [...c, step]); setPickingStep(false) }}
                                className="px-3 py-1.5 rounded-full text-xs border border-gray-200 text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors">
                                {step}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button type="button" onClick={() => setPickingStep(true)}
                      className="flex items-center gap-1.5 text-xs border border-dashed border-gray-300 rounded-lg px-3 py-2 text-gray-500 hover:border-gray-500 w-full justify-center transition-colors">
                      <Plus size={12} />{chain.length === 0 ? 'Pick first step' : 'Add another step'}
                    </button>
                  )}

                  {chain.length > 0 && form.name && (
                    <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-500 mt-2">
                      <span className="font-medium text-gray-700">{form.name}</span> is {parentName}'s{' '}
                      <span className="font-medium text-gray-700">{chainLabel}</span>
                      {resolved && <span className="text-gray-400"> ({resolved.hindi})</span>}
                    </div>
                  )}
                </div>

                {/* Contact */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact (optional)</p>
                  <input placeholder="Email" type="email" value={form.email} onChange={e => setField('email', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                  <input placeholder="Phone" value={form.phone} onChange={e => setField('phone', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Date of birth</label>
                    <input type="date" value={form.date_of_birth} onChange={e => setField('date_of_birth', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                  </div>
                </div>

                <button type="button" onClick={() => setShowExtra(e => !e)} className="text-xs text-gray-400 hover:text-gray-700 text-left flex items-center gap-1">
                  {showExtra ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {showExtra ? 'Hide' : 'Add'} extra details
                </button>

                {showExtra && (
                  <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                    <div className="flex gap-2">
                      <input placeholder="City" value={form.location_city} onChange={e => setField('location_city', e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 min-w-0" />
                      <input placeholder="Country" value={form.location_country} onChange={e => setField('location_country', e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 min-w-0" />
                    </div>
                    <input placeholder="Profession" value={form.profession} onChange={e => setField('profession', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                    <input placeholder="Company" value={form.company} onChange={e => setField('company', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                    <input placeholder="Education / College" value={form.education} onChange={e => setField('education', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                    <textarea placeholder="Notes" value={form.notes} onChange={e => setField('notes', e.target.value)} rows={2} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none" />
                  </div>
                )}

                {addError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{addError}</p>}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm">Cancel</button>
                  <button type="submit" disabled={!canSubmit || isPending} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50">
                    {isPending ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
