import { INDIAN_RELATIONSHIPS, RELATIONSHIP_CATEGORIES } from '@/lib/data/relationships'

export default function ReferencePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-1">Indian Relationship Guide</h1>
      <p className="text-sm text-gray-400 mb-8">
        Hindi has specific words for every family relationship — unlike English which uses generic terms like "uncle" or "aunt". Here's the complete guide.
      </p>

      {RELATIONSHIP_CATEGORIES.map(category => (
        <section key={category} className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
            {category}
          </h2>
          <div className="flex flex-col gap-2">
            {INDIAN_RELATIONSHIPS.filter(r => r.category === category).map(r => (
              <div key={r.hindi} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-36 shrink-0">
                  <span className="font-semibold text-sm text-gray-900">{r.hindi}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{r.definition}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.english}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="bg-gray-50 rounded-xl p-4 mt-4">
        <p className="text-xs font-semibold text-gray-500 mb-2">Key differences from English</p>
        <ul className="text-xs text-gray-500 flex flex-col gap-1.5">
          <li>• Hindi distinguishes <strong>elder vs younger</strong> — Tau (father's elder brother) vs Chacha (father's younger brother)</li>
          <li>• <strong>Paternal and maternal sides are always separate</strong> — Dada (father's father) vs Nana (mother's father)</li>
          <li>• <strong>No single word for "cousin"</strong> — each cousin has a specific compound term based on which aunt/uncle they come from</li>
          <li>• <strong>In-laws are highly specific</strong> — different terms for husband's side vs wife's side, and elder vs younger</li>
          <li>• Adding <strong>"-ji"</strong> to any term adds respect — Dadaji, Mamaji, Chachaji</li>
        </ul>
      </div>
    </div>
  )
}
