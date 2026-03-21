import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()

  const { data: inviter } = await supabase
    .from('profiles')
    .select('name, location, profession, expertise_tags')
    .eq('invite_code', code)
    .single()

  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/profile')

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-2">blood</h1>
        <p className="text-gray-500 text-sm mb-8">Ask your network, not the internet.</p>

        {inviter ? (
          <div className="border border-gray-100 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-gray-400 mb-1">You've been invited by</p>
            <p className="font-semibold">{inviter.name}</p>
            {inviter.profession && <p className="text-sm text-gray-500">{inviter.profession}</p>}
            {inviter.location && <p className="text-sm text-gray-400">{inviter.location}</p>}
            {inviter.expertise_tags?.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {inviter.expertise_tags.slice(0, 4).map((t: string) => (
                  <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-sm mb-6">Invalid invite link.</p>
        )}

        <Link
          href="/auth"
          className="block w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium"
        >
          Join Blood
        </Link>
      </div>
    </div>
  )
}
