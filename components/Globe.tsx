'use client'

import { useEffect, useRef, useState } from 'react'

interface MarkerPoint {
  lat: number
  lng: number
  name: string
  city: string | null
  country: string | null
  isMe?: boolean
}

interface Props {
  points: MarkerPoint[]
}

export default function GlobeComponent({ points }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false

    import('react-globe.gl').then(({ default: Globe }) => {
      if (cancelled || !containerRef.current) return

      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight

      const globe = (Globe as any)()
        .width(width)
        .height(height)
        .backgroundColor('rgba(0,0,0,0)')
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .pointsData(points)
        .pointLat((d: any) => d.lat)
        .pointLng((d: any) => d.lng)
        .pointColor((d: any) => d.isMe ? '#f97316' : '#3b82f6')
        .pointAltitude(0.01)
        .pointRadius((d: any) => d.isMe ? 0.6 : 0.4)
        .pointLabel((d: any) => `
          <div style="background:white;padding:6px 10px;border-radius:8px;font-size:12px;font-family:sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.15)">
            <strong>${d.name}</strong><br/>
            <span style="color:#888">${[d.city, d.country].filter(Boolean).join(', ')}</span>
          </div>
        `)
        (containerRef.current)

      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.5
      globe.controls().enableZoom = true

      // Focus on first point if available
      if (points.length > 0) {
        const me = points.find(p => p.isMe) || points[0]
        globe.pointOfView({ lat: me.lat, lng: me.lng, altitude: 2 }, 1000)
      }

      globeRef.current = globe
      setLoaded(true)
    })

    return () => { cancelled = true }
  }, [])

  // Update points when they change
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointsData(points)
    }
  }, [points])

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
          Loading globe...
        </div>
      )}
    </div>
  )
}
