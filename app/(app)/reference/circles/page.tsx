import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const CIRCLES = [
  {
    name: 'Family',
    emoji: '🏠',
    color: 'bg-red-50 border-red-100',
    tagColor: 'bg-red-100 text-red-700',
    description: 'Your blood relatives and immediate family. The most trusted circle.',
    whoItIncludes: ['Parents', 'Siblings', 'Grandparents', 'Aunts & Uncles', 'Cousins', 'In-laws'],
    whenToUse: [
      'Finding relatives in a city you\'re visiting',
      '"Do we have family in Dubai?"',
      'Sharing news that\'s too personal for other circles',
      'Asking for family-specific advice like property, health, or inheritance',
    ],
    trust: 'Highest trust — these are people who will help unconditionally',
  },
  {
    name: 'Friends',
    emoji: '👥',
    color: 'bg-blue-50 border-blue-100',
    tagColor: 'bg-blue-100 text-blue-700',
    description: 'Personal friends across different phases of your life.',
    whoItIncludes: ['Childhood friends', 'Neighbourhood friends', 'Friends from travel', 'Online friends you\'ve met'],
    whenToUse: [
      '"Anyone been to Bali?"',
      'Recommendations for restaurants, hotels, experiences',
      'Getting a trusted opinion on personal decisions',
      'Finding someone to meet up with in a new city',
    ],
    trust: 'High trust — built on shared experiences and personal connection',
  },
  {
    name: 'Work',
    emoji: '💼',
    color: 'bg-purple-50 border-purple-100',
    tagColor: 'bg-purple-100 text-purple-700',
    description: 'Professional connections — current and past colleagues, managers, teammates.',
    whoItIncludes: ['Current colleagues', 'Former colleagues', 'Managers & mentors', 'Professional acquaintances'],
    whenToUse: [
      '"Anyone know a good CA in Jaipur?"',
      'Job referrals and career moves',
      'Industry-specific questions',
      'Finding vendors, consultants, or service providers',
      '"Who works in fintech in London?"',
    ],
    trust: 'Medium-high trust — professional accountability adds reliability',
  },
  {
    name: 'Alumni',
    emoji: '🎓',
    color: 'bg-green-50 border-green-100',
    tagColor: 'bg-green-100 text-green-700',
    description: 'People you went to school or college with — a surprisingly powerful network.',
    whoItIncludes: ['School batchmates', 'College batchmates', 'Seniors and juniors from your institution', 'Alumni network contacts'],
    whenToUse: [
      '"Anyone from BITS Pilani working in Singapore?"',
      'Admissions advice for a younger sibling',
      'Hostel and campus life questions',
      'Alumni-only referrals and introductions',
      'Finding batchmates in a new city',
    ],
    trust: 'Medium-high trust — shared institution creates an instant connection',
  },
  {
    name: 'Sports',
    emoji: '⚽',
    color: 'bg-orange-50 border-orange-100',
    tagColor: 'bg-orange-100 text-orange-700',
    description: 'Teammates, training partners, and people you play with or compete alongside.',
    whoItIncludes: ['Teammates', 'Training partners', 'Coaches and trainers', 'People from sports clubs', 'Fellow enthusiasts'],
    whenToUse: [
      '"Anyone know a good cricket coaching academy in Pune?"',
      'Finding playing partners in a new city',
      'Sports equipment recommendations',
      'Training tips and fitness advice',
      'Organising games and tournaments',
    ],
    trust: 'Medium trust — shared passion and physical activity creates strong bonds',
  },
]

export default function CirclesReferencePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/reference" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6">
        <ChevronLeft size={16} /> Reference
      </Link>

      <h1 className="text-xl font-bold mb-1">Circles</h1>
      <p className="text-sm text-gray-400 mb-2">
        Blood organises your network into circles. When you ask a question, you choose which circle sees it — so the right people answer.
      </p>
      <p className="text-sm text-gray-400 mb-8">
        A question about a lawyer goes to Work. A question about Bali goes to Friends. A question about relatives in Dubai goes to Family. Circles make sure your network is actually useful.
      </p>

      <div className="flex flex-col gap-4">
        {CIRCLES.map(circle => (
          <div key={circle.name} className={`border rounded-xl p-4 ${circle.color}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{circle.emoji}</span>
              <h2 className="font-semibold">{circle.name}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${circle.tagColor}`}>Circle</span>
            </div>

            <p className="text-sm text-gray-600 mb-3">{circle.description}</p>

            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Who it includes</p>
              <div className="flex flex-wrap gap-1">
                {circle.whoItIncludes.map(w => (
                  <span key={w} className="text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded-full border border-white">{w}</span>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1">When to use it</p>
              <ul className="flex flex-col gap-0.5">
                {circle.whenToUse.map(w => (
                  <li key={w} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">›</span> {w}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-gray-500 italic">{circle.trust}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mt-6">
        <p className="text-xs font-semibold text-gray-500 mb-2">Reach: 1st degree vs 2nd degree</p>
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-xs font-medium text-gray-700">1st degree</p>
            <p className="text-xs text-gray-500">Only your direct connections see the post. Most private.</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700">2nd degree</p>
            <p className="text-xs text-gray-500">Your connections and their connections see it. Much wider reach — good for finding specialists or rare contacts.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
