'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Phone } from 'lucide-react'

const CATEGORIES = ['lawyer', 'doctor', 'RTO agent', 'real estate broker', 'CA', 'consultant', 'other'] as const

interface Contact {
  id: string
  name: string
  category: string
  phone: string | null
  city: string | null
  added_by: string
}

export default function ContactsClient({ contacts, userId }: { contacts: Contact[]; userId: string }) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [filterCat, setFilterCat] = useState('all')
  const [form, setForm] = useState({ name: '', category: 'lawyer', phone: '', city: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    startTransition(async () => {
      await supabase.from('trusted_contacts').insert({
        name: form.name,
        category: form.category,
        phone: form.phone || null,
        city: form.city || null,
        added_by: userId,
      })
      setShowAdd(false)
      setForm({ name: '', category: 'lawyer', phone: '', city: '' })
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    const supabase = createClient()
    startTransition(async () => {
      await supabase.from('trusted_contacts').delete().eq('id', id)
      router.refresh()
    })
  }

  const categories = ['all', ...Array.from(new Set(contacts.map((c) => c.category)))]
  const filtered = filterCat === 'all' ? contacts : contacts.filter((c) => c.category === filterCat)

  return (
    <div>
      <div className="flex gap-2 items-center flex-wrap mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              filterCat === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
        <button
          onClick={() => setShowAdd(true)}
          className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-900 text-white"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm">
            <h2 className="font-semibold mb-4">Add trusted contact</h2>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              {[
                { name: 'name', placeholder: 'Name', type: 'text' },
                { name: 'phone', placeholder: 'Phone (optional)', type: 'tel' },
                { name: 'city', placeholder: 'City (optional)', type: 'text' },
              ].map(({ name, placeholder, type }) => (
                <input
                  key={name}
                  type={type}
                  name={name}
                  placeholder={placeholder}
                  value={(form as Record<string, string>)[name]}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              ))}
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none capitalize"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={!form.name || isPending} className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">No trusted contacts yet. Add your first one.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((c) => (
            <li key={c.id} className="border border-gray-100 rounded-xl p-3 flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-gray-500 capitalize">{c.category} · {c.city}</p>
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-gray-400 mt-0.5 hover:text-gray-700">
                    <Phone size={11} /> {c.phone}
                  </a>
                )}
              </div>
              {c.added_by === userId && (
                <button onClick={() => handleDelete(c.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
