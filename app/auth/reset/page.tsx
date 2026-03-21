'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return setError(error.message)
      setDone(true)
    })
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold mb-6">blood</h1>
          <div className="p-5 border border-gray-100 rounded-xl">
            <p className="text-2xl mb-3">✓</p>
            <p className="font-semibold mb-1">Password updated</p>
            <p className="text-sm text-gray-500 mb-4">You can now sign in with your new password.</p>
            <a href="/auth" className="block w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium">
              Sign in
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-1">blood</h1>
        <p className="text-gray-500 text-sm mb-8">Set a new password</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {isPending ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
