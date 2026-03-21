import { INDIAN_RELATIONSHIPS, RELATIONSHIP_CATEGORIES } from '@/lib/data/relationships'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function RelationshipsReferencePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/reference" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6">
        <ChevronLeft size={16} /> Reference
      </Link>

      <h1 className="text-xl font-bold mb-1">Relationship Terms</h1>
      <p className="text-sm text-gray-400 mb-2">
        Hindi has a specific word for every family relationship — unlike English which uses generic terms like "uncle" or "aunt" for wildly different relationships.
      </p>
      <p className="text-sm text-gray-400 mb-8">
        Your father's younger brother (Chacha) and your mother's brother (Mama) are both "uncle" in English. In Hindi, they are completely different words, reflecting a completely different relationship.
      </p>

      {RELATIONSHIP_CATEGORIES.map(category => (
        <section key={category} className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
            {category}
          </h2>
          <div className="flex flex-col">
            {INDIAN_RELATIONSHIPS.filter(r => r.category === category).map(r => (
              <div key={r.hindi} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="w-32 shrink-0">
                  <span className="font-semibold text-sm">{r.hindi}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{r.definition}</p>
                  <p className="text-xs text-gray-400 mt-0.5 italic">{r.english}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-2">
        <p className="text-xs font-semibold text-amber-700 mb-2">Key differences from English</p>
        <ul className="text-xs text-amber-700 flex flex-col gap-1.5">
          <li>• Hindi distinguishes <strong>elder vs younger</strong> — Tau (father's elder brother) vs Chacha (father's younger brother)</li>
          <li>• <strong>Paternal and maternal sides are always separate</strong> — Dada (father's father) vs Nana (mother's father)</li>
          <li>• <strong>No single word for "cousin"</strong> — each has a compound term based on which aunt/uncle they come from</li>
          <li>• <strong>In-laws are highly specific</strong> — different terms for husband's side vs wife's side, and elder vs younger</li>
          <li>• Adding <strong>"-ji"</strong> to any term adds respect — Dadaji, Mamaji, Chachaji</li>
        </ul>
      </div>
    </div>
  )
}
