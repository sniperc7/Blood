'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react'
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

// How many generations above (+) or below (-) a member is relative to their parent node
const GEN_STEP: Record<string, number> = {
  // English
  'Father': 1, 'Mother': 1,
  'Grandfather': 2, 'Grandmother': 2,
  'Uncle': 1, 'Aunt': 1,
  'Brother': 0, 'Sister': 0,
  'Cousin': 0, 'Husband': 0, 'Wife': 0,
  'Son': -1, 'Daughter': -1,
  'Nephew': -1, 'Niece': -1,
  'Grandson': -2, 'Granddaughter': -2,
  // Hindi (first word of label)
  'Dada': 2, 'Dadi': 2, 'Nana': 2, 'Nani': 2,
  'Pardada': 3, 'Pardadi': 3, 'Parnana': 3, 'Parnani': 3,
  'Papa': 1, 'Pita': 1, 'Maa': 1, 'Mata': 1,
  'Bhaiya': 0, 'Bhai': 0, 'Behen': 0, 'Didi': 0, 'Chota': 0, 'Choti': 0,
  'Pati': 0, 'Patni': 0,
  'Beta': -1, 'Beti': -1,
  'Chacha': 1, 'Chachi': 1, 'Tau': 1, 'Taayi': 1,
  'Mama': 1, 'Mami': 1, 'Mausa': 1, 'Mausi': 1,
  'Bhatija': -1, 'Bhatiji': -1, 'Bhanja': -1, 'Bhanji': -1,
}

function getGenStep(relationshipLabel: string): number {
  const first = relationshipLabel.split(/[\s—]/)[0].trim()
  return GEN_STEP[first] ?? GEN_STEP[relationshipLabel.trim()] ?? 0
}

function computeGenerations(members: Member[]): Map<string, number> {
  const memo = new Map<string, number>()
  const memberMap = new Map(members.map(m => [m.id, m]))

  function compute(id: string, depth = 0): number {
    if (memo.has(id)) return memo.get(id)!
    if (depth > 20) return 0 // cycle guard
    const m = memberMap.get(id)
    if (!m) return 0
    const step = getGenStep(m.relationship_label)
    if (m.parent_member_id === null) {
      memo.set(id, step)
      return step
    }
    const parentGen = compute(m.parent_member_id, depth + 1)
    const gen = parentGen + step
    memo.set(id, gen)
    return gen
  }

  for (const m of members) compute(m.id)
  return memo
}

// Infer spouse relationship
const SPOUSE_MAP: Record<string, string> = {
  'Father': 'Mother', 'Mother': 'Father',
  'Husband': 'Wife', 'Wife': 'Husband',
  'Grandfather': 'Grandmother', 'Grandmother': 'Grandfather',
  'Nana': 'Nani', 'Nani': 'Nana', 'Dada': 'Dadi', 'Dadi': 'Dada',
}

function isSpouse(a: Member, b: Member): boolean {
  const aRel = a.relationship_label.split(/[\s—]/)[0].trim()
  const bRel = b.relationship_label.split(/[\s—]/)[0].trim()
  return SPOUSE_MAP[aRel] === bRel || SPOUSE_MAP[bRel] === aRel
}

// A nuclear family cluster: 1-2 parents + their shared children key
interface Cluster {
  key: string
  members: Member[]       // the members shown in this cluster (1 or 2 spouses)
  parentKey: string | null // key of the cluster that contains the parent_member_id node
}

function buildClusters(members: Member[], genMap: Map<string, number>): Map<number, Cluster[]> {
  const result = new Map<number, Cluster[]>()

  // Group by generation
  const byGen = new Map<number, Member[]>()
  for (const m of members) {
    const g = genMap.get(m.id) ?? 0
    if (!byGen.has(g)) byGen.set(g, [])
    byGen.get(g)!.push(m)
  }

  for (const [gen, genMembers] of byGen) {
    // Group by parent_member_id
    const byParent = new Map<string | null, Member[]>()
    for (const m of genMembers) {
      const key = m.parent_member_id
      if (!byParent.has(key)) byParent.set(key, [])
      byParent.get(key)!.push(m)
    }

    const clusters: Cluster[] = []
    for (const [parentId, mems] of byParent) {
      // Pair up spouses within this group, rest are singles
      const used = new Set<string>()
      const pairs: Member[][] = []
      for (let i = 0; i < mems.length; i++) {
        if (used.has(mems[i].id)) continue
        let paired = false
        for (let j = i + 1; j < mems.length; j++) {
          if (!used.has(mems[j].id) && isSpouse(mems[i], mems[j])) {
            pairs.push([mems[i], mems[j]])
            used.add(mems[i].id)
            used.add(mems[j].id)
            paired = true
            break
          }
        }
        if (!paired) {
          pairs.push([mems[i]])
          used.add(mems[i].id)
        }
      }

      for (const pair of pairs) {
        const parentMember = parentId ? members.find(m => m.id === parentId) : null
        const parentParentId = parentMember ? parentMember.parent_member_id : null
        clusters.push({
          key: pair.map(m => m.id).join('-'),
          members: pair,
          parentKey: parentId ?? null,
        })
      }
    }

    result.set(gen, clusters)
  }

  return result
}

