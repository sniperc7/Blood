'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

interface Member {
  id: string
  name: string
  email: string | null
  phone: string | null
  user_id: string | null
  relationship_label: string
  parent_member_id: string | null
}

interface TreeNode extends Member {
  children: TreeNode[]
}

const COMMON_RELATIONSHIPS = [
  'Father', 'Mother', 'Brother', 'Sister', 'Son', 'Daughter',
  'Grandfather', 'Grandmother', 'Grandson', 'Granddaughter',
  'Uncle', 'Aunt', 'Nephew', 'Niece', 'Cousin',
  'Husband', 'Wife', 'Father-in-law', 'Mother-in-law',
  'Brother-in-law', 'Sister-in-law',
]

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
          className={`text-gray-300 ${hasChildren ? 'visible' : 'invisible'}`}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <div className="flex-1 flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2 bg-white">
          <div className="flex-1">
            <span className="text-sm font-medium">{node.name}</span>
            <span className="text-xs text-gray-400 ml-2">{node.relationship_label}</span>
            {node.email && <span className="text-xs text-gray-300 ml-2">{node.email}</span>}
            {node.user_id && (
              <span className="ml-2 text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">on blood</span>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAdd(node.id, node.name)}
              className="text-gray-300 hover:text-gray-700 p-1"
              title={`Add relative of ${node.name}`}
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => onDelete(node.id)}
              className="text-gray-300 hover:text-red-400 p-1"
            >
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

export default function FamilyTreeClient({
  members,
  userId,
  userName,
}: {
  members: Member[]
  userId: string
  userName: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [parentId, setParentId] = useState<string | null>(null)
  const [parentName, setParentName] = useState<string>(userName)
  const [customRelationship, setCustomRelationship] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [form, setForm] = useState({
    name: '',
    relationship_label: '',
    email: '',
    phone: '',
  })

  const tree = buildTree(members, null)

  function openAdd(pId: string | null, pName: string) {
    setParentId(pId)
    setParentName(pName)
    setForm({ name: '', relationship_label: '', email: '', phone: '' })
    setCustomRelationship('')
    setUseCustom(false)
    setShowModal(true)
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const relationship = useCustom ? customRelationship : form.relationship_label
    if (!form.name || !relationship) return
    const supabase = createClient()
    startTransition(async () => {
      await supabase.from('family_tree_members').insert({
        tree_owner_id: userId,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        relationship_label: relationship,
        parent_member_id: parentId,
      })
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

  const relationship = useCustom ? customRelationship : form.relationship_label

  return (
    <div>
      {/* Root node — the user */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-4" />
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

      {/* Tree */}
      {tree.length === 0 ? (
        <div className="ml-10 mt-3 text-sm text-gray-400">
          No family members yet. Click "Add relative" to start your tree.
        </div>
      ) : (
        <div>
          {tree.map(node => (
            <TreeNodeView key={node.id} node={node} onAdd={openAdd} onDelete={handleDelete} depth={1} />
          ))}
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold mb-1">Add relative</h2>
            <p className="text-xs text-gray-400 mb-4">
              Adding a relative of <span className="font-medium text-gray-700">{parentName}</span>
            </p>

            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <input
                placeholder="Their name"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
              />

              {/* Relationship picker */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">
                  Their relationship to <span className="font-medium">{parentName}</span>
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {COMMON_RELATIONSHIPS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, relationship_label: r })); setUseCustom(false) }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        !useCustom && form.relationship_label === r
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    placeholder='Or type custom: e.g. "Younger Brother"'
                    value={customRelationship}
                    onChange={e => { setCustomRelationship(e.target.value); setUseCustom(true) }}
                    onFocus={() => setUseCustom(true)}
                    className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${
                      useCustom ? 'border-gray-900' : 'border-gray-200 focus:border-gray-400'
                    }`}
                  />
                </div>
              </div>

              <input
                placeholder="Email (optional)"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
              />
              <input
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
              />

              {/* Preview */}
              {form.name && relationship && (
                <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{form.name}</span> is the{' '}
                  <span className="font-medium text-gray-700">{relationship}</span> of{' '}
                  <span className="font-medium text-gray-700">{parentName}</span>
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!form.name || !relationship || isPending}
                  className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
