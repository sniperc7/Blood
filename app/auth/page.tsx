'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem('claim_name') ?? '' : ''
  )
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const supabase = createClient()

    startTransition(async () => {
      if (mode === 'signup') {
        const inviteCode = sessionStorage.getItem('invite_code')
        const inviteRelationship = sessionStorage.getItem('invite_relationship')
        const claimId = sessionStorage.getItem('claim_id')
        const claimName = sessionStorage.getItem('claim_name')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name || claimName || name } },
        })
        if (error) return setError(error.message)

        if (data.user) {
          // Handle invite link flow
          if (inviteCode) {
            const { data: inviter } = await supabase
              .from('profiles').select('id').eq('invite_code', inviteCode).single()
            if (inviter) {
              await supabase.from('connections').upsert({
                user_id: data.user.id,
                connected_user_id: inviter.id,
                relationship_type: inviteRelationship,
                circle: 'friends',
              })
            }
            sessionStorage.removeItem('invite_code')
            sessionStorage.removeItem('invite_relationship')
          }
          // Handle temp profile claim flow
          if (claimId) {
            const { data: temp } = await supabase
              .from('temp_profiles').select('*').eq('id', claimId).single()
            if (temp) {
              await supabase.from('temp_profiles').update({ claimed: true, claimed_by: data.user.id }).eq('id', claimId)
              await supabase.from('connections').upsert({
                user_id: data.user.id,
                connected_user_id: temp.created_by,
                relationship_type: temp.relationship,
                circle: temp.circle,
              })
              await supabase.from('connections').upsert({
                user_id: temp.created_by,
                connected_user_id: data.user.id,
                relationship_type: temp.relationship,
                circle: temp.circle,
              })
            }
            sessionStorage.removeItem('claim_id')
            sessionStorage.removeItem('claim_name')
          }
        }
        return setEmailSent(true)
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://blood-fawn.vercel.app/auth/callback',
        })
        if (error) return setError(error.message)
        return setEmailSent(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return setError(error.message)
        router.push('/profile')
        router.refresh()
      }
    })
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold mb-1">blood</h1>
          <div className="mt-8 p-5 border border-gray-100 rounded-xl">
            <p className="text-2xl mb-3">📬</p>
            <p className="font-semibold mb-1">Check your email</p>
            <p className="text-sm text-gray-500">
              {mode === 'forgot'
                ? `We sent a password reset link to `
                : `We sent a confirmation link to `}
              <span className="font-medium text-gray-700">{email}</span>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-1">blood</h1>
        <p className="text-gray-500 text-sm mb-8">Ask your network, not the internet.</p>

        {mode !== 'forgot' && (
          <div className="flex border border-gray-200 rounded-lg p-1 mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === m ? 'bg-gray-900 text-white' : 'text-gray-500'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>
        )}

        {mode === 'forgot' && (
          <p className="text-sm font-medium mb-4">Reset your password</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
          {mode !== 'forgot' && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
            />
          )}
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium mt-1 disabled:opacity-50"
          >
            {isPending
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign in'
              : mode === 'signup'
              ? 'Create account'
              : 'Send reset link'}
          </button>
        </form>

        {mode === 'login' && (
          <button
            onClick={() => { setMode('forgot'); setError('') }}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 w-full text-center"
          >
            Forgot password?
          </button>
        )}

        {mode === 'forgot' && (
          <button
            onClick={() => { setMode('login'); setError('') }}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 w-full text-center"
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  )
}
