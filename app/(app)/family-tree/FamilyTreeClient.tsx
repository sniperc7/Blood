'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
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

function TreeNodeView({
  node,
  onAdd,
  onDelete,
  depth = 0,
}: {
  node: TreeNode
  onAdd: (parentId: string, parentName: string) => void
  onDelete: (id: string) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l border-gray-100 pl-4' : ''} mt-2`}>
      <div className="flex items-center gap-2 group">
        <button
          onClick={() => setExpanded(e => !e)}
          className={`text-gray-300 shrink-0 ${hasChildren ? 'visible' : 'invisible'}`}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <div className="flex-1 flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2 bg-white">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{node.name}</span>
              <span className="text-xs text-gray-400">{node.relationship_label}</span>
              {node.user_id && (
                <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">on blood</span>
              )}
            </div>
            {(node.profession || node.location_city) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {[node.profession, node.location_city, node.location_country].filter(Boolean).join(' · ')}
              </p>
            )}
            {node.date_of_birth && (
              <p className="text-xs text-gray-400">{new Date(node.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onAdd(node.id, node.name)}
              className="text-gray-300 hover:text-gray-700 p-1"
              title={`Add relative of ${node.name}`}
            >
              <Plus size={14} />
            </button>
            <button onClick={() => onDelete(node.id)} className="text-gray-300 hover:text-red-400 p-1">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
      {expanded && node.children.map(child => (
        <TreeNodeView key={child.id} node={child} onAdd={onAdd} onDelete={onDelete} depth={depth + 1} />
      ))}
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
    setShowModal(true)
  }

  const selectedRelationship = form.use_custom
    ? form.custom_relationship
    : form.relationship_label

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
      if (error) {
        setAddError(error.message)
        return
      }
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
      {/* Header actions */}
      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/reference"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 ml-auto"
        >
          <BookOpen size={13} /> Indian relationship guide
        </Link>
      </div>

      {/* Root — the user */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-4 shrink-0" />
        <div className="flex-1 flex items-center justify-between border-2 border-gray-900 rounded-xl px-3 py-2 bg-gray-900 text-white">
          <span className="text-sm font-semibold">{userName} (you)</span>
          <button
            onClick={() => openAdd(null, userName)}
            className="flex items-center gap-1 text-xs bg-white text-gray-900 px-2 py-1 rounded-lg font-medium"
          >
            <Plus size={12} /> Add relative
          </button>
        </div>
      </div>

      {tree.length === 0 ? (
        <p className="ml-10 mt-3 text-sm text-gray-400">No family members yet. Click "Add relative" to start.</p>
      ) : (
        tree.map(node => (
          <TreeNodeView key={node.id} node={node} onAdd={openAdd} onDelete={handleDelete} depth={1} />
        ))
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl w-full max-w-sm max-h-[92vh] overflow-y-auto">
            <div className="p-5">
              <h2 className="font-semibold mb-0.5">Add relative</h2>
              <p className="text-xs text-gray-400 mb-4">
                Adding a relative of <span className="font-medium text-gray-700">{parentName}</span>
              </p>

              <form onSubmit={handleAdd} className="flex flex-col gap-3">

                {/* Basic details */}
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

                {/* Relationship picker */}
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
                      {/* Category tabs */}
                      <div className="flex gap-1 flex-wrap mb-2">
                        {RELATIONSHIP_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategory(cat)}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              activeCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      {/* Relationships in category */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {categoryRelationships.map(r => {
                          const label = `${r.hindi} — ${r.english}`
                          return (
                            <button
                              key={r.hindi}
                              type="button"
                              onClick={() => { set('relationship_label', label); set('use_custom', false) }}
                              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                                !form.use_custom && form.relationship_label === label
                                  ? 'bg-gray-900 text-white border-gray-900'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
                              }`}
                            >
                              {r.hindi}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {['Father', 'Mother', 'Brother', 'Sister', 'Son', 'Daughter', 'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Cousin', 'Husband', 'Wife', 'Nephew', 'Niece'].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => { set('relationship_label', r); set('use_custom', false) }}
                          className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                            !form.use_custom && form.relationship_label === r
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400'
                          }`}
                        >
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
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${
                      form.use_custom ? 'border-gray-900' : 'border-gray-200 focus:border-gray-400'
                    }`}
                  />
                </div>

                {/* Preview */}
                {form.name && selectedRelationship && (
                  <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{form.name}</span> is the{' '}
                    <span className="font-medium text-gray-700">{selectedRelationship}</span> of{' '}
                    <span className="font-medium text-gray-700">{parentName}</span>
                  </div>
                )}

                {/* Extra details toggle */}
                <button
                  type="button"
                  onClick={() => setShowExtra(e => !e)}
                  className="text-xs text-gray-400 hover:text-gray-700 text-left flex items-center gap-1"
                >
                  {showExtra ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {showExtra ? 'Hide' : 'Add'} extra details (location, profession, education, notes)
                </button>

                {showExtra && (
                  <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                    <div className="flex gap-2">
                      <input
                        placeholder="City"
                        value={form.location_city}
                        onChange={e => set('location_city', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 min-w-0"
                      />
                      <input
                        placeholder="Country"
                        value={form.location_country}
                        onChange={e => set('location_country', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 min-w-0"
                      />
                    </div>
                    <input
                      placeholder="Profession / Job role"
                      value={form.profession}
                      onChange={e => set('profession', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                    <input
                      placeholder="Company"
                      value={form.company}
                      onChange={e => set('company', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                    <input
                      placeholder="Education / College"
                      value={form.education}
                      onChange={e => set('education', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                    <textarea
                      placeholder="Notes (anything else you want to remember)"
                      value={form.notes}
                      onChange={e => set('notes', e.target.value)}
                      rows={2}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
                    />
                  </div>
                )}

                {addError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{addError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm">Cancel</button>
                  <button
                    type="submit"
                    disabled={!form.name || !selectedRelationship || isPending}
                    className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    Add
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
