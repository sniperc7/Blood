'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  name: string
  location: string | null
  profession: string | null
  education: string | null
  expertise_tags: string[]
  cities_visited: string[]
  invite_code: string | null
}

export default function ProfileForm({ profile, userId }: { profile: Profile | null; userId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    location: profile?.location ?? '',
    profession: profile?.profession ?? '',
    education: profile?.education ?? '',
    expertise_tags: (profile?.expertise_tags ?? []).join(', '),
    cities_visited: (profile?.cities_visited ?? []).join(', '),
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    startTransition(async () => {
      await supabase.from('profiles').upsert({
        id: userId,
        name: form.name,
        location: form.location || null,
        profession: form.profession || null,
        education: form.education || null,
        expertise_tags: form.expertise_tags.split(',').map((s) => s.trim()).filter(Boolean),
        cities_visited: form.cities_visited.split(',').map((s) => s.trim()).filter(Boolean),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    })
  }

  const inviteLink = profile?.invite_code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${profile.invite_code}`
    : ''

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {[
        { name: 'name', label: 'Name', placeholder: 'Your name' },
        { name: 'location', label: 'Location', placeholder: 'City, Country' },
        { name: 'profession', label: 'Profession', placeholder: 'What do you do?' },
        { name: 'education', label: 'Education', placeholder: 'University / School' },
        { name: 'expertise_tags', label: 'Expertise (comma separated)', placeholder: 'finance, real estate, travel...' },
        { name: 'cities_visited', label: 'Cities visited (comma separated)', placeholder: 'Bali, Dubai, London...' },
      ].map(({ name, label, placeholder }) => (
        <div key={name}>
          <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
          <input
            name={name}
            value={(form as Record<string, string>)[name]}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={isPending}
        className="bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {saved ? 'Saved!' : isPending ? 'Saving...' : 'Save profile'}
      </button>

      {inviteLink && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-1">Your invite link</p>
          <p className="text-xs text-gray-700 break-all">{inviteLink}</p>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(inviteLink)}
            className="mt-2 text-xs text-gray-500 underline"
          >
            Copy
          </button>
        </div>
      )}
    </form>
  )
}
