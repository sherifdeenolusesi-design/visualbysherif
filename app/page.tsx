"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import BookingModal from "@/components/booking/BookingModal";

const slideImages = [
  '/slides/_DSC5519.jpg',
  '/slides/_DSC5528.jpg',
  '/slides/_DSC5290.jpg',
  '/slides/_DSC5304.jpg',
  '/slides/_DSC5306.jpg',
  '/slides/_DSC5374.jpg',
  '/slides/_DSC5438.jpg',
  '/slides/_DSC5449.jpg',
  '/slides/_DSC5460.jpg',
  '/slides/_DSC5461.jpg',
  '/slides/_DSC5547.jpg',
  '/slides/_DSC5546.jpg',
  '/slides/_DSC5504.jpg',
  '/slides/_DSC5527.jpg',
  '/slides/_DSC5531.jpg',
  '/slides/_DSC5560.jpg',
  '/slides/_DSC5561.jpg',
  '/slides/_DSC5569.jpg',
]

const portfolioImages = [
  {
    src: "/slides/_DSC5519.jpg",
    alt: "Event coverage",
    aspect: "aspect-[3/4]",
    category: "Events",
  },
  {
    src: "/slides/_DSC5304.jpg",
    alt: "Event photography",
    aspect: "aspect-square",
    category: "Events",
  },
  {
    src: "/slides/_DSC5374.jpg",
    alt: "Live event",
    aspect: "aspect-[3/4]",
    category: "Events",
  },
  {
    src: "/slides/_DSC5449.jpg",
    alt: "Event moment",
    aspect: "aspect-square",
    category: "Events",
  },
  {
    src: "/slides/_DSC5546.jpg",
    alt: "Captured moment",
    aspect: "aspect-[3/4]",
    category: "Events",
  },
  {
    src: "/slides/_DSC5560.jpg",
    alt: "Event highlight",
    aspect: "aspect-square",
    category: "Events",
  },
];

const services = [
  { title: "Portraits", icon: "◆", desc: "Individual & family sessions" },
  { title: "Events", icon: "◈", desc: "Weddings, corporate & celebrations" },
  { title: "Commercial", icon: "◇", desc: "Product & brand photography" },
  { title: "Fine Art", icon: "○", desc: "Limited edition prints" },
];

export default function HomePage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slideImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Hero — full-screen slideshow */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Slides */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            {/* Blurred background fills edges — no black bars */}
            <Image
              src={slideImages[current]}
              alt=""
              fill
              priority
              aria-hidden
              className="object-cover object-center scale-110 blur-2xl opacity-70"
              sizes="100vw"
            />
            {/* Full image — no cropping, every face and head visible */}
            <Image
              src={slideImages[current]}
              alt="Visual by Sherif"
              fill
              priority
              className="object-contain"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Hero text */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-zinc-300 uppercase tracking-[0.5em] text-sm mb-6"
          >
            Photography & Cinematography
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-white font-thin tracking-[0.3em] text-5xl md:text-8xl uppercase mb-8"
          >
            Visual by Sherif
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-zinc-200 font-light text-base md:text-lg max-w-md mb-12 leading-relaxed"
          >
            Capturing moments that tell your story
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 items-center"
          >
            <button
              onClick={() => router.push('/portfolio')}
              className="border border-white/60 text-white px-10 py-3.5 text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-zinc-950 transition-all duration-300"
            >
              View Portfolio
            </button>
            <button
              onClick={() => setBookingOpen(true)}
              className="bg-white text-zinc-950 px-10 py-3.5 text-xs uppercase tracking-[0.3em] hover:bg-zinc-100 transition-all duration-300"
            >
              Book a Session
            </button>
          </motion.div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {slideImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-px transition-all duration-500 ${
                i === current ? 'w-8 bg-white' : 'w-3 bg-white/30'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Real work preview */}
      <section className="py-28 bg-zinc-100">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-center text-zinc-400 uppercase tracking-[0.4em] text-sm mb-20">
              Recent Work
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
            {portfolioImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`${img.aspect} overflow-hidden bg-zinc-900 group relative cursor-pointer`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-end p-4">
                  <div className="translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-zinc-300 text-sm uppercase tracking-widest">
                      {img.category}
                    </p>
                    <p className="text-white text-sm font-light mt-1">{img.alt}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-14"
          >
            <Link
              href="/portfolio"
              className="text-zinc-950 text-sm uppercase tracking-[0.3em] border-b border-zinc-300 pb-1 hover:text-zinc-600 hover:border-zinc-600 transition-colors"
            >
              Full Portfolio
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="py-28 px-4 bg-zinc-100">
        <div className="max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-zinc-500 uppercase tracking-[0.4em] text-sm mb-20"
          >
            Services
          </motion.p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-zinc-400 text-2xl mb-5">{s.icon}</div>
                <h3 className="text-zinc-950 font-light text-lg mb-2">{s.title}</h3>
                <p className="text-zinc-700 text-base leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Client Gallery CTA */}
      <section className="py-28 px-4 bg-zinc-100">
        <div className="max-w-xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-zinc-500 uppercase tracking-[0.4em] text-sm mb-6">
              For Clients
            </p>
            <h2 className="text-3xl font-thin text-zinc-950 mb-5">
              Your Photos Are Ready
            </h2>
            <p className="text-zinc-700 text-base mb-10 leading-relaxed">
              Access your private gallery to view and download your full-resolution photos.
            </p>
            <Link
              href="/gallery"
              className="border border-zinc-400 text-zinc-700 px-10 py-3.5 text-sm uppercase tracking-[0.2em] hover:border-zinc-950 hover:text-zinc-950 transition-colors"
            >
              Access My Gallery
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Booking modal */}
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />

      {/* Print Shop CTA */}
      <section className="py-28 bg-zinc-900/40 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-16">
            {[
              "/slides/_DSC5527.jpg",
              "/slides/_DSC5531.jpg",
            ].map((src, i) => (
              <div key={i} className="aspect-[4/3] relative overflow-hidden bg-zinc-900">
                <Image
                  src={src}
                  alt="Fine art print"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-white uppercase tracking-[0.4em] text-sm mb-6">
              Print Shop
            </p>
            <h2 className="text-3xl font-thin text-white mb-5">Fine Art Prints</h2>
            <p className="text-white text-base mb-10 leading-relaxed">
              Museum-quality prints on archival paper, professionally produced and ready to hang.
            </p>
            <Link
              href="/shop"
              className="bg-white text-zinc-950 px-10 py-3.5 text-sm uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors"
            >
              Shop Prints
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
