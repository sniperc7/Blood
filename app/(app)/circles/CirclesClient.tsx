'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UserPlus, Trash2 } from 'lucide-react'

const CIRCLES = ['family', 'friends', 'work', 'alumni', 'sports'] as const
type Circle = (typeof CIRCLES)[number]

interface ConnectedUser {
  id: string
  name: string
  location: string | null
  profession: string | null
  expertise_tags: string[]
}

interface Connection {
  id: string
  connected_user_id: string
  circle: Circle
  relationship_type: string | null
  connected_user: ConnectedUser
}

export default function CirclesClient({ connections, userId }: { connections: Connection[]; userId: string }) {
  const router = useRouter()
  const [activeCircle, setActiveCircle] = useState<Circle | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [selectedCircle, setSelectedCircle] = useState<Circle>('friends')
  const [searchResult, setSearchResult] = useState<ConnectedUser | null>(null)
  const [searchError, setSearchError] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = activeCircle === 'all'
    ? connections
    : connections.filter((c) => c.circle === activeCircle)

  async function handleSearch() {
    setSearchError('')
    setSearchResult(null)
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, name, location, profession, expertise_tags')
      .ilike('name', `%${searchEmail}%`)
      .neq('id', userId)
      .limit(1)
      .single()
    if (!data) return setSearchError('No user found')
    setSearchResult(data)
  }

  function handleAdd() {
    if (!searchResult) return
    const supabase = createClient()
    startTransition(async () => {
      await supabase.from('connections').upsert({
        user_id: userId,
        connected_user_id: searchResult.id,
        circle: selectedCircle,
      })
      setShowAdd(false)
      setSearchEmail('')
      setSearchResult(null)
      router.refresh()
    })
  }

  function handleRemove(connectionId: string) {
    const supabase = createClient()
    startTransition(async () => {
      await supabase.from('connections').delete().eq('id', connectionId)
      router.refresh()
    })
  }

  return (
    <div>
      {/* Circle tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(['all', ...CIRCLES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setActiveCircle(c)}
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ${
              activeCircle === c
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
        <button
          onClick={() => setShowAdd(true)}
          className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-900 text-white"
        >
          <UserPlus size={14} /> Add
        </button>
      </div>

      {/* Add person modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm">
            <h2 className="font-semibold mb-4">Add to circle</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Search by name"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-2 bg-gray-100 rounded-lg text-sm"
              >
                Search
              </button>
            </div>
            {searchError && <p className="text-red-500 text-xs mb-2">{searchError}</p>}
            {searchResult && (
              <div className="border border-gray-100 rounded-lg p-3 mb-3">
                <p className="font-medium text-sm">{searchResult.name}</p>
                <p className="text-xs text-gray-500">{searchResult.profession} · {searchResult.location}</p>
              </div>
            )}
            <select
              value={selectedCircle}
              onChange={(e) => setSelectedCircle(e.target.value as Circle)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none"
            >
              {CIRCLES.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdd(false); setSearchResult(null); setSearchEmail('') }}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!searchResult || isPending}
                className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection list */}
      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">No connections in this circle yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((c) => (
            <li key={c.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3">
              <div>
                <p className="font-medium text-sm">{c.connected_user.name}</p>
                <p className="text-xs text-gray-500">{c.connected_user.profession} · {c.connected_user.location}</p>
                {c.connected_user.expertise_tags?.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {c.connected_user.expertise_tags.slice(0, 3).map((t) => (
                      <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 capitalize">{c.circle}</span>
                <button
                  onClick={() => handleRemove(c.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