function ProfileModal({
  member, allMembers, userName, onClose, onAdd, onDelete,
}: {
  member: Member, allMembers: Member[], userName: string,
  onClose: () => void, onAdd: (id: string, name: string) => void, onDelete: (id: string) => void,
}) {
  const parentMember = member.parent_member_id ? allMembers.find(m => m.id === member.parent_member_id) : null
  const parentName = parentMember ? parentMember.name : userName

  // Find same-level members (same parent_member_id) and infer relationship
  const coMembers = allMembers.filter(m => m.id !== member.id && m.parent_member_id === member.parent_member_id)
  const inferred: { label: string; name: string }[] = coMembers.map(m => {
    const aRel = member.relationship_label.split(/[\s—]/)[0].trim()
    const bRel = m.relationship_label.split(/[\s—]/)[0].trim()
    if (SPOUSE_MAP[aRel] === bRel || SPOUSE_MAP[bRel] === aRel) return { label: 'Spouse', name: m.name }
    if (['Brother','Sister','Bhai','Behen','Didi'].includes(aRel) && ['Brother','Sister','Bhai','Behen','Didi'].includes(bRel)) return { label: 'Sibling', name: m.name }
    return { label: bRel, name: m.name }
  })

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">{member.name}</h2>
              <p className="text-sm text-gray-400">{member.relationship_label} of <span className="text-gray-600">{parentName}</span></p>
              {member.user_id && <span className="inline-block mt-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">on blood</span>}
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-600 p-1"><X size={18} /></button>
          </div>

          {inferred.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Also in tree</p>
              {inferred.map((r, i) => (
                <p key={i} className="text-xs text-gray-600"><span className="text-gray-400">{r.label}:</span> <span className="font-medium">{r.name}</span></p>
              ))}
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
              <div className="flex flex-col items-center justify-center px-3 py-2 border border-gray-100 rounded-xl" title="Verified users can't be removed">
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
    <div
      onClick={() => onTap(member)}
      className={`border rounded-xl bg-white px-3 py-2.5 text-center cursor-pointer active:bg-gray-50 transition-colors select-none ${verified ? 'border-red-200 hover:border-red-400' : 'border-gray-200 hover:border-gray-400'}`}
      style={{ minWidth: 120, maxWidth: 144 }}
    >
      <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
      <p className="text-xs text-gray-400 truncate mt-0.5">{member.relationship_label}</p>
      {member.location_city && <p className="text-xs text-gray-300 truncate">{member.location_city}</p>}
      {verified && (
        <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] text-red-600 font-medium">
          🩸 verified
        </span>
      )}
    </div>
  )
}

// Renders a couple or single member with optional spouse line
function ClusterNode({ cluster, onTap }: { cluster: Cluster; onTap: (m: Member) => void }) {
  const [a, b] = cluster.members
  return (
    <div className="flex flex-col items-center px-3">
      <div className="flex items-center gap-0">
        <MemberCard member={a} onTap={onTap} />
        {b && (
          <>
            <div style={{ width: 16, height: 1, background: '#d1d5db' }} />
            <MemberCard member={b} onTap={onTap} />
          </>
        )}
      </div>
    </div>
  )
}

