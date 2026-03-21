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

interface TreeNode extends Member {
  children: TreeNode[]
}

function buildTree(members: Member[], parentId: string | null): TreeNode[] {
  return members
    .filter(m => m.parent_member_id === parentId)
    .map(m => ({ ...m, children: buildTree(members, m.id) }))
}

// Infer relationships between members at the same tree level
const SPOUSE_MAP: Record<string, string> = {
  'Father': 'Mother', 'Mother': 'Father',
  'Husband': 'Wife', 'Wife': 'Husband',
  'Grandfather': 'Grandmother', 'Grandmother': 'Grandfather',
  'Nana': 'Nani', 'Nani': 'Nana',
  'Dada': 'Dadi', 'Dadi': 'Dada',
}

const SIBLING_SET = new Set(['Brother', 'Sister', 'Bhai', 'Behen'])
const CHILD_SET = new Set(['Son', 'Daughter', 'Beta', 'Beti'])

function inferRelationships(member: Member, allMembers: Member[]): { label: string; name: string }[] {
  const siblings = allMembers.filter(
    m => m.id !== member.id && m.parent_member_id === member.parent_member_id
  )

  const results: { label: string; name: string }[] = []

  for (const s of siblings) {
    const rel = member.relationship_label.split(' — ')[0] // strip Hindi label if present
    const sRel = s.relationship_label.split(' — ')[0]

    if (SPOUSE_MAP[rel] === sRel || SPOUSE_MAP[sRel] === rel) {
      results.push({ label: 'Spouse', name: s.name })
    } else if (SIBLING_SET.has(rel) && SIBLING_SET.has(sRel)) {
      results.push({ label: 'Sibling', name: s.name })
    } else if (CHILD_SET.has(rel) && CHILD_SET.has(sRel)) {
      results.push({ label: 'Sibling', name: s.name })
    } else {
      results.push({ label: sRel, name: s.name })
    }
  }

  return results
}

