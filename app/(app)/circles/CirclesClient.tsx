'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UserPlus, Trash2, UserCheck, Copy, Check } from 'lucide-react'

const CIRCLES = ['family', 'friends', 'work', 'alumni', 'sports'] as const
type Circle = (typeof CIRCLES)[number]

interface ConnectedUser {
  id: string
  name: string
  location_city: string | null
  location_country: string | null
  job_role: string | null
  expertise_tags: string[]
}

interface Connection {
  id: string
  connected_user_id: string
  circle: Circle
  relationship_type: string | null
  connected_user: ConnectedUser
}

interface TempProfile {
  id: string
  name: string
  email: string | null
  phone: string | null
  relationship: string | null
  circle: Circle
  claimed: boolean
}

const RELATIONSHIPS = ['Friend', 'Family', 'Colleague', 'Classmate', 'Alumni', 'Acquaintance']

export default function CirclesClient({
  connections,
  tempProfiles,
  userId,
}: {
  connections: Connection[]
  tempProfiles: TempProfile[]
  userId: string
}) {
  const router = useRouter()
  const [activeCircle, setActiveCircle] = useState<Circle | 'all'>('all')
  const [modal, setModal] = useState<'add' | 'temp' | null>(null)

  // Add existing user
  const [searchName, setSearchName] = useState('')
  const [selectedCircle, setSelectedCircle] = useState<Circle>('friends')
  const [searchResult, setSearchResult] = useState<ConnectedUser | null>(null)
  const [searchError, setSearchError] = useState('')

  // Temp profile
  const [tempForm, setTempForm] = useState({ name: '', email: '', phone: '', relationship: '', circle: 'family' as Circle })
  const [createdTempId, setCreatedTempId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
      .select('id, name, location_city, location_country, job_role, expertise_tags')
      .ilike('name', `%${searchName}%`)
      .neq('id', userId)
      .limit(1)
      .single()
    if (!data) return setSearchError('No user found')
    setSearchResult(data)
  }

  function handleAddConnection() {
    if (!searchResult) return
    const supabase = createClient()
    startTransition(async () => {
      await supabase.from('connections').upsert({
        user_id: userId,
        connected_user_id: searchResult.id,
        circle: selectedCircle,
      })
      setModal(null)
      setSearchName('')
      setSearchResult(null)
      router.refresh()
    })
  }

  function handleCreateTemp(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    startTransition(async () => {
      const { data } = await supabase
        .from('temp_profiles')
        .insert({ ...tempForm, created_by: userId })
        .select('id')
        .single()
      if (data) setCreatedTempId(data.id)
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

  function handleDeleteTemp(id: string) {
    const supabase = createClient()
    startTransition(async () => {
      await supabase.from('temp_profiles').delete().eq('id', id)
      router.refresh()
    })
  }

  const tempInviteLink = createdTempId
    ? `${window.location.origin}/claim/${createdTempId}`
    : ''

  function copyLink() {
    navigator.clipboard.writeText(tempInviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function closeModal() {
    setModal(null)
    setCreatedTempId(null)
    setTempForm({ name: '', email: '', phone: '', relationship: '', circle: 'family' })
    setSearchName('')
    setSearchResult(null)
    setSearchError('')
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
              activeCircle === c ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setModal('temp')}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <UserCheck size={14} /> Temp
          </button>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-900 text-white"
          >
            <UserPlus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Pending temp profiles */}
      {tempProfiles.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Awaiting signup</p>
          <ul className="flex flex-col gap-2">
            {tempProfiles.map((t) => {
              const link = `${window.location.origin}/claim/${t.id}`
              return (
                <li key={t.id} className="border border-dashed border-gray-200 rounded-xl p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{t.relationship} · {t.circle}</p>
                    {t.email && <p className="text-xs text-gray-400">{t.email}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { navigator.clipboard.writeText(link) }}
                      className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"
                    >
                      <Copy size={12} /> Copy link
                    </button>
                    <button onClick={() => handleDeleteTemp(t.id)} className="text-gray-300 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Connections */}
      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">No connections in this circle yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((c) => (
            <li key={c.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3">
              <div>
                <p className="font-medium text-sm">{c.connected_user.name}</p>
                <p className="text-xs text-gray-500">
                  {[c.connected_user.job_role, c.connected_user.location_city, c.connected_user.location_country].filter(Boolean).join(' · ')}
                </p>
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
                <button onClick={() => handleRemove(c.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal backdrop */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm">

            {/* Add existing user */}
            {modal === 'add' && (
              <>
                <h2 className="font-semibold mb-4">Add to circle</h2>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Search by name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                  />
                  <button onClick={handleSearch} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">Search</button>
                </div>
                {searchError && <p className="text-red-500 text-xs mb-2">{searchError}</p>}
                {searchResult && (
                  <div className="border border-gray-100 rounded-lg p-3 mb-3">
                    <p className="font-medium text-sm">{searchResult.name}</p>
                    <p className="text-xs text-gray-500">{searchResult.job_role} · {searchResult.location_city}</p>
                  </div>
                )}
                <select
                  value={selectedCircle}
                  onChange={(e) => setSelectedCircle(e.target.value as Circle)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none capitalize"
                >
                  {CIRCLES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
                  <button
                    onClick={handleAddConnection}
                    disabled={!searchResult || isPending}
                    className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
                  >Add</button>
                </div>
              </>
            )}

            {/* Create temp profile */}
            {modal === 'temp' && !createdTempId && (
              <>
                <h2 className="font-semibold mb-1">Create profile for someone</h2>
                <p className="text-xs text-gray-400 mb-4">They'll get a link to claim it and join Blood.</p>
                <form onSubmit={handleCreateTemp} className="flex flex-col gap-3">
                  <input
                    placeholder="Their name"
                    required
                    value={tempForm.name}
                    onChange={e => setTempForm(f => ({ ...f, name: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                  />
                  <input
                    placeholder="Their email (optional)"
                    type="email"
                    value={tempForm.email}
                    onChange={e => setTempForm(f => ({ ...f, email: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                  />
                  <input
                    placeholder="Their phone (optional)"
                    value={tempForm.phone}
                    onChange={e => setTempForm(f => ({ ...f, phone: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                  />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Your relationship</p>
                    <div className="flex flex-wrap gap-1">
                      {RELATIONSHIPS.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setTempForm(f => ({ ...f, relationship: r }))}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            tempForm.relationship === r
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <select
                    value={tempForm.circle}
                    onChange={e => setTempForm(f => ({ ...f, circle: e.target.value as Circle }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none capitalize"
                  >
                    {CIRCLES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                  <div className="flex gap-2 mt-1">
                    <button type="button" onClick={closeModal} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
                    <button
                      type="submit"
                      disabled={!tempForm.name || !tempForm.relationship || isPending}
                      className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Show invite link after temp profile created */}
            {modal === 'temp' && createdTempId && (
              <>
                <h2 className="font-semibold mb-1">Profile created!</h2>
                <p className="text-xs text-gray-400 mb-4">Share this link with {tempForm.name}. When they sign up, they'll be connected to you automatically.</p>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-700 break-all">{tempInviteLink}</p>
                </div>
                <button
                  onClick={copyLink}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium mb-2"
                >
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy link</>}
                </button>
                <button onClick={closeModal} className="w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-500">Done</button>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
