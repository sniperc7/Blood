import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContactsClient from './ContactsClient'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: contacts } = await supabase
    .from('trusted_contacts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">Trusted Contacts</h1>
      <ContactsClient contacts={contacts ?? []} userId={user.id} />
    </div>
  )
}
