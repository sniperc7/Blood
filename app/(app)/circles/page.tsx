import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CirclesClient from './CirclesClient'

export default async function CirclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: connections } = await supabase
    .from('connections')
    .select('*, connected_user:profiles!connections_connected_user_id_fkey(id, name, location, profession, expertise_tags)')
    .eq('user_id', user.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">Your Circles</h1>
      <CirclesClient connections={connections ?? []} userId={user.id} />
    </div>
  )
}
