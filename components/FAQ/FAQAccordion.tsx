'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface FAQItem {
  q: string
  a: string | string[]
}

interface FAQCategory {
  id: string
  label: string
  icon: string
  items: FAQItem[]
}

const FAQ_DATA: FAQCategory[] = [
  {
    id: 'booking',
    label: 'Booking',
    icon: '◈',
    items: [
      {
        q: 'How do I book a photography session?',
        a: 'Booking is simple! Visit our Booking page, choose your session type, pick your preferred date and time, and submit your enquiry. We will confirm availability within 24 hours and send you a booking agreement and deposit invoice.',
      },
      {
        q: 'What types of family photography sessions do you offer?',
        a: 'We offer a variety of family sessions to suit every family dynamic including outdoor lifestyle sessions, studio family portraits, extended family gatherings, maternity and newborn family sessions, multi-generational family portraits (grandparents included), anniversary and milestone family sessions, and seasonal mini sessions for Christmas, Easter and Summer.',
      },
      {
        q: 'Where can family sessions take place?',
        a: 'Sessions can take place at our studio, at your home for a relaxed lifestyle feel, at a meaningful outdoor location such as a park, beach, woodland or city, or at a venue of your choice. We love shooting at locations that mean something to your family — the place you got engaged, your favourite park, or simply your backyard.',
      },
      {
        q: 'How do I prepare my family for the session?',
        a: 'The most important thing is to relax and have fun — the best family photos happen naturally. We recommend coordinating outfits in complementary tones rather than matching exactly. Avoid busy patterns. Earth tones, pastels and neutrals photograph beautifully together. Arrive well-rested, fed and in good spirits. We handle everything else!',
      },
      {
        q: 'What should we wear for a family session?',
        a: 'Choose outfits that feel like YOU as a family. Coordinate colours rather than match exactly — think of a colour palette with 2–3 tones that complement each other. Avoid bright logos or very busy prints. Layers, textures and accessories add depth to photos. Most importantly wear something you feel comfortable and confident in.',
      },
      {
        q: 'Can we include our pets in the family session?',
        a: 'Absolutely! Pets are family too and we love including them. Please let us know in advance so we can plan accordingly. For outdoor sessions, ensure your pet is comfortable on a lead in public spaces. Studio sessions with pets are also possible — just ask when booking.',
      },
      {
        q: 'Can we do both indoor and outdoor shots in the same session?',
        a: 'Yes, if the location allows. Many of our sessions combine a short outdoor lifestyle segment followed by indoor or studio shots. Just mention this preference when booking and we will plan accordingly.',
      },
      {
        q: 'Do you offer maternity sessions as part of family photography?',
        a: 'Yes! Maternity sessions beautifully document this special chapter for the whole family. We can photograph just the expectant mother, the couple together, or include existing children and the bump for a full family maternity session. These pair wonderfully with a newborn session booked in advance.',
      },
      {
        q: 'How far in advance should I book?',
        a: 'We recommend booking at least 4–6 weeks in advance, especially for weekends and peak seasons like summer and Christmas. For weddings, 6–12 months ahead is ideal to secure your date.',
      },
      {
        q: 'How do multi-generational family sessions work?',
        a: 'These are one of our most meaningful sessions — capturing grandparents, parents and grandchildren together creates heirlooms that families treasure for generations. We photograph the full group together as well as smaller family units within the group. We recommend choosing a comfortable, accessible location for elderly family members. These sessions are relaxed, unhurried and deeply personal.',
      },
      {
        q: 'What happens if I need to reschedule or cancel?',
        a: 'Life happens! You may reschedule once at no charge with at least 7 days notice. Cancellations within 48 hours of the session forfeit the deposit. Full details are in your booking agreement.',
      },
      {
        q: 'Do you travel for shoots?',
        a: 'Yes! We are available for travel locally, nationally, and internationally. Travel fees may apply for locations beyond 30 miles. Contact us for a custom travel quote.',
      },
      {
        q: 'How long does a typical session last?',
        a: 'Sessions vary by type — mini sessions run 30–45 minutes, portrait sessions 1–2 hours, and full-day events or weddings 6–10 hours. Your booking confirmation will include the exact duration.',
      },
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing',
    icon: '◇',
    items: [
      {
        q: 'What are your session prices?',
        a: [
          'Mini Sessions — from £150 (30–45 mins | 10–20 edited images | 1 outfit)',
          'Portrait Sessions — from £250 (1–2 hours | 30 edited images | multiple outfits)',
          'Children & Family — from £300 (1–2 hours | 40 edited images)',
          'Newborn — from £350 (2–4 hours | 25 edited images | full setup included)',
          'Cake Smash — from £200 (1 hour | 15 edited images | full themed setup)',
          'Maternity — from £250 (1–1.5 hours | 30 edited images)',
          'Couples & Engagement — from £400 (1–2 hours | 30–40 edited images)',
          'Pre-Wedding — from £300 (2–3 hours | 20–30 edited images)',
          'Wedding Half Day — from £1,200 (5–6 hours | 200–300 images)',
          'Wedding Full Day — from £2,000 (8–10 hours | 500–600 images)',
          'Elopement — from £800 (3–4 hours | 150–200 images)',
          'Birthday & Milestone — from £225 (1 hour | 30–40 images)',
          'Corporate & Headshots — from £300 (2 hours | 10–20 headshots per person)',
          'Brand & Product — from £400 (half day | full styled shoot)',
          'Boudoir & Empowerment — from £280 (2 hours | 30–50 images | private gallery)',
          'Multi-Generational Family — from £350 (2–3 hours | 60–80 images)',
          'Contact us for bespoke packages and bundles.',
        ],
      },
      {
        q: 'What is the price for birthday sessions?',
        a: [
          'First Birthday Cake Smash — from £225',
          'Toddler Birthday Portrait — from £175',
          "Children's Birthday Party Coverage (2–3hrs) — from £325",
          'Teen Milestone Session (13th, 16th, 18th) — from £195',
          'Adult Milestone Session (30th, 40th, 50th, 60th+) — from £245',
          'Surprise Party Coverage (2–3hrs) — from £325',
          'Outdoor Birthday Lifestyle Session — from £195',
          'Birthday Boudoir Empowerment Session — from £275',
          'All packages include fully edited images and a private online gallery. Prints and albums available separately through our Print Shop.',
        ],
      },
      {
        q: 'Is VAT included in the prices?',
        a: 'All prices displayed are inclusive of VAT where applicable. Your invoice will clearly detail all charges with no hidden fees.',
      },
      {
        q: 'Do you require a deposit?',
        a: 'Yes. A 30% non-refundable deposit is required at the time of booking to secure your date and session. The remaining balance is due 7 days before your session date.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept bank transfer, all major credit and debit cards, PayPal and Klarna (buy now, pay later). All payments are processed securely.',
      },
      {
        q: 'Do you offer payment plans?',
        a: 'Yes! We offer flexible payment plans split across 2–3 instalments to make professional photography accessible for everyone. Please mention this when enquiring and we will set up a plan tailored to you.',
      },
      {
        q: 'Are there any additional costs I should know about?',
        a: 'Our packages are transparent with no hidden fees. The only potential additional costs are: travel fees beyond 30 miles, advanced retouching beyond standard included editing, rush delivery (within 5 business days), and optional print or album purchases. All additional costs are agreed in writing before the session.',
      },
      {
        q: 'Do you offer discounts for returning clients?',
        a: 'Yes! Returning clients receive a loyalty discount of 10% on their next session. We also offer referral rewards — refer a friend who books with us and receive a complimentary print or session credit as a thank you.',
      },
    ],
  },
  {
    id: 'deliverables',
    label: 'Deliverables',
    icon: '○',
    items: [
      {
        q: 'How long until I receive my photos?',
        a: 'Edited galleries are delivered within 2–3 weeks for portrait sessions and 4–6 weeks for weddings. You will receive an email with your private gallery link as soon as it is ready.',
      },
      {
        q: 'How will my photos be delivered?',
        a: 'Photos are delivered via your private online gallery where you can view, download, favourite, and share your images. You will also have access to our Conference Room for a real-time selection session with your photographer.',
      },
      {
        q: 'How soon will we receive our family photos?',
        a: 'Your fully edited gallery will be delivered within 2–3 weeks via your private online gallery. You will receive an email notification with your gallery link and access to your Conference Room for the real-time photo selection session with your photographer.',
      },
      {
        q: 'How many edited photos will I receive?',
        a: 'The number varies by package (see pricing above). All images are professionally colour-graded and retouched to the highest standard.',
      },
      {
        q: 'Can I request specific edits or retouching?',
        a: 'Absolutely. Basic skin retouching is included as standard. For advanced retouching such as background removal or composite edits, a small additional fee applies. Just let us know your preferences.',
      },
      {
        q: 'How long do you keep my photos on file?',
        a: 'We keep your images securely backed up for 12 months after delivery. We strongly recommend downloading and backing up your gallery as soon as you receive it.',
      },
    ],
  },
  {
    id: 'conference',
    label: 'Conference Room',
    icon: '◆',
    items: [
      {
        q: 'How does the online photo selection session work?',
        a: 'Once your gallery is ready, we invite you to a private Conference Room — a real-time online session where you and your photographer review all images together. You click to highlight your favourites and your photographer sees your selections instantly, live on their screen.',
      },
      {
        q: 'Will I see my photographer in real-time during selection?',
        a: 'Yes! Both you and your photographer are present in the Conference Room at the same time. You can see who is online, selections are synced instantly, and your photographer can leave notes on specific images.',
      },
      {
        q: 'Can I favourite and comment on photos during the session?',
        a: 'Absolutely. You can heart your favourites, leave comments on individual photos, and your photographer can respond in real-time. It makes the selection process collaborative and stress-free.',
      },
      {
        q: 'How do I access my private Conference Room link?',
        a: 'Your unique Conference Room link will be emailed to you when your gallery is ready. It is password-protected and accessible only to you and your photographer.',
      },
      {
        q: 'What happens after I make my selections?',
        a: 'Once you finalise your selections, your photographer reviews and approves them. You will then receive your final edited images within the agreed delivery timeframe.',
      },
    ],
  },
  {
    id: 'prints',
    label: 'Prints',
    icon: '▣',
    items: [
      {
        q: 'What print products do you offer?',
        a: [
          'Fine art lustre prints (5×7 up to 30×40)',
          'Canvas wraps (various sizes)',
          'Acrylic glass prints (stunning depth and clarity)',
          'Metal prints (sleek and modern)',
          'Framed prints (ready to hang)',
          'Luxury lay-flat albums (20–60 pages)',
          'Mini accordion albums (perfect gifts)',
          'Photo books',
          'Greeting cards and birth announcement cards',
          'Bespoke wall art collections',
          'All products are produced by professional labs on archival materials.',
        ],
      },
      {
        q: 'What print sizes and materials do you offer?',
        a: 'We offer a wide range including fine art prints, canvas wraps, acrylic glass prints, and handcrafted albums. Sizes range from 5×7 up to large format 30×40 wall art.',
      },
      {
        q: 'How long does print delivery take?',
        a: 'Prints are professionally produced and delivered within 7–14 business days. Express options are available at checkout.',
      },
      {
        q: 'Do you offer wall art consultation?',
        a: 'Yes! We offer a complimentary wall art consultation to help you plan the perfect gallery wall for your home. We can mock up your images on a photo of your wall so you can see exactly how it will look before ordering.',
      },
      {
        q: 'What is your print quality guarantee?',
        a: 'All prints are produced on premium archival materials built to last 75+ years without fading. If you are not completely satisfied with the quality of any print product, we will reprint or refund — no questions asked. Your satisfaction is guaranteed.',
      },
      {
        q: 'Do you offer framing or albums?',
        a: 'Yes! We offer custom framing and luxury lay-flat albums. These make perfect gifts and heirlooms. Browse options in our Print Shop.',
      },
      {
        q: 'Do you offer family session gift vouchers?',
        a: 'Yes! Family session gift vouchers are a beautiful and meaningful gift for birthdays, anniversaries, Mother\'s Day, Father\'s Day, Christmas or any special occasion. They are available in custom amounts and can be purchased directly through our website or by contacting us.',
      },
      {
        q: 'Can I purchase prints from a previous session?',
        a: 'Yes! As long as your gallery is still active (within 12 months), you can return to your gallery and order prints at any time. Contact us if your gallery has expired and we will do our best to assist.',
      },
    ],
  },
  {
    id: 'child-safety',
    label: 'Child Safety',
    icon: '❋',
    items: [
      {
        q: 'How do you ensure the safety of children during photo sessions?',
        a: [
          'The safety and wellbeing of every child is our absolute top priority. All our sessions involving minors follow strict safeguarding protocols:',
          'A parent or legal guardian must be present throughout the entire session at all times',
          'We are fully DBS checked and child safety certified',
          'Signed parental consent forms are required before any session begins',
          'Safe posing practices for newborns and babies',
          'We never photograph children alone without a trusted adult present',
          'We never share images of minors publicly without explicit written consent from the parent or guardian',
          'Any parent has the right to stop the session at any time',
        ],
      },
      {
        q: 'Can parents stay present during the session?',
        a: 'Yes, for all sessions involving children under 18, a parent or legal guardian is required to remain present for the full duration. This is non-negotiable and is in place to protect both your child and our photographer.',
      },
      {
        q: 'How do you handle and store images of children?',
        a: 'Images of minors are stored securely with restricted access and are never shared, published, or used for marketing without explicit written consent. Parents receive full control over how their child\'s images are used, and can request deletion of all images at any time.',
      },
      {
        q: "Do you share children's photos on social media?",
        a: 'Never without written consent. During booking you will be asked to sign a media consent form specifying exactly where, if anywhere, images may be shared. Your choices are fully respected — you can opt out of all public sharing entirely.',
      },
      {
        q: 'What if my child feels uncomfortable during the session?',
        a: 'We always follow the child\'s lead. If at any point your child feels uncomfortable, upset, or simply does not want to continue, we stop immediately — no questions asked. A happy child makes the best photos, and their emotional wellbeing always comes first.',
      },
      {
        q: 'What is your safeguarding policy for boudoir sessions?',
        a: [
          'Boudoir sessions are conducted with the utmost professionalism, respect and sensitivity:',
          'Sessions are always by appointment only in a private studio',
          'A chaperone is available on request',
          'A confidentiality agreement is signed before every session',
          'Images are never shared without explicit written consent',
          'You are always in control of what you are comfortable with and can pause or stop at any time',
        ],
      },
    ],
  },
]

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`border-b border-zinc-200 transition-colors ${isOpen ? 'bg-zinc-50' : ''}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-5 px-6 text-left group"
      >
        <span className={`text-base font-light leading-relaxed transition-colors ${isOpen ? 'text-white' : 'text-white group-hover:text-zinc-200'}`}>
          {item.q}
        </span>
        <span className={`flex-shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-45 text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-700'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              {Array.isArray(item.a) ? (
                <ul className="space-y-2">
                  {item.a.map((line, i) => (
                    <li key={i} className={`text-sm leading-relaxed flex gap-2 ${i === 0 && item.a[0]?.endsWith(':') ? 'text-white font-light list-none' : 'text-white'}`}>
                      {i > 0 || !String(item.a[0]).endsWith(':') ? (
                        <>
                          <span className="text-zinc-400 mt-1.5 flex-shrink-0">—</span>
                          <span>{line}</span>
                        </>
                      ) : (
                        <span>{line}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white text-base leading-relaxed">{item.a}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQAccordion() {
  const [activeCategory, setActiveCategory] = useState('booking')
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [bookingOpen, setBookingOpen] = useState(false)

  const currentCategory = FAQ_DATA.find((c) => c.id === activeCategory)!

  const filtered = useMemo(() => {
    if (!search.trim()) return currentCategory.items
    const q = search.toLowerCase()
    return currentCategory.items.filter(
      (item) =>
        item.q.toLowerCase().includes(q) ||
        (typeof item.a === 'string'
          ? item.a.toLowerCase().includes(q)
          : item.a.some((a) => a.toLowerCase().includes(q)))
    )
  }, [search, currentCategory])

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id)
    setOpenIndex(null)
    setSearch('')
  }

  const totalCount = FAQ_DATA.reduce((sum, c) => sum + c.items.length, 0)

  return (
    <>
      {/* Search */}
      <div className="relative max-w-xl mx-auto mb-12">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpenIndex(null) }}
          placeholder="Search questions..."
          className="w-full bg-white border border-zinc-300 text-zinc-950 pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap justify-center mb-10">
        {FAQ_DATA.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-widest transition-all duration-200 ${
              activeCategory === cat.id
                ? 'bg-zinc-950 text-white'
                : 'border border-zinc-300 text-zinc-500 hover:border-zinc-500 hover:text-zinc-950'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
              {cat.items.length}

            </span>
          </button>
        ))}
      </div>

      {/* Accordion */}
      <motion.div
        key={activeCategory}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto bg-white border border-zinc-200"
      >
        {filtered.length === 0 ? (
          <p className="text-center text-zinc-400 text-base py-16">No results found for "{search}"</p>
        ) : (
          filtered.map((item, i) => (
            <AccordionItem
              key={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))
        )}
      </motion.div>

      <p className="text-center text-zinc-400 text-sm mt-8 tracking-widest uppercase">
        {totalCount} questions answered across {FAQ_DATA.length} categories
      </p>

      {/* Bottom CTA */}
      <section className="relative mt-28 overflow-hidden">
        {/* Light background */}
        <div className="absolute inset-0 bg-zinc-50" />
        <div className="relative z-10 py-28 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-zinc-500 uppercase tracking-[0.5em] text-sm mb-6">Get Started</p>
            <h2 className="text-4xl md:text-5xl font-thin text-zinc-950 mb-6 leading-tight">
              Ready to Create Something Beautiful?
            </h2>
            <p className="text-zinc-600 text-base md:text-lg max-w-lg mx-auto mb-12 leading-relaxed">
              Book your session today and let us capture the moments that matter most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setBookingOpen(true)}
                className="bg-zinc-950 text-white px-10 py-4 text-xs uppercase tracking-[0.3em] hover:bg-zinc-800 transition-colors"
              >
                Book a Session
              </button>
              <Link
                href="/contact"
                className="border border-zinc-400 text-zinc-600 px-10 py-4 text-xs uppercase tracking-[0.3em] hover:border-zinc-950 hover:text-zinc-950 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Booking modal — lazy import to avoid circular deps */}
      {bookingOpen && (
        <BookingModalLazy onClose={() => setBookingOpen(false)} />
      )}
    </>
  )
}

function BookingModalLazy({ onClose }: { onClose: () => void }) {
  const BookingModal = require('@/components/booking/BookingModal').default
  return <BookingModal open={true} onClose={onClose} />
}
