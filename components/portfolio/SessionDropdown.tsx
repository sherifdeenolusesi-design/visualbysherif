'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  sessions: string[]
  selected: string
  category: string
  paramName: string
  allLabel: string
}

export default function SessionDropdown({ sessions, selected, category, paramName, allLabel }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const select = (session: string) => {
    setOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set('category', category)
    params.set(paramName, session)
    router.push(`/portfolio?${params.toString()}`)
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 border border-zinc-700 text-zinc-300 px-5 py-2 text-xs uppercase tracking-widest hover:border-zinc-500 hover:text-white transition-colors"
      >
        <svg className="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
        </svg>
        {selected ? selected.replace(/[_-]/g, ' ') : allLabel}
        <svg
          className={`w-2.5 h-2.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 min-w-[200px] bg-zinc-950 border border-zinc-800 shadow-xl shadow-black/50 py-1">
          <button
            onClick={() => {
              setOpen(false)
              router.push(`/portfolio?category=${category}`)
            }}
            className={`w-full text-left px-4 py-3 text-xs uppercase tracking-widest transition-colors ${
              !selected ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
            }`}
          >
            {allLabel}
          </button>
          {sessions.map((s) => (
            <button
              key={s}
              onClick={() => select(s)}
              className={`w-full text-left px-4 py-3 text-xs uppercase tracking-widest transition-colors ${
                selected === s ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {s.replace(/[_-]/g, ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
