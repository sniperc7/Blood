import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InviteClient from './InviteClient'

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()

  const { data: inviter } = await supabase
    .from('profiles')
    .select('id, name, location_city, location_country, job_role, company_name, expertise_tags')
    .eq('invite_code', code)
    .single()

  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/profile')

  return <InviteClient inviter={inviter} inviteCode={code} />
}