function ProfileModal({
  member,
  allMembers,
  userName,
  onClose,
  onAdd,
  onDelete,
}: {
  member: Member
  allMembers: Member[]
  userName: string
  onClose: () => void
  onAdd: (id: string, name: string) => void
  onDelete: (id: string) => void
}) {
  const inferred = inferRelationships(member, allMembers)
  const parentMember = member.parent_member_id
    ? allMembers.find(m => m.id === member.parent_member_id)
    : null
  const parentName = parentMember ? parentMember.name : userName

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">{member.name}</h2>
              <p className="text-sm text-gray-400">
                {member.relationship_label} of{' '}
                <span className="text-gray-600">{parentName}</span>
              </p>
              {member.user_id && (
                <span className="inline-block mt-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">on blood</span>
              )}
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-600 p-1">
              <X size={18} />
            </button>
          </div>

          {/* Inferred relationships */}
          {inferred.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Also in tree</p>
              <div className="flex flex-col gap-1.5">
                {inferred.map((r, i) => (
                  <p key={i} className="text-xs text-gray-600">
                    <span className="text-gray-400">{r.label}:</span>{' '}
                    <span className="font-medium">{r.name}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="flex flex-col gap-2.5">
            {member.date_of_birth && (
              <Row label="Date of birth" value={new Date(member.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
            )}
            {(member.location_city || member.location_country) && (
              <Row label="Location" value={[member.location_city, member.location_country].filter(Boolean).join(', ')} />
            )}
            {member.profession && (
              <Row label="Profession" value={[member.profession, member.company].filter(Boolean).join(' · ')} />
            )}
            {member.education && (
              <Row label="Education" value={member.education} />
            )}
            {member.email && (
              <Row label="Email" value={member.email} />
            )}
            {member.phone && (
              <Row label="Phone" value={member.phone} />
            )}
            {member.notes && (
              <Row label="Notes" value={member.notes} />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => { onAdd(member.id, member.name); onClose() }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-gray-400 transition-colors"
            >
              <Plus size={14} /> Add relative
            </button>
            <button
              onClick={() => { onDelete(member.id); onClose() }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-red-100 rounded-xl text-sm text-red-400 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-gray-400 w-24 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-gray-700 flex-1">{value}</span>
    </div>
  )
}

function NodeCard({
  node,
  onTap,
}: {
  node: TreeNode
  onTap: (node: TreeNode) => void
}) {
  return (
    <div
      className="border border-gray-200 rounded-xl bg-white px-3 py-2.5 w-36 text-center cursor-pointer hover:border-gray-400 active:bg-gray-50 transition-colors select-none"
      onClick={() => onTap(node)}
    >
      <p className="text-sm font-semibold text-gray-900 truncate">{node.name}</p>
      <p className="text-xs text-gray-400 truncate mt-0.5">{node.relationship_label}</p>
      {node.location_city && (
        <p className="text-xs text-gray-300 truncate">{node.location_city}</p>
      )}
      {node.user_id && (
        <span className="inline-block mt-1 text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">on blood</span>
      )}
    </div>
  )
}

function TreeBranch({
  node,
  onTap,
  index,
  total,
}: {
  node: TreeNode
  onTap: (node: TreeNode) => void
  index: number
  total: number
}) {
  const isFirst = index === 0
  const isLast = index === total - 1
  const isOnly = total === 1

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full flex justify-center" style={{ height: 28 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: '50%', height: 1, background: isFirst || isOnly ? 'transparent' : '#d1d5db' }} />
        <div style={{ position: 'absolute', top: 0, left: '50%', right: 0, height: 1, background: isLast || isOnly ? 'transparent' : '#d1d5db' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', marginLeft: -0.5, width: 1, background: '#d1d5db' }} />
      </div>

      <NodeCard node={node} onTap={onTap} />

      {node.children.length > 0 && (
        <>
          <div style={{ width: 1, height: 28, background: '#d1d5db' }} />
          <div className="flex items-start">
            {node.children.map((child, i) => (
              <TreeBranch key={child.id} node={child} onTap={onTap} index={i} total={node.children.length} />
            ))}
          </div>
        </>
      )}
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

  const tree = buildTree(members, null)

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
        tree_owner_id: userId,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        location_city: form.location_city || null,
        location_country: form.location_country || null,
        profession: form.profession || null,
        company: form.company || null,
        education: form.education || null,
        notes: form.notes || null,
        relationship_label: selectedRelationship,
        parent_member_id: parentId,
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

          {/* Root node */}
          <div className="border-2 border-gray-900 rounded-xl bg-gray-900 text-white px-4 py-2.5 w-40 text-center">
            <p className="text-sm font-semibold truncate">{userName}</p>
            <p className="text-xs text-gray-400 mt-0.5">You</p>
          </div>

          {tree.length === 0 ? (
            <div className="flex flex-col items-center mt-0">
              <div style={{ width: 1, height: 28, background: '#d1d5db' }} />
              <button
                onClick={() => openAdd(null, userName)}
                className="border border-dashed border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-colors flex items-center gap-1.5"
              >
                <Plus size={13} /> Add first relative
              </button>
            </div>
          ) : (
            <>
              <div style={{ width: 1, height: 28, background: '#d1d5db' }} />
              <div className="flex items-start">
                {tree.map((node, i) => (
                  <TreeBranch key={node.id} node={node} onTap={setShowProfile} index={i} total={tree.length} />
                ))}
              </div>
              <div className="mt-6">
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

      {tree.length > 0 && (
        <p className="text-center text-xs text-gray-300 -mt-4 mb-4">Tap a person to view their profile</p>
      )}

      {/* Profile modal */}
      {showProfile && (
        <ProfileModal
          member={showProfile}
          allMembers={members}
          userName={userName}
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
              <p className="text-xs text-gray-400 mb-4">
                Adding a relative of <span className="font-medium text-gray-700">{parentName}</span>
              </p>

              <form onSubmit={handleAdd} className="flex flex-col gap-3">
                <input
                  placeholder="Their name *"
                  required
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                />
                <input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                />
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Date of birth</label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={e => set('date_of_birth', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-medium">
                      Relationship to <span className="text-gray-700">{parentName}</span> *
                    </p>
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.use_indian}
                        onChange={e => { set('use_indian', e.target.checked); set('relationship_label', '') }}
                        className="w-3.5 h-3.5"
                      />
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

                  <input
                    placeholder="Or type anything custom..."
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

                {addError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{addError}</p>
                )}

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
