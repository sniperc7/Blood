'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TempProfile {
  id: string
  name: string
  email: string | null
  phone: string | null
  relationship: string | null
  circle: string
  creator: {
    name: string
    job_role: string | null
    location_city: string | null
    location_country: string | null
  }
}

export default function ClaimClient({ temp, claimId }: { temp: TempProfile; claimId: string }) {
  const router = useRouter()

  function handleYes() {
    // Store claim ID so auth callback can process it
    sessionStorage.setItem('claim_id', claimId)
    sessionStorage.setItem('claim_name', temp.name)
    router.push('/auth')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-1 text-center">blood</h1>
        <p className="text-gray-500 text-sm mb-6 text-center">Ask your network, not the internet.</p>

        <div className="border border-gray-100 rounded-xl p-5 mb-6">
          <p className="text-xs text-gray-400 mb-3">
            <span className="font-medium text-gray-700">{temp.creator.name}</span> has created a profile for you
          </p>
          <p className="text-2xl font-bold mb-1">{temp.name}</p>
          <p className="text-sm text-gray-500 capitalize">{temp.relationship} of {temp.creator.name}</p>
          {temp.email && <p className="text-xs text-gray-400 mt-2">{temp.email}</p>}
        </div>

        <p className="text-sm font-medium text-center mb-4">Is this you?</p>

        <div className="flex gap-3">
          <button
            onClick={handleYes}
            className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium"
          >
            Yes, that's me
          </button>
          <Link
            href="/auth"
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-center text-gray-600"
          >
            Not me
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Clicking "Yes" will take you to sign up. Once you create your account, you'll be automatically connected to {temp.creator.name}.
        </p>
      </div>
    </div>
  )
}
