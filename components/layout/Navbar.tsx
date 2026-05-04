'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function isAdmin(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some(c => c.trim().startsWith('vbs_admin_ui=1'))
}

const navLinks = [
  { href: '/booking', label: 'Book' },
  { href: '/about', label: 'About' },
  { href: '/FAQ', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

const exploreMenuItems = [
  { href: '/portfolio', label: 'Portfolio', desc: 'Browse my photography work' },
  { href: '/shop',      label: 'Shop',      desc: 'Prints & digital products' },
  { href: '/blog',      label: 'Blog',   desc: 'Stories, tips & behind the scenes' },
]

const clientMenuItems = [
  { href: '/gallery',    label: 'Client Gallery',   desc: 'View & download your photos' },
  { href: '/conference', label: 'Selection Session', desc: 'Real-time photo selection' },
]

const sessionsMenuItems = [
  { href: '/sessions/contract',     label: 'Contract Generator', desc: 'AI-powered photography contracts' },
  { href: '/sessions/invoice',      label: 'Invoice Generator',  desc: 'Create unique session invoices' },
  { href: '/sessions/deposit',      label: 'Deposit Invoice',    desc: '30% deposit invoice' },
  { href: '/sessions/travel-quote', label: 'Travel Quote',       desc: 'Custom travel fee quote' },
  { href: '/sessions/event-quote',  label: 'Event Quote',        desc: 'Big event pricing quote' },
  { href: '/sessions/qr-generator', label: 'QR Code Generator',  desc: 'Generate event gallery QR codes' },
  { href: '/sessions/art-generator', label: 'AI Art Studio',   desc: 'Generate fine art for the shop' },
  { href: '/sessions/photo-studio',  label: 'AI Photo Studio',   desc: 'Shoot planner + AI photo editing' },
  { href: '/sessions/retouch',       label: 'Retouch Studio',    desc: 'Healing brush · AI skin enhancement · Presets' },
  { href: '/sessions/blog',          label: 'Blog Manager',      desc: 'Create posts with AI-generated cover images' },
]

export default function Navbar() {
  const [scrolled,           setScrolled]           = useState(false)
  const [menuOpen,           setMenuOpen]            = useState(false)
  const [exploreDropdown,    setExploreDropdown]     = useState(false)
  const [clientDropdown,     setClientDropdown]      = useState(false)
  const [sessionsDropdown,   setSessionsDropdown]    = useState(false)
  const [mobileExploreOpen,  setMobileExploreOpen]   = useState(false)
  const [mobileClientOpen,   setMobileClientOpen]    = useState(false)
  const [mobileSessionsOpen, setMobileSessionsOpen]  = useState(false)
  const [admin,              setAdmin]               = useState(false)
  const pathname    = usePathname()
  const exploreRef  = useRef<HTMLDivElement>(null)
  const clientRef   = useRef<HTMLDivElement>(null)
  const sessionsRef = useRef<HTMLDivElement>(null)
  const isHome      = pathname === '/'

  useEffect(() => { setAdmin(isAdmin()) }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setExploreDropdown(false)
    setClientDropdown(false)
    setSessionsDropdown(false)
    setMobileExploreOpen(false)
    setMobileClientOpen(false)
    setMobileSessionsOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exploreRef.current  && !exploreRef.current.contains(e.target as Node))  setExploreDropdown(false)
      if (clientRef.current   && !clientRef.current.contains(e.target as Node))   setClientDropdown(false)
      if (sessionsRef.current && !sessionsRef.current.contains(e.target as Node))  setSessionsDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const transparent    = isHome && !scrolled && !menuOpen
  const exploreActive  = exploreMenuItems.some((i) => pathname.startsWith(i.href))
  const clientActive   = clientMenuItems.some((i) => pathname.startsWith(i.href))
  const sessionsActive = sessionsMenuItems.some((i) => pathname.startsWith(i.href))

  const chevron = (open: boolean) => (
    <svg className={`w-2.5 h-2.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )

  const DropdownPanel = ({ items }: { items: typeof clientMenuItems }) => (
    <div className="absolute right-0 top-full mt-2 w-60 bg-zinc-950 border border-zinc-800 shadow-xl shadow-black/50 py-1 z-50">
      {items.map(({ href, label, desc }) => (
        <Link
          key={href}
          href={href}
          className={`block px-4 py-3 hover:bg-zinc-900 transition-colors group ${pathname.startsWith(href) ? 'bg-zinc-900' : ''}`}
        >
          <span className={`block text-xs uppercase tracking-widest mb-0.5 transition-colors ${pathname.startsWith(href) ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>
            {label}
          </span>
          <span className="block text-[10px] text-zinc-600 group-hover:text-zinc-500 transition-colors">{desc}</span>
        </Link>
      ))}
    </div>
  )

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${transparent ? 'bg-transparent' : 'bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-900'}`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-12 w-12 flex-shrink-0">
            <img src="/logo/logo.png" alt="Visual by Sherif" className="h-full w-full object-contain" />
          </div>
          <span className="hidden sm:block text-white font-light tracking-[0.2em] text-xs uppercase">Visual by Sherif</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">

          {/* Explore dropdown */}
          <div className="relative" ref={exploreRef}>
            <button
              onClick={() => { setExploreDropdown(o => !o); setSessionsDropdown(false); setClientDropdown(false) }}
              className={`flex items-center gap-1.5 text-xs uppercase tracking-widest transition-colors ${
                exploreActive || exploreDropdown ? 'text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              Explore {chevron(exploreDropdown)}
            </button>
            {exploreDropdown && <DropdownPanel items={exploreMenuItems} />}
          </div>

          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={`text-xs uppercase tracking-widest transition-colors ${pathname.startsWith(href) ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
              {label}
            </Link>
          ))}

          {/* Sessions dropdown — admin only */}
          {admin && (
            <div className="relative" ref={sessionsRef}>
              <button
                onClick={() => { setSessionsDropdown(o => !o); setClientDropdown(false); setExploreDropdown(false) }}
                className={`flex items-center gap-1.5 border px-4 py-2 text-xs uppercase tracking-widest transition-all duration-200 ${
                  sessionsActive || sessionsDropdown ? 'border-zinc-600 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'
                }`}
              >
                Sessions {chevron(sessionsDropdown)}
              </button>
              {sessionsDropdown && <DropdownPanel items={sessionsMenuItems} />}
            </div>
          )}

          {/* Client dropdown — admin only */}
          {admin && (
            <div className="relative" ref={clientRef}>
              <button
                onClick={() => { setClientDropdown(o => !o); setSessionsDropdown(false); setExploreDropdown(false) }}
                className={`flex items-center gap-1.5 border px-4 py-2 text-xs uppercase tracking-widest transition-all duration-200 ${
                  clientActive || clientDropdown ? 'border-zinc-600 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'
                }`}
              >
                Client {chevron(clientDropdown)}
              </button>
              {clientDropdown && <DropdownPanel items={clientMenuItems} />}
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-white p-2" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle navigation">
          <div className="space-y-1.5 w-6">
            <span className={`block h-px bg-current transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-px bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-px bg-current transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-900 py-4 px-4 space-y-1">

          {/* Mobile Explore */}
          <div>
            <button onClick={() => setMobileExploreOpen(o => !o)} className="flex items-center justify-between w-full py-3 text-sm uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
              <span>Explore</span>
              <svg className={`w-3 h-3 transition-transform duration-200 ${mobileExploreOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mobileExploreOpen && (
              <div className="pl-4 border-l border-zinc-800 space-y-0.5 mb-2">
                {exploreMenuItems.map(({ href, label }) => (
                  <Link key={href} href={href} className="block py-2.5 text-sm uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">{label}</Link>
                ))}
              </div>
            )}
          </div>

          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="block py-3 text-sm uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">{label}</Link>
          ))}

          {/* Mobile Sessions — admin only */}
          {admin && (
            <div>
              <button onClick={() => setMobileSessionsOpen(o => !o)} className="flex items-center justify-between w-full py-3 text-sm uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                <span>Sessions</span>
                <svg className={`w-3 h-3 transition-transform duration-200 ${mobileSessionsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileSessionsOpen && (
                <div className="pl-4 border-l border-zinc-800 space-y-0.5 mb-2">
                  {sessionsMenuItems.map(({ href, label }) => (
                    <Link key={href} href={href} className="block py-2.5 text-sm uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">{label}</Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mobile Client — admin only */}
          {admin && (
            <div>
              <button onClick={() => setMobileClientOpen(o => !o)} className="flex items-center justify-between w-full py-3 text-sm uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                <span>Client</span>
                <svg className={`w-3 h-3 transition-transform duration-200 ${mobileClientOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileClientOpen && (
                <div className="pl-4 border-l border-zinc-800 space-y-0.5 mb-2">
                  {clientMenuItems.map(({ href, label }) => (
                    <Link key={href} href={href} className="block py-2.5 text-sm uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">{label}</Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