// Connector between two generation rows
function GenerationConnector({
  childClusters,
}: {
  childClusters: Cluster[]
}) {
  const count = childClusters.length
  return (
    <div className="flex items-start justify-center" style={{ height: 36 }}>
      {childClusters.map((cluster, i) => {
        const isFirst = i === 0
        const isLast = i === count - 1
        const isOnly = count === 1
        return (
          <div key={cluster.key} className="flex-1 flex flex-col items-center" style={{ minWidth: 150 }}>
            {/* Horizontal bar at top + vertical line down */}
            <div className="relative w-full" style={{ height: 18 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: '50%', height: 1, background: isFirst || isOnly ? 'transparent' : '#d1d5db' }} />
              <div style={{ position: 'absolute', top: 0, left: '50%', right: 0, height: 1, background: isLast || isOnly ? 'transparent' : '#d1d5db' }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', marginLeft: -0.5, width: 1, background: '#d1d5db' }} />
            </div>
            <div style={{ width: 1, height: 18, background: '#d1d5db' }} />
          </div>
        )
      })}
    </div>
  )
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', date_of_birth: '',
  location_city: '', location_country: '', profession: '',
  company: '', education: '', notes: '',
  relationship_label: '', custom_relationship: '',
  use_custom: false, use_indian: false,
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
  const [activeCategory, setActiveCategory] = useState(RELATIONSHIP_CATEGORIES[0])
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const genMap = computeGenerations(members)
  const clustersByGen = buildClusters(members, genMap)

  // Sort generations descending (oldest at top, user at 0, descendants below)
  const sortedGens = [...clustersByGen.keys()].sort((a, b) => b - a)

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function openAdd(pId: string | null, pName: string) {
    setParentId(pId)
    setParentName(pName)
    setForm({ ...EMPTY_FORM })
    setShowExtra(false)
    setAddError(null)
    setShowModal(true)
  }

  const selectedRelationship = form.use_custom ? form.custom_relationship : form.relationship_label

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !selectedRelationship) return
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
        relationship_label: selectedRelationship, parent_member_id: parentId,
      })
      if (error) { setAddError(error.message); return }
      setShowModal(false)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    const supabase = createClient()
    startTransition(async () => {
      await supabase.from('family_tree_members').delete().eq('id', id)
      router.refresh()
    })
  }

  const categoryRelationships = INDIAN_RELATIONSHIPS.filter(r => r.category === activeCategory)

  return (
    <div>
      <div className="overflow-x-auto pb-8">
        <div className="flex flex-col items-center" style={{ minWidth: 'max-content' }}>

          {members.length === 0 ? (
            <>
              {/* User node */}
              <div className="border-2 border-gray-900 rounded-xl bg-gray-900 text-white px-4 py-2.5 text-center" style={{ minWidth: 140 }}>
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs text-gray-400 mt-0.5">You</p>
              </div>
              <div style={{ width: 1, height: 28, background: '#d1d5db' }} />
              <button
                onClick={() => openAdd(null, userName)}
                className="border border-dashed border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-colors flex items-center gap-1.5"
              >
                <Plus size={13} /> Add first relative
              </button>
            </>
          ) : (
            <>
              {/* Generations above user (oldest first) */}
              {sortedGens.filter(g => g > 0).map((gen, gi, arr) => (
                <div key={gen} className="flex flex-col items-center w-full">
                  {gi === 0 && (
                    <p className="text-[10px] text-gray-300 mb-2 uppercase tracking-widest">
                      {gen === 1 ? 'Parents' : gen === 2 ? 'Grandparents' : `Generation +${gen}`}
                    </p>
                  )}
                  {gi > 0 && (
                    <p className="text-[10px] text-gray-300 mb-2 uppercase tracking-widest">
                      {gen === 1 ? 'Parents' : gen === 2 ? 'Grandparents' : `Generation +${gen}`}
                    </p>
                  )}
                  <div className="flex items-start justify-center">
                    {(clustersByGen.get(gen) ?? []).map(cluster => (
                      <ClusterNode key={cluster.key} cluster={cluster} onTap={setShowProfile} />
                    ))}
                  </div>
                  {/* Connector going down */}
                  <div style={{ width: 1, height: 32, background: '#d1d5db' }} />
                </div>
              ))}

              {/* User's generation row */}
              <div className="flex flex-col items-center w-full">
                {sortedGens.some(g => g > 0) && (
                  <p className="text-[10px] text-gray-300 mb-2 uppercase tracking-widest">Your generation</p>
                )}
                <div className="flex items-start justify-center gap-0">
                  {/* User node */}
                  <div className="flex flex-col items-center px-3">
                    <div className="border-2 border-gray-900 rounded-xl bg-gray-900 text-white px-3 py-2.5 text-center" style={{ minWidth: 120 }}>
                      <p className="text-sm font-semibold truncate">{userName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">You</p>
                    </div>
                  </div>
                  {/* Same-generation members */}
                  {(clustersByGen.get(0) ?? []).map(cluster => (
                    <ClusterNode key={cluster.key} cluster={cluster} onTap={setShowProfile} />
                  ))}
                </div>
              </div>

              {/* Connector + generations below user */}
              {sortedGens.filter(g => g < 0).map((gen) => (
                <div key={gen} className="flex flex-col items-center w-full">
                  <div style={{ width: 1, height: 32, background: '#d1d5db' }} />
                  <p className="text-[10px] text-gray-300 mb-2 uppercase tracking-widest">
                    {gen === -1 ? 'Children' : gen === -2 ? 'Grandchildren' : `Generation ${gen}`}
                  </p>
                  <div className="flex items-start justify-center">
                    {(clustersByGen.get(gen) ?? []).map(cluster => (
                      <ClusterNode key={cluster.key} cluster={cluster} onTap={setShowProfile} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Add more */}
              <div className="mt-8">
                <button
                  onClick={() => openAdd(null, userName)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Plus size={12} /> Add relative of {userName}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {members.length > 0 && (
        <p className="text-center text-xs text-gray-300 -mt-4 mb-4">Tap a person to view their profile</p>
      )}

      {/* Profile modal */}
      {showProfile && (
        <ProfileModal
          member={showProfile} allMembers={members} userName={userName}
          onClose={() => setShowProfile(null)}
          onAdd={(id, name) => { setShowProfile(null); openAdd(id, name) }}
          onDelete={(id) => { setShowProfile(null); handleDelete(id) }}
        />
      )}

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl w-full max-w-sm max-h-[92vh] overflow-y-auto">
            <div className="p-5">
              <h2 className="font-semibold mb-0.5">Add relative</h2>
              <p className="text-xs text-gray-400 mb-4">Adding a relative of <span className="font-medium text-gray-700">{parentName}</span></p>

              <form onSubmit={handleAdd} className="flex flex-col gap-3">
                <input placeholder="Their name *" required value={form.name} onChange={e => set('name', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                <input placeholder="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                <input placeholder="Phone" value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Date of birth</label>
                  <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-medium">Relationship to <span className="text-gray-700">{parentName}</span> *</p>
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                      <input type="checkbox" checked={form.use_indian}
                        onChange={e => { set('use_indian', e.target.checked); set('relationship_label', '') }}
                        className="w-3.5 h-3.5" />
                      Hindi terms
                    </label>
                  </div>

                  {form.use_indian ? (
                    <>
                      <div className="flex gap-1 flex-wrap mb-2">
                        {RELATIONSHIP_CATEGORIES.map(cat => (
                          <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${activeCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {categoryRelationships.map(r => {
                          const label = `${r.hindi} — ${r.english}`
                          return (
                            <button key={r.hindi} type="button"
                              onClick={() => { set('relationship_label', label); set('use_custom', false) }}
                              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${!form.use_custom && form.relationship_label === label ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                              {r.hindi}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {['Father', 'Mother', 'Brother', 'Sister', 'Son', 'Daughter', 'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Cousin', 'Husband', 'Wife', 'Nephew', 'Niece'].map(r => (
                        <button key={r} type="button"
                          onClick={() => { set('relationship_label', r); set('use_custom', false) }}
                          className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${!form.use_custom && form.relationship_label === r ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  )}

                  <input placeholder="Or type anything custom..."
                    value={form.custom_relationship}
                    onChange={e => { set('custom_relationship', e.target.value); set('use_custom', true) }}
                    onFocus={() => set('use_custom', true)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${form.use_custom ? 'border-gray-900' : 'border-gray-200 focus:border-gray-400'}`}
                  />
                </div>

                {form.name && selectedRelationship && (
                  <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{form.name}</span> is the{' '}
                    <span className="font-medium text-gray-700">{selectedRelationship}</span> of{' '}
                    <span className="font-medium text-gray-700">{parentName}</span>
                  </div>
                )}

                <button type="button" onClick={() => setShowExtra(e => !e)}
                  className="text-xs text-gray-400 hover:text-gray-700 text-left flex items-center gap-1">
                  {showExtra ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {showExtra ? 'Hide' : 'Add'} extra details
                </button>

                {showExtra && (
                  <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                    <div className="flex gap-2">
                      <input placeholder="City" value={form.location_city} onChange={e => set('location_city', e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 min-w-0" />
                      <input placeholder="Country" value={form.location_country} onChange={e => set('location_country', e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 min-w-0" />
                    </div>
                    <input placeholder="Profession / Job role" value={form.profession} onChange={e => set('profession', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                    <input placeholder="Company" value={form.company} onChange={e => set('company', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                    <input placeholder="Education / College" value={form.education} onChange={e => set('education', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                    <textarea placeholder="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none" />
                  </div>
                )}

                {addError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{addError}</p>}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm">Cancel</button>
                  <button type="submit" disabled={!form.name || !selectedRelationship || isPending}
                    className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50">
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
