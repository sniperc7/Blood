'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

const CIRCLES = ['all', 'family', 'friends', 'work', 'alumni', 'sports'] as const
type Circle = (typeof CIRCLES)[number]

interface Post {
  id: string
  content: string
  circle: Circle
  visibility: '1st' | '2nd'
  created_at: string
  author_id: string
  author: { name: string }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AskClient({ posts, userId }: { posts: Post[]; userId: string }) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [circle, setCircle] = useState<Circle>('all')
  const [visibility, setVisibility] = useState<'1st' | '2nd'>('2nd')
  const [isPending, startTransition] = useTransition()

  function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    const supabase = createClient()
    startTransition(async () => {
      await supabase.from('posts').insert({ content, circle, visibility, author_id: userId })
      setContent('')
      router.refresh()
    })
  }

  function handleDelete(postId: string) {
    const supabase = createClient()
    startTransition(async () => {
      await supabase.from('posts').delete().eq('id', postId)
      router.refresh()
    })
  }

  return (
    <div>
      {/* Compose */}
      <form onSubmit={handlePost} className="border border-gray-200 rounded-xl p-4 mb-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Anyone know a good lawyer in Delhi? Anyone been to Bali?"
          rows={3}
          className="w-full text-sm outline-none resize-none placeholder-gray-400"
        />
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <select
            value={circle}
            onChange={(e) => setCircle(e.target.value as Circle)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none capitalize flex-1"
          >
            {CIRCLES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as '1st' | '2nd')}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none"
          >
            <option value="1st">1st degree</option>
            <option value="2nd">2nd degree</option>
          </select>
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className="px-4 py-1.5 bg-gray-900 text-white text-xs rounded-lg font-medium disabled:opacity-50"
          >
            Ask
          </button>
        </div>
      </form>

      {/* Feed */}
      {posts.length === 0 ? (
        <p className="text-gray-400 text-sm">No posts yet. Ask your network something.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((p) => (
            <li key={p.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm">{p.content}</p>
                {p.author_id === userId && (
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500 font-medium">{p.author?.name}</span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400 capitalize">{p.circle}</span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">{p.visibility}</span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">{timeAgo(p.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
