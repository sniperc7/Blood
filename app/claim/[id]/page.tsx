import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClaimClient from './ClaimClient'

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: temp } = await supabase
    .from('temp_profiles')
    .select('*, creator:profiles!temp_profiles_created_by_fkey(name, job_role, location_city, location_country)')
    .eq('id', id)
    .eq('claimed', false)
    .single()

  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, auto-claim and redirect
  if (user && temp) {
    await supabase.from('temp_profiles').update({ claimed: true, claimed_by: user.id }).eq('id', id)
    await supabase.from('connections').upsert({
      user_id: user.id,
      connected_user_id: temp.created_by,
      relationship_type: temp.relationship,
      circle: temp.circle,
    })
    await supabase.from('connections').upsert({
      user_id: temp.created_by,
      connected_user_id: user.id,
      relationship_type: temp.relationship,
      circle: temp.circle,
    })
    redirect('/circles')
  }

  if (!temp) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold mb-4">blood</h1>
          <p className="text-gray-400 text-sm">This link has already been used or is invalid.</p>
        </div>
      </div>
    )
  }

  return <ClaimClient temp={temp} claimId={id} />
}
