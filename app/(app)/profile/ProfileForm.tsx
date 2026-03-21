'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Plus } from 'lucide-react'
import SearchableDropdown from '@/components/SearchableDropdown'
import { COLLEGES } from '@/lib/data/colleges'
import { COUNTRIES } from '@/lib/data/countries'

interface Profile {
  id: string
  name: string
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  location_city: string | null
  location_country: string | null
  job_role: string | null
  company_name: string | null
  company_city: string | null
  company_country: string | null
  college_name: string | null
  college_city: string | null
  college_country: string | null
  college_major: string | null
  expertise_tags: string[]
  countries_visited: string[]
  phone: string | null
  linkedin_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  invite_code: string | null
}

const collegeNames = COLLEGES.map(c => c.name)
const countryNames = COUNTRIES

export default function ProfileForm({ profile, userId }: { profile: Profile | null; userId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [expertiseInput, setExpertiseInput] = useState('')

  const [form, setForm] = useState({
    first_name: profile?.first_name ?? '',
    middle_name: profile?.middle_name ?? '',
    last_name: profile?.last_name ?? '',
    location_city: profile?.location_city ?? '',
    location_country: profile?.location_country ?? '',
    job_role: profile?.job_role ?? '',
    company_name: profile?.company_name ?? '',
    company_city: profile?.company_city ?? '',
    company_country: profile?.company_country ?? '',
    college_name: profile?.college_name ?? '',
    college_city: profile?.college_city ?? '',
    college_country: profile?.college_country ?? '',
    college_major: profile?.college_major ?? '',
    expertise_tags: profile?.expertise_tags ?? [],
    countries_visited: profile?.countries_visited ?? [],
    phone: profile?.phone ?? '',
    linkedin_url: profile?.linkedin_url ?? '',
    instagram_url: profile?.instagram_url ?? '',
    facebook_url: profile?.facebook_url ?? '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleCollegeSelect(name: string) {
    const college = COLLEGES.find(c => c.name === name)
    setForm(f => ({
      ...f,
      college_name: name,
      college_city: college?.city ?? f.college_city,
      college_country: college?.country ?? f.college_country,
    }))
  }

  function addCountry(country: string) {
    if (!country || form.countries_visited.includes(country)) return
    setForm(f => ({ ...f, countries_visited: [...f.countries_visited, country] }))
  }

  function removeCountry(country: string) {
    setForm(f => ({ ...f, countries_visited: f.countries_visited.filter(c => c !== country) }))
  }

  function addExpertise() {
    const tag = expertiseInput.trim()
    if (!tag || form.expertise_tags.includes(tag)) return
    setForm(f => ({ ...f, expertise_tags: [...f.expertise_tags, tag] }))
    setExpertiseInput('')
  }

  function removeExpertise(tag: string) {
    setForm(f => ({ ...f, expertise_tags: f.expertise_tags.filter(t => t !== tag) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    startTransition(async () => {
      const name = [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(' ') || profile?.name || ''
      await supabase.from('profiles').upsert({
        id: userId,
        name,
        ...form,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    })
  }

  const inviteLink = profile?.invite_code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${profile.invite_code}`
    : ''

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Name */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Name</p>
        <div className="flex gap-2">
          {[
            { field: 'first_name', placeholder: 'First' },
            { field: 'middle_name', placeholder: 'Middle' },
            { field: 'last_name', placeholder: 'Last' },
          ].map(({ field, placeholder }) => (
            <input
              key={field}
              placeholder={placeholder}
              value={(form as unknown as Record<string, string>)[field]}
              onChange={e => set(field, e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 min-w-0"
            />
          ))}
        </div>
      </section>

      {/* Location */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Location</p>
        <div className="flex gap-2">
          <input
            placeholder="City"
            value={form.location_city}
            onChange={e => set('location_city', e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 min-w-0"
          />
          <div className="flex-1 min-w-0">
            <SearchableDropdown
              options={countryNames}
              value={form.location_country}
              onChange={v => set('location_country', v)}
              placeholder="Country"
            />
          </div>
        </div>
      </section>

      {/* Profession */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Profession</p>
        <div className="flex flex-col gap-2">
          <input
            placeholder="Job role"
            value={form.job_role}
            onChange={e => set('job_role', e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
          <input
            placeholder="Company name"
            value={form.company_name}
            onChange={e => set('company_name', e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
          <div className="flex gap-2">
            <input
              placeholder="City"
              value={form.company_city}
              onChange={e => set('company_city', e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 min-w-0"
            />
            <div className="flex-1 min-w-0">
              <SearchableDropdown
                options={countryNames}
                value={form.company_country}
                onChange={v => set('company_country', v)}
                placeholder="Country"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Education */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Education</p>
        <div className="flex flex-col gap-2">
          <SearchableDropdown
            options={collegeNames}
            value={form.college_name}
            onChange={handleCollegeSelect}
            placeholder="College / University"
          />
          <div className="flex gap-2">
            <input
              placeholder="City"
              value={form.college_city}
              onChange={e => set('college_city', e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 min-w-0"
            />
            <div className="flex-1 min-w-0">
              <SearchableDropdown
                options={countryNames}
                value={form.college_country}
                onChange={v => set('college_country', v)}
                placeholder="Country"
              />
            </div>
          </div>
          <input
            placeholder="Major / Field of study"
            value={form.college_major}
            onChange={e => set('college_major', e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
        </div>
      </section>

      {/* Expertise */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Expertise</p>
        <div className="flex gap-2 mb-2">
          <input
            placeholder="e.g. prop trading, Bali travel tips"
            value={expertiseInput}
            onChange={e => setExpertiseInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExpertise() } }}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          />
          <button type="button" onClick={addExpertise} className="px-3 py-2 bg-gray-100 rounded-lg">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {form.expertise_tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              {tag}
              <button type="button" onClick={() => removeExpertise(tag)}><X size={11} /></button>
            </span>
          ))}
        </div>
      </section>

      {/* Countries visited */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Countries Visited</p>
        <SearchableDropdown
          options={countryNames.filter(c => !form.countries_visited.includes(c))}
          value=""
          onChange={addCountry}
          placeholder="Search and add a country"
        />
        <div className="flex flex-wrap gap-1 mt-2">
          {form.countries_visited.map(c => (
            <span key={c} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              {c}
              <button type="button" onClick={() => removeCountry(c)}><X size={11} /></button>
            </span>
          ))}
        </div>
      </section>

      {/* Socials */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Socials</p>
        <div className="flex flex-col gap-2">
          {[
            { field: 'linkedin_url', placeholder: 'LinkedIn URL' },
            { field: 'instagram_url', placeholder: 'Instagram URL' },
            { field: 'facebook_url', placeholder: 'Facebook URL' },
            { field: 'phone', placeholder: 'Phone number' },
          ].map(({ field, placeholder }) => (
            <input
              key={field}
              placeholder={placeholder}
              value={(form as unknown as Record<string, string>)[field]}
              onChange={e => set(field, e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
            />
          ))}
        </div>
      </section>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {saved ? 'Saved!' : isPending ? 'Saving...' : 'Save profile'}
      </button>

      {inviteLink && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-1">Your invite link</p>
          <p className="text-xs text-gray-700 break-all">{inviteLink}</p>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(inviteLink)}
            className="mt-2 text-xs text-gray-500 underline"
          >
            Copy
          </button>
        </div>
      )}
    </form>
  )
}
