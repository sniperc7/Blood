'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'

interface Person {
  id: string
  name: string
  location: string | null
  profession: string | null
  expertise_tags: string[]
}

interface Post {
  id: string
  content: string
  created_at: string
  author: { name: string }
}

interface Contact {
  id: string
  name: string
  category: string
  city: string | null
  phone: string | null
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searched, setSearched] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    const supabase = createClient()
    const q = query.trim()

    startTransition(async () => {
      const [{ data: p }, { data: po }, { data: c }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, location, profession, expertise_tags')
          .or(`name.ilike.%${q}%,location.ilike.%${q}%,profession.ilike.%${q}%`)
          .limit(10),
        supabase
          .from('posts')
          .select('id, content, created_at, author:profiles!posts_author_id_fkey(name)')
          .ilike('content', `%${q}%`)
          .limit(10),
        supabase
          .from('trusted_contacts')
          .select('id, name, category, city, phone')
          .or(`name.ilike.%${q}%,category.ilike.%${q}%,city.ilike.%${q}%`)
          .limit(10),
      ])
      setPeople(p ?? [])
      setPosts((po ?? []) as unknown as Post[])
      setContacts(c ?? [])
      setSearched(true)
    })
  }

  const total = people.length + posts.length + contacts.length

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">Search</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="flex-1 flex items-center border border-gray-200 rounded-xl px-3 gap-2">
          <Search size={16} className="text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="finance jobs London · lawyer Delhi · Bali nightlife"
            className="flex-1 py-2.5 text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2.5 bg-gray-900 text-white text-sm rounded-xl font-medium disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {searched && !isPending && total === 0 && (
        <p className="text-gray-400 text-sm">No results for "{query}"</p>
      )}

      {people.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">People</h2>
          <ul className="flex flex-col gap-2">
            {people.map((p) => (
              <li key={p.id} className="border border-gray-100 rounded-xl p-3">
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-gray-500">{p.profession} · {p.location}</p>
                {p.expertise_tags?.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {p.expertise_tags.slice(0, 4).map((t) => (
                      <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {posts.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Posts</h2>
          <ul className="flex flex-col gap-2">
            {posts.map((p) => (
              <li key={p.id} className="border border-gray-100 rounded-xl p-3">
                <p className="text-sm">{p.content}</p>
                <p className="text-xs text-gray-400 mt-1">{p.author?.name}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {contacts.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Trusted Contacts</h2>
          <ul className="flex flex-col gap-2">
            {contacts.map((c) => (
              <li key={c.id} className="border border-gray-100 rounded-xl p-3">
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-gray-500 capitalize">{c.category} · {c.city}</p>
                {c.phone && <p className="text-xs text-gray-400 mt-0.5">{c.phone}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
