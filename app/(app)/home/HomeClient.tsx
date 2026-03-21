'use client'

import dynamic from 'next/dynamic'
import { Users, MapPin } from 'lucide-react'

const Globe = dynamic(() => import('@/components/Globe'), { ssr: false })

interface Point {
  lat: number
  lng: number
  name: string
  city: string | null
  country: string | null
  isMe?: boolean
}

export default function HomeClient({
  points,
  myCity,
  myCountry,
  totalUsers,
}: {
  points: Point[]
  myCity: string | null | undefined
  myCountry: string | null | undefined
  totalUsers: number
}) {
  const mappedCount = points.length

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] md:h-screen">
      {/* Globe — takes most of screen */}
      <div className="flex-1 relative bg-gray-950 min-h-0">
        <Globe points={points} />

        {/* Overlay stats */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
          <div>
            <h1 className="text-white text-lg font-bold tracking-tight drop-shadow">blood</h1>
            <p className="text-white/50 text-xs">your trusted network</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-black/40 backdrop-blur text-white rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5">
              <Users size={12} />
              {totalUsers} {totalUsers === 1 ? 'member' : 'members'}
            </div>
            {mappedCount > 0 && (
              <div className="bg-black/40 backdrop-blur text-white rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5">
                <MapPin size={12} />
                {mappedCount} on map
              </div>
            )}
          </div>
        </div>

        {/* Location hint if user has no location */}
        {!myCity && !myCountry && (
          <div className="absolute bottom-4 left-4 right-4">
            <a
              href="/profile"
              className="block w-full bg-white/10 backdrop-blur border border-white/20 text-white text-xs text-center py-2.5 rounded-xl"
            >
              Add your location to appear on the globe →
            </a>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur rounded-xl px-3 py-2 text-xs text-white/70 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> You
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> Network
          </div>
        </div>
      </div>

      {/* Bottom strip — no users on map message */}
      {points.length === 0 && (
        <div className="bg-white border-t border-gray-100 px-4 py-3 text-center text-sm text-gray-400">
          No members on the map yet — add your location in your profile.
        </div>
      )}
    </div>
  )
}
