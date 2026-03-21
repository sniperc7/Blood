'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const RELATIONSHIPS = ['Friend', 'Family', 'Colleague', 'Classmate', 'Alumni', 'Acquaintance']

interface Inviter {
  id: string
  name: string
  location_city: string | null
  location_country: string | null
  job_role: string | null
  company_name: string | null
  expertise_tags: string[]
}

export default function InviteClient({ inviter, inviteCode }: { inviter: Inviter | null; inviteCode: string }) {
  const [relationship, setRelationship] = useState('')
  const router = useRouter()

  function handleJoin() {
    if (!relationship) return
    // Store invite context in sessionStorage so auth page can use it after signup
    sessionStorage.setItem('invite_code', inviteCode)
    sessionStorage.setItem('invite_relationship', relationship)
    router.push('/auth')
  }

  if (!inviter) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold mb-4">blood</h1>
          <p className="text-gray-400 text-sm">This invite link is invalid or has expired.</p>
          <Link href="/auth" className="block mt-6 w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium">
            Sign up anyway
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-1 text-center">blood</h1>
        <p className="text-gray-500 text-sm mb-6 text-center">Ask your network, not the internet.</p>

        <div className="border border-gray-100 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-400 mb-1">You've been invited by</p>
          <p className="font-semibold text-lg">{inviter.name}</p>
          {inviter.job_role && (
            <p className="text-sm text-gray-500">{inviter.job_role}{inviter.company_name ? ` at ${inviter.company_name}` : ''}</p>
          )}
          {(inviter.location_city || inviter.location_country) && (
            <p className="text-sm text-gray-400">{[inviter.location_city, inviter.location_country].filter(Boolean).join(', ')}</p>
          )}
          {inviter.expertise_tags?.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {inviter.expertise_tags.slice(0, 4).map((t: string) => (
                <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">How do you know {inviter.name.split(' ')[0]}?</p>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIPS.map(r => (
              <button
                key={r}
                onClick={() => setRelationship(r)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  relationship === r
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={!relationship}
          className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-40"
        >
          Join Blood
        </button>
      </div>
    </div>
  )
}
