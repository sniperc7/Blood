import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FamilyTreeClient from './FamilyTreeClient'

export default async function FamilyTreePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, first_name, last_name')
    .eq('id', user.id)
    .single()

  const { data: members } = await supabase
    .from('family_tree_members')
    .select('*')
    .eq('tree_owner_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-1">Family Tree</h1>
      <p className="text-sm text-gray-400 mb-6">Map your blood relatives — as far out as you know them.</p>
      <FamilyTreeClient
        members={members ?? []}
        userId={user.id}
        userName={profile?.first_name || profile?.name || 'You'}
      />
    </div>
  )
}
