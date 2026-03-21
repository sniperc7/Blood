import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HomeClient from './HomeClient'
import { getCoords } from '@/lib/data/coordinates'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, location_city, location_country')

  const points = (profiles ?? [])
    .map(p => {
      const coords = getCoords(p.location_city, p.location_country)
      if (!coords) return null
      return {
        lat: coords[0],
        lng: coords[1],
        name: p.name,
        city: p.location_city,
        country: p.location_country,
        isMe: p.id === user.id,
      }
    })
    .filter(Boolean)

  const myProfile = (profiles ?? []).find(p => p.id === user.id)

  return <HomeClient points={points as any[]} myCity={myProfile?.location_city} myCountry={myProfile?.location_country} totalUsers={profiles?.length ?? 0} />
}
