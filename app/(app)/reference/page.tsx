import Link from 'next/link'
import { BookOpen, Users } from 'lucide-react'

export default function ReferencePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-1">Reference</h1>
      <p className="text-sm text-gray-400 mb-8">Guides to help you understand and use Blood.</p>

      <div className="flex flex-col gap-3">
        <Link href="/reference/relationships" className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-orange-500" />
            </div>
            <h2 className="font-semibold text-sm">Relationship Terms</h2>
          </div>
          <p className="text-xs text-gray-400 ml-11">Hindi, English, and Indian-specific relationship names — Dada, Nani, Mausi, Chacha and more. Why Hindi has 30+ words where English has just "uncle".</p>
        </Link>

        <Link href="/reference/circles" className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-blue-500" />
            </div>
            <h2 className="font-semibold text-sm">Circles</h2>
          </div>
          <p className="text-xs text-gray-400 ml-11">What are circles, how they work, and how to use them to ask the right people the right questions — family, work, college, sports, and friends.</p>
        </Link>
      </div>
    </div>
  )
}
