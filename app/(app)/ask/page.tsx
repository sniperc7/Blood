import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AskClient from './AskClient'

export default async function AskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: posts } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(name)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">Ask Your Network</h1>
      <AskClient posts={posts ?? []} userId={user.id} />
    </div>
  )
}
