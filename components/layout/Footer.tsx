import Link from 'next/link'

const footerLinks = [
  ['Portfolio', '/portfolio'],
  ['Print Shop', '/shop'],
  ['Journal', '/blog'],
  ['Book a Session', '/booking'],
  ['About', '/about'],
  ['Contact', '/contact'],
]

export default function Footer() {
  return (
    <footer className="border-t border-zinc-900 py-16 px-4 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div>
            <p className="text-white text-xs uppercase tracking-[0.25em] font-light mb-4">
              Visual by Sherif
            </p>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Photography, Cinematography &amp; Creative Visual Storytelling.
            </p>
          </div>

          <div>
            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-5">Navigate</p>
            <div className="space-y-2.5">
              {footerLinks.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="block text-zinc-500 text-xs hover:text-white transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-5">Connect</p>
            <div className="space-y-2.5">
              <a
                href="mailto:hello@virtualbysherif.com"
                className="block text-zinc-500 text-xs hover:text-white transition-colors"
              >
                hello@virtualbysherif.com
              </a>
              <a
                href="https://instagram.com/virtualbysherif"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-zinc-500 text-xs hover:text-white transition-colors"
              >
                Instagram ↗
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-700 text-xs">
          <p>© {new Date().getFullYear()} Visual by Sherif. All rights reserved.</p>
          <Link href="/gallery" className="hover:text-zinc-500 transition-colors">
            Client Gallery Access
          </Link>
        </div>
      </div>
    </footer>
  )
}
