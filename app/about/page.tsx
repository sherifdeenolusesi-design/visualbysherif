import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'Meet Sherif — the photographer behind the lens.',
}

const gear = [
  {
    category: 'Camera Bodies',
    items: ['Sony A7 IV', 'Sony A7R V'],
  },
  {
    category: 'Lenses',
    items: ['Sony 24-70mm f/2.8 GM II', 'Sony 85mm f/1.4 GM', 'Sony 16-35mm f/2.8 GM'],
  },
  {
    category: 'Lighting',
    items: ['Profoto B10 Plus', 'Godox AD600 Pro', 'Various modifiers & reflectors'],
  },
  {
    category: 'Accessories',
    items: ['Peak Design Everyday Backpack', 'DJI RS3 Gimbal', 'B+W ND filter set'],
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-5xl mx-auto px-4 py-20">

        {/* Bio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-28">
          <div className="relative bg-zinc-900 aspect-[3/4] overflow-hidden">
            <Image
              src="/sherif.jpg"
              alt="Sherif — Visual by Sherif"
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs mb-6">
              Behind the Lens
            </p>
            <h1 className="text-4xl font-thin text-white mb-8">Hi, I'm Sherif</h1>
            <div className="space-y-5 text-zinc-500 text-sm leading-relaxed">
              <p>
                For over a decade, I have been telling love stories, capturing milestone
                moments, and freezing time for families, couples and brands across Birmingham
                and beyond. What started as a quiet obsession with light and human connection
                has grown into a career built entirely on trust, artistry, and the belief
                that every single moment deserves to be remembered beautifully.
              </p>
              <p>
                Based in Birmingham, I specialise in weddings, events and intimate portrait
                sessions bringing a calm, unobtrusive presence that allows genuine emotions
                to unfold naturally in front of my lens. I do not just photograph your day.
                I immerse myself in it — learning your story, understanding what matters most
                to you, and delivering images that feel as alive years from now as they do today.
              </p>
              <p>
                Over the past 10 years I have had the extraordinary privilege of documenting
                hundreds of weddings, from intimate elopements across the Midlands countryside
                to grand celebrations in some of Birmingham's most beautiful and iconic venues.
                Every wedding teaches me something new. Every family reminds me why this work
                matters. Every frame is a responsibility I take seriously and a gift I do not
                take lightly.
              </p>
              <p>
                When I am not behind the camera, you will find me chasing golden hour light
                across Birmingham's hidden gems, scouting new locations throughout the Midlands,
                or obsessing over the perfect edit. Photography is not what I do, it is who
                I am. And I would be honoured to be the person who captures your story.
              </p>
            </div>
            <div className="mt-10 flex gap-4 flex-wrap">
              <Link
                href="/booking"
                className="bg-white text-zinc-950 px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors"
              >
                Work With Me
              </Link>
              <Link
                href="/contact"
                className="border border-zinc-800 text-zinc-400 px-8 py-3 text-xs uppercase tracking-[0.2em] hover:border-zinc-600 hover:text-white transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>

        {/* Gear */}
        <div>
          <p className="text-zinc-600 uppercase tracking-[0.4em] text-xs text-center mb-14">
            The Gear
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gear.map((section) => (
              <div key={section.category} className="border border-zinc-900 p-8">
                <h3 className="text-zinc-500 text-xs uppercase tracking-widest mb-5">
                  {section.category}
                </h3>
                <ul className="space-y-2.5">
                  {section.items.map((item) => (
                    <li key={item} className="text-white font-light text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
