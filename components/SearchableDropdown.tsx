'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  options: string[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

export default function SearchableDropdown({ options, value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase())).slice(0, 8)

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-sm max-h-48 overflow-y-auto">
          {filtered.map(o => (
            <li
              key={o}
              onMouseDown={() => { onChange(o); setQuery(o); setOpen(false) }}
              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
